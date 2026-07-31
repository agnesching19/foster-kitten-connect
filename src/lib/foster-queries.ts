import { queryOptions } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface LitterRow {
  id: string
  mother_name: string
  litter_name: string | null
  date_of_birth: string | null
  arrived: string
  left_date: string | null
  status: 'active' | 'completed'
  external_record: string | null
  album_url: string | null
  kittens: { id: string; name: string }[]
}

export const littersQueryOptions = queryOptions({
  queryKey: ['litters'],
  queryFn: async (): Promise<LitterRow[]> => {
    const { data, error } = await supabase
      .from('litters')
      .select(
        'id, mother_name, litter_name, date_of_birth, arrived, left_date, status, external_record, album_url, kittens(id, name)',
      )
      .order('arrived', { ascending: false })
    if (error) throw error
    return (data ?? []).map((litter) => ({
      ...litter,
      kittens: [...(litter.kittens ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    })) as LitterRow[]
  },
})

export function pickCurrentLitter(litters: LitterRow[]): LitterRow | undefined {
  return litters.find((litter) => litter.status === 'active') ?? litters[0]
}

export const currentLitterQueryOptions = queryOptions({
  queryKey: ['current-litter'],
  queryFn: async (): Promise<LitterRow | null> => {
    const litters = await littersQueryOptions.queryFn!({} as never)
    return pickCurrentLitter(litters as LitterRow[]) ?? null
  },
})

export interface FeedingRow {
  id: string
  date: string
  time: string
  food: string
  meal_number: number | null
}

export const feedingsQueryOptions = (litterId: string | undefined) =>
  queryOptions({
    queryKey: ['feedings', litterId],
    enabled: Boolean(litterId),
    queryFn: async (): Promise<FeedingRow[]> => {
      const { data, error } = await supabase
        .from('feedings')
        .select('id, date, time, food, meal_number')
        .eq('litter_id', litterId!)
        .order('date', { ascending: false })
        .order('time', { ascending: true })
      if (error) throw error
      return (data ?? []) as FeedingRow[]
    },
  })

export interface PoopRow {
  id: string
  date: string
  time: string
  note: string | null
  kitten_id: string | null
  kittens: { name: string } | null
}

export const poopsQueryOptions = (litterId: string | undefined) =>
  queryOptions({
    queryKey: ['poops', litterId],
    enabled: Boolean(litterId),
    queryFn: async (): Promise<PoopRow[]> => {
      const { data, error } = await supabase
        .from('poop_entries')
        .select('id, date, time, note, kitten_id, kittens(name)')
        .eq('litter_id', litterId!)
        .order('date', { ascending: false })
        .order('time', { ascending: false })
      if (error) throw error
      return (data ?? []) as unknown as PoopRow[]
    },
  })

export interface LitterChangeRow {
  id: string
  date: string
  time: string
}

export const litterChangesQueryOptions = (litterId: string | undefined) =>
  queryOptions({
    queryKey: ['litter-changes', litterId],
    enabled: Boolean(litterId),
    queryFn: async (): Promise<LitterChangeRow[]> => {
      const { data, error } = await supabase
        .from('litter_changes')
        .select('id, date, time')
        .eq('litter_id', litterId!)
        .order('date', { ascending: false })
        .order('time', { ascending: false })
      if (error) throw error
      return (data ?? []) as LitterChangeRow[]
    },
  })

export interface WeighInRow {
  id: string
  date: string
  time: string
  weights: { kitten_id: string; grams: number; kittens: { name: string } | null }[]
}

export const weighInsQueryOptions = (litterId: string | undefined) =>
  queryOptions({
    queryKey: ['weigh-ins', litterId],
    enabled: Boolean(litterId),
    queryFn: async (): Promise<WeighInRow[]> => {
      const { data, error } = await supabase
        .from('weigh_ins')
        .select('id, date, time, weights(kitten_id, grams, kittens(name))')
        .eq('litter_id', litterId!)
        .order('date', { ascending: false })
        .order('time', { ascending: false })
      if (error) throw error
      return (data ?? []) as unknown as WeighInRow[]
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
