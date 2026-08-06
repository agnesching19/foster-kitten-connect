-- Meal numbers are derived from each feeding's chronological position in its day.
-- Keeping this in the database makes app entries, imports, edits, and deletes agree.

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
  -- Serialise changes to the same litter/day so concurrent logs cannot receive
  -- duplicate or stale meal numbers.
  PERFORM pg_advisory_xact_lock(
    hashtextextended(target_litter_id::text || ':' || target_date::text, 0)
  );

  UPDATE public.feedings AS feeding
  SET meal_number = ranked.meal_number
  FROM (
    SELECT
      id,
      row_number() OVER (ORDER BY time, created_at, id)::smallint AS meal_number
    FROM public.feedings
    WHERE litter_id = target_litter_id
      AND date = target_date
  ) AS ranked
  WHERE feeding.id = ranked.id
    AND feeding.meal_number IS DISTINCT FROM ranked.meal_number;
END;
$$;

CREATE OR REPLACE FUNCTION public.keep_daily_feeding_numbers_in_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  -- Updates performed by resequence_daily_feedings fire this trigger too.
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    PERFORM public.resequence_daily_feedings(OLD.litter_id, OLD.date);
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE'
    AND (OLD.litter_id, OLD.date) IS DISTINCT FROM (NEW.litter_id, NEW.date)
  THEN
    PERFORM public.resequence_daily_feedings(OLD.litter_id, OLD.date);
  END IF;

  PERFORM public.resequence_daily_feedings(NEW.litter_id, NEW.date);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS keep_daily_feeding_numbers_in_order ON public.feedings;

CREATE TRIGGER keep_daily_feeding_numbers_in_order
AFTER INSERT OR UPDATE OR DELETE ON public.feedings
FOR EACH ROW
EXECUTE FUNCTION public.keep_daily_feeding_numbers_in_order();

-- Correct existing records as part of the migration.
WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY litter_id, date
      ORDER BY time, created_at, id
    )::smallint AS meal_number
  FROM public.feedings
)
UPDATE public.feedings AS feeding
SET meal_number = ranked.meal_number
FROM ranked
WHERE feeding.id = ranked.id
  AND feeding.meal_number IS DISTINCT FROM ranked.meal_number;

REVOKE ALL ON FUNCTION public.resequence_daily_feedings(uuid, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.keep_daily_feeding_numbers_in_order() FROM PUBLIC;
