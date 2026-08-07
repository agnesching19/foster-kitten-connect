CREATE TABLE public.feeding_food_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE CHECK (name = btrim(name) AND char_length(name) BETWEEN 1 AND 80),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.feeding_food_presets TO authenticated;
GRANT ALL ON public.feeding_food_presets TO service_role;

ALTER TABLE public.feeding_food_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view feeding food presets"
  ON public.feeding_food_presets FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can add feeding food presets"
  ON public.feeding_food_presets FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

INSERT INTO public.feeding_food_presets (name) VALUES
  ('kitten salmon'),
  ('kitten lamb'),
  ('kitten chicken'),
  ('kitten white fish'),
  ('beef'),
  ('cod'),
  ('lamb'),
  ('tuna');
