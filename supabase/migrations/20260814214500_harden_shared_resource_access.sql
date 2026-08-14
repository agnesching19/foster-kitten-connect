-- Shared food choices remain visible to signed-in fosterers, but only their
-- creator may change or remove them. Built-in rows have no creator and remain
-- read-only.
DROP POLICY IF EXISTS "Authenticated users can update feeding food presets"
  ON public.feeding_food_presets;
CREATE POLICY "Creators can update feeding food presets"
  ON public.feeding_food_presets FOR UPDATE TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can delete feeding food presets"
  ON public.feeding_food_presets;
CREATE POLICY "Creators can delete feeding food presets"
  ON public.feeding_food_presets FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- Profiles are private unless the viewer needs the display name for their own
-- account, a shared foster batch, or the live-cam access list they administer.
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
    OR (
      public.is_live_cam_admin()
      AND EXISTS (
        SELECT 1
        FROM public.live_cam_access
        WHERE user_id = target_user_id
      )
    );
$$;

REVOKE ALL ON FUNCTION public.can_view_profile(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_view_profile(UUID) TO authenticated, service_role;

DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Users can view related profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.can_view_profile(id));

-- Owners can invite an existing account by exact email without exposing the
-- complete user directory to the browser.
CREATE OR REPLACE FUNCTION public.add_litter_collaborator_by_email(
  target_litter_id UUID,
  target_email TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  collaborator_id UUID;
BEGIN
  IF NOT public.is_litter_owner(target_litter_id) THEN
    RAISE EXCEPTION 'Only the batch owner can add editors';
  END IF;

  SELECT id INTO collaborator_id
  FROM auth.users
  WHERE lower(email) = lower(btrim(target_email));

  IF collaborator_id IS NULL THEN
    RAISE EXCEPTION 'No registered user found for that email';
  END IF;

  IF collaborator_id = auth.uid() THEN
    RAISE EXCEPTION 'You already own this batch';
  END IF;

  INSERT INTO public.litter_collaborators (litter_id, user_id, role)
  VALUES (target_litter_id, collaborator_id, 'editor');

  RETURN collaborator_id;
END;
$$;

REVOKE ALL ON FUNCTION public.add_litter_collaborator_by_email(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_litter_collaborator_by_email(UUID, TEXT)
  TO authenticated, service_role;

-- The live-cam administrator gets the same exact-email workflow.
CREATE OR REPLACE FUNCTION public.grant_live_cam_access_by_email(target_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  IF NOT public.is_live_cam_admin() THEN
    RAISE EXCEPTION 'Only the live-cam administrator can grant access';
  END IF;

  SELECT id INTO target_user_id
  FROM auth.users
  WHERE lower(email) = lower(btrim(target_email));

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'No registered user found for that email';
  END IF;

  INSERT INTO public.live_cam_access (user_id)
  VALUES (target_user_id);

  RETURN target_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_live_cam_access_by_email(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_live_cam_access_by_email(TEXT)
  TO authenticated, service_role;
