import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { TagColour } from '@/components/foster/ui/KittenDot'

export interface LitterRow {
  id: string
  user_id: string
  mother_name: string
  mother_avatar_path: string | null
  batch_type: 'family' | 'single' | 'kittens_only'
  primary_cat: CatRow | null
  litter_name: string | null
  visibility: 'private' | 'community'
  community_summary: string | null
  date_of_birth: string | null
  arrived: string
  left_date: string | null
  status: 'active' | 'completed'
  external_record: string | null
  album_url: string | null
  litter_change_interval_hours: number
  kittens: CatRow[]
}

export interface CatRow {
  id: string
  name: string
  sort_order: number
  litter_id: string
  role: 'mother' | 'single' | 'kitten'
  date_of_birth: string | null
  tag_colour: TagColour | null
  avatar_path: string | null
  adoption_status: AdoptionStatus
  adopter_name: string | null
  adoption_date: string | null
  adoption_notes: string | null
}

export type AdoptionStatus = 'not_available' | 'available' | 'reserved' | 'adopted'

const catSelect =
  'id, litter_id, name, sort_order, role, date_of_birth, tag_colour, avatar_path, adoption_status, adopter_name, adoption_date, adoption_notes'

export const littersQueryOptions = queryOptions({
  queryKey: ['litters'],
  queryFn: async (): Promise<LitterRow[]> => {
    const { data, error } = await supabase
      .from('litters')
      .select(
        `id, user_id, mother_name, mother_avatar_path, batch_type, litter_name, visibility, community_summary, date_of_birth, arrived, left_date, status, external_record, album_url, litter_change_interval_hours, kittens(${catSelect})`,
      )
      .order('arrived', { ascending: false })
    if (error) throw error
    return (data ?? []).map((litter) => {
      const cats = [...(litter.kittens ?? [])] as CatRow[]
      return {
        ...litter,
        primary_cat: cats.find((cat) => cat.role === 'mother' || cat.role === 'single') ?? null,
        kittens: cats
          .filter((cat) => cat.role === 'kitten')
          .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
      }
    }) as LitterRow[]
  },
})

export function pickCurrentLitter(litters: LitterRow[]): LitterRow | undefined {
  return litters.find((litter) => litter.status === 'active') ?? litters[0]
}

export function batchDisplayName(litter: LitterRow): string {
  return litter.litter_name || litter.primary_cat?.name || litter.mother_name || 'Kittens'
}

export interface CommunityCat {
  name: string
  role: 'mother' | 'single' | 'kitten'
  avatar_path: string | null
  tag_colour: TagColour | null
}

export interface CommunityBatch {
  id: string
  batch_type: 'family' | 'single' | 'kittens_only'
  display_name: string
  arrived: string
  left_date: string | null
  status: 'active' | 'completed'
  community_summary: string | null
  fosterer_name: string
  cats: CommunityCat[]
}

export const TIMELINE_PAGE_SIZE = 100
export const COMMUNITY_PAGE_SIZE = 12

export const communityBatchesQueryOptions = infiniteQueryOptions({
  queryKey: ['community-batches'],
  staleTime: 10 * 60 * 1000,
  initialPageParam: 0,
  queryFn: async ({ pageParam }): Promise<CommunityBatch[]> => {
    const { data, error } = await supabase
      .rpc('community_batches')
      .range(pageParam, pageParam + COMMUNITY_PAGE_SIZE - 1)
    if (error) throw error
    return (data ?? []).map((batch) => ({
      ...batch,
      cats: Array.isArray(batch.cats) ? (batch.cats as unknown as CommunityCat[]) : [],
    }))
  },
  getNextPageParam: (lastPage, pages) =>
    lastPage.length === COMMUNITY_PAGE_SIZE ? pages.length * COMMUNITY_PAGE_SIZE : undefined,
})

export interface DashboardQuickView {
  mealsToday: number
  latestLitterChange: { date: string; time: string } | null
  latestWeights: {
    date: string
    grams: number
    kittens: { name: string } | null
  }[]
}

export const dashboardQuickViewQueryOptions = (litterId: string | undefined, today: string) =>
  queryOptions({
    queryKey: ['dashboard-quick-view', litterId, today],
    enabled: Boolean(litterId),
    queryFn: async (): Promise<DashboardQuickView> => {
      const { data, error } = await supabase.rpc('dashboard_quick_view', {
        target_litter_id: litterId!,
        target_date: today,
      })
      if (error) throw error
      const result = data as unknown as DashboardQuickView
      return result
    },
  })

