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
  paymentPlanSelected: boolean

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
  ensureProofs: (client: any, retries?: number) => Promise<void>

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
  paymentPlanSelected: false,
}

export const useStorachaStore = create<StorachaStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Authentication actions
      // Note: Accounts should be created at console.storacha.network first
      // This function logs in to an existing Storacha account
      login: async (email: string) => {
        set({ isLoading: true, error: null })
        try {
          const accountId = `account-${email}`

          // Initialize client for this account
          const client = await storachaClientManager.initializeClient(accountId)

          // Login with email (sends validation email if first time on this device)
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

            // Claim delegations to get latest spaces created elsewhere (e.g., in console)
            // This also claims the account itself if it exists
            try {
              console.log('[Storacha] Claiming delegations...')
              const delegations = await client.capability.access.claim()
              console.log('[Storacha] Claimed delegations:', delegations.length)
            } catch (claimError) {
              console.warn('[Storacha] Failed to claim delegations (may already be claimed):', claimError)
              // Continue - delegations might already be claimed
            }

            // After login and claiming, get the account from client.accounts()
            // Note: If account was just created in console, we need to wait a moment for it to propagate
            let accounts = client.accounts()
            let accountEntries = Object.entries(accounts)
            
            // If no accounts found, try claiming again after a short delay
            if (accountEntries.length === 0) {
              console.log('[Storacha] No accounts found immediately, waiting and retrying...')
              await new Promise(resolve => setTimeout(resolve, 1000))
              // Try claiming again
              try {
                await client.capability.access.claim()
              } catch {
                // Ignore errors
              }
              accounts = client.accounts()
              accountEntries = Object.entries(accounts)
            }
            
            if (accountEntries.length === 0) {
              throw new Error('No account found after login. Please ensure you have created an account at console.storacha.network and completed the payment plan selection.')
            }

            // Get the first account (should be the one we just logged in with)
            const [accountDID] = accountEntries[0]
            console.log('[Storacha] Account found:', accountDID)

            // Check if payment plan is already selected (non-blocking)
            // Note: account.plan.wait() can hang if user hasn't selected a plan yet
            // We'll check the plan status but not wait for it
            let planSelected = false
            try {
              // Try to get plan info - if it succeeds, plan is selected
              const planInfo = await client.capability.plan.get(accountDID as any)
              console.log('[Storacha] Payment plan status:', planInfo)
              planSelected = true
            } catch {
              // Plan not selected yet - this is OK, user can select it later
              console.log('[Storacha] Payment plan not yet selected - user can select plan at console.storacha.network')
              planSelected = false
            }
            
            // Don't wait for plan selection - allow login to complete
            // User can select plan at console.storacha.network if needed

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
              paymentPlanSelected: planSelected,
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
          paymentPlanSelected: false,
        })
      },

      switchAccount: async (accountId: string) => {
        const account = get().accounts.find((a) => a.id === accountId)
        if (!account) {
          set({ error: 'Account not found' })
          return
        }
        // Initialize client if not already done
        const client = await storachaClientManager.initializeClient(accountId)
        
        // Claim delegations to get latest spaces
        try {
          await client.capability.access.claim()
        } catch (claimError) {
          console.log('[Storacha] Delegations already claimed or error:', claimError)
        }
        
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

      // Helper function to ensure proofs are available
      ensureProofs: async (client: any, retries = 2): Promise<void> => {
        for (let i = 0; i <= retries; i++) {
          try {
            // Check if we have proofs for space operations
            const proofs = client.proofs()
            if (proofs && proofs.length > 0) {
              console.log('[Storacha] Proofs available:', proofs.length)
              return
            }
            
            // No proofs found, try claiming delegations
            console.log(`[Storacha] No proofs found, claiming delegations (attempt ${i + 1}/${retries + 1})...`)
            const delegations = await client.capability.access.claim()
            console.log('[Storacha] Claimed delegations:', delegations.length)
            
            // Verify proofs are now available
            const newProofs = client.proofs()
            if (newProofs && newProofs.length > 0) {
              console.log('[Storacha] Proofs now available:', newProofs.length)
              return
            }
            
            // If still no proofs and not last retry, wait before retrying
            if (i < retries) {
              await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
            }
          } catch (error) {
            console.warn(`[Storacha] Error ensuring proofs (attempt ${i + 1}):`, error)
            if (i === retries) {
              throw new Error('Failed to obtain proofs after retries. Please ensure you have created a space at console.storacha.network.')
            }
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
          }
        }
      },

      // Spaces actions
      // Automatically selects and uses the first space
      fetchSpaces: async () => {
        const account = get().currentAccount
        if (!account) return

        set({ isLoadingSpaces: true })
        try {
          let client = storachaClientManager.getClient(account.id)
          if (!client) {
            client = await storachaClientManager.initializeClient(account.id)
          }

          // Ensure proofs are available before operations
          await get().ensureProofs(client)

          const spaces = client.spaces()
          console.log('[Storacha] Found spaces:', spaces.length)
          
          if (spaces.length === 0) {
            set({ 
              spaces: [], 
              isLoadingSpaces: false,
              selectedSpace: null,
              error: 'No space found. Please create a space at console.storacha.network first.'
            })
            return
          }

          // Automatically select the first space
          const firstSpace = spaces[0]
          const did = firstSpace.did()
          const name = 'name' in firstSpace && typeof (firstSpace as any).name === 'function' 
            ? (firstSpace as any).name() 
            : (firstSpace as any).name || did
          const registered = 'registered' in firstSpace && typeof (firstSpace as any).registered === 'function'
            ? (firstSpace as any).registered()
            : (firstSpace as any).registered !== false

          const storachaSpace: StorachaSpace = {
            id: did,
            name: String(name),
            did: did,
            registered: Boolean(registered),
          }

          // Set current space in client
          await client.setCurrentSpace(did as `did:${string}:${string}`)

          set({ 
            spaces: [storachaSpace], // Only store the first space
            selectedSpace: storachaSpace,
            isLoadingSpaces: false 
          })

          // Automatically fetch contents for the first space
          await get().fetchSpaceContents(did)
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

          // Ensure proofs are available before operations
          await get().ensureProofs(client)

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

          // Ensure proofs are available before operations
          await get().ensureProofs(client)

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

          // Ensure proofs are available before operations
          await get().ensureProofs(client)

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

