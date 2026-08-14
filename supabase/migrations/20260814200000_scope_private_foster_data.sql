-- Private workspace access: only a batch owner or invited collaborator may
-- read its cats and operational records. Community-safe access is added in a
-- later migration alongside explicit per-batch publishing controls.

DROP POLICY IF EXISTS "Litters are viewable by everyone" ON public.litters;
CREATE POLICY "Litter members can view litters"
  ON public.litters FOR SELECT TO authenticated
  USING (public.can_edit_litter(id));

DROP POLICY IF EXISTS "Kittens are viewable by everyone" ON public.kittens;
CREATE POLICY "Litter members can view cats"
  ON public.kittens FOR SELECT TO authenticated
  USING (public.can_edit_litter(litter_id));

DROP POLICY IF EXISTS "Feedings are viewable by everyone" ON public.feedings;
CREATE POLICY "Litter members can view feedings"
  ON public.feedings FOR SELECT TO authenticated
  USING (public.can_edit_litter(litter_id));

DROP POLICY IF EXISTS "Poop entries are viewable by everyone" ON public.poop_entries;
CREATE POLICY "Litter members can view poop entries"
  ON public.poop_entries FOR SELECT TO authenticated
  USING (public.can_edit_litter(litter_id));

DROP POLICY IF EXISTS "Litter changes are viewable by everyone" ON public.litter_changes;
CREATE POLICY "Litter members can view litter changes"
  ON public.litter_changes FOR SELECT TO authenticated
  USING (public.can_edit_litter(litter_id));

DROP POLICY IF EXISTS "Weigh-ins are viewable by everyone" ON public.weigh_ins;
CREATE POLICY "Litter members can view weigh-ins"
  ON public.weigh_ins FOR SELECT TO authenticated
  USING (public.can_edit_litter(litter_id));

DROP POLICY IF EXISTS "Weights are viewable by everyone" ON public.weights;
CREATE POLICY "Litter members can view weights"
  ON public.weights FOR SELECT TO authenticated
  USING (public.can_edit_weigh_in(weigh_in_id));

DROP POLICY IF EXISTS "Daily notes are viewable by everyone" ON public.daily_notes;
CREATE POLICY "Litter members can view daily notes"
  ON public.daily_notes FOR SELECT TO authenticated
  USING (public.can_edit_litter(litter_id));

-- Display names are needed for attribution and collaborator selection, but
-- should no longer be enumerable by signed-out visitors.
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

-- Cat photos follow the same private batch boundary. Signed URLs are issued
-- only when the requesting user can access the cat's batch.
UPDATE storage.buckets
SET public = false
WHERE id = 'kitten-avatars';

DROP POLICY IF EXISTS "Kitten avatars are publicly viewable" ON storage.objects;
CREATE POLICY "Litter members can view cat avatars"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'kitten-avatars'
    AND EXISTS (
      SELECT 1
      FROM public.kittens AS cat
      WHERE cat.avatar_path = storage.objects.name
        AND public.can_edit_litter(cat.litter_id)
    )
  );
