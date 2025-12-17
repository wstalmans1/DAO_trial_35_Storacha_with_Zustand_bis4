import { useState, useEffect, type ChangeEvent } from 'react'
import { useStorachaStore } from '../stores'
import { storachaClientManager } from '../services/storacha/clientManager'

export default function StorachaManager() {
  const {
    // State
    currentAccount,
    isAuthenticated,
    accounts,
    spaces,
    selectedSpace,
    spaceContents,
    isLoading,
    isLoadingSpaces,
    isLoadingContents,
    error,
    // Actions
    login,
    logout,
    switchAccount,
    fetchSpaces,
    createSpace,
    selectSpace,
    fetchSpaceContents,
    uploadToSpace,
    deleteFromSpace,
    clearError,
  } = useStorachaStore()

  const [email, setEmail] = useState('')
  const [newSpaceName, setNewSpaceName] = useState('')
  const [emailSent, setEmailSent] = useState(false)

  // Initialize existing accounts on mount
  useEffect(() => {
    const initializeAccounts = async () => {
      const persistedAccounts = useStorachaStore.getState().accounts
      for (const account of persistedAccounts) {
        await storachaClientManager.initializeClient(account.id)
      }
      // If there's a current account, fetch its spaces
      if (persistedAccounts.length > 0 && !currentAccount) {
        await useStorachaStore.getState().switchAccount(persistedAccounts[0].id)
      }
    }
    initializeAccounts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch spaces when space is selected
  useEffect(() => {
    if (selectedSpace) {
      fetchSpaceContents(selectedSpace.id)
    }
  }, [selectedSpace, fetchSpaceContents])

  const handleLogin = async () => {
    if (!email) return
    setEmailSent(true)
    try {
      await login(email)
      await fetchSpaces()
      setEmailSent(false)
      setEmail('')
    } catch (err) {
      console.error('Login failed:', err)
      setEmailSent(false)
    }
  }

  const handleLogout = () => {
    logout()
    setEmail('')
  }

  const handleSwitchAccount = async (accountId: string) => {
    await switchAccount(accountId)
  }

  const handleCreateSpace = async () => {
    if (!newSpaceName) return
    try {
      await createSpace(newSpaceName)
      setNewSpaceName('')
    } catch (err) {
      console.error('Failed to create space:', err)
    }
  }

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedSpace) return
    try {
      await uploadToSpace(selectedSpace.id, file)
      // Reset file input
      e.target.value = ''
    } catch (err) {
      console.error('Failed to upload file:', err)
    }
  }

  const handleDeleteContent = async (contentId: string) => {
    if (!selectedSpace) return
    if (!confirm('Are you sure you want to delete this content?')) return
    try {
      await deleteFromSpace(selectedSpace.id, contentId)
    } catch (err) {
      console.error('Failed to delete content:', err)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur">
        <h2 className="text-xl font-semibold mb-4">Storacha Account</h2>
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
            {error}
            <button onClick={clearError} className="ml-2 underline">
              Dismiss
            </button>
          </div>
        )}
        {emailSent ? (
          <div className="space-y-4">
            <p className="text-slate-300">
              A validation email has been sent to <strong>{email}</strong>
            </p>
            <p className="text-slate-400 text-sm">
              Please check your email and click the validation link. This window will automatically update once you've confirmed.
            </p>
            <p className="text-slate-400 text-sm">
              ⏱️ Waiting for email confirmation (timeout: 5 minutes)...
            </p>
            <div className="text-yellow-400 text-sm p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
              ⚠️ <strong>Important:</strong> All data uploaded to Storacha is public and permanently stored (minimum 30-day retention). Do not upload sensitive information.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                placeholder="your@email.com"
              />
            </div>
            <button
              onClick={handleLogin}
              disabled={isLoading || !email}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg"
            >
              {isLoading ? 'Logging in...' : 'Create Account'}
            </button>
            <div className="text-yellow-400 text-sm p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
              ⚠️ <strong>Important:</strong> All data uploaded to Storacha is public and permanently stored (minimum 30-day retention). Do not upload sensitive information.
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Account Info */}
      <div className="rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold">Storacha Account</h2>
          <button
            onClick={handleLogout}
            className="px-3 py-1 text-sm bg-red-500/10 hover:bg-red-500/20 rounded"
          >
            Logout
          </button>
        </div>
        {currentAccount && (
          <div className="space-y-2 text-sm">
            <p>
              <strong>Email:</strong> {currentAccount.email}
            </p>
            <p>
              <strong>Account DID:</strong>{' '}
              <code className="text-xs">{currentAccount.accountDID}</code>
            </p>
            <p>
              <strong>Agent DID:</strong>{' '}
              <code className="text-xs">{currentAccount.agentDID}</code>
            </p>
          </div>
        )}
        {accounts.length > 1 && (
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Switch Account</label>
            <select
              onChange={(e) => handleSwitchAccount(e.target.value)}
              value={currentAccount?.id || ''}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.email}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Spaces */}
      <div className="rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur">
        <h2 className="text-xl font-semibold mb-4">Spaces</h2>
        {isLoadingSpaces ? (
          <p className="text-slate-400">Loading spaces...</p>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newSpaceName}
                onChange={(e) => setNewSpaceName(e.target.value)}
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg"
                placeholder="New space name"
              />
              <button
                onClick={handleCreateSpace}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Create Space
              </button>
            </div>
            {spaces.length === 0 ? (
              <p className="text-slate-400">No spaces yet. Create one above.</p>
            ) : (
              <div className="space-y-2">
                {spaces.map((space) => (
                  <div
                    key={space.id}
                    className={`p-3 rounded border cursor-pointer ${
                      selectedSpace?.id === space.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-white/10 bg-white/5'
                    }`}
                    onClick={() => selectSpace(space)}
                  >
                    <p className="font-medium">{space.name}</p>
                    <p className="text-xs text-slate-400">{space.did}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Space Contents */}
      {selectedSpace && (
        <div className="rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur">
          <h2 className="text-xl font-semibold mb-4">Contents: {selectedSpace.name}</h2>
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
              {error}
              <button onClick={clearError} className="ml-2 underline">
                Dismiss
              </button>
            </div>
          )}
          <div className="space-y-4">
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={isLoadingContents}
              className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            />
            {isLoadingContents ? (
              <p className="text-slate-400">Loading contents...</p>
            ) : (
              <div className="space-y-2">
                {(spaceContents[selectedSpace.id] || []).length === 0 ? (
                  <p className="text-slate-400">No files uploaded yet.</p>
                ) : (
                  spaceContents[selectedSpace.id].map((content) => (
                    <div
                      key={content.id}
                      className="flex justify-between items-center p-3 bg-white/5 rounded border border-white/10"
                    >
                      <div>
                        <p className="font-medium">{content.name}</p>
                        {content.gatewayUrl && (
                          <a
                            href={content.gatewayUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:underline"
                          >
                            View on IPFS
                          </a>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteContent(content.id)}
                        className="px-3 py-1 text-sm bg-red-500/10 hover:bg-red-500/20 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

