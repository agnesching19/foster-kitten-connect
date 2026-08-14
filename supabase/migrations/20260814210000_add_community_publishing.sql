ALTER TABLE public.litters
  ADD COLUMN visibility TEXT NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private', 'community')),
  ADD COLUMN community_summary TEXT
    CHECK (community_summary IS NULL OR char_length(community_summary) <= 500);

COMMENT ON COLUMN public.litters.visibility IS
  'Whether a deliberately limited batch summary is published to the community board.';
COMMENT ON COLUMN public.litters.community_summary IS
  'Optional public-facing foster update. Never used for private care notes.';

-- This is the only public read surface for foster batches. It deliberately
-- excludes IDs belonging to users, case references, albums, dates of birth,
-- collaborators, and every operational care record.
CREATE OR REPLACE FUNCTION public.community_batches()
RETURNS TABLE (
  id UUID,
  batch_type public.foster_batch_type,
  display_name TEXT,
  arrived DATE,
  left_date DATE,
  status public.litter_status,
  community_summary TEXT,
  fosterer_name TEXT,
  cats JSONB
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    litter.id,
    litter.batch_type,
    COALESCE(
      NULLIF(trim(litter.litter_name), ''),
      primary_cat.name,
      'Foster kittens'
    ) AS display_name,
    litter.arrived,
    litter.left_date,
    litter.status,
    litter.community_summary,
    COALESCE(profile.display_name, 'Foster carer') AS fosterer_name,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'name', cat.name,
          'role', cat.role,
          'avatar_path', cat.avatar_path,
          'tag_colour', cat.tag_colour
        ) ORDER BY cat.sort_order, cat.name
      ) FILTER (WHERE cat.id IS NOT NULL),
      '[]'::jsonb
    ) AS cats
  FROM public.litters AS litter
  LEFT JOIN public.profiles AS profile ON profile.id = litter.user_id
  LEFT JOIN public.kittens AS cat ON cat.litter_id = litter.id
  LEFT JOIN public.kittens AS primary_cat
    ON primary_cat.litter_id = litter.id
    AND primary_cat.role IN ('mother', 'single')
  WHERE litter.visibility = 'community'
  GROUP BY litter.id, primary_cat.name, profile.display_name
  ORDER BY
    CASE WHEN litter.status = 'active' THEN 0 ELSE 1 END,
    litter.arrived DESC;
$$;

REVOKE ALL ON FUNCTION public.community_batches() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.community_batches() TO anon, authenticated, service_role;

-- Storage policies cannot safely join through private-table RLS for signed-out
-- visitors, so expose only this boolean check to the avatar policy.
CREATE OR REPLACE FUNCTION public.is_community_cat_avatar(target_path TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.kittens AS cat
    JOIN public.litters AS litter ON litter.id = cat.litter_id
    WHERE cat.avatar_path = target_path
      AND litter.visibility = 'community'
  );
$$;

REVOKE ALL ON FUNCTION public.is_community_cat_avatar(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_community_cat_avatar(TEXT)
  TO anon, authenticated, service_role;

CREATE POLICY "Community can view shared cat avatars"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (
    bucket_id = 'kitten-avatars'
    AND public.is_community_cat_avatar(name)
  );
