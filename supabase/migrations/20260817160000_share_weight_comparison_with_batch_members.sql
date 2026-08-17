-- Anyone who can access the current batch may compare its kittens with an
-- anonymised range from the owner's previous completed kitten batches. The
-- function deliberately returns no cat, batch, fosterer, or calendar-date IDs.
CREATE OR REPLACE FUNCTION public.batch_historical_weight_range(target_litter_id UUID)
RETURNS TABLE (
  age_days INTEGER,
  min_grams INTEGER,
  max_grams INTEGER
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
  )
  SELECT
    (weigh_in.date - historical_batch.date_of_birth)::INTEGER AS age_days,
    min(weight.grams)::INTEGER AS min_grams,
    max(weight.grams)::INTEGER AS max_grams
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
  GROUP BY (weigh_in.date - historical_batch.date_of_birth)
  ORDER BY age_days;
$$;

REVOKE ALL ON FUNCTION public.batch_historical_weight_range(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.batch_historical_weight_range(UUID)
  TO authenticated, service_role;
