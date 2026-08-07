ALTER TABLE public.feedings ADD COLUMN flavours TEXT[];

UPDATE public.feedings
SET flavours = array_fill(food, ARRAY[pouch_count]);

ALTER TABLE public.feedings
  ALTER COLUMN flavours SET NOT NULL,
  ADD CONSTRAINT feedings_flavours_match_pouch_count
    CHECK (cardinality(flavours) = pouch_count AND cardinality(flavours) BETWEEN 1 AND 50);

CREATE OR REPLACE FUNCTION public.sync_feeding_flavours()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.flavours IS NULL OR cardinality(NEW.flavours) = 0 THEN
    NEW.flavours := array_fill(NEW.food, ARRAY[NEW.pouch_count]);
  END IF;
  NEW.pouch_count := cardinality(NEW.flavours);
  NEW.food := array_to_string(NEW.flavours, ' + ');
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_feeding_flavours_before_write
  BEFORE INSERT OR UPDATE OF food, pouch_count, flavours ON public.feedings
  FOR EACH ROW EXECUTE FUNCTION public.sync_feeding_flavours();
