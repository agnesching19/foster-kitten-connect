import { supabase } from '@/integrations/supabase/client'

export const CAT_AVATAR_BUCKET = 'kitten-avatars'
export const COMMUNITY_AVATAR_BUCKET = 'community-avatar-thumbnails'

const SIGNED_URL_LIFETIME_SECONDS = 24 * 60 * 60
const SIGNED_URL_CACHE_MS = 23 * 60 * 60 * 1000
const SIGNED_URL_STORAGE_PREFIX = 'kitty-tracker:avatar-url:v1:'

export type CatAvatarVariant = 'thumbnail' | 'preview'

const avatarTransforms = {
  thumbnail: { width: 256, height: 256, quality: 70, resize: 'cover' as const },
  preview: { width: 1200, height: 1200, quality: 80, resize: 'contain' as const },
}

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

export async function uploadCatAvatar(file: File, pathPrefix: string): Promise<string> {
  const extension = avatarTypes[file.type]
  if (!extension) throw new Error('Choose a JPG, PNG, WebP or GIF image.')
  if (file.size > 5 * 1024 * 1024) throw new Error('Avatar images must be 5 MB or smaller.')

  const path = `${pathPrefix}/${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage
    .from(CAT_AVATAR_BUCKET)
    .upload(path, file, { cacheControl: '86400', contentType: file.type })
  if (error) throw error
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
      const sourceUrl = await getCatAvatarUrl(path, 'thumbnail')
      if (!sourceUrl) throw new Error('Could not prepare a community thumbnail.')

      const response = await fetch(sourceUrl)
      if (!response.ok) throw new Error('Could not download a community thumbnail.')

      const thumbnail = await response.blob()
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
  return getCachedSignedUrl(CAT_AVATAR_BUCKET, path, variant, avatarTransforms[variant])
}

function getCachedSignedUrl(
  bucket: string,
  path: string,
  cacheVariant: string,
  transform?: (typeof avatarTransforms)[CatAvatarVariant],
): Promise<string | null> {
  const cacheKey = `${bucket}:${cacheVariant}:${path}`
  const cached = signedUrlCache.get(cacheKey) ?? readStoredUrl(cacheKey)
  if (cached) signedUrlCache.set(cacheKey, cached)
  if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.url)

  const pending = pendingSignedUrls.get(cacheKey)
  if (pending) return pending

  const request = supabase.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_URL_LIFETIME_SECONDS, transform ? { transform } : undefined)
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
  const { error } = await supabase.storage.from(CAT_AVATAR_BUCKET).remove(existingPaths)
  if (error) throw error
  const { error: thumbnailError } = await supabase.storage
    .from(COMMUNITY_AVATAR_BUCKET)
    .remove(existingPaths)
  if (thumbnailError) console.warn('Could not remove community avatar thumbnails', thumbnailError)
  existingPaths.forEach((path) => {
    const cacheKeys = [
      `${CAT_AVATAR_BUCKET}:thumbnail:${path}`,
      `${CAT_AVATAR_BUCKET}:preview:${path}`,
      `${COMMUNITY_AVATAR_BUCKET}:community-thumbnail:${path}`,
    ]
    cacheKeys.forEach((cacheKey) => {
      signedUrlCache.delete(cacheKey)
      removeStoredUrl(cacheKey)
    })
  })
}