export interface ProfileRow {
  id: string
  display_name: string
}

export const profilesQueryOptions = queryOptions({
  queryKey: ['profiles'],
  queryFn: async (): Promise<ProfileRow[]> => {
    const { data, error } = await supabase.from('profiles').select('id, display_name')
    if (error) throw error
    return (data ?? []) as ProfileRow[]
  },
  staleTime: 5 * 60 * 1000,
})

export function logAuthorName(profiles: ProfileRow[], userId: string): string {
  return profiles.find((profile) => profile.id === userId)?.display_name ?? 'Foster carer'
}

export type NoteCategory =
  'milestone' | 'behaviour' | 'health' | 'medication' | 'appointment' | 'general'
export type NoteImportance = 'normal' | 'important'
export type NoteSubject = 'batch' | 'mother' | 'kittens'

export interface DailyNoteRow {
  id: string
  user_id: string
  litter_id: string
  date: string
  time: string | null
  note: string
  category: NoteCategory
  importance: NoteImportance
  subject_type: NoteSubject
  kitten_ids: string[]
  includes_mother: boolean
}

export const dailyNotesQueryOptions = (litterId: string | undefined) =>
  infiniteQueryOptions({
    queryKey: ['daily-notes', litterId],
    enabled: Boolean(litterId),
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<DailyNoteRow[]> => {
      const { data, error } = await supabase
        .from('daily_notes')
        .select(
          'id, user_id, litter_id, date, time, note, category, importance, subject_type, kitten_ids, includes_mother',
        )
        .eq('litter_id', litterId!)
        .order('date', { ascending: false })
        .order('time', { ascending: false, nullsFirst: false })
        .order('id', { ascending: false })
        .range(pageParam, pageParam + TIMELINE_PAGE_SIZE - 1)
      if (error) throw error
      return (data ?? []) as DailyNoteRow[]
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.length === TIMELINE_PAGE_SIZE ? pages.length * TIMELINE_PAGE_SIZE : undefined,
  })

export type KittenRow = CatRow

export const kittensQueryOptions = (litterId: string | undefined) =>
  queryOptions({
    queryKey: ['kittens', litterId],
    enabled: Boolean(litterId),
    queryFn: async (): Promise<KittenRow[]> => {
      const { data, error } = await supabase
        .from('kittens')
        .select(catSelect)
        .eq('litter_id', litterId!)
        .eq('role', 'kitten')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })
      if (error) throw error
      return (data ?? []) as KittenRow[]
    },
  })

export const catsQueryOptions = (litterId: string | undefined) =>
  queryOptions({
    queryKey: ['cats', litterId],
    enabled: Boolean(litterId),
    queryFn: async (): Promise<CatRow[]> => {
      const { data, error } = await supabase
        .from('kittens')
        .select(catSelect)
        .eq('litter_id', litterId!)
        .order('sort_order', { ascending: true })
      if (error) throw error
      return (data ?? []) as CatRow[]
    },
  })

export interface FeedingRow {
  id: string
  user_id: string
  date: string
  time: string
  food: string
  flavours: string[]
  meal_number: number | null
  notes: string | null
  pouch_count: number
  feeding_type: 'wet' | 'dry' | 'treat'
  dry_food_type: 'kitten' | 'adult' | 'mixed' | null
  bowl_count: number | null
  top_up_percent: number | null
}

