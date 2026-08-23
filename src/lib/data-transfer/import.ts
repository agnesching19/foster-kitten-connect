import JSZip from 'jszip'
import { supabase } from '@/integrations/supabase/client'
import { parseCsv } from './csv'
import {
  normaliseRow,
  specByFile,
  tableSpecs,
  type TableName,
  type TableSpec,
  type ValidationIssue,
} from './tables'

export type ConflictStrategy = 'skip' | 'replace' | 'merge'

export interface ParsedTable {
  spec: TableSpec
  rows: Record<string, unknown>[]
}

export interface ImportPreview {
  tables: ParsedTable[]
  issues: ValidationIssue[]
  /** Litters found in the payload. */
  litters: { id: string; label: string }[]
  /** Litters that already exist in the database. */
  existingLitterIds: string[]
  totalRows: number
}

export interface ImportProgress {
  step: string
  percent: number
}

export interface ImportSummary {
  inserted: Record<string, number>
  skippedLitters: number
  totalInserted: number
}

async function readFiles(files: File[]): Promise<{ name: string; text: string }[]> {
  const out: { name: string; text: string }[] = []
  for (const file of files) {
    if (file.name.toLowerCase().endsWith('.zip')) {
      const zip = await JSZip.loadAsync(file)
      for (const entry of Object.values(zip.files)) {
        const name = entry.name.split('/').pop() ?? entry.name
        if (entry.dir || !name.toLowerCase().endsWith('.csv')) continue
        out.push({ name, text: await entry.async('string') })
      }
    } else if (file.name.toLowerCase().endsWith('.csv')) {
      out.push({ name: file.name, text: await file.text() })
    } else {
      out.push({ name: file.name, text: '' })
    }
  }
  return out
}

/** Validates CSV/ZIP files and builds a preview without touching the database. */
export async function buildImportPreview(files: File[]): Promise<ImportPreview> {
  const issues: ValidationIssue[] = []
  const contents = await readFiles(files)
  const byTable = new Map<TableName, Record<string, unknown>[]>()

  for (const { name, text } of contents) {
    const spec = specByFile.get(name)
    if (!spec) {
      issues.push({
        file: name,
        message: 'Unrecognised file. Expected one of: ' + tableSpecs.map((s) => s.file).join(', '),
      })
      continue
    }
    if (!text.trim()) {
      issues.push({ file: name, message: 'File is empty' })
      continue
    }

    const { headers, rows } = parseCsv(text)
    const missing = spec.columns
      .filter((column) => column.required && !headers.includes(column.name))
      .map((column) => column.name)
    if (missing.length) {
      issues.push({ file: name, message: `Missing required column(s): ${missing.join(', ')}` })
      continue
    }

    const accepted = byTable.get(spec.table) ?? []
    rows.forEach((row, index) => {
      const payload = normaliseRow(spec, row as Record<string, string>, index + 2, issues)
      if (payload) accepted.push(payload)
    })
    byTable.set(spec.table, accepted)
  }

  const tables: ParsedTable[] = tableSpecs
    .filter((spec) => byTable.has(spec.table))
    .map((spec) => ({ spec, rows: byTable.get(spec.table)! }))

  const litterRows = byTable.get('litters') ?? []
  const litters = litterRows.map((row) => ({
    id: String(row['id']),
    label: String(row['litter_name'] || row['mother_name'] || row['id']),
  }))

  let existingLitterIds: string[] = []
  if (litters.length) {
    const { data, error } = await supabase
      .from('litters')
      .select('id')
      .in(
        'id',
        litters.map((litter) => litter.id),
      )
    if (error) throw error
    existingLitterIds = (data ?? []).map((row) => row.id)
  }

  return {
    tables,
    issues,
    litters,
    existingLitterIds,
    totalRows: tables.reduce((sum, table) => sum + table.rows.length, 0),
  }
}

async function deleteLitterData(litterIds: string[]) {
  const { data: weighIns, error: weighInError } = await supabase
    .from('weigh_ins')
    .select('id')
    .in('litter_id', litterIds)
  if (weighInError) throw weighInError
  const weighInIds = (weighIns ?? []).map((row) => row.id)

  if (weighInIds.length) {
    const { error } = await supabase.from('weights').delete().in('weigh_in_id', weighInIds)
    if (error) throw error
  }

  for (const table of [
    'weigh_ins',
    'feedings',
    'poop_entries',
    'litter_changes',
    'daily_notes',
    'kittens',
  ] as const) {
    const { error } = await supabase.from(table).delete().in('litter_id', litterIds)
    if (error) throw error
  }
}

