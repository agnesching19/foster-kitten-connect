import { emptyResult, type LegacySheet, type SpreadsheetParser } from './types'
import { isTicked, normaliseHeader, parseGrams, parseLooseDate, parseLooseTime } from './values'

type Role =
  | 'date'
  | 'time'
  | 'food'
  | 'meal'
  | 'poop'
  | 'poop-kitten'
  | 'litter-change'
  | 'weight'
  | 'notes'
  | 'unknown'

interface Column {
  header: string
  role: Role
  /** For weight columns: the kitten name taken from the header. */
  kittenName?: string
}

function has(header: string, ...words: string[]): boolean {
  return words.some((word) => header.includes(word))
}

function classify(rawHeader: string, samples: string[]): Column {
  const header = normaliseHeader(rawHeader)
  if (!header) return { header: rawHeader, role: 'unknown' }

  if (has(header, 'date', 'day of', 'dato')) return { header: rawHeader, role: 'date' }
  if (header === 'day' || header === 'days') return { header: rawHeader, role: 'date' }
  if (has(header, 'time', 'clock', 'when') && !has(header, 'times fed'))
    return { header: rawHeader, role: 'time' }
  if (has(header, 'food', 'formula', 'fed', 'feed', 'meal type', 'amount eaten', 'ate'))
    return { header: rawHeader, role: 'food' }
  if (has(header, 'meal number', 'meal no', 'meal', 'pouch', 'feeding number', 'times fed'))
    return { header: rawHeader, role: 'meal' }
  if (has(header, 'litter change', 'litter box', 'litter tray', 'box change', 'litter changed'))
    return { header: rawHeader, role: 'litter-change' }
  if (has(header, 'poop kitten', 'poop who', 'who pooped', 'pooper'))
    return { header: rawHeader, role: 'poop-kitten' }
  if (has(header, 'poop', 'poo', 'stool', 'bathroom', 'toilet', 'bm'))
    return { header: rawHeader, role: 'poop' }
  if (has(header, 'note', 'comment', 'observation', 'remark'))
    return { header: rawHeader, role: 'notes' }

  const weightMatch = rawHeader.match(/^(.*?)[\s(]*(weight|weigh|grams?|g|kg|wt)\)?$/i)
  if (has(header, 'weight', 'weigh', 'grams', 'gram') || weightMatch) {
    const name = (weightMatch?.[1] ?? '')
      .trim()
      .replace(/[-–—:]+$/, '')
      .trim()
    return {
      header: rawHeader,
      role: 'weight',
      kittenName: name || rawHeader.trim(),
    }
  }

  // Unlabelled column full of numeric values that look like weights -> kitten weight column.
  const numeric = samples.filter((sample) => parseGrams(sample) !== null).length
  if (samples.length >= 2 && numeric >= Math.ceil(samples.length * 0.6)) {
    return { header: rawHeader, role: 'weight', kittenName: rawHeader.trim() }
  }

  return { header: rawHeader, role: 'unknown' }
}

function detectColumns(sheet: LegacySheet): Column[] {
  return sheet.headers.map((header) => {
    const samples = sheet.rows
      .map((row) => (row[header] ?? '').trim())
      .filter(Boolean)
      .slice(0, 12)
    return classify(header, samples)
  })
}

function first(columns: Column[], role: Role): Column | undefined {
  return columns.find((column) => column.role === role)
}

/**
 * Parser for the historical "Kitty Tracker" Google Sheets layout:
 * one row per event/day with loosely named columns.
 */
