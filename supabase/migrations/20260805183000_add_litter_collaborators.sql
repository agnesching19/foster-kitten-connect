CREATE TABLE public.litter_collaborators (
  litter_id UUID NOT NULL REFERENCES public.litters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role = 'editor'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (litter_id, user_id)
);

CREATE INDEX litter_collaborators_user_id_idx
  ON public.litter_collaborators (user_id);

GRANT SELECT, INSERT, DELETE ON public.litter_collaborators TO authenticated;
GRANT ALL ON public.litter_collaborators TO service_role;

ALTER TABLE public.litter_collaborators ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_litter_owner(target_litter_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.litters
    WHERE id = target_litter_id
      AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.can_edit_litter(target_litter_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    public.is_litter_owner(target_litter_id)
    OR EXISTS (
      SELECT 1
      FROM public.litter_collaborators
      WHERE litter_id = target_litter_id
        AND user_id = auth.uid()
        AND role = 'editor'
    );
$$;

CREATE OR REPLACE FUNCTION public.can_edit_weigh_in(target_weigh_in_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.weigh_ins
    WHERE id = target_weigh_in_id
      AND public.can_edit_litter(litter_id)
  );
$$;

REVOKE ALL ON FUNCTION public.is_litter_owner(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_edit_litter(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_edit_weigh_in(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_litter_owner(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_edit_litter(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_edit_weigh_in(UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.protect_litter_record_identity()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id
    OR NEW.litter_id IS DISTINCT FROM OLD.litter_id THEN
    RAISE EXCEPTION 'Record attribution and litter cannot be changed';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.protect_weight_identity()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id
    OR NEW.weigh_in_id IS DISTINCT FROM OLD.weigh_in_id THEN
    RAISE EXCEPTION 'Weight attribution and weigh-in cannot be changed';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_kittens_identity
  BEFORE UPDATE ON public.kittens
  FOR EACH ROW EXECUTE FUNCTION public.protect_litter_record_identity();
CREATE TRIGGER protect_feedings_identity
  BEFORE UPDATE ON public.feedings
  FOR EACH ROW EXECUTE FUNCTION public.protect_litter_record_identity();
CREATE TRIGGER protect_poop_entries_identity
  BEFORE UPDATE ON public.poop_entries
  FOR EACH ROW EXECUTE FUNCTION public.protect_litter_record_identity();
CREATE TRIGGER protect_litter_changes_identity
  BEFORE UPDATE ON public.litter_changes
  FOR EACH ROW EXECUTE FUNCTION public.protect_litter_record_identity();
CREATE TRIGGER protect_weigh_ins_identity
  BEFORE UPDATE ON public.weigh_ins
  FOR EACH ROW EXECUTE FUNCTION public.protect_litter_record_identity();
CREATE TRIGGER protect_daily_notes_identity
  BEFORE UPDATE ON public.daily_notes
  FOR EACH ROW EXECUTE FUNCTION public.protect_litter_record_identity();
CREATE TRIGGER protect_weights_identity
  BEFORE UPDATE ON public.weights
  FOR EACH ROW EXECUTE FUNCTION public.protect_weight_identity();

CREATE POLICY "Owners and editors can view litter collaborators"
  ON public.litter_collaborators FOR SELECT TO authenticated
  USING (public.can_edit_litter(litter_id));

CREATE POLICY "Litter owners can add collaborators"
  ON public.litter_collaborators FOR INSERT TO authenticated
  WITH CHECK (
    public.is_litter_owner(litter_id)
    AND user_id <> auth.uid()
  );

CREATE POLICY "Litter owners can remove collaborators"
  ON public.litter_collaborators FOR DELETE TO authenticated
  USING (public.is_litter_owner(litter_id));

-- Litter members can manage kittens and logs while preserving the original
-- user_id attribution supplied when each record was created.
DROP POLICY "Users insert their own kittens" ON public.kittens;
DROP POLICY "Users update their own kittens" ON public.kittens;
DROP POLICY "Users delete their own kittens" ON public.kittens;
CREATE POLICY "Litter editors insert kittens" ON public.kittens FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.can_edit_litter(litter_id));
CREATE POLICY "Litter editors update kittens" ON public.kittens FOR UPDATE TO authenticated
  USING (public.can_edit_litter(litter_id))
  WITH CHECK (public.can_edit_litter(litter_id));
CREATE POLICY "Litter editors delete kittens" ON public.kittens FOR DELETE TO authenticated
  USING (public.can_edit_litter(litter_id));

DROP POLICY "Users insert their own feedings" ON public.feedings;
DROP POLICY "Users update their own feedings" ON public.feedings;
DROP POLICY "Users delete their own feedings" ON public.feedings;
CREATE POLICY "Litter editors insert feedings" ON public.feedings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.can_edit_litter(litter_id));
CREATE POLICY "Litter editors update feedings" ON public.feedings FOR UPDATE TO authenticated
  USING (public.can_edit_litter(litter_id))
  WITH CHECK (public.can_edit_litter(litter_id));
CREATE POLICY "Litter editors delete feedings" ON public.feedings FOR DELETE TO authenticated
  USING (public.can_edit_litter(litter_id));

DROP POLICY "Users insert their own poop entries" ON public.poop_entries;
DROP POLICY "Users update their own poop entries" ON public.poop_entries;
DROP POLICY "Users delete their own poop entries" ON public.poop_entries;
CREATE POLICY "Litter editors insert poop entries" ON public.poop_entries FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.can_edit_litter(litter_id));
CREATE POLICY "Litter editors update poop entries" ON public.poop_entries FOR UPDATE TO authenticated
  USING (public.can_edit_litter(litter_id))
  WITH CHECK (public.can_edit_litter(litter_id));
CREATE POLICY "Litter editors delete poop entries" ON public.poop_entries FOR DELETE TO authenticated
  USING (public.can_edit_litter(litter_id));

DROP POLICY "Users insert their own litter changes" ON public.litter_changes;
DROP POLICY "Users update their own litter changes" ON public.litter_changes;
DROP POLICY "Users delete their own litter changes" ON public.litter_changes;
CREATE POLICY "Litter editors insert litter changes" ON public.litter_changes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.can_edit_litter(litter_id));
CREATE POLICY "Litter editors update litter changes" ON public.litter_changes FOR UPDATE TO authenticated
  USING (public.can_edit_litter(litter_id))
  WITH CHECK (public.can_edit_litter(litter_id));
CREATE POLICY "Litter editors delete litter changes" ON public.litter_changes FOR DELETE TO authenticated
  USING (public.can_edit_litter(litter_id));

DROP POLICY "Users insert their own weigh-ins" ON public.weigh_ins;
DROP POLICY "Users update their own weigh-ins" ON public.weigh_ins;
DROP POLICY "Users delete their own weigh-ins" ON public.weigh_ins;
CREATE POLICY "Litter editors insert weigh-ins" ON public.weigh_ins FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.can_edit_litter(litter_id));
CREATE POLICY "Litter editors update weigh-ins" ON public.weigh_ins FOR UPDATE TO authenticated
  USING (public.can_edit_litter(litter_id))
  WITH CHECK (public.can_edit_litter(litter_id));
CREATE POLICY "Litter editors delete weigh-ins" ON public.weigh_ins FOR DELETE TO authenticated
  USING (public.can_edit_litter(litter_id));

DROP POLICY "Users insert their own weights" ON public.weights;
DROP POLICY "Users update their own weights" ON public.weights;
DROP POLICY "Users delete their own weights" ON public.weights;
CREATE POLICY "Litter editors insert weights" ON public.weights FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.can_edit_weigh_in(weigh_in_id));
CREATE POLICY "Litter editors update weights" ON public.weights FOR UPDATE TO authenticated
  USING (public.can_edit_weigh_in(weigh_in_id))
  WITH CHECK (public.can_edit_weigh_in(weigh_in_id));
CREATE POLICY "Litter editors delete weights" ON public.weights FOR DELETE TO authenticated
  USING (public.can_edit_weigh_in(weigh_in_id));

DROP POLICY "Users insert their own daily notes" ON public.daily_notes;
DROP POLICY "Users update their own daily notes" ON public.daily_notes;
DROP POLICY "Users delete their own daily notes" ON public.daily_notes;
CREATE POLICY "Litter editors insert daily notes" ON public.daily_notes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.can_edit_litter(litter_id));
CREATE POLICY "Litter editors update daily notes" ON public.daily_notes FOR UPDATE TO authenticated
  USING (public.can_edit_litter(litter_id))
  WITH CHECK (public.can_edit_litter(litter_id));
CREATE POLICY "Litter editors delete daily notes" ON public.daily_notes FOR DELETE TO authenticated
  USING (public.can_edit_litter(litter_id));
