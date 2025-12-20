# DID:ethr: Migration Plan - MVP Implementation

## Executive Summary

**Migration Goal**: Replace email-based authentication with DID:ethr: (Ethereum wallet-based) while **keeping Storacha as the IPFS/Filecoin storage provider**.

### ⚠️ Critical Understanding: Dual Authentication Functionality

**Storacha's `client.login(email)` serves TWO purposes**:
1. **DApp-level authentication**: Identifies the user in our application
2. **Storacha agent authentication**: Authenticates the local agent DID with Storacha's service to obtain UCAN delegations (proofs) required for storage operations

**This means**: We cannot simply "remove authentication" - the Storacha agent MUST be authenticated to get UCAN delegations to perform storage operations.

### ⚠️ Critical Constraint: Storacha Agent Principal Limitation

**Problem 1**: Storacha console only supports email authentication. Spaces are created and delegated to email addresses (`did:mailto:`).

**Problem 2**: **Storacha client agents use `did:key:` (ED25519) principals, NOT `did:ethr:`**
- Storacha client creates agents with `did:key:` DIDs (ED25519 keys)
- Storacha provides `Signer` from `@storacha/client/principal/ed25519` only
- UCAN delegations have an `audience` field that MUST match the agent's DID
- **A delegation created for `did:ethr:0x...` CANNOT be used by a `did:key:...` agent**

**This means**: We CANNOT directly use DID:ethr: as the Storacha agent principal.

