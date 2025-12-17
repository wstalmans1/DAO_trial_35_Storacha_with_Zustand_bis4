import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { StorachaAccount, StorachaSpace, StorachaContent } from '../types/storacha'
import { storachaClientManager } from '../services/storacha/clientManager'

interface StorachaStore {
  // State
  currentAccount: StorachaAccount | null
  isAuthenticated: boolean
  accounts: StorachaAccount[]
  isLoading: boolean
  error: string | null
  spaces: StorachaSpace[]
  selectedSpace: StorachaSpace | null
  isLoadingSpaces: boolean
  spaceContents: Record<string, StorachaContent[]>
  isLoadingContents: boolean

  // Authentication actions
  login: (email: string) => Promise<void>
  logout: () => void
  switchAccount: (accountId: string) => Promise<void>
  addAccount: (account: StorachaAccount) => void
  removeAccount: (accountId: string) => Promise<void>

  // Spaces actions
  fetchSpaces: () => Promise<void>
  createSpace: (name: string) => Promise<void>
  deleteSpace: (spaceId: string) => Promise<void>
  selectSpace: (space: StorachaSpace | null) => void

  // Space contents actions
  fetchSpaceContents: (spaceId: string) => Promise<void>
  uploadToSpace: (spaceId: string, file: File) => Promise<void>
  deleteFromSpace: (spaceId: string, contentId: string) => Promise<void>

  // Utility actions
  clearError: () => void
  reset: () => void
}

const initialState = {
  currentAccount: null,
  isAuthenticated: false,
  accounts: [],
  isLoading: false,
  error: null,
  spaces: [],
  selectedSpace: null,
  isLoadingSpaces: false,
  spaceContents: {},
  isLoadingContents: false,
}

