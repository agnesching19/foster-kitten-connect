GRANT UPDATE, DELETE ON public.feeding_food_presets TO authenticated;

CREATE POLICY "Authenticated users can update feeding food presets"
  ON public.feeding_food_presets FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete feeding food presets"
  ON public.feeding_food_presets FOR DELETE TO authenticated
  USING (true);