export const legacyTemplateParser: SpreadsheetParser = {
  id: 'legacy-foster-tracker',
  label: 'Legacy Kitty Tracker spreadsheet',
  description:
    'Row-per-entry sheets with columns such as Date, Time, Food, Poop, Litter change, Weight and Notes — column names and order are detected automatically.',
  detect: (sheets) => {
    let score = 0
    for (const sheet of sheets) {
      const columns = detectColumns(sheet)
      const known = columns.filter((column) => column.role !== 'unknown').length
      if (first(columns, 'date') && known >= 2) score = Math.max(score, 0.8)
      else if (known >= 2) score = Math.max(score, 0.4)
    }
    return score
  },
  parse: (sheets) => {
    const result = emptyResult(legacyTemplateParser.id, legacyTemplateParser.label)
    const kittenNames = new Set<string>()

    for (const sheet of sheets) {
      result.sheetsSeen.push(sheet.name)
      const columns = detectColumns(sheet)
      for (const column of columns) {
        if (!result.columnRoles.some((entry) => entry.header === column.header)) {
          result.columnRoles.push({
            header: column.header,
            role: column.role === 'weight' ? `weight — ${column.kittenName}` : column.role,
          })
        }
      }

      const dateColumn = first(columns, 'date')
      const timeColumn = first(columns, 'time')
      const foodColumn = first(columns, 'food')
      const mealColumn = first(columns, 'meal')
      const poopColumn = first(columns, 'poop')
      const poopKittenColumn = first(columns, 'poop-kitten')
      const changeColumn = first(columns, 'litter-change')
      const notesColumn = first(columns, 'notes')
      const weightColumns = columns.filter((column) => column.role === 'weight')

      if (!dateColumn) {
        result.skipped.push({ sheet: sheet.name, row: 1, reason: 'No date column found' })
        continue
      }

      let lastDate: string | null = null

      sheet.rows.forEach((row, index) => {
        const rowNumber = index + 2
        const cell = (column?: Column) => (column ? (row[column.header] ?? '').trim() : '')
        const nonEmpty = Object.values(row).some((value) => (value ?? '').trim() !== '')
        if (!nonEmpty) return

        const parsedDate = parseLooseDate(cell(dateColumn))
        const date = parsedDate ?? lastDate
        if (!date) {
          result.skipped.push({
            sheet: sheet.name,
            row: rowNumber,
            reason: cell(dateColumn) ? 'Unreadable date' : 'Empty date',
          })
          return
        }
        lastDate = date

        const time = parseLooseTime(cell(timeColumn)) ?? '12:00:00'
        const notes = cell(notesColumn) || null
        let matched = false

        const food = cell(foodColumn)
        const mealRaw = cell(mealColumn)
        if (food || mealRaw) {
          const meal = Number(mealRaw.replace(/[^\d]/g, ''))
          result.feedings.push({
            date,
            time,
            food: !food || isTicked(food) ? 'Fed' : food,
            meal_number: Number.isInteger(meal) && meal > 0 ? meal : null,
            notes,
          })
          matched = true
        }

        const poop = cell(poopColumn)
        if (isTicked(poop) || (poop && !/^n(o)?$/i.test(poop))) {
          const kittenName = cell(poopKittenColumn) || null
          if (kittenName) kittenNames.add(kittenName)
          result.poops.push({
            date,
            time: parseLooseTime(poop) ?? time,
            note: /^[a-z\s]{4,}$/i.test(poop) && !isTicked(poop) ? poop : notes,
            kittenName,
            subjectType: 'kitten',
          })
          matched = true
        }

        const change = cell(changeColumn)
        if (isTicked(change)) {
          result.litterChanges.push({
            date,
            time: parseLooseTime(change) ?? time,
            notes,
          })
          matched = true
        }

        const weights = weightColumns
          .map((column) => ({ column, grams: parseGrams(cell(column)) }))
          .filter((entry): entry is { column: Column; grams: number } => entry.grams !== null)
        if (weights.length) {
          for (const entry of weights) kittenNames.add(entry.column.kittenName!)
          result.weighIns.push({
            date,
            time,
            notes,
            weights: weights.map((entry) => ({
              kittenName: entry.column.kittenName!,
              grams: entry.grams,
            })),
          })
          matched = true
        }

        if (notes && !matched) {
          result.notes.push({ date, note: notes })
          matched = true
        }

        if (!matched) {
          result.skipped.push({ sheet: sheet.name, row: rowNumber, reason: 'No recognised values' })
        }
      })
    }

    result.kittenNames = [...kittenNames]
    return result
  },
}