export const feedingsQueryOptions = (litterId: string | undefined) =>
  infiniteQueryOptions({
    queryKey: ['feedings', litterId],
    enabled: Boolean(litterId),
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<FeedingRow[]> => {
      const { data, error } = await supabase
        .from('feedings')
        .select(
          'id, user_id, date, time, food, flavours, meal_number, notes, pouch_count, feeding_type, dry_food_type, bowl_count, top_up_percent',
        )
        .eq('litter_id', litterId!)
        .order('date', { ascending: false })
        .order('time', { ascending: false })
        .order('id', { ascending: false })
        .range(pageParam, pageParam + TIMELINE_PAGE_SIZE - 1)
      if (error) throw error
      return (data ?? []) as FeedingRow[]
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.length === TIMELINE_PAGE_SIZE ? pages.length * TIMELINE_PAGE_SIZE : undefined,
  })

export interface PoopRow {
  id: string
  user_id: string
  date: string
  time: string
  note: string | null
  kitten_id: string | null
  subject_type: 'mother' | 'kitten'
  kittens: { name: string; tag_colour: TagColour | null; avatar_path: string | null } | null
}

export const poopsQueryOptions = (litterId: string | undefined) =>
  infiniteQueryOptions({
    queryKey: ['poops', litterId],
    enabled: Boolean(litterId),
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<PoopRow[]> => {
      const { data, error } = await supabase
        .from('poop_entries')
        .select(
          'id, user_id, date, time, note, kitten_id, subject_type, kittens(name, tag_colour, avatar_path)',
        )
        .eq('litter_id', litterId!)
        .order('date', { ascending: false })
        .order('time', { ascending: false })
        .order('id', { ascending: false })
        .range(pageParam, pageParam + TIMELINE_PAGE_SIZE - 1)
      if (error) throw error
      return (data ?? []) as unknown as PoopRow[]
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.length === TIMELINE_PAGE_SIZE ? pages.length * TIMELINE_PAGE_SIZE : undefined,
  })

export interface LitterChangeRow {
  id: string
  user_id: string
  date: string
  time: string
  notes: string | null
}

export const litterChangesQueryOptions = (litterId: string | undefined) =>
  infiniteQueryOptions({
    queryKey: ['litter-changes', litterId],
    enabled: Boolean(litterId),
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<LitterChangeRow[]> => {
      const { data, error } = await supabase
        .from('litter_changes')
        .select('id, user_id, date, time, notes')
        .eq('litter_id', litterId!)
        .order('date', { ascending: false })
        .order('time', { ascending: false })
        .order('id', { ascending: false })
        .range(pageParam, pageParam + TIMELINE_PAGE_SIZE - 1)
      if (error) throw error
      return (data ?? []) as LitterChangeRow[]
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.length === TIMELINE_PAGE_SIZE ? pages.length * TIMELINE_PAGE_SIZE : undefined,
  })

export interface WeighInRow {
  id: string
  user_id: string
  date: string
  time: string
  notes: string | null
  weights: {
    kitten_id: string
    grams: number
    kittens: { name: string; tag_colour: TagColour | null; avatar_path: string | null } | null
  }[]
}

export const weighInsQueryOptions = (litterId: string | undefined) =>
  infiniteQueryOptions({
    queryKey: ['weigh-ins', litterId],
    enabled: Boolean(litterId),
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<WeighInRow[]> => {
      const { data, error } = await supabase
        .from('weigh_ins')
        .select(
          'id, user_id, date, time, notes, weights(kitten_id, grams, kittens(name, tag_colour, avatar_path))',
        )
        .eq('litter_id', litterId!)
        .order('date', { ascending: false })
        .order('time', { ascending: false })
        .order('id', { ascending: false })
        .range(pageParam, pageParam + TIMELINE_PAGE_SIZE - 1)
      if (error) throw error
      return (data ?? []) as unknown as WeighInRow[]
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.length === TIMELINE_PAGE_SIZE ? pages.length * TIMELINE_PAGE_SIZE : undefined,
  })

export interface HistoricalWeightRange {
  age_days: number
  batch_count: number
  kitten_count: number
  min_grams: number
  max_grams: number
  sample_count: number
}

export const historicalWeightRangeQueryOptions = (litterId: string | undefined) =>
  queryOptions({
    queryKey: ['historical-weight-range', litterId],
    enabled: Boolean(litterId),
    queryFn: async (): Promise<HistoricalWeightRange[]> => {
      const { data, error } = await supabase.rpc('batch_historical_weight_range', {
        target_litter_id: litterId!,
      })
      if (error) throw error
      return data ?? []
    },
  })

export function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T12:00:00`).getTime()
  const b = new Date(`${to}T12:00:00`).getTime()
  return Math.round((b - a) / 86_400_000)
}

export function groupByDate<T extends { date: string }>(rows: T[]): { date: string; items: T[] }[] {
  const map = new Map<string, T[]>()
  for (const row of rows) {
    const list = map.get(row.date)
    if (list) list.push(row)
    else map.set(row.date, [row])
  }
  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([date, items]) => ({ date, items }))
}
