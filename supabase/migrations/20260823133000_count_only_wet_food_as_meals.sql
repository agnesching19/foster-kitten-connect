-- Wet-food servings are meals. Dry-food bowl top-ups remain food-log events,
-- but do not receive a meal number or contribute to dashboard meal totals.
CREATE OR REPLACE FUNCTION public.resequence_daily_feedings(
  target_litter_id uuid,
  target_date date
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(
    hashtextextended(target_litter_id::text || ':' || target_date::text, 0)
  );

  UPDATE public.feedings AS feeding
  SET meal_number = CASE
    WHEN feeding.feeding_type = 'wet' THEN ranked.meal_number
    ELSE NULL
  END
  FROM (
    SELECT
      id,
      row_number() OVER (ORDER BY time, created_at, id)::smallint AS meal_number
    FROM public.feedings
    WHERE litter_id = target_litter_id
      AND date = target_date
      AND feeding_type = 'wet'
  ) AS ranked
  WHERE feeding.id = ranked.id
    AND feeding.meal_number IS DISTINCT FROM ranked.meal_number;

  UPDATE public.feedings
  SET meal_number = NULL
  WHERE litter_id = target_litter_id
    AND date = target_date
    AND feeding_type = 'dry'
    AND meal_number IS NOT NULL;
END;
$$;

-- Correct all existing wet meal numbers and clear numbers from dry top-ups.
WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY litter_id, date
      ORDER BY time, created_at, id
    )::smallint AS meal_number
  FROM public.feedings
  WHERE feeding_type = 'wet'
)
UPDATE public.feedings AS feeding
SET meal_number = ranked.meal_number
FROM ranked
WHERE feeding.id = ranked.id
  AND feeding.meal_number IS DISTINCT FROM ranked.meal_number;

UPDATE public.feedings
SET meal_number = NULL
WHERE feeding_type = 'dry'
  AND meal_number IS NOT NULL;

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
        AND feeding.feeding_type = 'wet'
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

REVOKE ALL ON FUNCTION public.resequence_daily_feedings(uuid, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.dashboard_quick_view(UUID, DATE) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.dashboard_quick_view(UUID, DATE) FROM anon;
GRANT EXECUTE ON FUNCTION public.dashboard_quick_view(UUID, DATE)
  TO authenticated, service_role;
