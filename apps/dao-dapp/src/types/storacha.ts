// Storacha account and space type definitions
// These types match the @storacha/client SDK structure

export interface StorachaAccount {
  id: string // Account identifier (e.g., "account-{email}")
  email: string
  accountDID: string // DID from Storacha account
  agentDID: string // DID from Storacha client agent
  createdAt?: Date
}

export interface StorachaSpace {
  id: string // Space DID
  name: string
  did: string // Space DID (same as id)
  registered: boolean
  createdAt?: Date
}

export interface StorachaContent {
  id: string // Content CID
  name: string
  cid: string
  size?: number
  type?: string
  uploadedAt?: Date
  gatewayUrl?: string // IPFS gateway URL
}

