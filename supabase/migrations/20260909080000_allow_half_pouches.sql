ALTER TABLE public.feedings
  DROP CONSTRAINT feedings_details_match_type;

DROP TRIGGER sync_feeding_flavours_before_write ON public.feedings;

ALTER TABLE public.feedings
  ALTER COLUMN pouch_count TYPE NUMERIC(4, 1) USING pouch_count::NUMERIC(4, 1);

ALTER TABLE public.feedings
  ADD CONSTRAINT feedings_details_match_type CHECK (
    (
      feeding_type = 'wet'
      AND pouch_count BETWEEN 0.5 AND 50
      AND (pouch_count = 0.5 OR pouch_count = trunc(pouch_count))
      AND cardinality(flavours) = ceil(pouch_count)
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
    OR
    (
      feeding_type = 'treat'
      AND char_length(trim(food)) BETWEEN 1 AND 120
      AND pouch_count = 0
      AND cardinality(flavours) = 0
      AND dry_food_type IS NULL
      AND bowl_count IS NULL
      AND top_up_percent IS NULL
    )
  );

COMMENT ON COLUMN public.feedings.pouch_count IS
  'Wet-food amount served: half a pouch, or a whole number of pouches.';

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
  ELSIF NEW.feeding_type = 'treat' THEN
    NEW.pouch_count := 0;
    NEW.flavours := ARRAY[]::TEXT[];
    NEW.dry_food_type := NULL;
    NEW.bowl_count := NULL;
    NEW.top_up_percent := NULL;
    NEW.food := trim(NEW.food);
  ELSE
    NEW.dry_food_type := NULL;
    NEW.bowl_count := NULL;
    NEW.top_up_percent := NULL;
    IF NEW.flavours IS NULL OR cardinality(NEW.flavours) = 0 THEN
      NEW.flavours := array_fill(NEW.food, ARRAY[ceil(NEW.pouch_count)::INTEGER]);
    END IF;
    NEW.food := array_to_string(NEW.flavours, ' + ');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_feeding_flavours_before_write
  BEFORE INSERT OR UPDATE OF food, pouch_count, flavours, feeding_type, dry_food_type,
    bowl_count, top_up_percent ON public.feedings
  FOR EACH ROW EXECUTE FUNCTION public.sync_feeding_flavours();
