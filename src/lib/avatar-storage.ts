import { supabase } from '@/integrations/supabase/client'

export const CAT_AVATAR_BUCKET = 'kitten-avatars'
export const COMMUNITY_AVATAR_BUCKET = 'community-avatar-thumbnails'

const SIGNED_URL_LIFETIME_SECONDS = 24 * 60 * 60
const SIGNED_URL_CACHE_MS = 23 * 60 * 60 * 1000
const SIGNED_URL_STORAGE_PREFIX = 'kitty-tracker:avatar-url:v2:'

export type CatAvatarVariant = 'thumbnail' | 'preview' | 'original'

const THUMBNAIL_SIZE = 256
const PREVIEW_SIZE = 1200

type CachedAvatarUrl = {
  url: string
  expiresAt: number
}

const signedUrlCache = new Map<string, CachedAvatarUrl>()
const pendingSignedUrls = new Map<string, Promise<string | null>>()

function storedUrlKey(cacheKey: string): string {
  return `${SIGNED_URL_STORAGE_PREFIX}${cacheKey}`
}

function readStoredUrl(cacheKey: string): CachedAvatarUrl | null {
  if (typeof window === 'undefined') return null
  const key = storedUrlKey(cacheKey)
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const cached = JSON.parse(raw) as Partial<CachedAvatarUrl>
    if (
      typeof cached.url === 'string' &&
      typeof cached.expiresAt === 'number' &&
      cached.expiresAt > Date.now()
    ) {
      return cached as CachedAvatarUrl
    }
    window.localStorage.removeItem(key)
  } catch {
    // Ignore unavailable or malformed browser storage.
  }
  return null
}

function storeUrl(cacheKey: string, cached: CachedAvatarUrl): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(storedUrlKey(cacheKey), JSON.stringify(cached))
  } catch {
    // Browsers may disable or exhaust local storage. The in-memory cache still works.
  }
}

function removeStoredUrl(cacheKey: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(storedUrlKey(cacheKey))
  } catch {
    // Ignore unavailable browser storage.
  }
}

export function clearCachedCatAvatarUrls(): void {
  signedUrlCache.clear()
  pendingSignedUrls.clear()
  if (typeof window === 'undefined') return
  try {
    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index)
      if (key?.startsWith(SIGNED_URL_STORAGE_PREFIX)) window.localStorage.removeItem(key)
    }
  } catch {
    // Ignore unavailable browser storage.
  }
}

const avatarTypes: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

function avatarThumbnailPath(path: string): string {
  return `${path}.thumbnail.webp`
}

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read the selected image.'))
    }
    image.src = url
  })
}

async function resizeAvatar(
  file: Blob,
  maxSize: number,
  resize: 'contain' | 'cover',
  quality: number,
): Promise<Blob> {
  const image = await loadImage(file)
  const sourceWidth = image.naturalWidth
  const sourceHeight = image.naturalHeight
  if (!sourceWidth || !sourceHeight) throw new Error('The selected image has no dimensions.')

  const canvas = document.createElement('canvas')
  let sourceX = 0
  let sourceY = 0
  let sourceCropWidth = sourceWidth
  let sourceCropHeight = sourceHeight

  if (resize === 'cover') {
    const cropSize = Math.min(sourceWidth, sourceHeight)
    sourceX = (sourceWidth - cropSize) / 2
    sourceY = (sourceHeight - cropSize) / 2
    sourceCropWidth = cropSize
    sourceCropHeight = cropSize
    canvas.width = maxSize
    canvas.height = maxSize
  } else {
    const scale = Math.min(1, maxSize / Math.max(sourceWidth, sourceHeight))
    canvas.width = Math.max(1, Math.round(sourceWidth * scale))
    canvas.height = Math.max(1, Math.round(sourceHeight * scale))
  }

  const context = canvas.getContext('2d')
  if (!context) throw new Error('This browser cannot prepare avatar images.')
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceCropWidth,
    sourceCropHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not prepare the avatar image.'))),
      'image/webp',
      quality,
    )
  })
}

export async function uploadCatAvatar(file: File, pathPrefix: string): Promise<string> {
  if (!avatarTypes[file.type]) throw new Error('Choose a JPG, PNG, WebP or GIF image.')
  if (file.size > 5 * 1024 * 1024) throw new Error('Avatar images must be 5 MB or smaller.')

  const path = `${pathPrefix}/${crypto.randomUUID()}.webp`
  const [preview, thumbnail] = await Promise.all([
    resizeAvatar(file, PREVIEW_SIZE, 'contain', 0.8),
    resizeAvatar(file, THUMBNAIL_SIZE, 'cover', 0.7),
  ])
  const { error } = await supabase.storage
    .from(CAT_AVATAR_BUCKET)
    .upload(path, preview, { cacheControl: '31536000', contentType: 'image/webp' })
  if (error) throw error

  const { error: thumbnailError } = await supabase.storage
    .from(CAT_AVATAR_BUCKET)
    .upload(avatarThumbnailPath(path), thumbnail, {
      cacheControl: '31536000',
      contentType: 'image/webp',
    })
  if (thumbnailError) {
    await supabase.storage.from(CAT_AVATAR_BUCKET).remove([path])
    throw thumbnailError
  }
  return path
}

