ALTER TABLE public.daily_notes
  ADD COLUMN time TIME,
  ADD COLUMN category TEXT NOT NULL DEFAULT 'general',
  ADD COLUMN importance TEXT NOT NULL DEFAULT 'normal',
  ADD COLUMN subject_type TEXT NOT NULL DEFAULT 'batch',
  ADD COLUMN kitten_ids UUID[] NOT NULL DEFAULT '{}';

ALTER TABLE public.daily_notes
  ADD CONSTRAINT daily_notes_category_check
    CHECK (category IN ('milestone', 'behaviour', 'health', 'medication', 'appointment', 'general')),
  ADD CONSTRAINT daily_notes_importance_check
    CHECK (importance IN ('normal', 'important')),
  ADD CONSTRAINT daily_notes_subject_type_check
    CHECK (subject_type IN ('batch', 'mother', 'kittens')),
  ADD CONSTRAINT daily_notes_subject_kittens_check
    CHECK (
      (subject_type = 'kittens' AND cardinality(kitten_ids) > 0)
      OR (subject_type <> 'kittens' AND cardinality(kitten_ids) = 0)
    );

CREATE INDEX idx_daily_notes_litter_date_time
  ON public.daily_notes(litter_id, date DESC, time DESC);