**Reconciliation Strategy**: Two-Layer Identity Model
- **DApp Identity**: DID:ethr: (wallet-based, for user identity)
- **Storacha Agent**: DID:key: (Storacha's default, for storage operations)
- **Link**: Map DID:ethr: → DID:key: agent (one-to-one relationship)

**Migration Strategy**:
- ✅ **DApp Authentication**: Wallet/DID (`did:ethr:0x...`) replaces email for user identity
- ⚠️ **Storacha Space Setup**: Still requires email (one-time setup at console)
- ⚠️ **Storacha Agent**: MUST be `did:key:` (Storacha limitation - cannot use `did:ethr:` directly)
- ✅ **Agent Mapping**: Store `did:ethr:` → `did:key:` agent mapping
- ✅ **Storacha Agent Authentication**: Use UCAN delegations from space to `did:key:` agent
- ✅ **Storage**: Storacha remains (using `did:key:` agent with delegated access)

**Key Decision**: 
- ✅ **Keep Storacha** for all IPFS/Filecoin storage operations
- ⚠️ **Email still needed** for initial space setup (console requirement)
- ✅ **Use UCAN delegations** for daily agent authentication (no email login needed after setup)
- ✅ **One-time email setup** → **Ongoing DID-based authentication**

**Flow**:
1. **Setup Phase** (one-time):
   - User creates Storacha account at console (email required)
   - User creates space at console (delegated to email)
   - User connects wallet → Get DID:ethr: (DApp identity)
   - User provides email to DApp (one-time)
   - DApp logs in with email (background) → Creates `did:key:` agent automatically
   - DApp gets `did:key:` agent DID: `client.agent.did()` (e.g., `did:key:abc123...`)
   - DApp creates delegation: Space → `did:key:` agent (NOT `did:ethr:`)
   - Store mapping: `did:ethr:` → `did:key:` agent DID
   - Store delegation (keyed by `did:key:` agent DID)
   - User never needs email again

2. **Daily Use** (Wallet-based, but uses `did:key:` agent):
   - User connects wallet → Get DID:ethr: (DApp identity)
   - Look up `did:key:` agent DID from mapping
   - Load stored delegation (for that `did:key:` agent)
   - Initialize Storacha client with `did:key:` agent (from IndexedDB store)
   - Add delegation: `client.addSpace(delegation)`
   - Agent authenticated via UCAN (no email login needed)
   - **DApp identity remains `did:ethr:`** (for profile, UI, etc.)

**What Changes**:
- **DApp Authentication**: Email → Wallet/DID (`did:ethr:0x...`) for user identity
- **Identity**: Email address → Ethereum wallet address (for DApp)
- **Storacha Setup**: Email still required (one-time, at console)
- **Storacha Agent**: Always `did:key:` (Storacha limitation, cannot use `did:ethr:`)
- **Agent Mapping**: Store `did:ethr:` → `did:key:` agent mapping
- **Storacha Agent Auth**: Email login (one-time) → Create `did:key:` agent → Create delegation → UCAN delegation for daily use
- **Storage**: **Storacha remains** (using `did:key:` agent with delegated UCANs, email only for setup)

**What Stays**:
- Storacha client for IPFS/Filecoin storage
- Storacha spaces for file organization
- Storacha gateway for file retrieval
- Payment plan requirement (users still need Storacha account for space/payment)

### Impact on Migration Plan

**Critical Change**: We cannot simply "remove" Storacha authentication. Instead, we must:

1. **Replace email-based agent authentication** with **UCAN delegation-based authentication**
   - Email login → UCAN delegation from space to DID:ethr: agent
   - Agent still needs authentication, but via delegation instead of email

2. **Delegation Flow**:
   - User connects wallet → Get DID:ethr:
   - Get UCAN delegation (from backend, console, or user-provided)
   - Initialize Storacha client with DID:ethr: agent
   - Add delegation: `client.addSpace(delegation)` or `client.addProof(delegation)`
   - Agent now authenticated via UCAN (no email needed)

3. **User Setup Requirements**:
   - User MUST create Storacha account at console (email required - Storacha constraint)
   - User MUST create space at console (delegated to email - Storacha constraint)
   - User connects wallet → Get DID:ethr: (DApp identity)
   - **One-time email authentication** needed to:
     - Create `did:key:` agent (Storacha's default)
     - Get space access via email
     - Create delegation: Space → `did:key:` agent
     - Store mapping: `did:ethr:` → `did:key:` agent DID
   - Delegation creation options:
     - **Option A**: User provides email → DApp logs in with email (background) → Creates `did:key:` agent → Creates delegation to `did:key:` → Stores mapping and delegation
     - **Option B**: Backend service logs in with email → Creates `did:key:` agent → Creates delegation → Provides mapping and delegation to frontend
   - After delegation created: Daily use is wallet-based (no email needed, but uses `did:key:` agent internally)

4. **Benefits**:
   - DApp authentication: Wallet/DID (no email for daily use)
   - Storacha agent authentication: UCAN delegation (no email login after setup)
   - Storage: Still Storacha (using `did:key:` agent with delegated access)
   - **User Experience**: One-time email setup → Daily wallet-based authentication
   - **Identity Separation**: DApp uses `did:ethr:` for identity, Storacha uses `did:key:` for operations

5. **Trade-offs**:
   - ⚠️ Email still required for initial Storacha account/space setup (Storacha constraint)
   - ⚠️ Storacha agent MUST be `did:key:` (cannot use `did:ethr:` directly)
   - ✅ Email login only needed once (to create `did:key:` agent and delegation)
   - ✅ After delegation created, all operations use wallet (but agent is `did:key:` internally)
   - ✅ Better UX: Wallet connect instead of email validation flow
   - ✅ Clear separation: DApp identity (`did:ethr:`) vs Storacha agent (`did:key:`)

---

## Current State Analysis

### Current Architecture
- **Authentication**: Email-based via Storacha (`did:mailto:`)
- **Storage**: Storacha spaces on IPFS
- **State Management**: Zustand with persistence
- **Wallet Integration**: RainbowKit + wagmi (already installed but not used for auth)
- **Profile Storage**: Direct file uploads to IPFS via Storacha

### Key Components
- `useStorachaStore`: Manages authentication, spaces, and profiles
- `StorachaManager`: Main UI component for authentication and profile management
- `ProfileView` / `ProfileEdit`: Profile display and editing components

---

## Target Architecture: DID:ethr: Based DApp

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  RainbowKit  │  │   Zustand    │  │   UI Comps   │      │
│  │  (Wallet)    │→ │   Store      │← │  (Profile)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         ↓                  ↓                    ↓           │
└─────────┼──────────────────┼────────────────────┼──────────┘
          │                  │                    │
          ↓                  ↓                    ↓
┌─────────┼──────────────────┼────────────────────┼──────────┐
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ DID:ethr:   │  │   IPFS       │  │  Ethereum    │      │
│  │ Resolver    │  │   Storage    │  │  Registry    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Key Changes
1. **Authentication**: Ethereum wallet → DID:ethr: (`did:ethr:0x...`) - **REPLACES Storacha email auth**
2. **Identity**: Wallet address = DID identifier
3. **Storage**: **KEEP Storacha for IPFS/Filecoin storage** (only remove Storacha auth, keep storage)
4. **Profile Linking**: Profile CID stored in registry (IPFS JSON file via Storacha)

---

## MVP Implementation Plan

### Phase 1: Foundation Setup (Week 1)

#### Step 1.1: Install Required Dependencies
```bash
pnpm add dids
pnpm add @didtools/ethr-did-resolver
pnpm add key-did-resolver
```

**Note**: We keep `@storacha/client` for IPFS/Filecoin storage - only removing authentication, not storage.

#### Step 1.2: Create DID Service Layer
**File**: `src/services/did/didManager.ts`

```typescript
// DID:ethr: manager for creating and resolving DIDs
// Responsibilities:
// - Generate DID from Ethereum address
// - Resolve DID documents
// - Sign/verify messages with DID
// - Store profile CID in DID document or separate registry
```

**Key Functions**:
- `createDIDFromAddress(address: string): string` - Generate `did:ethr:0x...`
- `resolveDID(did: string): Promise<DIDDocument>`
- `signMessage(message: string, did: string): Promise<string>`
- `verifySignature(message: string, signature: string, did: string): Promise<boolean>`

#### Step 1.3: Create Storacha Storage Service with UCAN Delegations
**File**: `src/services/storage/storachaStorage.ts`

```typescript
// Storacha client wrapper using UCAN delegations (not email auth)
// Responsibilities:
// - Initialize Storacha client with DID:ethr: agent
// - Add UCAN delegations to authenticate agent for storage operations
// - Upload files to IPFS via Storacha
// - Fetch files by CID from Storacha gateway
// - Manage Storacha spaces for file organization
```

**Key Functions**:
- `initializeStorageClient(did: string, delegation: Delegation): Promise<Client>` - Initialize client with UCAN delegation
- `addSpaceFromDelegation(client: Client, delegation: Delegation): Promise<Space>` - Add space using delegation
- `uploadFile(file: File, spaceId: string): Promise<string>` - Upload and get CID
- `fetchFile(cid: string): Promise<any>` - Fetch file by CID

**Important**: 
- Storacha client initialized with DID:ethr: agent (from wallet)
- UCAN delegation proves agent has access to space
- No email authentication needed - delegation replaces it
- User still needs Storacha account/space (created at console), but access is delegated to their DID:ethr: agent

---

### Phase 2: State Management Migration (Week 1-2)

#### Step 2.1: Create New DID Store
**File**: `src/stores/useDIDStore.ts`

```typescript
interface DIDStore {
  // DID state
  currentDID: string | null
  didDocument: DIDDocument | null
  isAuthenticated: boolean
  walletAddress: string | null
  
  // Profile state (keep existing structure)
  profile: ParticipantProfile | null
  profileCID: string | null
  
  // Actions
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  loadProfile: () => Promise<void>
  saveProfile: (profile: ParticipantProfile) => Promise<void>
}
```

#### Step 2.2: Integrate with wagmi/RainbowKit
- Use `useAccount()` hook from wagmi
- Use `useConnect()` for wallet connection
- Map wallet address to DID: `did:ethr:${address}`

#### Step 2.3: Profile Storage Strategy

**Option A: Store Profile CID in DID Document**
- Update DID document with `profileCID` attribute
- Requires DID document updates (on-chain or IPNS)

**Option B: Use IPNS Key Linked to DID** (Recommended for MVP)
- Create IPNS key from DID
- Store profile CID in IPNS
- Resolve: DID → IPNS key → Profile CID

**Option C: Simple Registry Pattern** (Simplest for MVP)
- Store mapping: `DID → Profile CID` in Zustand persisted state
- For discovery: Store in public registry (IPFS JSON file via Storacha)

**Option D: Store in Storacha Space** (Current approach, keep for MVP)
- Upload profile to Storacha space (via delegated access)
- Store profile CID in registry
- Fetch from Storacha gateway

---

### Phase 3: Authentication Flow (Week 2)

#### Step 3.1: Replace Email Login with Wallet Connect
**File**: `src/components/DIDManager.tsx` (replaces `StorachaManager.tsx`)

**New Flow**:
1. User clicks "Connect Wallet"
2. RainbowKit modal opens
3. User selects wallet and connects
4. Extract address: `0x...`
5. Generate DID: `did:ethr:0x...`
6. Check if profile exists (load from IPFS/IPNS)
7. Set authenticated state

#### Step 3.2: Hybrid Approach - Email Setup + DID Delegation
**Critical**: Storacha console only supports email, so we need a hybrid approach:

**Setup Flow** (One-time, per user):
1. User connects wallet → Get DID:ethr:
2. Check if delegation exists for this DID (stored in Zustand or backend)
3. **If no delegation exists**:
   - User provides email (one-time setup)
   - DApp logs in with email (background): `client.login(email)`
   - Get space access via email authentication
   - Create delegation: `client.createDelegation(didEthrAgent, abilities)`
   - Store delegation (Zustand persisted state or backend)
   - User never needs to provide email again
4. **If delegation exists**:
   - Load stored delegation
   - Initialize Storacha client with DID:ethr: agent
   - Add delegation: `client.addSpace(delegation)` or `client.addProof(delegation)`
   - Agent authenticated via UCAN (no email needed)

**Daily Use Flow** (After setup):
- User connects wallet → Get DID:ethr:
- Load stored delegation
- Initialize Storacha client with delegation
- No email authentication needed

**UI Changes**:
- Remove email input from main login screen
- Add "First-time setup" flow (email input only if no delegation exists)
- After setup: Pure wallet-based authentication

#### Step 3.3: Multi-Account Support
- Each wallet address = separate DID = separate profile
- Store multiple DIDs in Zustand: `dids: string[]`
- Switch between DIDs (similar to current account switching)

---

### Phase 4: Profile Management (Week 2-3)

#### Step 4.1: Update Profile Save Flow
**Current**: `saveProfile()` → Storacha upload (with email auth) → Store CID
**New**: `saveProfile()` → Storacha upload (storage-only) → Store CID → Update registry

**Implementation**:
```typescript
saveProfile: async (profile: ParticipantProfile) => {
  // 1. Get or create Storacha space for this DID
  const spaceId = await storachaStorage.getOrCreateSpaceForDID(currentDID)
  
  // 2. Upload profile JSON to IPFS via Storacha (storage-only, no email auth)
  const profileJSON = JSON.stringify(profile, null, 2)
  const profileFile = new File([profileJSON], 'profile.json')
  const profileCID = await storachaStorage.uploadFile(profileFile, spaceId)
  
  // 3. Store CID in profile registry (IPFS JSON file via Storacha)
  await profileRegistry.updateProfileCID(currentDID, profileCID)
  
  // 4. Update local state
  set({ profile, profileCID })
}
```

#### Step 4.2: Update Profile Load Flow
**Current**: Search Storacha uploads → Find profile.json → Load
**New**: Get profile CID from registry → Fetch from IPFS via Storacha gateway

**Implementation**:
```typescript
loadProfile: async () => {
  // 1. Get profile CID from registry (stored on IPFS via Storacha)
  const profileCID = await profileRegistry.getProfileCID(currentDID)
  
  if (!profileCID) {
    set({ profile: null, profileCID: null, isLoadingProfile: false })
    return
  }
  
  // 2. Fetch profile from IPFS via Storacha gateway
  const response = await fetch(`https://${profileCID}.ipfs.storacha.link`)
  const profile = await response.json() as ParticipantProfile
  
  // 3. Update local state
  set({ profile, profileCID, isLoadingProfile: false })
}
```

#### Step 4.3: Profile Discovery (Optional for MVP)
- Create public registry: `registry.json` on IPFS
- Store: `{ did: "did:ethr:0x...", profileCID: "Qm..." }`
- Allow searching profiles by DID or name

---

### Phase 5: UI Updates (Week 3)

#### Step 5.1: Replace Login Screen
- Remove email input
- Add "Connect Wallet" button (RainbowKit ConnectButton)
- Show connected wallet address and DID
- Display "Switch Wallet" option for multi-account

#### Step 5.2: Update Profile Components
- `ProfileView`: Add DID display
- `ProfileEdit`: Keep existing functionality
- Add "Copy DID" button for sharing

#### Step 5.3: Update Storacha-Specific UI
- Remove "Storacha Account" authentication references
- **Keep payment plan setup** (still needed for Storacha storage)
- Update authentication text to DID/wallet terminology
- Keep storage-related UI (if showing storage status)
- Clarify that Storacha is used for storage, wallet for identity

---

### Phase 6: Storacha Storage Integration (Week 3-4)

#### Step 6.1: Storacha Storage-Only Setup

**Decision**: Use Storacha exclusively for IPFS/Filecoin storage
- **Pros**: Existing infrastructure, reliable pinning, Filecoin integration, proven service
- **Implementation**: Initialize Storacha client without email authentication, use only for storage

#### Step 6.2: Create Storacha Storage Service
**File**: `src/services/storage/storachaStorage.ts`

```typescript
import { create, type Client } from '@storacha/client'
import { StoreIndexedDB } from '@storacha/client/stores/indexeddb'

class StorachaStorageService {
  private clients: Map<string, Client> = new Map()
  
  // Initialize Storacha client for storage (no email auth)
  async initializeStorageClient(did: string): Promise<Client> {
    // Use DID as identifier instead of email
    const clientId = `storage-${did}`
    
    if (this.clients.has(clientId)) {
      return this.clients.get(clientId)!
    }
    
    // Create client with DID-based store namespace
    const client = await create({
      store: new StoreIndexedDB(`storacha-storage-${did}`)
    })
    
    // Note: No email login - we authenticate via DID/wallet
    // User must have Storacha account with payment plan set up
    // We'll use existing spaces or create new ones
    
    this.clients.set(clientId, client)
    return client
  }
  
  // Get or create space for DID
  async getOrCreateSpaceForDID(did: string): Promise<string> {
    const client = await this.initializeStorageClient(did)
    // Implementation: Get existing space or create new one
    // Map DID to space name/id
  }
  
  // Upload file via Storacha
  async uploadFile(file: File, spaceId: string): Promise<string> {
    const client = await this.initializeStorageClient(/* ... */)
    await client.setCurrentSpace(spaceId)
    const cid = await client.uploadFile(file)
    return cid.toString()
  }
}
```

**Important Considerations**:
- Users still need Storacha account with payment plan (set up at console.storacha.network)
- We'll use Storacha's storage infrastructure but authenticate via wallet/DID
- Map each DID to a Storacha space (one-to-one relationship)
- Store space mapping in Zustand persisted state

---

## Detailed Step-by-Step Implementation

### Step 1: Setup DID Infrastructure

**1.1 Install Dependencies**
```bash
cd apps/dao-dapp
pnpm add dids @didtools/ethr-did-resolver key-did-resolver
```

**1.2 Create DID Manager**
```typescript
// src/services/did/didManager.ts
import { DID } from 'dids'
import { getResolver } from '@didtools/ethr-did-resolver'
import { EthereumAuthProvider } from '@didtools/ethr-did-resolver'

export class DIDManager {
  // Generate DID from Ethereum address
  static createDIDFromAddress(address: string): string {
    return `did:ethr:${address}`
  }
  
  // Create DID instance with wallet provider
  static async createDIDWithProvider(
    address: string,
    provider: EthereumAuthProvider
  ): Promise<DID> {
    const did = new DID({
      provider: provider,
      resolver: getResolver(),
    })
    await did.authenticate()
    return did
  }
  
  // Resolve DID document
  static async resolveDID(did: string): Promise<DIDDocument> {
    // Use resolver to fetch DID document
  }
}
```

**1.3 Create UCAN Delegation Service**
```typescript
// src/services/storacha/delegationService.ts
// Handles getting UCAN delegations for DID:ethr: agents

export class DelegationService {
  // Get UCAN delegation for a DID:ethr: agent
  // Options:
  // 1. Fetch from backend API (if you have a backend)
  // 2. Fetch from IPFS registry (if stored there)
  // 3. User provides delegation (from console setup)
  static async getDelegationForDID(did: string): Promise<Delegation> {
    // Implementation depends on delegation source
  }
  
  // Store delegation (for user-provided delegations)
  static async storeDelegation(did: string, delegation: Delegation): Promise<void> {
    // Store in Zustand or IndexedDB
  }
}
```

### Step 2: Create New Store Structure

**2.1 Create DID Store**
```typescript
// src/stores/useDIDStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAccount, useConnect } from 'wagmi'
import { DIDManager } from '../services/did/didManager'

interface DIDStore {
  // DID state
  currentDID: string | null
  dids: string[] // Multiple DIDs (multiple wallets)
  isAuthenticated: boolean
  
  // Profile state
  profile: ParticipantProfile | null
  profileCID: string | null
  
  // Actions
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  switchDID: (did: string) => Promise<void>
  loadProfile: () => Promise<void>
  saveProfile: (profile: ParticipantProfile) => Promise<void>
}
```

**2.2 Integrate Wallet Connection with UCAN Delegations**
```typescript
// In component or hook
const { address, isConnected } = useAccount()
const { connect, connectors } = useConnect()

const handleConnect = async () => {
  if (!isConnected) {
    await connect({ connector: connectors[0] })
  }
  
  if (address) {
    const did = DIDManager.createDIDFromAddress(address)
    
    // Check if delegation exists for this DID
    let delegation = await DelegationManager.loadDelegation(did)
    
    // If no delegation, user needs to set up (one-time email)
    if (!delegation) {
      // Show setup flow: request email
      const email = await promptForEmail() // One-time setup
      delegation = await DelegationManager.createDelegationForDID(email, did)
    }
    
    // Connect wallet and initialize Storacha with delegation
    await useDIDStore.getState().connectWallet(did, delegation)
  }
}
```

### Step 3: Update Authentication Flow

**3.1 Replace Login Component**
```typescript
// src/components/DIDManager.tsx (replaces StorachaManager.tsx)
export default function DIDManager() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { currentDID, isAuthenticated, profile, loadProfile } = useDIDStore()
  
  useEffect(() => {
    if (isConnected && address) {
      const did = DIDManager.createDIDFromAddress(address)
      // Auto-connect if wallet already connected
      // This will fetch UCAN delegation and initialize Storacha client
      useDIDStore.getState().connectWallet(did)
    }
  }, [isConnected, address])
  
  if (!isAuthenticated) {
    return (
      <div>
        <h2>Profile</h2>
        <ConnectButton /> {/* RainbowKit component */}
        <p className="text-sm text-slate-400 mt-4">
          First time? Create your Storacha account and space at{' '}
          <a href="https://console.storacha.network" target="_blank">
            console.storacha.network
          </a>
          {' '}and get a delegation for your wallet address.
        </p>
      </div>
    )
  }
  
  // ... rest of profile UI
}
```

### Step 4: Profile Storage Implementation

**4.1 Update Save Profile**
```typescript
saveProfile: async (profile: ParticipantProfile) => {
  // 1. Get Storacha client (already initialized with UCAN delegation)
  const client = storachaStorage.getClientForDID(currentDID)
  
  // 2. Set current space (access granted via UCAN delegation)
  await client.setCurrentSpace(spaceDID)
  
  // 3. Upload profile JSON to IPFS via Storacha
  const profileJSON = JSON.stringify(profile, null, 2)
  const profileFile = new File([profileJSON], 'profile.json')
  const profileCID = await client.uploadFile(profileFile)
  
  // 4. Store CID mapping in profile registry (IPFS JSON file via Storacha)
  await profileRegistry.updateProfileCID(currentDID, profileCID.toString())
  
  // 5. Update local state
  set({ profile, profileCID: profileCID.toString() })
}
```

**4.2 Update Load Profile**
```typescript
loadProfile: async () => {
  // 1. Get profile CID from registry (stored on IPFS via Storacha)
  const profileCID = await profileRegistry.getProfileCID(currentDID)
  
  if (!profileCID) {
    set({ profile: null, profileCID: null, isLoadingProfile: false })
    return
  }
  
  // 2. Fetch profile from IPFS via Storacha gateway
  const response = await fetch(`https://${profileCID}.ipfs.storacha.link`)
  if (!response.ok) {
    throw new Error('Failed to fetch profile')
  }
  const profile = await response.json() as ParticipantProfile
  
  // 3. Update local state
  set({ profile, profileCID, isLoadingProfile: false })
}
```

### Step 5: UCAN Delegation Flow (Critical for MVP)

**5.1 Delegation Creation Flow** (Reconciling Email Constraint)

**The Constraint**: To create a delegation FROM a space, you need access TO that space. Storacha console only provides email-based access.

**Solution Options**:

**Option A: Client-Side Delegation Creation** (Recommended for MVP)
```typescript
// User provides email (one-time setup)
// DApp logs in with email to get space access
// Then creates delegation to DID:ethr: agent
async function createDelegationForDID(
  email: string,
  didEthr: string
): Promise<Delegation> {
  // 1. Login with email (one-time, background)
  const emailClient = await create({ store: new StoreMemory() })
  await emailClient.login(email)
  
  // 2. Get space (first space or user-selected)
  const spaces = emailClient.spaces()
  const space = spaces[0] // Or let user select
  await emailClient.setCurrentSpace(space.did())
  
  // 3. Create delegation to DID:ethr: agent
  const audience = DID.parse(didEthr)
  const abilities = ['space/blob/add', 'space/index/add', 'upload/add']
  const delegation = await emailClient.createDelegation(audience, abilities, {
    expiration: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year
  })
  
  // 4. Store delegation (never need email again)
  await storeDelegation(didEthr, delegation)
  
  return delegation
}
```

**Option B: Backend Service** (If you have backend)
```typescript
// Backend has email credentials or delegation
// Backend creates delegation for DID:ethr: agent
async function getDelegationFromBackend(
  did: string,
  email?: string // Optional, if backend doesn't have it
): Promise<Delegation> {
  const response = await fetch(`/api/storacha-delegation/${did}`, {
    method: 'POST',
    body: JSON.stringify({ email }) // If needed for first-time setup
  })
  const data = await response.arrayBuffer()
  const delegation = await Delegation.extract(new Uint8Array(data))
  return delegation.ok
}
```

**Option C: User-Provided Delegation** (Manual setup via CLI)
```typescript
// User creates delegation via Storacha CLI
// User pastes/imports delegation in DApp
async function importUserDelegation(delegationString: string): Promise<Delegation> {
  const delegation = await Delegation.parse(delegationString)
  // Store in Zustand persisted state
  return delegation
}
```

**Recommended Approach**: **Option A** (Client-side delegation creation)
- User provides email once (during setup)
- DApp creates delegation programmatically
- Delegation stored for future use
- No email needed after setup

**5.2 Delegation Management Service** (CORRECTED - Uses did:key: Agent)
```typescript
// src/services/storacha/delegationManager.ts
import { create, type Client } from '@storacha/client'
import { StoreIndexedDB, StoreMemory } from '@storacha/client/stores'
import type { Delegation } from '@storacha/client'
import * as DID from '@ipld/dag-ucan/did'

