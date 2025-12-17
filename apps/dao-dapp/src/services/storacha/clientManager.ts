import { create, type Client } from '@storacha/client'
import { StoreIndexedDB } from '@storacha/client/stores/indexeddb'

class StorachaClientManager {
  private clients: Map<string, Client> = new Map()

  /**
   * Initialize or retrieve a Storacha client for a specific account
   * Each account gets its own IndexedDB store namespace
   */
  async initializeClient(accountId: string): Promise<Client> {
    // Return existing client if already initialized
    if (this.clients.has(accountId)) {
      return this.clients.get(accountId)!
    }

    // Create new client with account-specific IndexedDB store
    const client = await create({
      store: new StoreIndexedDB(`storacha-account-${accountId}`)
    })

    // Storacha automatically loads existing state from IndexedDB if it exists
    this.clients.set(accountId, client)
    return client
  }

  /**
   * Get an existing client instance
   */
  getClient(accountId: string): Client | undefined {
    return this.clients.get(accountId)
  }

  /**
   * Remove a client from memory (doesn't delete IndexedDB data)
   */
  removeClient(accountId: string): void {
    this.clients.delete(accountId)
  }

  /**
   * Get all initialized account IDs
   */
  getAccountIds(): string[] {
    return Array.from(this.clients.keys())
  }
}

// Export singleton instance
export const storachaClientManager = new StorachaClientManager()

