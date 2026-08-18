-- Add anonymised sample sizes so batch members can judge how representative
-- the historical range is without exposing previous kitten or batch details.
DROP FUNCTION public.batch_historical_weight_range(UUID);

CREATE FUNCTION public.batch_historical_weight_range(target_litter_id UUID)
RETURNS TABLE (
  age_days INTEGER,
  min_grams INTEGER,
  max_grams INTEGER,
  sample_count INTEGER,
  kitten_count INTEGER,
  batch_count INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH current_batch AS (
    SELECT user_id
    FROM public.litters
    WHERE id = target_litter_id
      AND public.can_edit_litter(id)
  ),
  observations AS (
    SELECT
      (weigh_in.date - historical_batch.date_of_birth)::INTEGER AS age_days,
      weight.grams,
      kitten.id AS kitten_id,
      historical_batch.id AS batch_id
    FROM current_batch
    JOIN public.litters AS historical_batch
      ON historical_batch.user_id = current_batch.user_id
      AND historical_batch.id <> target_litter_id
      AND historical_batch.status = 'completed'
      AND historical_batch.batch_type <> 'single'
      AND historical_batch.date_of_birth IS NOT NULL
    JOIN public.weigh_ins AS weigh_in
      ON weigh_in.litter_id = historical_batch.id
    JOIN public.weights AS weight
      ON weight.weigh_in_id = weigh_in.id
    JOIN public.kittens AS kitten
      ON kitten.id = weight.kitten_id
      AND kitten.role = 'kitten'
  ),
  totals AS (
    SELECT
      count(DISTINCT kitten_id)::INTEGER AS kitten_count,
      count(DISTINCT batch_id)::INTEGER AS batch_count
    FROM observations
  )
  SELECT
    observations.age_days,
    min(observations.grams)::INTEGER AS min_grams,
    max(observations.grams)::INTEGER AS max_grams,
    count(*)::INTEGER AS sample_count,
    totals.kitten_count,
    totals.batch_count
  FROM observations
  CROSS JOIN totals
  GROUP BY observations.age_days, totals.kitten_count, totals.batch_count
  ORDER BY observations.age_days;
$$;

REVOKE ALL ON FUNCTION public.batch_historical_weight_range(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.batch_historical_weight_range(UUID)
  TO authenticated, service_role;