export const useStorachaStore = create<StorachaStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Authentication actions
      login: async (email: string) => {
        set({ isLoading: true, error: null })
        try {
          const accountId = `account-${email}`

          // Initialize client for this account
          const client = await storachaClientManager.initializeClient(accountId)

          // Login with email (sends validation email)
          // Implement 5-minute timeout
          // eslint-disable-next-line no-undef
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000)

          try {
            // Validate email format matches Storacha's expected type
            if (!email.includes('@')) {
              throw new Error('Invalid email format')
            }
            
            console.log('[Storacha] Starting login for:', email)
            await client.login(email as `${string}@${string}`, { signal: controller.signal })
            console.log('[Storacha] Email confirmed, login successful')

            // After login, get the account from client.accounts()
            const accounts = client.accounts()
            const accountEntries = Object.entries(accounts)
            
            if (accountEntries.length === 0) {
              throw new Error('No account found after login')
            }

            // Get the first account (should be the one we just logged in with)
            const [accountDID, account] = accountEntries[0]
            console.log('[Storacha] Account found:', accountDID)

            // Wait for payment plan selection (required for provisioning spaces)
            // This will wait up to 15 minutes (default) for user to select a plan
            try {
              console.log('[Storacha] Waiting for payment plan selection...')
              await account.plan.wait()
              console.log('[Storacha] Payment plan selected')
            } catch (planError) {
              // If plan selection times out or fails, still allow login but show warning
              console.warn('[Storacha] Payment plan selection pending or failed:', planError)
              // Continue with login - user can select plan later
            }

            // Get agent DID
            const agentDID = client.agent.did()
            console.log('[Storacha] Agent DID:', agentDID)

            // Update Zustand state (UI state only)
            const storachaAccount: StorachaAccount = {
              id: accountId,
              email: email,
              accountDID: accountDID,
              agentDID: agentDID,
              createdAt: new Date(),
            }

            console.log('[Storacha] Setting authenticated state')
            set({
              currentAccount: storachaAccount,
              isAuthenticated: true,
              accounts: [...get().accounts.filter(a => a.id !== accountId), storachaAccount],
              isLoading: false,
            })
            console.log('[Storacha] Login complete, state updated')
          } finally {
            clearTimeout(timeoutId)
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Login failed',
          })
          throw error
        }
      },

      logout: () => {
        const accountId = get().currentAccount?.id
        if (accountId) {
          storachaClientManager.removeClient(accountId)
        }
        set({
          currentAccount: null,
          isAuthenticated: false,
          selectedSpace: null,
          spaces: [],
          spaceContents: {},
        })
      },

      switchAccount: async (accountId: string) => {
        const account = get().accounts.find((a) => a.id === accountId)
        if (!account) {
          set({ error: 'Account not found' })
          return
        }
        // Initialize client if not already done
        await storachaClientManager.initializeClient(accountId)
        // Update Zustand state
        set({
          currentAccount: account,
          isAuthenticated: true,
          selectedSpace: null,
          spaces: [], // Will be fetched separately
        })
        // Fetch spaces for the new account
        await get().fetchSpaces()
      },

      addAccount: (account: StorachaAccount) => {
        set((state) => ({
          accounts: state.accounts.some((a) => a.id === account.id)
            ? state.accounts
            : [...state.accounts, account],
        }))
      },

      removeAccount: async (accountId: string) => {
        storachaClientManager.removeClient(accountId)
        set((state) => ({
          accounts: state.accounts.filter((a) => a.id !== accountId),
          currentAccount:
            state.currentAccount?.id === accountId ? null : state.currentAccount,
        }))
      },

      // Spaces actions
      fetchSpaces: async () => {
        const account = get().currentAccount
        if (!account) return

        set({ isLoadingSpaces: true })
        try {
          let client = storachaClientManager.getClient(account.id)
          if (!client) {
            client = await storachaClientManager.initializeClient(account.id)
          }

          const spaces = client.spaces()
          const storachaSpaces: StorachaSpace[] = spaces.map((space) => {
            const did = space.did()
            // Handle both method and property access patterns
            const name = 'name' in space && typeof (space as any).name === 'function' 
              ? (space as any).name() 
              : (space as any).name || did
            const registered = 'registered' in space && typeof (space as any).registered === 'function'
              ? (space as any).registered()
              : (space as any).registered !== false // Default to true if not explicitly false
            return {
              id: did,
              name: String(name),
              did: did,
              registered: Boolean(registered),
            }
          })

          set({ spaces: storachaSpaces, isLoadingSpaces: false })
        } catch (error) {
          set({
            isLoadingSpaces: false,
            error: error instanceof Error ? error.message : 'Failed to fetch spaces',
          })
        }
      },

      createSpace: async (name: string) => {
        const account = get().currentAccount
        if (!account) throw new Error('No account selected')

        set({ isLoadingSpaces: true })
        try {
          const client = storachaClientManager.getClient(account.id)
          if (!client) throw new Error('Client not initialized')

          // Get account object from client
          const accounts = client.accounts()
          const accountEntries = Object.entries(accounts)
          if (accountEntries.length === 0) {
            throw new Error('Account not found in client')
          }
          const accountObj = accountEntries[0][1] // Get first account

          // ⚠️ CRITICAL: Always provide account parameter to avoid losing access
          const space = await client.createSpace(name, { account: accountObj })

          // Update Zustand state
          const did = space.did()
          const spaceName = 'name' in space && typeof (space as any).name === 'function'
            ? (space as any).name()
            : (space as any).name || did
          const registered = 'registered' in space && typeof (space as any).registered === 'function'
            ? (space as any).registered()
            : (space as any).registered !== false
          const storachaSpace: StorachaSpace = {
            id: did,
            name: String(spaceName),
            did: did,
            registered: Boolean(registered),
          }

          set((state) => ({
            spaces: [...state.spaces, storachaSpace],
            isLoadingSpaces: false,
          }))
        } catch (error) {
          set({
            isLoadingSpaces: false,
            error: error instanceof Error ? error.message : 'Failed to create space',
          })
          throw error
        }
      },

      deleteSpace: async (_spaceId: string) => {
        // Note: Storacha doesn't support deleting spaces yet
        // This is a placeholder for future implementation
        set({ error: 'Space deletion is not yet supported by Storacha' })
      },

      selectSpace: (space: StorachaSpace | null) => {
        set({ selectedSpace: space })
      },

      // Space contents actions
      fetchSpaceContents: async (spaceId: string) => {
        const account = get().currentAccount
        if (!account) return

        set({ isLoadingContents: true })
        try {
          const client = storachaClientManager.getClient(account.id)
          if (!client) throw new Error('Client not initialized')

          // Set current space (spaceId is already a DID string from space.did())
          await client.setCurrentSpace(spaceId as `did:${string}:${string}`)

          // List uploads
          const result = await client.capability.upload.list({ cursor: '', size: 25 })

          const contents: StorachaContent[] = result.results.map((upload) => ({
            id: upload.root.toString(),
            name: upload.root.toString(), // You might want to store filenames separately
            cid: upload.root.toString(),
            gatewayUrl: `https://${upload.root.toString()}.ipfs.storacha.link`,
          }))

          set((state) => ({
            spaceContents: { ...state.spaceContents, [spaceId]: contents },
            isLoadingContents: false,
          }))
        } catch (error) {
          set({
            isLoadingContents: false,
            error: error instanceof Error ? error.message : 'Failed to fetch contents',
          })
        }
      },

      uploadToSpace: async (spaceId: string, file: File) => {
        const account = get().currentAccount
        if (!account) throw new Error('No account selected')

        set({ isLoadingContents: true })
        try {
          const client = storachaClientManager.getClient(account.id)
          if (!client) throw new Error('Client not initialized')

          // Set current space (spaceId is already a DID string from space.did())
          await client.setCurrentSpace(spaceId as `did:${string}:${string}`)

          // Upload file
          await client.uploadFile(file)

          // Refresh contents
          await get().fetchSpaceContents(spaceId)
        } catch (error) {
          set({
            isLoadingContents: false,
            error: error instanceof Error ? error.message : 'Failed to upload file',
          })
          throw error
        }
      },

      deleteFromSpace: async (spaceId: string, contentId: string) => {
        const account = get().currentAccount
        if (!account) return

        try {
          const client = storachaClientManager.getClient(account.id)
          if (!client) throw new Error('Client not initialized')

          // Set current space (spaceId is already a DID string from space.did())
          await client.setCurrentSpace(spaceId as `did:${string}:${string}`)

          // Import CID type from multiformats
          const { CID } = await import('multiformats/cid')
          const contentCID = CID.parse(contentId)

          // Remove upload (with shards)
          await client.remove(contentCID, { shards: true })

          // Refresh contents
          await get().fetchSpaceContents(spaceId)
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete content',
          })
          throw error
        }
      },

      // Utility actions
      clearError: () => set({ error: null }),

      reset: () => {
        // Clear all clients
        storachaClientManager.getAccountIds().forEach((id) => {
          storachaClientManager.removeClient(id)
        })
        set(initialState)
      },
    }),
    {
      name: 'storacha-store', // Zustand persist key
      partialize: (state) => ({
        // Only persist UI state, not client instances
        accounts: state.accounts,
        currentAccount: state.currentAccount,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