export function getCommunityThumbnailUrl(path: string): Promise<string | null> {
  return getCachedSignedUrl(COMMUNITY_AVATAR_BUCKET, path, 'community-thumbnail')
}

export async function syncCommunityThumbnails(
  paths: Array<string | null | undefined>,
  published: boolean,
): Promise<void> {
  const existingPaths = [...new Set(paths.filter((path): path is string => Boolean(path)))]
  if (!existingPaths.length) return

  if (!published) {
    const { error } = await supabase.storage.from(COMMUNITY_AVATAR_BUCKET).remove(existingPaths)
    if (error) throw error
    return
  }

  await Promise.all(
    existingPaths.map(async (path) => {
      const thumbnailUrl = await getCatAvatarUrl(path, 'thumbnail')
      let response = thumbnailUrl ? await fetch(thumbnailUrl) : null
      if (!response?.ok) {
        const originalUrl = await getCatAvatarUrl(path, 'original')
        response = originalUrl ? await fetch(originalUrl) : null
      }
      if (!response?.ok) throw new Error('Could not download a community thumbnail.')

      const source = await response.blob()
      const thumbnail = await resizeAvatar(source, THUMBNAIL_SIZE, 'cover', 0.7)
      const { error } = await supabase.storage
        .from(COMMUNITY_AVATAR_BUCKET)
        .upload(path, thumbnail, {
          cacheControl: '31536000',
          contentType: thumbnail.type || 'image/webp',
          upsert: true,
        })
      if (error) throw error
    }),
  )
}

export function getCatAvatarUrl(
  path: string,
  variant: CatAvatarVariant = 'thumbnail',
): Promise<string | null> {
  const storedPath = variant === 'thumbnail' ? avatarThumbnailPath(path) : path
  return getCachedSignedUrl(CAT_AVATAR_BUCKET, storedPath, variant)
}

const pendingThumbnailBackfills = new Map<string, Promise<void>>()

export function backfillCatAvatarThumbnail(path: string): Promise<void> {
  const pending = pendingThumbnailBackfills.get(path)
  if (pending) return pending

  const request = (async () => {
    const sourceUrl = await getCatAvatarUrl(path, 'original')
    if (!sourceUrl) return
    const response = await fetch(sourceUrl)
    if (!response.ok) return
    const thumbnail = await resizeAvatar(await response.blob(), THUMBNAIL_SIZE, 'cover', 0.7)
    const { error } = await supabase.storage
      .from(CAT_AVATAR_BUCKET)
      .upload(avatarThumbnailPath(path), thumbnail, {
        cacheControl: '31536000',
        contentType: 'image/webp',
        upsert: true,
      })
    // Collaborators can view an avatar but only its owner may create its thumbnail.
    if (error && error.message !== 'The resource already exists') return
  })().finally(() => pendingThumbnailBackfills.delete(path))

  pendingThumbnailBackfills.set(path, request)
  return request
}

function getCachedSignedUrl(
  bucket: string,
  path: string,
  cacheVariant: string,
): Promise<string | null> {
  const cacheKey = `${bucket}:${cacheVariant}:${path}`
  const cached = signedUrlCache.get(cacheKey) ?? readStoredUrl(cacheKey)
  if (cached) signedUrlCache.set(cacheKey, cached)
  if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.url)

  const pending = pendingSignedUrls.get(cacheKey)
  if (pending) return pending

  const request = supabase.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_URL_LIFETIME_SECONDS)
    .then(({ data, error }) => {
      if (error) return null

      const cachedUrl = {
        url: data.signedUrl,
        expiresAt: Date.now() + SIGNED_URL_CACHE_MS,
      }
      signedUrlCache.set(cacheKey, cachedUrl)
      storeUrl(cacheKey, cachedUrl)
      return data.signedUrl
    })
    .finally(() => pendingSignedUrls.delete(cacheKey))

  pendingSignedUrls.set(cacheKey, request)
  return request
}

export async function removeCatAvatars(paths: Array<string | null | undefined>) {
  const existingPaths = paths.filter((path): path is string => Boolean(path))
  if (!existingPaths.length) return
  const privatePaths = existingPaths.flatMap((path) => [path, avatarThumbnailPath(path)])
  const { error } = await supabase.storage.from(CAT_AVATAR_BUCKET).remove(privatePaths)
  if (error) throw error
  const { error: thumbnailError } = await supabase.storage
    .from(COMMUNITY_AVATAR_BUCKET)
    .remove(existingPaths)
  if (thumbnailError) console.warn('Could not remove community avatar thumbnails', thumbnailError)
  existingPaths.forEach((path) => {
    const cacheKeys = [
      `${CAT_AVATAR_BUCKET}:thumbnail:${avatarThumbnailPath(path)}`,
      `${CAT_AVATAR_BUCKET}:preview:${path}`,
      `${COMMUNITY_AVATAR_BUCKET}:community-thumbnail:${path}`,
    ]
    cacheKeys.forEach((cacheKey) => {
      signedUrlCache.delete(cacheKey)
      removeStoredUrl(cacheKey)
    })
  })
}
