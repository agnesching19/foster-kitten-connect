ALTER TABLE public.kittens
  ADD COLUMN avatar_path TEXT;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kitten-avatars',
  'kitten-avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "Kitten avatars are publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'kitten-avatars');

CREATE POLICY "Users upload kitten avatars to their folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'kitten-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users update kitten avatars in their folder"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'kitten-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'kitten-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users delete kitten avatars from their folder"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'kitten-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
