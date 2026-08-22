import { supabase } from '@/integrations/supabase/client'

export const CAT_AVATAR_BUCKET = 'kitten-avatars'

const SIGNED_URL_LIFETIME_SECONDS = 60 * 60
const SIGNED_URL_CACHE_MS = 50 * 60 * 1000

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
    .upload(path, file, { contentType: file.type })
  if (error) throw error
  return path
}

export function getCatAvatarUrl(
  path: string,
  variant: CatAvatarVariant = 'thumbnail',
): Promise<string | null> {
  const cacheKey = `${variant}:${path}`
  const cached = signedUrlCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.url)

  const pending = pendingSignedUrls.get(cacheKey)
  if (pending) return pending

  const request = supabase.storage
    .from(CAT_AVATAR_BUCKET)
    .createSignedUrl(path, SIGNED_URL_LIFETIME_SECONDS, {
      transform: avatarTransforms[variant],
    })
    .then(({ data, error }) => {
      if (error) return null

      signedUrlCache.set(cacheKey, {
        url: data.signedUrl,
        expiresAt: Date.now() + SIGNED_URL_CACHE_MS,
      })
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
  existingPaths.forEach((path) => {
    signedUrlCache.delete(`thumbnail:${path}`)
    signedUrlCache.delete(`preview:${path}`)
  })
}
