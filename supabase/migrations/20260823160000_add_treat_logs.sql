ALTER TABLE public.feedings
  DROP CONSTRAINT feedings_feeding_type_check,
  DROP CONSTRAINT feedings_details_match_type;

ALTER TABLE public.feedings
  ADD CONSTRAINT feedings_feeding_type_check
    CHECK (feeding_type IN ('wet', 'dry', 'treat')),
  ADD CONSTRAINT feedings_details_match_type CHECK (
    (feeding_type = 'wet' AND pouch_count BETWEEN 1 AND 50
      AND cardinality(flavours) = pouch_count AND dry_food_type IS NULL
      AND bowl_count IS NULL AND top_up_percent IS NULL)
    OR
    (feeding_type = 'dry' AND pouch_count = 0 AND cardinality(flavours) = 0
      AND dry_food_type IS NOT NULL AND bowl_count BETWEEN 1 AND 20
      AND top_up_percent BETWEEN 1 AND 100)
    OR
    (feeding_type = 'treat' AND char_length(trim(food)) BETWEEN 1 AND 120
      AND pouch_count = 0 AND cardinality(flavours) = 0 AND dry_food_type IS NULL
      AND bowl_count IS NULL AND top_up_percent IS NULL)
  );

COMMENT ON COLUMN public.feedings.feeding_type IS
  'Whether this event records a wet-food meal, dry-food bowl top-up, or treat.';

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
      NEW.flavours := array_fill(NEW.food, ARRAY[NEW.pouch_count]);
    END IF;
    NEW.pouch_count := cardinality(NEW.flavours);
    NEW.food := array_to_string(NEW.flavours, ' + ');
  END IF;
  RETURN NEW;
END;
$$;
