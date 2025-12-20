# DID:ethr: Migration Plan - MVP Implementation

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
1. **Authentication**: Ethereum wallet → DID:ethr: (`did:ethr:0x...`)
2. **Identity**: Wallet address = DID identifier
3. **Storage**: Direct IPFS storage (can keep Storacha or use direct IPFS)
4. **Profile Linking**: Profile CID stored in DID document or IPNS

---

## MVP Implementation Plan

### Phase 1: Foundation Setup (Week 1)

#### Step 1.1: Install Required Dependencies
```bash
pnpm add @didtools/ethr-did-resolver
pnpm add @didtools/key-did-resolver
pnpm add dids
pnpm add @ipld/dag-cbor
pnpm add @ipld/dag-pb
pnpm add ipfs-http-client  # If switching from Storacha
```

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

#### Step 1.3: Create IPFS Service (if replacing Storacha)
**File**: `src/services/ipfs/ipfsManager.ts`

```typescript
// Direct IPFS client for file storage
// Responsibilities:
// - Upload files to IPFS
// - Pin files (optional, via Pinata or similar)
// - Fetch files by CID
```

**Alternative**: Keep Storacha but use it only for storage, not authentication

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
- For discovery: Store in public registry (IPFS JSON file or smart contract)

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

#### Step 3.2: Remove Storacha Authentication
- Remove `login(email)` function
- Remove email input UI
- Remove Storacha client initialization for auth
- Keep Storacha only for IPFS storage (if using)

#### Step 3.3: Multi-Account Support
- Each wallet address = separate DID = separate profile
- Store multiple DIDs in Zustand: `dids: string[]`
- Switch between DIDs (similar to current account switching)

---

### Phase 4: Profile Management (Week 2-3)

#### Step 4.1: Update Profile Save Flow
**Current**: `saveProfile()` → Storacha upload → Store CID
**New**: `saveProfile()` → IPFS upload → Store CID → Update DID/IPNS

**Implementation**:
```typescript
saveProfile: async (profile: ParticipantProfile) => {
  // 1. Upload profile JSON to IPFS
  const profileCID = await ipfsManager.uploadFile(profileJSON)
  
  // 2. Store CID in DID document or IPNS
  await didManager.updateProfileCID(currentDID, profileCID)
  
  // 3. Update local state
  set({ profile, profileCID })
}
```

#### Step 4.2: Update Profile Load Flow
**Current**: Search Storacha uploads → Find profile.json → Load
**New**: Resolve DID → Get profile CID → Fetch from IPFS

**Implementation**:
```typescript
loadProfile: async () => {
  // 1. Resolve DID to get profile CID
  const profileCID = await didManager.getProfileCID(currentDID)
  
  // 2. Fetch profile from IPFS
  const profile = await ipfsManager.fetchFile(profileCID)
  
  // 3. Update local state
  set({ profile, profileCID })
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

#### Step 5.3: Remove Storacha-Specific UI
- Remove "Storacha Account" references
- Remove payment plan warnings (if not using Storacha)
- Update all text to DID/wallet terminology

---

### Phase 6: Storage Migration (Week 3-4)

#### Step 6.1: Choose Storage Strategy

**Option A: Keep Storacha for Storage**
- Pros: Existing infrastructure, pinning, reliability
- Cons: Still depends on Storacha service
- Implementation: Use Storacha client only for `uploadFile()`, not auth

**Option B: Direct IPFS via HTTP Client**
- Pros: Decentralized, no service dependency
- Cons: Need pinning service (Pinata, Infura, etc.)
- Implementation: Use `ipfs-http-client` or `helia`

**Option C: Hybrid Approach** (Recommended for MVP)
- Use Storacha for storage initially (quick migration)
- Plan migration to direct IPFS later
- Abstract storage behind interface

#### Step 6.2: Create Storage Abstraction
**File**: `src/services/storage/storageInterface.ts`

```typescript
interface StorageProvider {
  uploadFile(file: File): Promise<string> // Returns CID
  fetchFile(cid: string): Promise<any>
  deleteFile(cid: string): Promise<void>
}
```

Implementations:
- `StorachaStorageProvider` (existing)
- `IPFSStorageProvider` (new)

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

**2.2 Integrate Wallet Connection**
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
    await useDIDStore.getState().connectWallet(did)
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
      useDIDStore.getState().connectWallet(did)
    }
  }, [isConnected, address])
  
  if (!isAuthenticated) {
    return (
      <div>
        <h2>Profile</h2>
        <ConnectButton /> {/* RainbowKit component */}
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
  // 1. Upload to IPFS (via Storacha or direct IPFS)
  const profileJSON = JSON.stringify(profile, null, 2)
  const profileFile = new File([profileJSON], 'profile.json')
  const profileCID = await storageProvider.uploadFile(profileFile)
  
  // 2. Store CID mapping (simple approach for MVP)
  // Option A: Store in Zustand persisted state
  // Option B: Store in DID document (more complex)
  // Option C: Store in IPNS key derived from DID
  
  // For MVP: Store in local state + IPFS registry
  await updateProfileRegistry(currentDID, profileCID)
  
  set({ profile, profileCID })
}
```

