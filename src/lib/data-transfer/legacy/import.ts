import { supabase } from '@/integrations/supabase/client'
import type { LegacyParseResult } from './types'

export interface LegacyImportTarget {
  userId: string
  /** Existing litter to import into, or null when creating one. */
  litterId: string | null
  newLitter?: { mother_name: string; litter_name: string | null; arrived: string }
}

export interface LegacyImportSummary {
  litterId: string
  imported: {
    feedings: number
    poops: number
    litterChanges: number
    weighIns: number
    weights: number
    notes: number
  }
  createdKittens: string[]
  skipped: { reason: string; count: number }[]
  totalImported: number
}

async function chunkInsert(table: string, rows: Record<string, unknown>[]) {
  for (let start = 0; start < rows.length; start += 400) {
    const { error } = await supabase
      .from(table as never)
      .insert(rows.slice(start, start + 400) as never)
    if (error) throw error
  }
}

export async function runLegacyImport(
  result: LegacyParseResult,
  target: LegacyImportTarget,
  onProgress?: (progress: { step: string; percent: number }) => void,
): Promise<LegacyImportSummary> {
  const { userId } = target
  let litterId = target.litterId

  if (!litterId) {
    if (!target.newLitter?.mother_name || !target.newLitter.arrived) {
      throw new Error('Enter a mother name and arrival date for the new litter.')
    }
    onProgress?.({ step: 'Creating litter…', percent: 5 })
    const { data, error } = await supabase
      .from('litters')
      .insert({ ...target.newLitter, user_id: userId, status: 'active' })
      .select('id')
      .single()
    if (error) throw error
    litterId = data.id
  }

  // Resolve kitten names -> ids, creating any that are missing.
  onProgress?.({ step: 'Matching kittens…', percent: 15 })
  const { data: existingKittens, error: kittenError } = await supabase
    .from('kittens')
    .select('id, name, sort_order')
    .eq('litter_id', litterId)
  if (kittenError) throw kittenError

  const byName = new Map<string, string>()
  for (const kitten of existingKittens ?? []) byName.set(kitten.name.toLowerCase(), kitten.id)
  let nextOrder = (existingKittens ?? []).reduce((max, k) => Math.max(max, k.sort_order + 1), 0)

  const createdKittens: string[] = []
  const missing = result.kittenNames.filter((name) => name && !byName.has(name.toLowerCase()))
  if (missing.length) {
    const { data, error } = await supabase
      .from('kittens')
      .insert(
        missing.map((name) => ({
          name,
          litter_id: litterId!,
          user_id: userId,
          sort_order: nextOrder++,
        })),
      )
      .select('id, name')
    if (error) throw error
    for (const kitten of data ?? []) {
      byName.set(kitten.name.toLowerCase(), kitten.id)
      createdKittens.push(kitten.name)
    }
  }

  const base = { litter_id: litterId, user_id: userId }
  const skipped = new Map<string, number>()
  for (const entry of result.skipped) {
    skipped.set(entry.reason, (skipped.get(entry.reason) ?? 0) + 1)
  }

  onProgress?.({ step: 'Importing feedings…', percent: 30 })
  await chunkInsert(
    'feedings',
    result.feedings.map((row) => ({ ...base, ...row })),
  )

  onProgress?.({ step: 'Importing bathroom entries…', percent: 45 })
  await chunkInsert(
    'poop_entries',
    result.poops.map((row) => ({
      ...base,
      date: row.date,
      time: row.time,
      note: row.note,
      kitten_id: row.kittenName ? byName.get(row.kittenName.toLowerCase()) ?? null : null,
    })),
  )

  onProgress?.({ step: 'Importing litter changes…', percent: 60 })
  await chunkInsert(
    'litter_changes',
    result.litterChanges.map((row) => ({ ...base, ...row })),
  )

  onProgress?.({ step: 'Importing weigh-ins…', percent: 75 })
  let weightCount = 0
  for (let start = 0; start < result.weighIns.length; start += 100) {
    const batch = result.weighIns.slice(start, start + 100)
    const { data, error } = await supabase
      .from('weigh_ins')
      .insert(
        batch.map((row) => ({ ...base, date: row.date, time: row.time, notes: row.notes })),
      )
      .select('id')
    if (error) throw error
    const ids = (data ?? []).map((row) => row.id)
    const weightRows: Record<string, unknown>[] = []
    batch.forEach((row, index) => {
      const weighInId = ids[index]
      if (!weighInId) return
      for (const weight of row.weights) {
        const kittenId = byName.get(weight.kittenName.toLowerCase())
        if (!kittenId) {
          skipped.set('unmatched kitten weights', (skipped.get('unmatched kitten weights') ?? 0) + 1)
          continue
        }
        weightRows.push({
          user_id: userId,
          weigh_in_id: weighInId,
          kitten_id: kittenId,
          grams: weight.grams,
        })
      }
    })
    weightCount += weightRows.length
    await chunkInsert('weights', weightRows)
  }

  onProgress?.({ step: 'Importing notes…', percent: 90 })
  await chunkInsert(
    'daily_notes',
    result.notes.map((row) => ({ ...base, date: row.date, note: row.note })),
  )

  onProgress?.({ step: 'Done', percent: 100 })
  const imported = {
    feedings: result.feedings.length,
    poops: result.poops.length,
    litterChanges: result.litterChanges.length,
    weighIns: result.weighIns.length,
    weights: weightCount,
    notes: result.notes.length,
  }
  return {
    litterId: litterId!,
    imported,
    createdKittens,
    skipped: [...skipped.entries()].map(([reason, count]) => ({ reason, count })),
    totalImported: Object.values(imported).reduce((sum, count) => sum + count, 0),
  }
}