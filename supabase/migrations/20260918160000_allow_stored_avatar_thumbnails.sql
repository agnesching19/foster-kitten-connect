-- Avatar thumbnails are now resized in the browser and stored beside their
-- private preview image. Keep access scoped to members of the same litter.
DROP POLICY IF EXISTS "Litter members can view cat avatars" ON storage.objects;
CREATE POLICY "Litter members can view cat avatars"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'kitten-avatars'
    AND EXISTS (
      SELECT 1
      FROM public.kittens AS cat
      WHERE (
          cat.avatar_path = storage.objects.name
          OR cat.avatar_path || '.thumbnail.webp' = storage.objects.name
        )
        AND public.can_edit_litter(cat.litter_id)
    )
  );
