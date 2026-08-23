-- Return only the dashboard summary instead of sending the complete weigh-in
-- history to every dashboard visit.
CREATE OR REPLACE FUNCTION public.dashboard_quick_view(
  target_litter_id UUID,
  target_date DATE
)
RETURNS JSONB
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT jsonb_build_object(
    'mealsToday', (
      SELECT count(*)
      FROM public.feedings AS feeding
      WHERE feeding.litter_id = target_litter_id
        AND feeding.date = target_date
    ),
    'latestLitterChange', (
      SELECT jsonb_build_object('date', change.date, 'time', change.time)
      FROM public.litter_changes AS change
      WHERE change.litter_id = target_litter_id
      ORDER BY change.date DESC, change.time DESC, change.id DESC
      LIMIT 1
    ),
    'latestWeights', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'date', latest.date,
          'grams', latest.grams,
          'kittens', jsonb_build_object('name', latest.name)
        )
        ORDER BY latest.name
      )
      FROM (
        SELECT DISTINCT ON (weight.kitten_id)
          weigh_in.date,
          weight.grams,
          cat.name,
          weight.kitten_id
        FROM public.weights AS weight
        JOIN public.weigh_ins AS weigh_in ON weigh_in.id = weight.weigh_in_id
        JOIN public.kittens AS cat ON cat.id = weight.kitten_id
        WHERE weigh_in.litter_id = target_litter_id
        ORDER BY
          weight.kitten_id,
          weigh_in.date DESC,
          weigh_in.time DESC,
          weigh_in.id DESC
      ) AS latest
    ), '[]'::jsonb)
  );
$$;

REVOKE ALL ON FUNCTION public.dashboard_quick_view(UUID, DATE) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.dashboard_quick_view(UUID, DATE) FROM anon;
GRANT EXECUTE ON FUNCTION public.dashboard_quick_view(UUID, DATE)
  TO authenticated, service_role;
