import { useState, useEffect } from 'react'
import { useStorachaStore } from '../stores'
import { storachaClientManager } from '../services/storacha/clientManager'
import ProfileView from './ProfileView'
import ProfileEdit from './ProfileEdit'

export default function StorachaManager() {
  const {
    // State
    currentAccount,
    isAuthenticated,
    accounts,
    selectedSpace,
    isLoading,
    isLoadingSpaces,
    error,
    paymentPlanSelected,
    // Profile state
    profile,
    isLoadingProfile,
    profileError,
    clearProfileError,
    // Actions
    login,
    logout,
    switchAccount,
    fetchSpaces,
    clearError,
    loadProfile,
  } = useStorachaStore()

  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [showFirstTimeWarning, setShowFirstTimeWarning] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)

  // Initialize existing accounts on mount (only if authenticated)
  useEffect(() => {
    const initializeAccounts = async () => {
      const state = useStorachaStore.getState()
      const isAuthenticated = state.isAuthenticated
      const currentAccount = state.currentAccount
      
      // Only restore if user is authenticated
      if (isAuthenticated && currentAccount) {
        // Initialize client for the current account
        const client = await storachaClientManager.initializeClient(currentAccount.id)
        
        // CRITICAL: Claim delegations FIRST to get latest spaces created in console
        // This ensures we have the most up-to-date delegations before fetching spaces
        console.log('[Storacha] Claiming delegations on mount to sync with console...')
        try {
          await client.capability.access.claim()
          console.log('[Storacha] Delegations claimed successfully on mount')
        } catch (claimError) {
          console.log('[Storacha] Delegations claim on mount (may already be claimed):', claimError)
          // Continue anyway - delegations might already be claimed
        }
        
        // Re-check payment plan status on mount
        try {
          const accounts = client.accounts()
          const accountEntries = Object.entries(accounts)
          if (accountEntries.length > 0) {
            const [accountDID] = accountEntries[0]
            const planInfo = await client.capability.plan.get(accountDID as any)
            if (planInfo && (planInfo as any).product) {
              useStorachaStore.setState({ paymentPlanSelected: true })
              console.log('[Storacha] Payment plan confirmed on mount')
            } else {
              useStorachaStore.setState({ paymentPlanSelected: false })
            }
          }
        } catch {
          console.log('[Storacha] Payment plan check failed on mount')
          useStorachaStore.setState({ paymentPlanSelected: false })
        }
        
        // Fetch spaces for the current account (after claiming delegations)
        await useStorachaStore.getState().fetchSpaces()
        
        // Load profile if space is available
        const state = useStorachaStore.getState()
        if (state.selectedSpace) {
          await state.loadProfile()
        }
      }
      // If not authenticated, don't restore - user needs to login again
    }
    initializeAccounts()
  }, [])

  // Load profile when space becomes available
  useEffect(() => {
    if (isAuthenticated && selectedSpace && !isLoadingSpaces) {
      loadProfile()
    }
  }, [selectedSpace, isAuthenticated, isLoadingSpaces, loadProfile])

  // Reset emailSent when authentication succeeds
  useEffect(() => {
    if (isAuthenticated && emailSent) {
      setEmailSent(false)
      setEmail('')
    }
  }, [isAuthenticated, emailSent])

  // Auto-fetch contents when space is available (handled in fetchSpaces now)

  const handleLogin = async () => {
    if (!email) return
    
    // Always allow login attempt - account might exist in Storacha but not in our local state
    setShowFirstTimeWarning(false)
    
    // Check if this account already exists in our persisted accounts
    // If it does, login will likely complete immediately without email validation
    const accountId = `account-${email}`
    const accountExists = accounts.some(a => a.id === accountId)
    
    // Only show email waiting message if this is a new account
    // For existing accounts, login should complete immediately
    if (!accountExists) {
      setEmailSent(true)
    }
    
    try {
      await login(email)
      // Login successful - fetch spaces for the newly authenticated account
      await fetchSpaces()
      // emailSent will be reset by useEffect when isAuthenticated becomes true
    } catch (err) {
      console.error('Login failed:', err)
      setEmailSent(false)
      // Check if error is about account not found
      if (err instanceof Error && err.message.includes('No account found')) {
        // Account doesn't exist or wasn't fully set up - show helpful message
        setShowFirstTimeWarning(true)
      }
      // Show error to user
      if (err instanceof Error) {
        // Error is already set in the store, but we can add more context
        console.error('Login error details:', err.message)
      }
    }
  }

  const handleLogout = () => {
    logout()
    setEmail('')
  }

  const handleSwitchAccount = async (accountId: string) => {
    await switchAccount(accountId)
  }


  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur">
        <h2 className="text-xl font-semibold mb-4">Profile</h2>
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
            <div className="text-yellow-400 text-xs p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
              <strong>Note:</strong> All data is public and permanently stored. Do not upload sensitive information.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {showFirstTimeWarning ? (
              <div className="space-y-4">
                <div className="text-yellow-400 text-sm p-4 bg-yellow-500/10 border border-yellow-500/20 rounded">
                  <p className="font-semibold mb-2">Account Not Found</p>
                  <p className="mb-2">
                    We couldn't find your Storacha account. This can happen if:
                  </p>
                  <ul className="list-disc list-inside mb-3 text-xs space-y-1">
                    <li>You haven't created an account at console.storacha.network yet</li>
                    <li>You created an account but haven't selected a payment plan</li>
                    <li>You haven't created a space in the console yet</li>
                    <li>There's a delay in account propagation (try again in a few moments)</li>
                  </ul>
                  <div className="flex gap-2 mt-3">
                    <a
                      href="https://console.storacha.network"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
                    >
                      Go to console.storacha.network
                    </a>
                    <button
                      onClick={() => {
                        setShowFirstTimeWarning(false)
                        setEmail('')
                      }}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm"
                    >
                      Try Again
                    </button>
                  </div>
                  <p className="text-xs mt-3 text-yellow-300/70">
                    Make sure you've completed account creation, payment plan selection, and created a space, then try logging in again.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="text-blue-400 text-sm p-3 bg-blue-500/10 border border-blue-500/20 rounded mb-4">
                  <p className="text-xs">
                    New here? Create your account at{' '}
                    <a
                      href="https://console.storacha.network"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-blue-300 font-medium"
                    >
                      console.storacha.network
                    </a>
                    {' '}first, then sign in below.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Sign in with your profile email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setShowFirstTimeWarning(false)
                    }}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-500"
                    placeholder="your@email.com"
                  />
                </div>
                <button
                  onClick={handleLogin}
                  disabled={isLoading || !email}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-medium"
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
              </>
            )}
            <div className="text-yellow-400 text-xs p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
              <strong>Note:</strong> All data is public and permanently stored. Do not upload sensitive information.
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
          <h2 className="text-xl font-semibold">Profile</h2>
          <button
            onClick={handleLogout}
            className="px-3 py-1 text-sm bg-red-500/10 hover:bg-red-500/20 rounded"
          >
            Logout
          </button>
        </div>
        {!paymentPlanSelected && (
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-yellow-400 text-sm">
            <p className="font-semibold mb-2">⚠️ Payment Plan Required</p>
            <p className="mb-2">
              To upload files, you need to select a payment plan.
            </p>
            <a
              href="https://console.storacha.network"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline inline-block"
            >
              Select a plan at console.storacha.network →
            </a>
            <p className="mt-2 text-xs text-yellow-300/70">
              After selecting a plan, refresh this page or log out and log back in.
            </p>
          </div>
        )}
        {accounts.length > 1 && (
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Switch Profile</label>
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

      {/* Profile Content - Only show if space is available */}
      {isLoadingSpaces ? (
        <div className="rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur">
          <p className="text-slate-400">Loading profile space...</p>
        </div>
      ) : !selectedSpace ? (
        <div className="rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur">
          <div className="text-yellow-400 text-sm p-4 bg-yellow-500/10 border border-yellow-500/20 rounded">
            <p className="font-semibold mb-2">No Space Found</p>
            <p className="mb-2">
              Please create a space at{' '}
              <a
                href="https://console.storacha.network"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                console.storacha.network
              </a>
              {' '}first, then refresh this page.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Profile Section */}
          <div className="rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur">
            {profileError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                {profileError}
                <button onClick={clearProfileError} className="ml-2 underline">Dismiss</button>
              </div>
            )}

            {isLoadingProfile ? (
              <p className="text-slate-400">Loading profile...</p>
            ) : isEditingProfile ? (
              <ProfileEdit
                profile={profile}
                onCancel={() => setIsEditingProfile(false)}
                onSave={() => {
                  setIsEditingProfile(false)
                  loadProfile()
                }}
              />
            ) : profile ? (
              <ProfileView
                profile={profile}
                onEdit={() => setIsEditingProfile(true)}
              />
            ) : (
              <div className="space-y-4">
                <p className="text-slate-400">No profile yet. Create one to get started!</p>
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Create Profile
                </button>
              </div>
            )}
          </div>

        </>
      )}
    </div>
  )
}