export class DelegationManager {
  // Create delegation from email-authenticated client to did:key: agent
  // Store mapping: did:ethr: → did:key: agent DID
  async setupDelegationForDID(
    email: string,
    didEthr: string,
    spaceDID?: string
  ): Promise<{ delegation: Delegation, agentDID: string }> {
    // 1. Create client for email auth (one-time)
    // This will create a did:key: agent automatically
    const emailClient = await create({
      store: new StoreMemory() // Temporary, don't persist email auth
    })
    
    // 2. Login with email (one-time setup)
    await emailClient.login(email)
    
    // 3. Get the did:key: agent DID that was created
    const agentDID = emailClient.agent.did() // This is did:key:...
    
    // 4. Get space (use provided or first available)
    const spaces = emailClient.spaces()
    const space = spaceDID 
      ? spaces.find(s => s.did() === spaceDID)
      : spaces[0]
    
    if (!space) {
      throw new Error('No space found. Please create a space at console.storacha.network')
    }
    
    await emailClient.setCurrentSpace(space.did())
    
    // 5. Create delegation TO the did:key: agent (NOT did:ethr:)
    // The delegation audience MUST match the agent DID
    const audience = DID.parse(agentDID) // Use did:key: agent, not did:ethr:
    const abilities = [
      'space/blob/add',
      'space/index/add', 
      'upload/add',
      'filecoin/offer'
    ]
    const expiration = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year
    
    const delegation = await emailClient.createDelegation(
      audience,
      abilities,
      { expiration }
    )
    
    // 6. Store mapping: did:ethr: → did:key: agent DID
    await this.storeAgentMapping(didEthr, agentDID)
    
    // 7. Store delegation (keyed by did:key: agent DID)
    await this.storeDelegation(agentDID, delegation)
    
    return { delegation, agentDID }
  }
  
