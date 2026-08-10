ALTER TABLE public.litters
  ADD COLUMN litter_change_interval_hours INTEGER NOT NULL DEFAULT 48
  CHECK (litter_change_interval_hours BETWEEN 6 AND 720);

COMMENT ON COLUMN public.litters.litter_change_interval_hours IS
  'Target number of hours between litter-box changes for this batch.';
