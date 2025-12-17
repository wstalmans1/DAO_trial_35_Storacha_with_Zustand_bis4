import { useEffect } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useStorachaStore } from './stores'
import { storachaClientManager } from './services/storacha/clientManager'
import StorachaManager from './components/StorachaManager'

export default function App() {
  const { switchAccount } = useStorachaStore()

  useEffect(() => {
    // Initialize clients for persisted accounts on app load
    const initializeAccounts = async () => {
      const state = useStorachaStore.getState()
      const persistedAccounts = state.accounts
      const isAuthenticated = state.isAuthenticated
      const currentAccount = state.currentAccount
      
      // Only restore accounts if user is authenticated and has a current account
      if (isAuthenticated && currentAccount && persistedAccounts.length > 0) {
        // Initialize client for the current account
        await storachaClientManager.initializeClient(currentAccount.id)
        // Restore the current account
        await switchAccount(currentAccount.id)
      }
      // If not authenticated, don't restore - user needs to login again
    }
    initializeAccounts()
  }, [switchAccount])

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-slate-950 to-indigo-500/10" aria-hidden />
      <div className="relative flex w-full flex-col gap-10 px-6 py-10">
        <header className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-6 py-4 backdrop-blur">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Starter v27.2</p>
            <h1 className="text-2xl font-semibold text-white">DAO DApp</h1>
          </div>
          <ConnectButton />
        </header>
        <StorachaManager />
      </div>
    </div>
  )
}
