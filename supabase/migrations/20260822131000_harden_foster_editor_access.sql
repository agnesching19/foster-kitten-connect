-- Defense in depth: PostgREST must reject anonymous execution, and the
-- function itself must refuse calls without an authenticated user even if a
-- future privilege change accidentally makes it reachable.
REVOKE EXECUTE ON FUNCTION public.add_foster_editor_by_email(TEXT, BOOLEAN) FROM anon;

CREATE OR REPLACE FUNCTION public.add_foster_editor_by_email(
  target_email TEXT,
  include_future BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  editor_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT id INTO editor_id
  FROM auth.users
  WHERE lower(email) = lower(btrim(target_email));

  IF editor_id IS NULL THEN
    RAISE EXCEPTION 'No registered user found for that email';
  END IF;

  IF editor_id = auth.uid() THEN
    RAISE EXCEPTION 'You already own these batches';
  END IF;

  INSERT INTO public.litter_collaborators (litter_id, user_id, role)
  SELECT litter.id, editor_id, 'editor'
  FROM public.litters AS litter
  WHERE litter.user_id = auth.uid()
  ON CONFLICT (litter_id, user_id) DO NOTHING;

  IF include_future THEN
    INSERT INTO public.foster_editor_defaults (owner_id, user_id)
    VALUES (auth.uid(), editor_id)
    ON CONFLICT (owner_id, user_id) DO NOTHING;
  END IF;

  RETURN editor_id;
END;
$$;

REVOKE ALL ON FUNCTION public.add_foster_editor_by_email(TEXT, BOOLEAN) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.add_foster_editor_by_email(TEXT, BOOLEAN) FROM anon;
GRANT EXECUTE ON FUNCTION public.add_foster_editor_by_email(TEXT, BOOLEAN)
  TO authenticated, service_role;
