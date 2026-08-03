DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tag_colour' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.tag_colour AS ENUM (
      'blue','pink','red','orange','yellow','green','purple','white','grey','brown','black'
    );
  END IF;
END $$;

ALTER TABLE public.kittens ADD COLUMN IF NOT EXISTS tag_colour public.tag_colour;
ALTER TABLE public.feedings ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.litter_changes ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.weigh_ins ADD COLUMN IF NOT EXISTS notes text;