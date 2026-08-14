-- Model every animal in a foster batch as a role-bearing cat while retaining
-- the existing kittens table name for backwards-compatible imports/exports.
DO $$ BEGIN
  CREATE TYPE public.foster_batch_type AS ENUM ('family', 'single', 'kittens_only');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.foster_cat_role AS ENUM ('mother', 'single', 'kitten');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.litters
  ADD COLUMN IF NOT EXISTS batch_type public.foster_batch_type NOT NULL DEFAULT 'family';

ALTER TABLE public.kittens
  ADD COLUMN IF NOT EXISTS role public.foster_cat_role NOT NULL DEFAULT 'kitten',
  ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Existing kitten dates were stored once on the batch.
UPDATE public.kittens AS cat
SET date_of_birth = litter.date_of_birth
FROM public.litters AS litter
WHERE cat.litter_id = litter.id
  AND cat.role = 'kitten'
  AND cat.date_of_birth IS NULL;

-- Promote each existing mother into the same participant table. Keeping the
-- legacy litter columns synchronized allows older backups to remain usable.
INSERT INTO public.kittens (
  user_id, litter_id, name, sort_order, avatar_path, role, date_of_birth
)
SELECT
  litter.user_id,
  litter.id,
  litter.mother_name,
  -1,
  litter.mother_avatar_path,
  'mother'::public.foster_cat_role,
  NULL
FROM public.litters AS litter
WHERE NOT EXISTS (
  SELECT 1 FROM public.kittens AS cat
  WHERE cat.litter_id = litter.id AND cat.role IN ('mother', 'single')
)
ON CONFLICT (litter_id, name) DO UPDATE
SET role = 'mother'::public.foster_cat_role,
    avatar_path = COALESCE(EXCLUDED.avatar_path, public.kittens.avatar_path);

CREATE UNIQUE INDEX IF NOT EXISTS one_primary_cat_per_batch
  ON public.kittens (litter_id)
  WHERE role IN ('mother', 'single');

CREATE INDEX IF NOT EXISTS kittens_litter_role_idx
  ON public.kittens (litter_id, role, sort_order);