function rowLitterId(spec: TableSpec, row: Record<string, unknown>): string | null {
  if (spec.litterColumn === 'id') return String(row['id'])
  if (spec.litterColumn === 'litter_id') return String(row['litter_id'])
  return null
}

/**
 * Writes a validated preview into Supabase, preserving IDs and relationships.
 * Existing litters are handled with the chosen strategy.
 */
export async function runImport(
  preview: ImportPreview,
  options: { userId: string; strategy: ConflictStrategy },
  onProgress?: (progress: ImportProgress) => void,
): Promise<ImportSummary> {
  const { userId, strategy } = options
  const conflicting = new Set(preview.existingLitterIds)
  const skipped = strategy === 'skip' ? conflicting : new Set<string>()

  if (strategy === 'replace' && conflicting.size) {
    onProgress?.({ step: 'Clearing existing batch records…', percent: 5 })
    await deleteLitterData([...conflicting])
  }

  const inserted: Record<string, number> = {}
  const weighInsById = new Map<string, string>()
  for (const table of preview.tables) {
    if (table.spec.table !== 'weigh_ins') continue
    for (const row of table.rows) {
      weighInsById.set(String(row['id']), String(row['litter_id']))
    }
  }

  for (let index = 0; index < preview.tables.length; index += 1) {
    const { spec, rows } = preview.tables[index]!
    onProgress?.({
      step: `Importing ${spec.label.toLowerCase()}…`,
      percent: 10 + Math.round((index / preview.tables.length) * 85),
    })

    const payload = rows
      .filter((row) => {
        const litterId = spec.viaWeighIn
          ? (weighInsById.get(String(row['weigh_in_id'])) ?? null)
          : rowLitterId(spec, row)
        return !(litterId && skipped.has(litterId))
      })
      .map((row) => ({
        ...row,
        ...(spec.table === 'litters' && !row['batch_type'] ? { batch_type: 'family' } : {}),
        ...(spec.table === 'litters' && !row['visibility'] ? { visibility: 'private' } : {}),
        ...(spec.table === 'kittens' && !row['role'] ? { role: 'kitten' } : {}),
        ...(spec.table === 'daily_notes' && row['includes_mother'] == null
          ? { includes_mother: row['subject_type'] === 'mother' }
          : {}),
        user_id: userId,
      }))

    inserted[spec.label] = payload.length
    if (!payload.length) continue

    const chunkSize = 400
    for (let start = 0; start < payload.length; start += chunkSize) {
      const chunk = payload.slice(start, start + chunkSize)
      const { error } = await supabase.from(spec.table).upsert(chunk as never, { onConflict: 'id' })
      if (error) throw error
    }
  }

  // Older backups stored the primary cat directly on the batch. Promote those
  // rows after import when no role-bearing primary cat was included.
  const importedLitters = preview.tables.find((table) => table.spec.table === 'litters')?.rows ?? []
  for (const row of importedLitters) {
    const litterId = String(row['id'])
    if (skipped.has(litterId)) continue
    const { data: existingPrimary, error: lookupError } = await supabase
      .from('kittens')
      .select('id')
      .eq('litter_id', litterId)
      .in('role', ['mother', 'single'])
      .maybeSingle()
    if (lookupError) throw lookupError
    if (!existingPrimary && row['mother_name']) {
      const batchType = row['batch_type'] === 'single' ? 'single' : 'family'
      const { error } = await supabase.from('kittens').insert({
        user_id: userId,
        litter_id: litterId,
        name: String(row['mother_name']),
        sort_order: -1,
        role: batchType === 'single' ? 'single' : 'mother',
      })
      if (error) throw error
    }
  }

  onProgress?.({ step: 'Done', percent: 100 })
  return {
    inserted,
    skippedLitters: skipped.size,
    totalInserted: Object.values(inserted).reduce((sum, count) => sum + count, 0),
  }
}
