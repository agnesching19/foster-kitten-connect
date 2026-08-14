import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { CAT_AVATAR_BUCKET } from '@/lib/avatar-storage'
import { AvatarPreviewDialog } from './AvatarPreviewDialog'
import { catAvatarSizeClasses, type CatAvatarSize } from './avatar-styles'

export function CatAvatar({
  name,
  avatarPath,
  size = 'md',
  className = '',
  photoPreview = true,
}: {
  name: string
  avatarPath?: string | null
  size?: CatAvatarSize
  className?: string
  photoPreview?: boolean
}) {
  const [failed, setFailed] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    let refreshTimer: ReturnType<typeof setTimeout> | undefined

    async function loadImage() {
      if (!avatarPath) {
        setImageUrl(null)
        return
      }
      const { data, error } = await supabase.storage
        .from(CAT_AVATAR_BUCKET)
        .createSignedUrl(avatarPath, 60 * 60)
      if (!active) return
      setImageUrl(error ? null : data.signedUrl)
      setFailed(false)
      if (!error) refreshTimer = setTimeout(loadImage, 50 * 60 * 1000)
    }

    void loadImage()
    return () => {
      active = false
      if (refreshTimer) clearTimeout(refreshTimer)
    }
  }, [avatarPath])

  if (imageUrl && !failed) {
    const image = (
      <img
        src={imageUrl}
        alt={`${name} avatar`}
        className="h-full w-full rounded-full border border-border object-cover"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    )

    if (!photoPreview) {
      return (
        <span className={`inline-flex shrink-0 ${catAvatarSizeClasses[size]} ${className}`}>
          {image}
        </span>
      )
    }

    return (
      <>
        <button
          type="button"
          className={`inline-flex shrink-0 cursor-zoom-in rounded-full focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 ${catAvatarSizeClasses[size]} ${className}`}
          title={`View ${name}'s photo`}
          aria-label={`View ${name}'s photo`}
          onClick={() => setPreviewOpen(true)}
        >
          {image}
        </button>
        <AvatarPreviewDialog
          open={previewOpen}
          name={name}
          imageUrl={imageUrl}
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
