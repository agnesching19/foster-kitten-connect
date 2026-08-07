-- Expand historical notes such as "x2" or "x 4" into individual rows so
-- aggregate counts represent actual portions. Keep any other note text.
DO $$
DECLARE
  entry public.poop_entries%ROWTYPE;
  portions INTEGER;
  cleaned_note TEXT;
BEGIN
  FOR entry IN
    SELECT * FROM public.poop_entries
    WHERE note ~* '\mx\s*[2-9][0-9]*\M'
  LOOP
    portions := LEAST(
      (substring(entry.note FROM '(?i)\mx\s*([2-9][0-9]*)\M'))::INTEGER,
      50
    );
    cleaned_note := nullif(
      btrim(
        regexp_replace(
          regexp_replace(entry.note, '(?i)\mx\s*[2-9][0-9]*\M', '', 'g'),
          '\s{2,}',
          ' ',
          'g'
        ),
        ' ,;()'
      ),
      ''
    );

    UPDATE public.poop_entries SET note = cleaned_note WHERE id = entry.id;

    INSERT INTO public.poop_entries (
      user_id, litter_id, kitten_id, date, time, note, subject_type, created_at, updated_at
    )
    SELECT
      entry.user_id,
      entry.litter_id,
      entry.kitten_id,
      entry.date,
      entry.time,
      cleaned_note,
      entry.subject_type,
      entry.created_at,
      entry.updated_at
    FROM generate_series(2, portions);
  END LOOP;
END $$;
