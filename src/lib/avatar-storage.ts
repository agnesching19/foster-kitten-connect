import { supabase } from '@/integrations/supabase/client'

export const CAT_AVATAR_BUCKET = 'kitten-avatars'

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

export async function removeCatAvatars(paths: Array<string | null | undefined>) {
  const existingPaths = paths.filter((path): path is string => Boolean(path))
  if (!existingPaths.length) return
  const { error } = await supabase.storage.from(CAT_AVATAR_BUCKET).remove(existingPaths)
  if (error) throw error
}
