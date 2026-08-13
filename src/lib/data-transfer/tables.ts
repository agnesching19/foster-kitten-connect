export type TableName =
  | 'litters'
  | 'kittens'
  | 'weigh_ins'
  | 'weights'
  | 'feedings'
  | 'poop_entries'
  | 'litter_changes'
  | 'daily_notes'

export interface ColumnSpec {
  name: string
  required?: boolean
  type?: 'text' | 'date' | 'time' | 'int' | 'uuid' | 'status' | 'string-array'
}

export interface TableSpec {
  table: TableName
  label: string
  file: string
  /** Column that ties the row to a litter, when it exists directly. */
  litterColumn?: 'id' | 'litter_id'
  /** Rows are scoped to a litter through weigh_ins. */
  viaWeighIn?: boolean
  columns: ColumnSpec[]
}

/**
 * Import/export order matters: parents first so foreign keys resolve.
 */
export const tableSpecs: TableSpec[] = [
  {
    table: 'litters',
    label: 'Batches',
    file: 'litters.csv',
    litterColumn: 'id',
    columns: [
      { name: 'id', required: true, type: 'uuid' },
      { name: 'mother_name', required: true },
      { name: 'litter_name' },
      { name: 'date_of_birth', type: 'date' },
      { name: 'arrived', required: true, type: 'date' },
      { name: 'left_date', type: 'date' },
      { name: 'litter_change_interval_hours', type: 'int' },
      { name: 'status', required: true, type: 'status' },
      { name: 'external_record' },
      { name: 'album_url' },
    ],
  },
  {
    table: 'kittens',
    label: 'Kittens',
    file: 'kittens.csv',
    litterColumn: 'litter_id',
    columns: [
      { name: 'id', required: true, type: 'uuid' },
      { name: 'litter_id', required: true, type: 'uuid' },
      { name: 'name', required: true },
      { name: 'sort_order', type: 'int' },
    ],
  },
  {
    table: 'weigh_ins',
    label: 'Weigh-ins',
    file: 'weigh_ins.csv',
    litterColumn: 'litter_id',
    columns: [
      { name: 'id', required: true, type: 'uuid' },
      { name: 'litter_id', required: true, type: 'uuid' },
      { name: 'date', required: true, type: 'date' },
      { name: 'time', required: true, type: 'time' },
    ],
  },
  {
    table: 'weights',
    label: 'Weights',
    file: 'weights.csv',
    viaWeighIn: true,
    columns: [
      { name: 'id', required: true, type: 'uuid' },
      { name: 'weigh_in_id', required: true, type: 'uuid' },
      { name: 'kitten_id', required: true, type: 'uuid' },
      { name: 'grams', required: true, type: 'int' },
    ],
  },
  {
    table: 'feedings',
    label: 'Feedings',
    file: 'feedings.csv',
    litterColumn: 'litter_id',
    columns: [
      { name: 'id', required: true, type: 'uuid' },
      { name: 'litter_id', required: true, type: 'uuid' },
      { name: 'date', required: true, type: 'date' },
      { name: 'time', required: true, type: 'time' },
      { name: 'food', required: true },
      { name: 'flavours', type: 'string-array' },
      { name: 'meal_number', type: 'int' },
      { name: 'pouch_count', type: 'int' },
      { name: 'feeding_type' },
      { name: 'dry_food_type' },
      { name: 'bowl_count', type: 'int' },
      { name: 'top_up_percent', type: 'int' },
    ],
  },
  {
    table: 'poop_entries',
    label: 'Bathroom entries',
    file: 'poop_entries.csv',
    litterColumn: 'litter_id',
    columns: [
      { name: 'id', required: true, type: 'uuid' },
      { name: 'litter_id', required: true, type: 'uuid' },
      { name: 'kitten_id', type: 'uuid' },
      { name: 'date', required: true, type: 'date' },
      { name: 'time', required: true, type: 'time' },
      { name: 'note' },
    ],
  },
  {
    table: 'litter_changes',
    label: 'Litter box changes',
    file: 'litter_changes.csv',
    litterColumn: 'litter_id',
    columns: [
      { name: 'id', required: true, type: 'uuid' },
      { name: 'litter_id', required: true, type: 'uuid' },
      { name: 'date', required: true, type: 'date' },
      { name: 'time', required: true, type: 'time' },
    ],
  },
  {
    table: 'daily_notes',
    label: 'Daily notes',
    file: 'daily_notes.csv',
    litterColumn: 'litter_id',
    columns: [
      { name: 'id', required: true, type: 'uuid' },
      { name: 'litter_id', required: true, type: 'uuid' },
      { name: 'date', required: true, type: 'date' },
      { name: 'time', type: 'time' },
      { name: 'note', required: true },
      { name: 'category' },
      { name: 'importance' },
      { name: 'subject_type' },
      { name: 'kitten_ids', type: 'string-array' },
    ],
  },
]

