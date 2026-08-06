import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { CAT_AVATAR_BUCKET } from '@/lib/avatar-storage'
import { AvatarPreviewDialog } from './AvatarPreviewDialog'
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
  const [previewOpen, setPreviewOpen] = useState(false)
  const publicUrl = useMemo(
    () =>
      avatarPath
        ? supabase.storage.from(CAT_AVATAR_BUCKET).getPublicUrl(avatarPath).data.publicUrl
        : null,
    [avatarPath],
  )

  useEffect(() => setFailed(false), [publicUrl])

  if (publicUrl && !failed) {
    return (
      <>
        <button
          type="button"
          className={`inline-flex shrink-0 cursor-zoom-in rounded-full focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 ${catAvatarSizeClasses[size]} ${className}`}
          title={`View ${name}'s photo`}
          aria-label={`View ${name}'s photo`}
          onClick={() => setPreviewOpen(true)}
        >
          <img
            src={publicUrl}
            alt={`${name} avatar`}
            className="h-full w-full rounded-full border border-border object-cover"
            loading="lazy"
            onError={() => setFailed(true)}
          />
        </button>
        <AvatarPreviewDialog
          open={previewOpen}
          name={name}
          imageUrl={publicUrl}
          onClose={() => setPreviewOpen(false)}
        />
      </>
    )
  }

  return (
    <span
      className={`inline-flex shrink-0 ${catAvatarSizeClasses[size]} ${className}`}
      title={name}
    >
      <span
        role="img"
        aria-label={name}
        className="flex h-full w-full items-center justify-center rounded-full border border-brand-200 bg-brand-100 font-semibold uppercase text-brand-800"
      >
        {name.trim().charAt(0) || '🐾'}
      </span>
    </span>
  )
}
