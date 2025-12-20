import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react'
import { useStorachaStore } from '../stores'
import type { ParticipantProfile, ProfileFormData } from '../types/profile'

interface ProfileEditProps {
  profile: ParticipantProfile | null
  onCancel: () => void
  onSave: () => void
}

export default function ProfileEdit({ profile, onCancel, onSave }: ProfileEditProps) {
  const { saveProfile, uploadAvatar, isSavingProfile, profileError } = useStorachaStore()
  
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    bio: '',
    avatarFile: null,
    socialLinks: {
      website: '',
      twitter: '',
      github: '',
      linkedin: '',
      discord: '',
    },
  })

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarCID, setAvatarCID] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form with existing profile data
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        bio: profile.bio || '',
        avatarFile: null,
        socialLinks: {
          website: profile.socialLinks?.website || '',
          twitter: profile.socialLinks?.twitter || '',
          github: profile.socialLinks?.github || '',
          linkedin: profile.socialLinks?.linkedin || '',
          discord: profile.socialLinks?.discord || '',
        },
        metadata: profile.metadata,
      })
      setAvatarCID(profile.avatarCID || null)
      if (profile.avatarCID) {
        setAvatarPreview(`https://${profile.avatarCID}.ipfs.storacha.link`)
      }
    }
  }, [profile])

  // eslint-disable-next-line no-undef
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name.startsWith('social.')) {
      const socialKey = name.replace('social.', '')
      setFormData((prev) => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialKey]: value,
        },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData((prev) => ({ ...prev, avatarFile: file }))
      // eslint-disable-next-line no-undef
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    // Disable button immediately for instant feedback
    setIsSubmitting(true)
    
    try {
      let finalAvatarCID = avatarCID

      // Upload new avatar if provided
      if (formData.avatarFile) {
        finalAvatarCID = await uploadAvatar(formData.avatarFile)
        setAvatarCID(finalAvatarCID)
      }

      // Create profile object
      const now = new Date().toISOString()
      const updatedProfile: ParticipantProfile = {
        name: formData.name,
        bio: formData.bio || undefined,
        avatarCID: finalAvatarCID || undefined,
        socialLinks: Object.fromEntries(
          Object.entries(formData.socialLinks).filter(([_, value]) => value.trim() !== '')
        ),
        metadata: formData.metadata,
        createdAt: profile?.createdAt || now,
        updatedAt: now,
        version: '1.0',
      }

      await saveProfile(updatedProfile)
      onSave()
    } catch (error) {
      console.error('Failed to save profile:', error)
      // Error is already set in store
      // Re-enable button on error so user can try again
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {profileError && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
          {profileError}
        </div>
      )}

      {/* Avatar */}
      <div>
        <label className="block text-sm font-medium mb-2">Avatar</label>
        <div className="flex items-center gap-4">
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt="Avatar preview"
              className="w-20 h-20 rounded-full object-cover border-2 border-white/10"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-2xl font-semibold">
              {formData.name.charAt(0).toUpperCase() || '?'}
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="block text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
          />
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium mb-2">Name *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
          placeholder="Your name"
        />
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium mb-2">Bio</label>
        <textarea
          name="bio"
          value={formData.bio}
          onChange={handleInputChange}
          rows={4}
          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white resize-none"
          placeholder="Tell us about yourself..."
        />
      </div>

      {/* Social Links */}
      <div>
        <label className="block text-sm font-medium mb-2">Social Links</label>
        <div className="space-y-2">
          <input
            type="url"
            name="social.website"
            value={formData.socialLinks.website}
            onChange={handleInputChange}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            placeholder="Website URL"
          />
          <input
            type="url"
            name="social.twitter"
            value={formData.socialLinks.twitter}
            onChange={handleInputChange}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            placeholder="Twitter/X URL"
          />
          <input
            type="url"
            name="social.github"
            value={formData.socialLinks.github}
            onChange={handleInputChange}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            placeholder="GitHub URL"
          />
          <input
            type="url"
            name="social.linkedin"
            value={formData.socialLinks.linkedin}
            onChange={handleInputChange}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            placeholder="LinkedIn URL"
          />
          <input
            type="text"
            name="social.discord"
            value={formData.socialLinks.discord}
            onChange={handleInputChange}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            placeholder="Discord username"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={isSubmitting || isSavingProfile || !formData.name.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-opacity"
        >
          {isSubmitting || isSavingProfile ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              {isSubmitting && !isSavingProfile ? 'Preparing...' : 'Saving Profile...'}
            </span>
          ) : (
            'Save Profile'
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting || isSavingProfile}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}


