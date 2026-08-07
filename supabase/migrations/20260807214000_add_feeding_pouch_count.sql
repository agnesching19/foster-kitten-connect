ALTER TABLE public.feedings
  ADD COLUMN pouch_count INTEGER NOT NULL DEFAULT 1
  CHECK (pouch_count BETWEEN 1 AND 50);

COMMENT ON COLUMN public.feedings.pouch_count IS
  'Number of pouches served during this feeding event.';
