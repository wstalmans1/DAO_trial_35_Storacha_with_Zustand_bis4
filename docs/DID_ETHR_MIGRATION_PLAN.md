# DID:ethr: Migration Plan - MVP Implementation

## Executive Summary

**Migration Goal**: Replace email-based DApp authentication with DID:ethr: (Ethereum wallet-based) while **keeping Storacha as the IPFS/Filecoin storage provider**.

---

## Core Understanding: How Storacha Works

### Storacha's Architecture (Per Official Documentation)

Storacha is a **capability-based storage system** using UCAN delegations:

1. **Agent Creation**: When you call `create()`, Storacha generates a local `did:key:` agent (ED25519 keypair) stored in IndexedDB
2. **Email Bootstrap**: `login(email)` is **only** for initial authorization - it:
   - Sends email challenge to user
   - When confirmed, issues UCAN delegations to the agent's `did:key:`
   - Claims existing delegations stashed for that email (`did:mailto:`)
3. **Post-Bootstrap**: All operations use UCAN delegations - no email needed
4. **Agent Identity**: Storacha agents are **always** `did:key:` (ED25519) - cannot use `did:ethr:` directly

**Key Insight**: Email is NOT an identity - it's a **human authentication oracle** for bootstrap only. After delegation, operations are purely cryptographic.

---

## Migration Strategy: Two-Layer Identity Model

### The Constraint

- **Storacha agents MUST be `did:key:`** (Storacha limitation - only ED25519 signers available)
- **UCAN delegations have an `audience` field** that MUST match the agent's DID
- **We want DApp identity to be `did:ethr:`** (wallet-based)

### The Solution

**Two-Layer Identity**:
- **DApp Identity**: `did:ethr:0x...` (wallet-based, for user identity, profiles, UI)
- **Storacha Agent**: `did:key:...` (ED25519, for storage operations)
- **Mapping**: Store `did:ethr:` → `did:key:` agent DID (one-to-one, device/origin-specific)

**Authentication Flow**:

1. **Setup Phase** (one-time):
   - User creates Storacha account/space at console (email required - Storacha constraint)
   - User connects wallet → Get `did:ethr:0x...` (DApp identity)
   - User provides email to DApp (one-time)
   - DApp calls `create()` → Creates `did:key:` agent automatically
   - DApp calls `login(email)` → Authenticates agent, claims delegations
   - DApp gets agent DID: `client.agent.did()` (e.g., `did:key:abc123...`)
   - DApp creates delegation: Space → `did:key:` agent (NOT `did:ethr:`)
   - Store mapping: `did:ethr:` → `did:key:` agent DID (in Zustand persisted state)
   - Store delegation (keyed by `did:key:` agent DID)
   - User never needs email again

2. **Daily Use** (Wallet-based):
   - User connects wallet → Get `did:ethr:0x...` (DApp identity)
   - Look up `did:key:` agent DID from mapping
   - Load stored delegation (for that `did:key:` agent)
   - Initialize Storacha client with `did:key:` agent (from IndexedDB store)
   - Add delegation: `client.addSpace(delegation)` or `client.addProof(delegation)`
   - Agent authenticated via UCAN (no email login needed)
   - **DApp identity remains `did:ethr:`** (for profile, UI, etc.)

### What Changes vs. What Stays

**Changes**:
- DApp authentication: Email → Wallet/DID (`did:ethr:0x...`)
- Storacha agent auth: Email login (one-time) → UCAN delegation (daily use)
- Agent mapping: Store `did:ethr:` → `did:key:` relationship

**Stays**:
- Storacha client for IPFS/Filecoin storage
- Storacha spaces for file organization
- Storacha gateway for file retrieval
- Payment plan requirement (users still need Storacha account)

---

## Current State Analysis

### Current Architecture
- **Authentication**: Email-based via Storacha (`did:mailto:`)
- **Storage**: Storacha spaces on IPFS
- **State Management**: Zustand with persistence
- **Wallet Integration**: RainbowKit + wagmi (installed but not used for auth)
- **Profile Storage**: Direct file uploads to IPFS via Storacha

### Key Components
- `useStorachaStore`: Manages authentication, spaces, and profiles
- `StorachaManager`: Main UI component for authentication and profile management
- `ProfileView` / `ProfileEdit`: Profile display and editing components

---

## Target Architecture

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
│  │ DID:ethr:   │  │   Storacha   │  │  Profile     │      │
│  │ (DApp ID)   │  │   Agent      │  │  Registry    │      │
│  │             │  │   (did:key:) │  │  (IPFS)       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

**Key Changes**:
1. **Authentication**: Ethereum wallet → DID:ethr: (`did:ethr:0x...`) - replaces email for DApp identity
2. **Identity**: Wallet address = DID identifier
3. **Storage**: **KEEP Storacha** for IPFS/Filecoin storage (using `did:key:` agent with UCAN delegations)
4. **Profile Linking**: Profile CID stored in registry (IPFS JSON file via Storacha)

