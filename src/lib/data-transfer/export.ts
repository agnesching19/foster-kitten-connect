import JSZip from 'jszip'
import { supabase } from '@/integrations/supabase/client'
import { toCsv } from './csv'
import { exportHeaders, tableSpecs, type TableName } from './tables'

export interface ExportProgress {
  step: string
  percent: number
}

export interface ExportResult {
  filename: string
  blob: Blob
  counts: Record<string, number>
}

async function fetchRows(
  table: TableName,
  litterIds: string[] | null,
  weighInIds?: string[],
): Promise<Record<string, unknown>[]> {
  const spec = tableSpecs.find((item) => item.table === table)!
  let query = supabase.from(table).select(exportHeaders(spec).join(','))

  if (litterIds) {
    if (spec.litterColumn === 'id') query = query.in('id', litterIds)
    else if (spec.litterColumn === 'litter_id') query = query.in('litter_id', litterIds)
    else if (spec.viaWeighIn) query = query.in('weigh_in_id', weighInIds ?? [])
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as unknown as Record<string, unknown>[]
}

/**
 * Builds a ZIP with one CSV per table. IDs and foreign keys are preserved so the
 * archive can be re-imported (also used as the backup format).
 */
export async function buildExportZip(
  litterIds: string[] | null,
  onProgress?: (progress: ExportProgress) => void,
): Promise<ExportResult> {
  const zip = new JSZip()
  const counts: Record<string, number> = {}

  let weighInIds: string[] = []
  if (litterIds) {
    const { data, error } = await supabase
      .from('weigh_ins')
      .select('id')
      .in('litter_id', litterIds)
    if (error) throw error
    weighInIds = (data ?? []).map((row) => row.id)
  }

  for (let index = 0; index < tableSpecs.length; index += 1) {
    const spec = tableSpecs[index]!
    onProgress?.({
      step: `Exporting ${spec.label.toLowerCase()}…`,
      percent: Math.round((index / (tableSpecs.length + 1)) * 100),
    })
    const rows = await fetchRows(spec.table, litterIds, weighInIds)
    counts[spec.label] = rows.length
    zip.file(spec.file, toCsv(exportHeaders(spec), rows))
  }

  zip.file(
    'manifest.json',
    JSON.stringify(
      {
        app: 'foster-kitten-tracker',
        format: 'csv-zip',
        version: 1,
        exported_at: new Date().toISOString(),
        scope: litterIds ? { litter_ids: litterIds } : 'all',
        counts,
      },
      null,
      2,
    ),
  )

  onProgress?.({ step: 'Packaging archive…', percent: 95 })
  const blob = await zip.generateAsync({ type: 'blob' })
  onProgress?.({ step: 'Done', percent: 100 })

  const stamp = new Date().toISOString().slice(0, 10)
  const scope = litterIds ? `litters-${litterIds.length}` : 'all-data'
  return { filename: `foster-tracker-${scope}-${stamp}.zip`, blob, counts }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}