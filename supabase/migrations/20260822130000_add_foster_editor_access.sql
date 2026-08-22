-- Batch access remains explicit, while owners can grant an editor every
-- existing batch and optionally remember that editor for future batches.
CREATE TABLE public.foster_editor_defaults (
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, user_id),
  CHECK (owner_id <> user_id)
);

GRANT SELECT, DELETE ON public.foster_editor_defaults TO authenticated;
GRANT ALL ON public.foster_editor_defaults TO service_role;

ALTER TABLE public.foster_editor_defaults ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners and editors can view future access"
  ON public.foster_editor_defaults FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR user_id = auth.uid());

CREATE POLICY "Owners can remove future access"
  ON public.foster_editor_defaults FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

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
GRANT EXECUTE ON FUNCTION public.add_foster_editor_by_email(TEXT, BOOLEAN)
  TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.add_default_foster_editors()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.litter_collaborators (litter_id, user_id, role)
  SELECT NEW.id, defaults.user_id, 'editor'
  FROM public.foster_editor_defaults AS defaults
  WHERE defaults.owner_id = NEW.user_id
  ON CONFLICT (litter_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.add_default_foster_editors() FROM PUBLIC;

CREATE TRIGGER add_default_foster_editors
  AFTER INSERT ON public.litters
  FOR EACH ROW EXECUTE FUNCTION public.add_default_foster_editors();

-- Future editors and owners need each other's display names even before the
-- owner creates another batch.
CREATE OR REPLACE FUNCTION public.can_view_profile(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    target_user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.litters AS litter
      WHERE public.can_edit_litter(litter.id)
        AND (
          litter.user_id = target_user_id
          OR EXISTS (
            SELECT 1
            FROM public.litter_collaborators AS collaborator
            WHERE collaborator.litter_id = litter.id
              AND collaborator.user_id = target_user_id
          )
        )
    )
    OR EXISTS (
      SELECT 1
      FROM public.foster_editor_defaults AS defaults
      WHERE (defaults.owner_id = auth.uid() AND defaults.user_id = target_user_id)
         OR (defaults.user_id = auth.uid() AND defaults.owner_id = target_user_id)
    )
    OR (
      public.is_live_cam_admin()
      AND EXISTS (
        SELECT 1
        FROM public.live_cam_access
        WHERE user_id = target_user_id
      )
    );
$$;
