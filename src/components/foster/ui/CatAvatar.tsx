import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { CAT_AVATAR_BUCKET } from '@/lib/avatar-storage'
import { catAvatarSizeClasses, type CatAvatarSize } from './avatar-styles'

export function CatAvatar({
  name,
  avatarPath,
  size = 'md',
  className = '',
}: {
  name: string
  avatarPath?: string | null
  size?: CatAvatarSize
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const publicUrl = useMemo(
    () =>
      avatarPath
        ? supabase.storage.from(CAT_AVATAR_BUCKET).getPublicUrl(avatarPath).data.publicUrl
        : null,
    [avatarPath],
  )

  useEffect(() => setFailed(false), [publicUrl])

  return (
    <span
      className={`inline-flex shrink-0 ${catAvatarSizeClasses[size]} ${className}`}
      title={name}
    >
      {publicUrl && !failed ? (
        <img
          src={publicUrl}
          alt={`${name} avatar`}
          className="h-full w-full rounded-full border border-border object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          role="img"
          aria-label={name}
          className="flex h-full w-full items-center justify-center rounded-full border border-brand-200 bg-brand-100 font-semibold uppercase text-brand-800"
        >
          {name.trim().charAt(0) || '🐾'}
        </span>
      )}
    </span>
  )
}