---

## MVP Implementation Plan

### Phase 1: Foundation Setup (Week 1)

#### Step 1.1: Install Required Dependencies
```bash
cd apps/dao-dapp
pnpm add dids @didtools/ethr-did-resolver key-did-resolver
```

**Note**: Keep `@storacha/client` for IPFS/Filecoin storage.

#### Step 1.2: Create DID Service Layer
**File**: `src/services/did/didManager.ts`

```typescript
// DID:ethr: manager for creating and resolving DIDs
// Responsibilities:
// - Generate DID from Ethereum address
// - Resolve DID documents
// - Sign/verify messages with DID
```

**Key Functions**:
- `createDIDFromAddress(address: string): string` - Generate `did:ethr:0x...`
- `resolveDID(did: string): Promise<DIDDocument>`
- `signMessage(message: string, did: string): Promise<string>`
- `verifySignature(message: string, signature: string, did: string): Promise<boolean>`

#### Step 1.3: Create Delegation Manager
**File**: `src/services/storacha/delegationManager.ts`

**Responsibilities**:
- Create `did:key:` agent via `create()` (one-time setup)
- Authenticate agent via `login(email)` (one-time setup)
- Create delegation: Space → `did:key:` agent
- Store mapping: `did:ethr:` → `did:key:` agent DID
- Store delegation (keyed by `did:key:` agent DID)
- Load delegation and initialize client for daily use

**Key Functions**:
- `setupDelegationForDID(email: string, didEthr: string): Promise<{ delegation, agentDID }>`
- `initializeClientWithDelegation(didEthr: string): Promise<Client>`
- `storeAgentMapping(didEthr: string, agentDID: string): Promise<void>`
- `getAgentDID(didEthr: string): Promise<string | null>`

---

### Phase 2: State Management Migration (Week 1-2)

#### Step 2.1: Create New DID Store
**File**: `src/stores/useDIDStore.ts`

```typescript
interface DIDStore {
  // DID state
  currentDID: string | null
  dids: string[] // Multiple DIDs (multiple wallets)
  isAuthenticated: boolean
  walletAddress: string | null
  
  // Agent mapping
  agentMappings: Record<string, string> // did:ethr: → did:key: agent DID
  
  // Profile state (keep existing structure)
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

#### Step 2.2: Integrate with wagmi/RainbowKit
- Use `useAccount()` hook from wagmi
- Use `useConnect()` for wallet connection
- Map wallet address to DID: `did:ethr:${address}`

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
6. Check if delegation exists for this DID
7. **If no delegation**: Show setup flow (request email, create delegation)
8. **If delegation exists**: Load delegation, initialize Storacha client
9. Set authenticated state

#### Step 3.2: Setup Flow (One-time)
```typescript
// When no delegation exists for DID
async function setupDelegation(didEthr: string) {
  // 1. Request email (one-time)
  const email = await promptForEmail()
  
  // 2. Create client (creates did:key: agent automatically)
  const client = await create({
    store: new StoreIndexedDB(`storacha-agent-${didEthr}`)
  })
  
  // 3. Login with email (authenticates agent, claims delegations)
  await client.login(email)
  
  // 4. Get agent DID
  const agentDID = client.agent.did() // did:key:...
  
  // 5. Get space (first available or user-selected)
  const spaces = client.spaces()
  const space = spaces[0]
  await client.setCurrentSpace(space.did())
  
  // 6. Create delegation TO the did:key: agent
  const audience = DID.parse(agentDID)
  const abilities = ['space/blob/add', 'space/index/add', 'upload/add']
  const delegation = await client.createDelegation(audience, abilities, {
    expiration: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year
  })
  
  // 7. Store mapping and delegation
  await storeAgentMapping(didEthr, agentDID)
  await storeDelegation(agentDID, delegation)
  
  return { delegation, agentDID }
}
```

#### Step 3.3: Daily Use Flow
```typescript
// When delegation exists
async function initializeWithDelegation(didEthr: string) {
  // 1. Get did:key: agent DID from mapping
  const agentDID = await getAgentDID(didEthr)
  if (!agentDID) throw new Error('No agent mapping found')
  
  // 2. Load delegation
  const delegation = await loadDelegation(agentDID)
  if (!delegation) throw new Error('No delegation found')
  
  // 3. Create client with did:key: agent (from IndexedDB store)
  const client = await create({
    store: new StoreIndexedDB(`storacha-agent-${agentDID}`)
  })
  
  // 4. Verify agent DID matches
  if (client.agent.did() !== agentDID) {
    throw new Error('Agent DID mismatch')
  }
  
  // 5. Add space from delegation (authenticates agent)
  const space = await client.addSpace(delegation)
  await client.setCurrentSpace(space.did())
  
  return client
}
```

---

### Phase 4: Profile Management (Week 2-3)

#### Step 4.1: Update Profile Save Flow
```typescript
saveProfile: async (profile: ParticipantProfile) => {
  // 1. Get Storacha client (already initialized with UCAN delegation)
  const client = await initializeWithDelegation(currentDID)
  
  // 2. Set current space (access granted via UCAN delegation)
  await client.setCurrentSpace(spaceDID)
  
  // 3. Upload profile JSON to IPFS via Storacha
  const profileJSON = JSON.stringify(profile, null, 2)
  const profileFile = new File([profileJSON], 'dao-dapp-profile.json')
  const profileCID = await client.uploadFile(profileFile)
  
  // 4. Store CID mapping in profile registry (IPFS JSON file via Storacha)
  await profileRegistry.updateProfileCID(currentDID, profileCID.toString())
  
  // 5. Update local state
  set({ profile, profileCID: profileCID.toString() })
}
```

#### Step 4.2: Update Profile Load Flow
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

---

### Phase 5: UI Updates (Week 3)

#### Step 5.1: Replace Login Screen
- Remove email input
- Add "Connect Wallet" button (RainbowKit ConnectButton)
- Show connected wallet address and DID
- Display "Switch Wallet" option for multi-account
- Show setup flow if no delegation exists

#### Step 5.2: Update Profile Components
- `ProfileView`: Add DID display
- `ProfileEdit`: Keep existing functionality
- Add "Copy DID" button for sharing

#### Step 5.3: Update Storacha-Specific UI
- Remove "Storacha Account" authentication references
- **Keep payment plan setup** (still needed for Storacha storage)
- Update authentication text to DID/wallet terminology
- Clarify that Storacha is used for storage, wallet for identity

---

### Phase 6: Profile Registry (Week 3-4)

#### Step 6.1: Create Registry Service
**File**: `src/services/registry/profileRegistry.ts`

```typescript
// Store DID → Profile CID mapping in IPFS JSON file via Storacha
// Registry stored on IPFS via Storacha
// Each DID has its own registry entry, or use a shared registry file

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
- [ ] Create `DelegationManager` for UCAN delegation management
- [ ] Create `useDIDStore` with basic structure
- [ ] Test DID generation from wallet address
- [ ] Test UCAN delegation flow (setup, store, load)
- [ ] Test Storacha client initialization with delegation