  // Initialize client with stored delegation (using did:key: agent)
  async initializeClientWithDelegation(
    didEthr: string
  ): Promise<Client> {
    // 1. Get did:key: agent DID from mapping
    const agentDID = await this.getAgentDID(didEthr)
    if (!agentDID) {
      throw new Error(`No agent mapping found for ${didEthr}. Please complete setup.`)
    }
    
    // 2. Load delegation for this did:key: agent
    const delegation = await this.loadDelegation(agentDID)
    if (!delegation) {
      throw new Error(`No delegation found for agent ${agentDID}. Please complete setup.`)
    }
    
    // 3. Create client with did:key: agent (from IndexedDB store)
    // The store contains the agent's private key
    const client = await create({
      store: new StoreIndexedDB(`storacha-agent-${agentDID}`)
    })
    
    // 4. Verify agent DID matches
    if (client.agent.did() !== agentDID) {
      throw new Error(`Agent DID mismatch. Expected ${agentDID}, got ${client.agent.did()}`)
    }
    
    // 5. Add space from delegation (authenticates agent)
    const space = await client.addSpace(delegation)
    await client.setCurrentSpace(space.did())
    
    return client
  }
  
  // Store mapping: did:ethr: → did:key: agent DID
  async storeAgentMapping(didEthr: string, agentDID: string): Promise<void> {
    // Store in Zustand persisted state (recommended for MVP)
    // This allows us to look up the did:key: agent for a given did:ethr:
    const store = useDIDStore.getState()
    store.setAgentMapping(didEthr, agentDID)
    
    // Alternative: Store in IndexedDB directly
    // const db = await openDB('did-mappings', 1)
    // await db.put('mappings', { didEthr, agentDID }, didEthr)
  }
  
