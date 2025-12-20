import type { ParticipantProfile } from '../types/profile'

interface ProfileViewProps {
  profile: ParticipantProfile
  onEdit: () => void
}

export default function ProfileView({ profile, onEdit }: ProfileViewProps) {
  const avatarUrl = profile.avatarCID
    ? `https://${profile.avatarCID}.ipfs.storacha.link`
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={profile.name}
              className="w-20 h-20 rounded-full object-cover border-2 border-white/10"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-2xl font-semibold">
              {profile.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold">{profile.name}</h2>
            {profile.bio && (
              <p className="text-slate-400 mt-1">{profile.bio}</p>
            )}
          </div>
        </div>
        <button
          onClick={onEdit}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
        >
          Edit Profile
        </button>
      </div>

      {/* Social Links */}
      {profile.socialLinks && Object.keys(profile.socialLinks).length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2 text-slate-300">Links</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(profile.socialLinks).map(([key, url]) => {
              if (!url) return null
              return (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded border border-white/10 text-sm"
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </a>
              )
            })}
          </div>
        </div>
      )}

      {/* Metadata */}
      {profile.metadata && Object.keys(profile.metadata).length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2 text-slate-300">Additional Info</h3>
          <div className="space-y-1 text-sm">
            {Object.entries(profile.metadata).map(([key, value]) => (
              <div key={key} className="flex">
                <span className="text-slate-400 w-32">{key}:</span>
                <span className="text-slate-200">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timestamps */}
      <div className="pt-4 border-t border-white/10 text-xs text-slate-500">
        <p>Created: {new Date(profile.createdAt).toLocaleDateString()}</p>
        <p>Updated: {new Date(profile.updatedAt).toLocaleDateString()}</p>
      </div>
    </div>
  )
}


