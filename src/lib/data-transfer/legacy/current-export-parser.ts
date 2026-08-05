import { specByFile } from '../tables'
import { emptyResult, type SpreadsheetParser } from './types'
import { parseLooseDate, parseLooseTime } from './values'

/**
 * Recognises CSVs produced by this app's own export. Present so the legacy
 * importer can tell the user to use the (untouched) "Import CSV" card instead.
 */
export const currentExportParser: SpreadsheetParser = {
  id: 'current-export',
  label: 'Foster Tracker export (this app)',
  description:
    'CSV/ZIP bundles exported by this app. These are handled by the "Import CSV" card, which preserves IDs and relationships.',
  detect: (sheets) =>
    sheets.some(
      (sheet) =>
        specByFile.has(sheet.name.toLowerCase()) &&
        sheet.headers.includes('id') &&
        (sheet.headers.includes('litter_id') || sheet.headers.includes('mother_name')),
    )
      ? 1
      : 0,
  parse: (sheets) => {
    const result = emptyResult(currentExportParser.id, currentExportParser.label)
    for (const sheet of sheets) {
      result.sheetsSeen.push(sheet.name)
      const spec = specByFile.get(sheet.name.toLowerCase())
      if (!spec) continue
      sheet.rows.forEach((row, index) => {
        const date = parseLooseDate(row['date'] ?? '')
        if (!date) {
          result.skipped.push({ sheet: sheet.name, row: index + 2, reason: 'Empty date' })
          return
        }
        const time = parseLooseTime(row['time'] ?? '') ?? '12:00:00'
        if (spec.table === 'feedings') {
          result.feedings.push({
            date,
            time,
            food: row['food'] || 'Fed',
            meal_number: Number(row['meal_number']) || null,
            notes: row['notes'] || null,
          })
        } else if (spec.table === 'poop_entries') {
          result.poops.push({
            date,
            time,
            note: row['note'] || null,
            kittenName: null,
            subjectType: row['subject_type'] === 'mother' ? 'mother' : 'kitten',
          })
        } else if (spec.table === 'litter_changes') {
          result.litterChanges.push({ date, time, notes: row['notes'] || null })
        } else if (spec.table === 'daily_notes' && row['note']) {
          result.notes.push({ date, note: row['note'] })
        }
      })
    }
    return result
  },
}