**4.2 Update Load Profile**
```typescript
loadProfile: async () => {
  // 1. Get profile CID from registry
  const profileCID = await getProfileCIDFromRegistry(currentDID)
  
  // 2. Fetch profile from IPFS
  const profileJSON = await storageProvider.fetchFile(profileCID)
  const profile = JSON.parse(profileJSON) as ParticipantProfile
  
  set({ profile, profileCID })
}
```

### Step 5: Profile Registry (Simple MVP Approach)

**5.1 Create Registry Service**
```typescript
// src/services/registry/profileRegistry.ts
// Store DID → Profile CID mapping in IPFS JSON file

const REGISTRY_CID = 'Qm...' // Fixed CID for registry (or use IPNS)

export async function updateProfileRegistry(
  did: string,
  profileCID: string
): Promise<void> {
  // 1. Fetch current registry
  const registry = await fetchRegistry()
  
  // 2. Update entry
  registry[did] = profileCID
  
  // 3. Upload updated registry
  const newRegistryCID = await uploadRegistry(registry)
  
  // 4. Update IPNS pointer (if using IPNS)
}
```

---

## Migration Checklist

### Week 1: Foundation
- [ ] Install DID dependencies
- [ ] Create `DIDManager` service
- [ ] Create `useDIDStore` with basic structure
- [ ] Test DID generation from wallet address
- [ ] Test DID resolution

### Week 2: Authentication
- [ ] Integrate RainbowKit wallet connection
- [ ] Replace email login with wallet connect
- [ ] Update `DIDManager` component
- [ ] Remove Storacha authentication code
- [ ] Test multi-wallet support

### Week 3: Profile Management
- [ ] Update `saveProfile` to use DID
- [ ] Update `loadProfile` to use DID
- [ ] Create profile registry service
- [ ] Update profile components
- [ ] Test profile save/load flow

### Week 4: UI & Polish
- [ ] Update all UI text (remove Storacha references)
- [ ] Add DID display in profile
- [ ] Test end-to-end flow
- [ ] Remove unused Storacha code
- [ ] Documentation

---

## Technical Decisions

### 1. Storage Provider
**Decision**: Keep Storacha for storage initially, abstract behind interface
**Rationale**: Faster migration, existing infrastructure, can migrate later

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

### Risk 2: Storage Migration
**Mitigation**: Abstract storage layer, can switch providers without UI changes

### Risk 3: User Migration
**Mitigation**: Provide migration tool to convert email accounts to DIDs (optional)

### Risk 4: Profile Discovery
**Mitigation**: Start with simple registry, can enhance later

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

