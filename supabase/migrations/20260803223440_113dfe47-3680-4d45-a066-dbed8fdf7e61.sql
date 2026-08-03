DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'poop_subject_type') THEN
    CREATE TYPE public.poop_subject_type AS ENUM ('mother', 'kitten');
  END IF;
END $$;

ALTER TABLE public.poop_entries
  ADD COLUMN IF NOT EXISTS subject_type public.poop_subject_type NOT NULL DEFAULT 'kitten';

CREATE INDEX IF NOT EXISTS poop_entries_litter_subject_type_idx
  ON public.poop_entries (litter_id, subject_type);