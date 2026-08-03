ALTER TABLE public.kittens ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

WITH ordered AS (
  SELECT id, row_number() OVER (PARTITION BY litter_id ORDER BY name) AS rn
  FROM public.kittens
)
UPDATE public.kittens k
SET sort_order = ordered.rn
FROM ordered
WHERE ordered.id = k.id;

CREATE INDEX IF NOT EXISTS kittens_litter_id_sort_order_idx
  ON public.kittens (litter_id, sort_order);