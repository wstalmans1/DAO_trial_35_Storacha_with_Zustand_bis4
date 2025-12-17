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
      const persistedAccounts = useStorachaStore.getState().accounts
      for (const account of persistedAccounts) {
        await storachaClientManager.initializeClient(account.id)
      }
      // Restore current account if exists
      if (persistedAccounts.length > 0) {
        const currentAccount = useStorachaStore.getState().currentAccount
        if (currentAccount) {
          await switchAccount(currentAccount.id)
        } else {
          await switchAccount(persistedAccounts[0].id)
        }
      }
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
