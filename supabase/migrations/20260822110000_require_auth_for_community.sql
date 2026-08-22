-- The community board is available only to signed-in fosterers. Enforce this
-- in Postgres and Storage as well as in the client route so anonymous callers
-- cannot bypass the UI.
REVOKE EXECUTE ON FUNCTION public.community_batches() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_community_cat_avatar(TEXT) FROM anon;

DROP POLICY IF EXISTS "Community can view shared cat avatars" ON storage.objects;
CREATE POLICY "Authenticated community can view shared cat avatars"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'kitten-avatars'
    AND public.is_community_cat_avatar(name)
  );
