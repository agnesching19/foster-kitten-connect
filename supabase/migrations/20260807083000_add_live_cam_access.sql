CREATE TABLE public.live_cam_access (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.live_cam_access TO authenticated;
GRANT ALL ON public.live_cam_access TO service_role;

ALTER TABLE public.live_cam_access ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_live_cam_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT lower(COALESCE(auth.jwt() ->> 'email', '')) = 'agnesching19@gmail.com';
$$;

REVOKE ALL ON FUNCTION public.is_live_cam_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_live_cam_admin() TO authenticated, service_role;

CREATE POLICY "Users can check their own live cam access"
  ON public.live_cam_access FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_live_cam_admin());

CREATE POLICY "Live cam admin can grant access"
  ON public.live_cam_access FOR INSERT TO authenticated
  WITH CHECK (public.is_live_cam_admin());

CREATE POLICY "Live cam admin can revoke access"
  ON public.live_cam_access FOR DELETE TO authenticated
  USING (public.is_live_cam_admin() AND user_id <> auth.uid());

INSERT INTO public.live_cam_access (user_id)
SELECT id
FROM auth.users
WHERE lower(email) = 'agnesching19@gmail.com'
ON CONFLICT (user_id) DO NOTHING;
