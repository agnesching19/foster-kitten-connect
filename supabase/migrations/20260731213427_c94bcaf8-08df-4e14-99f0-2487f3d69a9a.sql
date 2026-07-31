-- Enums
CREATE TYPE public.litter_status AS ENUM ('active', 'completed');

-- Shared updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 1. litters
CREATE TABLE public.litters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mother_name TEXT NOT NULL,
  litter_name TEXT,
  date_of_birth DATE,
  arrived DATE NOT NULL,
  left_date DATE,
  status public.litter_status NOT NULL DEFAULT 'active',
  external_record TEXT,
  album_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.litters TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.litters TO authenticated;
GRANT ALL ON public.litters TO service_role;
ALTER TABLE public.litters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Litters are viewable by everyone" ON public.litters FOR SELECT USING (true);
CREATE POLICY "Users insert their own litters" ON public.litters FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update their own litters" ON public.litters FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete their own litters" ON public.litters FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_litters_user_id ON public.litters(user_id);
CREATE INDEX idx_litters_arrived ON public.litters(arrived DESC);
CREATE TRIGGER update_litters_updated_at BEFORE UPDATE ON public.litters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. kittens
CREATE TABLE public.kittens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  litter_id UUID NOT NULL REFERENCES public.litters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (litter_id, name)
);
GRANT SELECT ON public.kittens TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kittens TO authenticated;
GRANT ALL ON public.kittens TO service_role;
ALTER TABLE public.kittens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Kittens are viewable by everyone" ON public.kittens FOR SELECT USING (true);
CREATE POLICY "Users insert their own kittens" ON public.kittens FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update their own kittens" ON public.kittens FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete their own kittens" ON public.kittens FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_kittens_user_id ON public.kittens(user_id);
CREATE INDEX idx_kittens_litter_id ON public.kittens(litter_id);
CREATE TRIGGER update_kittens_updated_at BEFORE UPDATE ON public.kittens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. feedings
CREATE TABLE public.feedings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  litter_id UUID NOT NULL REFERENCES public.litters(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  food TEXT NOT NULL,
  meal_number SMALLINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.feedings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedings TO authenticated;
GRANT ALL ON public.feedings TO service_role;
ALTER TABLE public.feedings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Feedings are viewable by everyone" ON public.feedings FOR SELECT USING (true);
CREATE POLICY "Users insert their own feedings" ON public.feedings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update their own feedings" ON public.feedings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete their own feedings" ON public.feedings FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_feedings_user_id ON public.feedings(user_id);
CREATE INDEX idx_feedings_litter_id ON public.feedings(litter_id);
CREATE INDEX idx_feedings_date_time ON public.feedings(date DESC, time DESC);
CREATE TRIGGER update_feedings_updated_at BEFORE UPDATE ON public.feedings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. poop_entries
CREATE TABLE public.poop_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  litter_id UUID NOT NULL REFERENCES public.litters(id) ON DELETE CASCADE,
  kitten_id UUID REFERENCES public.kittens(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.poop_entries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.poop_entries TO authenticated;
GRANT ALL ON public.poop_entries TO service_role;
ALTER TABLE public.poop_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Poop entries are viewable by everyone" ON public.poop_entries FOR SELECT USING (true);
CREATE POLICY "Users insert their own poop entries" ON public.poop_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update their own poop entries" ON public.poop_entries FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete their own poop entries" ON public.poop_entries FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_poop_entries_user_id ON public.poop_entries(user_id);
CREATE INDEX idx_poop_entries_litter_id ON public.poop_entries(litter_id);
CREATE INDEX idx_poop_entries_kitten_id ON public.poop_entries(kitten_id);
CREATE INDEX idx_poop_entries_date_time ON public.poop_entries(date DESC, time DESC);
CREATE TRIGGER update_poop_entries_updated_at BEFORE UPDATE ON public.poop_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. litter_changes
CREATE TABLE public.litter_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  litter_id UUID NOT NULL REFERENCES public.litters(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.litter_changes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.litter_changes TO authenticated;
GRANT ALL ON public.litter_changes TO service_role;
ALTER TABLE public.litter_changes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Litter changes are viewable by everyone" ON public.litter_changes FOR SELECT USING (true);
CREATE POLICY "Users insert their own litter changes" ON public.litter_changes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update their own litter changes" ON public.litter_changes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete their own litter changes" ON public.litter_changes FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_litter_changes_user_id ON public.litter_changes(user_id);
CREATE INDEX idx_litter_changes_litter_id ON public.litter_changes(litter_id);
CREATE INDEX idx_litter_changes_date_time ON public.litter_changes(date DESC, time DESC);
CREATE TRIGGER update_litter_changes_updated_at BEFORE UPDATE ON public.litter_changes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. weigh_ins
CREATE TABLE public.weigh_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  litter_id UUID NOT NULL REFERENCES public.litters(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.weigh_ins TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weigh_ins TO authenticated;
GRANT ALL ON public.weigh_ins TO service_role;
ALTER TABLE public.weigh_ins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Weigh-ins are viewable by everyone" ON public.weigh_ins FOR SELECT USING (true);
CREATE POLICY "Users insert their own weigh-ins" ON public.weigh_ins FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update their own weigh-ins" ON public.weigh_ins FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete their own weigh-ins" ON public.weigh_ins FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_weigh_ins_user_id ON public.weigh_ins(user_id);
CREATE INDEX idx_weigh_ins_litter_id ON public.weigh_ins(litter_id);
CREATE INDEX idx_weigh_ins_date_time ON public.weigh_ins(date DESC, time DESC);
CREATE TRIGGER update_weigh_ins_updated_at BEFORE UPDATE ON public.weigh_ins
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. weights
CREATE TABLE public.weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weigh_in_id UUID NOT NULL REFERENCES public.weigh_ins(id) ON DELETE CASCADE,
  kitten_id UUID NOT NULL REFERENCES public.kittens(id) ON DELETE CASCADE,
  grams INTEGER NOT NULL CHECK (grams > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (weigh_in_id, kitten_id)
);
GRANT SELECT ON public.weights TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weights TO authenticated;
GRANT ALL ON public.weights TO service_role;
ALTER TABLE public.weights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Weights are viewable by everyone" ON public.weights FOR SELECT USING (true);
CREATE POLICY "Users insert their own weights" ON public.weights FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update their own weights" ON public.weights FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete their own weights" ON public.weights FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_weights_user_id ON public.weights(user_id);
CREATE INDEX idx_weights_weigh_in_id ON public.weights(weigh_in_id);
CREATE INDEX idx_weights_kitten_id ON public.weights(kitten_id);
CREATE TRIGGER update_weights_updated_at BEFORE UPDATE ON public.weights
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. daily_notes
CREATE TABLE public.daily_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  litter_id UUID NOT NULL REFERENCES public.litters(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.daily_notes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_notes TO authenticated;
GRANT ALL ON public.daily_notes TO service_role;
ALTER TABLE public.daily_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Daily notes are viewable by everyone" ON public.daily_notes FOR SELECT USING (true);
CREATE POLICY "Users insert their own daily notes" ON public.daily_notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update their own daily notes" ON public.daily_notes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete their own daily notes" ON public.daily_notes FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_daily_notes_user_id ON public.daily_notes(user_id);
CREATE INDEX idx_daily_notes_litter_id ON public.daily_notes(litter_id);
CREATE INDEX idx_daily_notes_date ON public.daily_notes(date DESC);
CREATE TRIGGER update_daily_notes_updated_at BEFORE UPDATE ON public.daily_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();