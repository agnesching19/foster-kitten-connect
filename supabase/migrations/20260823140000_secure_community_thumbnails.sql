-- Public buckets bypass storage.objects SELECT policies. Keep community
-- thumbnails private so only signed-in users who can see the published batch,
-- or members who manage it, can create signed URLs for them.
UPDATE storage.buckets
SET public = false
WHERE id = 'community-avatar-thumbnails';

DROP POLICY IF EXISTS "Community thumbnails can be read by batch members"
  ON storage.objects;

CREATE POLICY "Authenticated users can read visible community thumbnails"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'community-avatar-thumbnails'
    AND (
      public.is_community_cat_avatar(name)
      OR public.can_manage_community_thumbnail(name)
    )
  );