  // Get did:key: agent DID for a given did:ethr:
  async getAgentDID(didEthr: string): Promise<string | null> {
    // Load from Zustand persisted state (recommended for MVP)
    const store = useDIDStore.getState()
    return store.getAgentMapping(didEthr)
    
    // Alternative: Load from IndexedDB directly
    // const db = await openDB('did-mappings', 1)
    // const mapping = await db.get('mappings', didEthr)
    // return mapping?.agentDID || null
  }
  
  // Store delegation (keyed by did:key: agent DID)
  async storeDelegation(agentDID: string, delegation: Delegation): Promise<void> {
    // Serialize and store
    const archive = await delegation.archive()
    // Store in Zustand persisted state or IndexedDB
  }
  
  // Load stored delegation (by did:key: agent DID)
  async loadDelegation(agentDID: string): Promise<Delegation | null> {
    // Load from Zustand or IndexedDB
    // Deserialize and return
  }
}
```

### Step 6: Profile Registry (Simple MVP Approach)

**6.1 Create Registry Service**
```typescript
// src/services/registry/profileRegistry.ts
// Store DID → Profile CID mapping in IPFS JSON file via Storacha

// Registry stored on IPFS via Storacha
// Each DID has its own registry entry, or use a shared registry file
const REGISTRY_SPACE_ID = 'registry-space-id' // Shared space for registry

