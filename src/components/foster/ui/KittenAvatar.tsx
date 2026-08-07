import { CatAvatar } from './CatAvatar'
import { catAvatarSizeClasses, type CatAvatarSize } from './avatar-styles'
import { KittenDot, type TagColour } from './KittenDot'

export function KittenAvatar({
  name,
  avatarPath,
  colour,
  size = 'md',
  className = '',
  photoPreview = true,
}: {
  name: string
  avatarPath?: string | null
  colour?: TagColour | null
  size?: CatAvatarSize
  className?: string
  photoPreview?: boolean
}) {
  return (
    <span
      className={`relative inline-flex shrink-0 ${catAvatarSizeClasses[size]} ${className}`}
      title={name}
    >
      <CatAvatar
        name={name}
        avatarPath={avatarPath ?? null}
        size={size}
        photoPreview={photoPreview}
      />
      <KittenDot
        colour={colour ?? null}
        className="absolute -bottom-0.5 -right-0.5 ring-2 ring-white"
      />
    </span>
  )
}
