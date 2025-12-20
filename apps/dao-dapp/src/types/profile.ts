// Participant profile data model
// Profiles are stored as JSON files in Storacha spaces

export interface ParticipantProfile {
  // Basic information
  name: string
  bio?: string
  avatarCID?: string // CID of avatar image stored in Storacha
  
  // Social links (optional)
  socialLinks?: {
    website?: string
    twitter?: string
    github?: string
    linkedin?: string
    discord?: string
    [key: string]: string | undefined
  }
  
  // Custom metadata (flexible for future extensions)
  metadata?: Record<string, any>
  
  // Timestamps
  createdAt: string // ISO date string
  updatedAt: string // ISO date string
  
  // Version for future migrations
  version?: string
}

// Profile form data (for editing)
export interface ProfileFormData {
  name: string
  bio: string
  avatarFile?: File | null
  socialLinks: {
    website: string
    twitter: string
    github: string
    linkedin: string
    discord: string
    [key: string]: string
  }
  metadata?: Record<string, any>
}

// Profile state in store
export interface ProfileState {
  profile: ParticipantProfile | null
  profileCID: string | null // CID of the profile.json file
  isLoading: boolean
  isSaving: boolean
  error: string | null
}
