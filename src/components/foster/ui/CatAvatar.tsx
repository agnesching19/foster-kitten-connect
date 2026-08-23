import { useEffect, useState } from 'react'
import { getCatAvatarUrl, getCommunityThumbnailUrl } from '@/lib/avatar-storage'
import { AvatarPreviewDialog } from './AvatarPreviewDialog'
import { catAvatarSizeClasses, type CatAvatarSize } from './avatar-styles'
import { recordImageTraffic } from '@/lib/traffic-monitor'

export function CatAvatar({
  name,
  avatarPath,
  size = 'md',
  className = '',
  photoPreview = true,
  publicThumbnailPath,
}: {
  name: string
  avatarPath?: string | null
  size?: CatAvatarSize
  className?: string
  photoPreview?: boolean
  publicThumbnailPath?: string | null
}) {
  const [failed, setFailed] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [usingPublicThumbnail, setUsingPublicThumbnail] = useState(false)

  useEffect(() => {
    let active = true

    async function loadImage() {
      if (!avatarPath) {
        setImageUrl(null)
        return
      }
      const signedUrl = publicThumbnailPath
        ? await getCommunityThumbnailUrl(publicThumbnailPath)
        : await getCatAvatarUrl(avatarPath)
      if (!active) return
      setImageUrl(signedUrl)
      setUsingPublicThumbnail(Boolean(publicThumbnailPath))
      setFailed(false)
    }

    void loadImage()
    return () => {
      active = false
    }
  }, [avatarPath, publicThumbnailPath])

  useEffect(() => {
    let active = true
    if (!previewOpen || !avatarPath) return

    void getCatAvatarUrl(avatarPath, 'preview').then((signedUrl) => {
      if (active) setPreviewImageUrl(signedUrl)
    })

    return () => {
      active = false
    }
  }, [avatarPath, previewOpen])

  if (imageUrl && !failed) {
    const image = (
      <img
        src={imageUrl}
        alt={`${name} avatar`}
        className="h-full w-full rounded-full border border-border object-cover"
        loading="lazy"
        onLoad={(event) =>
          recordImageTraffic(
            usingPublicThumbnail ? 'community-thumbnail' : 'private-thumbnail',
            event.currentTarget.currentSrc,
          )
        }
        onError={() => {
          if (usingPublicThumbnail && avatarPath) {
            setUsingPublicThumbnail(false)
            void getCatAvatarUrl(avatarPath).then((fallbackUrl) => {
              if (fallbackUrl) setImageUrl(fallbackUrl)
              else setFailed(true)
            })
            return
          }
          setFailed(true)
        }}
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
          imageUrl={previewImageUrl ?? imageUrl}
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