export async function updateProfileRegistry(
  did: string,
  profileCID: string,
  client: Client // Storacha client with delegation
): Promise<void> {
  // 1. Fetch current registry from IPFS (via Storacha)
  const registry = await getRegistry(client)
  
  // 2. Update entry
  registry[did] = {
    profileCID,
    updatedAt: new Date().toISOString()
  }
  
  // 3. Upload updated registry to IPFS via Storacha
  const registryJSON = JSON.stringify(registry, null, 2)
  const registryFile = new File([registryJSON], 'profile-registry.json')
  await client.setCurrentSpace(REGISTRY_SPACE_ID)
  const newRegistryCID = await client.uploadFile(registryFile)
  
  // 4. Store registry CID in Zustand or local storage
  // For MVP: Could also store per-DID mapping in Zustand persisted state
}

export async function getProfileCIDFromRegistry(
  did: string,
  client: Client
): Promise<string | null> {
  const registry = await getRegistry(client)
  return registry[did]?.profileCID || null
}
```

---

## Migration Checklist

### Week 1: Foundation & UCAN Delegations
- [ ] Install DID dependencies
- [ ] Create `DIDManager` service
- [ ] Create `DelegationService` for UCAN delegation management
- [ ] Create `StorachaStorageService` with delegation support
- [ ] Create `useDIDStore` with basic structure
- [ ] Test DID generation from wallet address
- [ ] Test UCAN delegation flow (get delegation, add to client)
- [ ] Test Storacha client initialization with delegation

### Week 2: Authentication & Delegation Integration
- [ ] Integrate RainbowKit wallet connection
- [ ] Replace email login with wallet connect + delegation flow
- [ ] Implement delegation fetching (backend or user-provided)
- [ ] Update `DIDManager` component
- [ ] Remove Storacha email authentication code
- [ ] Test multi-wallet support with delegations
- [ ] Handle delegation expiration and renewal

### Week 3: Profile Management
- [ ] Update `saveProfile` to use Storacha client with delegation
- [ ] Update `loadProfile` to use Storacha client with delegation
- [ ] Create profile registry service (using Storacha storage)
- [ ] Update profile components
- [ ] Test profile save/load flow with delegated access

### Week 4: UI & Polish
- [ ] Update all UI text (remove email auth references)
- [ ] Add DID display in profile
- [ ] Add delegation status/expiration UI
- [ ] Add instructions for delegation setup
- [ ] Test end-to-end flow
- [ ] Remove unused Storacha email auth code
- [ ] Documentation

---

## Technical Decisions

### 1. Storage Provider
**Decision**: **Use Storacha exclusively for IPFS/Filecoin storage**
**Rationale**: 
- Existing infrastructure and proven reliability
- Filecoin integration for long-term storage
- Pinning and redundancy handled by Storacha
- Users already familiar with Storacha console setup
- No need to abstract - Storacha is the storage solution
**Note**: Only authentication changes (email → DID), storage remains Storacha

### 2. Profile Registry
**Decision**: Simple IPFS JSON file registry (not DID document)
**Rationale**: Easier MVP, no on-chain transactions needed

### 3. DID Resolution
**Decision**: Use `@didtools/ethr-did-resolver` with public resolver
**Rationale**: Standard library, works with Ethereum addresses

### 4. Multi-Account Support
**Decision**: Support multiple wallet connections (like current multi-account)
**Rationale**: Maintains current UX, users can switch wallets

---

## Risks & Mitigations

### Risk 1: DID Resolution Complexity
**Mitigation**: Start with simple address-based DIDs, add document updates later

### Risk 2: UCAN Delegation Management
**Risk**: Users need UCAN delegation to access Storacha spaces with `did:key:` agent (not `did:ethr:` - Storacha agents use `did:key:`)
**Mitigation**: 
- **Option A**: Backend service creates delegations (requires backend)
- **Option B**: Users get delegations from console (manual step)
- **Option C**: Hybrid - backend creates delegations, users provide space DID
- Store delegations in Zustand persisted state (keyed by `did:key:` agent DID)
- Store agent mapping (`did:ethr:` → `did:key:`) in Zustand persisted state
- Provide clear instructions for delegation setup
- Note: Delegations are created for `did:key:` agents, not `did:ethr:` (Storacha limitation)

### Risk 3: Storacha Storage Setup
**Risk**: Users need Storacha account with payment plan for storage
**Mitigation**: 
- Clear instructions to set up Storacha account at console.storacha.network
- Check payment plan status before allowing uploads
- Show helpful error messages if storage not available
- Keep existing Storacha space management (one space per DID)

### Risk 4: User Migration
**Mitigation**: Provide migration tool to convert email accounts to DIDs (optional)

### Risk 5: Profile Discovery
**Mitigation**: Start with simple registry, can enhance later

### Risk 6: Delegation Expiration
**Risk**: UCAN delegations can expire
**Mitigation**: 
- Check delegation expiration before operations
- Provide UI to refresh/renew delegations
- Store delegation expiration in state
- Auto-refresh delegations when needed

### Risk 7: Agent Mapping Storage
**Risk**: Mapping between `did:ethr:` and `did:key:` agent could be lost
**Mitigation**: 
- **Store in Zustand persisted state** (recommended for MVP)
  - Persisted to IndexedDB via Zustand's persist middleware
  - Survives page refreshes
  - Easy to access from store
- **Alternative**: Store in separate IndexedDB table
  - More explicit control
  - Can be shared across origins if needed
- **Backup**: Could also store mapping in profile metadata (IPFS)
  - For recovery if local storage is lost
  - Not recommended for primary storage (slower)

---

## Future Enhancements (Post-MVP)

1. **DID Document Updates**: Store profile CID in DID document itself
2. **IPNS Integration**: Use IPNS keys derived from DIDs
3. **Profile Discovery**: Search profiles by name, DID, or attributes
4. **Verifiable Credentials**: Add credential support to profiles
5. **Cross-Chain DIDs**: Support multiple chains (Polygon, Base, etc.)
6. **Social Recovery**: Add recovery mechanisms for lost wallets

---

## Resources

- [DID:ethr: Specification](https://github.com/decentralized-identity/ethr-did-resolver)
- [DID Tools Documentation](https://github.com/ceramicnetwork/js-did)
- [RainbowKit Documentation](https://rainbowkit.com/)
- [wagmi Documentation](https://wagmi.sh/)