### Week 2: Authentication & Delegation Integration
- [ ] Integrate RainbowKit wallet connection
- [ ] Replace email login with wallet connect + delegation flow
- [ ] Implement delegation setup flow (one-time email)
- [ ] Update `DIDManager` component
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

### 2. Profile Registry
**Decision**: Simple IPFS JSON file registry (not DID document)
**Rationale**: Easier MVP, no on-chain transactions needed

### 3. DID Resolution
**Decision**: Use `@didtools/ethr-did-resolver` with public resolver
**Rationale**: Standard library, works with Ethereum addresses

### 4. Multi-Account Support
**Decision**: Support multiple wallet connections (like current multi-account)
**Rationale**: Maintains current UX, users can switch wallets

### 5. Agent Mapping Storage
**Decision**: Store in Zustand persisted state (IndexedDB)
**Rationale**: 
- Survives page refreshes
- Easy to access from store
- Device/origin-specific (as it should be - `did:key:` agents are device-specific)

---

## Risks & Mitigations

### Risk 1: UCAN Delegation Management
**Risk**: Users need UCAN delegation to access Storacha spaces with `did:key:` agent (not `did:ethr:` - Storacha agents use `did:key:`)
**Mitigation**: 
- One-time email setup flow creates delegation automatically
- Store delegations in Zustand persisted state (keyed by `did:key:` agent DID)
- Store agent mapping (`did:ethr:` → `did:key:`) in Zustand persisted state
- Provide clear instructions for delegation setup
- Note: Delegations are created for `did:key:` agents, not `did:ethr:` (Storacha limitation)

### Risk 2: Storacha Storage Setup
**Risk**: Users need Storacha account with payment plan for storage
**Mitigation**: 
- Clear instructions to set up Storacha account at console.storacha.network
- Check payment plan status before allowing uploads
- Show helpful error messages if storage not available
- Keep existing Storacha space management (one space per DID)

### Risk 3: Delegation Expiration
**Risk**: UCAN delegations can expire
**Mitigation**: 
- Check delegation expiration before operations
- Provide UI to refresh/renew delegations
- Store delegation expiration in state
- Auto-refresh delegations when needed

### Risk 4: Agent Mapping Loss
**Risk**: Mapping between `did:ethr:` and `did:key:` agent could be lost
**Mitigation**: 
- Store in Zustand persisted state (IndexedDB)
- Survives page refreshes
- Could also store mapping in profile metadata (IPFS) for recovery (not recommended for primary storage)

### Risk 5: DID Resolution Complexity
**Mitigation**: Start with simple address-based DIDs, add document updates later

### Risk 6: User Migration
**Mitigation**: Provide migration tool to convert email accounts to DIDs (optional)

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
- [Storacha Documentation](https://docs.storacha.network/)
