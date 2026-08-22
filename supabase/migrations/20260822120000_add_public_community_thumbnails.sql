-- Stable, aggressively cached thumbnails for deliberately shared community
-- avatars. Full-resolution originals remain in the private kitten-avatars
-- bucket and continue to require an authorized signed URL.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-avatar-thumbnails',
  'community-avatar-thumbnails',
  true,
  524288,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE OR REPLACE FUNCTION public.can_manage_community_thumbnail(target_path TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.kittens AS cat
    WHERE cat.avatar_path = target_path
      AND public.can_edit_litter(cat.litter_id)
  );
$$;

REVOKE ALL ON FUNCTION public.can_manage_community_thumbnail(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_manage_community_thumbnail(TEXT) TO authenticated;

CREATE POLICY "Community thumbnails can be created by batch members"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'community-avatar-thumbnails'
    AND public.can_manage_community_thumbnail(name)
    AND public.is_community_cat_avatar(name)
  );

CREATE POLICY "Community thumbnails can be read by batch members"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'community-avatar-thumbnails'
    AND public.can_manage_community_thumbnail(name)
  );

CREATE POLICY "Community thumbnails can be updated by batch members"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'community-avatar-thumbnails'
    AND public.can_manage_community_thumbnail(name)
  )
  WITH CHECK (
    bucket_id = 'community-avatar-thumbnails'
    AND public.can_manage_community_thumbnail(name)
    AND public.is_community_cat_avatar(name)
  );

CREATE POLICY "Community thumbnails can be deleted by batch members"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'community-avatar-thumbnails'
    AND public.can_manage_community_thumbnail(name)
  );
