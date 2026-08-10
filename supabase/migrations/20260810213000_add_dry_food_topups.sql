ALTER TABLE public.feedings
  ADD COLUMN feeding_type TEXT NOT NULL DEFAULT 'wet',
  ADD COLUMN dry_food_type TEXT,
  ADD COLUMN bowl_count INTEGER,
  ADD COLUMN top_up_percent INTEGER;

ALTER TABLE public.feedings
  ADD CONSTRAINT feedings_feeding_type_check
    CHECK (feeding_type IN ('wet', 'dry')),
  ADD CONSTRAINT feedings_dry_food_type_check
    CHECK (dry_food_type IS NULL OR dry_food_type IN ('kitten', 'adult', 'mixed'));

ALTER TABLE public.feedings
  DROP CONSTRAINT feedings_pouch_count_check,
  DROP CONSTRAINT feedings_flavours_match_pouch_count;

ALTER TABLE public.feedings
  ADD CONSTRAINT feedings_details_match_type CHECK (
    (
      feeding_type = 'wet'
      AND pouch_count BETWEEN 1 AND 50
      AND cardinality(flavours) = pouch_count
      AND dry_food_type IS NULL
      AND bowl_count IS NULL
      AND top_up_percent IS NULL
    )
    OR
    (
      feeding_type = 'dry'
      AND pouch_count = 0
      AND cardinality(flavours) = 0
      AND dry_food_type IS NOT NULL
      AND bowl_count BETWEEN 1 AND 20
      AND top_up_percent BETWEEN 1 AND 100
    )
  );

COMMENT ON COLUMN public.feedings.feeding_type IS
  'Whether this feeding event records wet food or a dry-food bowl top-up.';
COMMENT ON COLUMN public.feedings.dry_food_type IS
  'Type of dry food used: kitten, adult, or mixed.';
COMMENT ON COLUMN public.feedings.bowl_count IS
  'Number of shared bowls topped up.';
COMMENT ON COLUMN public.feedings.top_up_percent IS
  'Approximate percentage added to each shared bowl.';

CREATE OR REPLACE FUNCTION public.sync_feeding_flavours()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.feeding_type = 'dry' THEN
    NEW.pouch_count := 0;
    NEW.flavours := ARRAY[]::TEXT[];
    NEW.food := NEW.dry_food_type || ' dry food';
  ELSE
    NEW.dry_food_type := NULL;
    NEW.bowl_count := NULL;
    NEW.top_up_percent := NULL;
    IF NEW.flavours IS NULL OR cardinality(NEW.flavours) = 0 THEN
      NEW.flavours := array_fill(NEW.food, ARRAY[NEW.pouch_count]);
    END IF;
    NEW.pouch_count := cardinality(NEW.flavours);
    NEW.food := array_to_string(NEW.flavours, ' + ');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER sync_feeding_flavours_before_write ON public.feedings;
CREATE TRIGGER sync_feeding_flavours_before_write
  BEFORE INSERT OR UPDATE OF food, pouch_count, flavours, feeding_type, dry_food_type,
    bowl_count, top_up_percent ON public.feedings
  FOR EACH ROW EXECUTE FUNCTION public.sync_feeding_flavours();