export const specByFile = new Map(tableSpecs.map((spec) => [spec.file, spec]))
export const specByTable = new Map(tableSpecs.map((spec) => [spec.table, spec]))

export function exportHeaders(spec: TableSpec): string[] {
  return spec.columns.map((column) => column.name)
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const datePattern = /^\d{4}-\d{2}-\d{2}$/
const timePattern = /^\d{2}:\d{2}(:\d{2})?$/

export interface ValidationIssue {
  file: string
  row?: number
  message: string
}

/** Normalises one CSV row into a Supabase payload, collecting validation issues. */
export function normaliseRow(
  spec: TableSpec,
  row: Record<string, string>,
  rowNumber: number,
  issues: ValidationIssue[],
): Record<string, unknown> | null {
  const payload: Record<string, unknown> = {}
  let valid = true

  for (const column of spec.columns) {
    const raw = (row[column.name] ?? '').trim()

    if (!raw) {
      if (column.required) {
        issues.push({
          file: spec.file,
          row: rowNumber,
          message: `Missing required value for "${column.name}"`,
        })
        valid = false
      } else {
        payload[column.name] = null
      }
      continue
    }

    switch (column.type) {
      case 'uuid':
        if (!uuidPattern.test(raw)) {
          issues.push({
            file: spec.file,
            row: rowNumber,
            message: `"${column.name}" is not a valid ID`,
          })
          valid = false
        }
        payload[column.name] = raw
        break
      case 'date':
        if (!datePattern.test(raw)) {
          issues.push({
            file: spec.file,
            row: rowNumber,
            message: `"${column.name}" must be YYYY-MM-DD`,
          })
          valid = false
        }
        payload[column.name] = raw
        break
      case 'time':
        if (!timePattern.test(raw)) {
          issues.push({
            file: spec.file,
            row: rowNumber,
            message: `"${column.name}" must be HH:MM`,
          })
          valid = false
        }
        payload[column.name] = raw
        break
      case 'int': {
        const parsed = Number(raw)
        if (!Number.isInteger(parsed)) {
          issues.push({
            file: spec.file,
            row: rowNumber,
            message: `"${column.name}" must be a whole number`,
          })
          valid = false
        }
        payload[column.name] = parsed
        break
      }
      case 'status':
        if (raw !== 'active' && raw !== 'completed') {
          issues.push({
            file: spec.file,
            row: rowNumber,
            message: `"status" must be "active" or "completed"`,
          })
          valid = false
        }
        payload[column.name] = raw
        break
      case 'string-array':
        try {
          const parsed: unknown = JSON.parse(raw)
          if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === 'string')) {
            throw new Error('Not a string array')
          }
          payload[column.name] = parsed
        } catch {
          issues.push({
            file: spec.file,
            row: rowNumber,
            message: `"${column.name}" must be a list of text values`,
          })
          valid = false
        }
        break
      default:
        payload[column.name] = raw
    }
  }

  return valid ? payload : null
}
