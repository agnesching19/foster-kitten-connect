-- Match the litter filter and deterministic pagination order used by each
-- growing timeline. These also accelerate latest-record dashboard lookups.
CREATE INDEX IF NOT EXISTS feedings_litter_date_time_id_idx
  ON public.feedings (litter_id, date DESC, time DESC, id DESC);

CREATE INDEX IF NOT EXISTS poop_entries_litter_date_time_id_idx
  ON public.poop_entries (litter_id, date DESC, time DESC, id DESC);

CREATE INDEX IF NOT EXISTS litter_changes_litter_date_time_id_idx
  ON public.litter_changes (litter_id, date DESC, time DESC, id DESC);

CREATE INDEX IF NOT EXISTS weigh_ins_litter_date_time_id_idx
  ON public.weigh_ins (litter_id, date DESC, time DESC, id DESC);

CREATE INDEX IF NOT EXISTS daily_notes_litter_date_time_id_idx
  ON public.daily_notes (litter_id, date DESC, time DESC NULLS LAST, id DESC);

CREATE INDEX IF NOT EXISTS litters_community_status_arrived_idx
  ON public.litters (visibility, status, arrived DESC)
  WHERE visibility = 'community';
