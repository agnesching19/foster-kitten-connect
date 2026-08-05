/** Shared contract so extra spreadsheet templates can be plugged in later. */
export interface LegacySheet {
  /** Sheet/tab or file name, used only for reporting. */
  name: string
  headers: string[]
  rows: Record<string, string>[]
}

export interface FeedingDraft {
  date: string
  time: string
  food: string
  meal_number: number | null
  notes: string | null
}

export interface PoopDraft {
  date: string
  time: string
  note: string | null
  kittenName: string | null
  subjectType: 'mother' | 'kitten'
}

export interface LitterChangeDraft {
  date: string
  time: string
  notes: string | null
}

export interface WeighInDraft {
  date: string
  time: string
  notes: string | null
  weights: { kittenName: string; grams: number }[]
}

export interface NoteDraft {
  date: string
  note: string
}

export interface SkippedRow {
  sheet: string
  row: number
  reason: string
}

export interface LegacyParseResult {
  parserId: string
  parserLabel: string
  feedings: FeedingDraft[]
  poops: PoopDraft[]
  litterChanges: LitterChangeDraft[]
  weighIns: WeighInDraft[]
  notes: NoteDraft[]
  /** Kitten names discovered in weight columns, in sheet order. */
  kittenNames: string[]
  skipped: SkippedRow[]
  /** Column header -> detected role, for the preview panel. */
  columnRoles: { header: string; role: string }[]
  sheetsSeen: string[]
  /** Tabs/files deliberately skipped (Chart, unrecognised sheets). */
  ignoredSheets: string[]
}

export interface SpreadsheetParser {
  id: string
  label: string
  description: string
  /** Confidence 0-1 that this parser understands the given sheets. */
  detect: (sheets: LegacySheet[]) => number
  parse: (sheets: LegacySheet[]) => LegacyParseResult
}

export function emptyResult(parserId: string, parserLabel: string): LegacyParseResult {
  return {
    parserId,
    parserLabel,
    feedings: [],
    poops: [],
    litterChanges: [],
    weighIns: [],
    notes: [],
    kittenNames: [],
    skipped: [],
    columnRoles: [],
    sheetsSeen: [],
    ignoredSheets: [],
  }
}

export function totalRecords(result: LegacyParseResult): number {
  return (
    result.feedings.length +
    result.poops.length +
    result.litterChanges.length +
    result.weighIns.length +
    result.notes.length
  )
}
