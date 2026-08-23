ALTER TABLE public.daily_notes
  ADD COLUMN includes_mother BOOLEAN NOT NULL DEFAULT false;

UPDATE public.daily_notes
SET includes_mother = true
WHERE subject_type = 'mother';

ALTER TABLE public.daily_notes
  DROP CONSTRAINT daily_notes_subject_kittens_check,
  ADD CONSTRAINT daily_notes_subject_selection_check CHECK (
    (subject_type = 'batch' AND NOT includes_mother AND cardinality(kitten_ids) = 0)
    OR (subject_type = 'mother' AND includes_mother)
    OR (subject_type = 'kittens' AND NOT includes_mother AND cardinality(kitten_ids) > 0)
  );

COMMENT ON COLUMN public.daily_notes.includes_mother IS
  'Whether a cat-specific note includes the batch mother or primary foster cat.';
