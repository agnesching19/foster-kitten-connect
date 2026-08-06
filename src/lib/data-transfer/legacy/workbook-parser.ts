import {
  emptyResult,
  type LegacyParseResult,
  type LegacySheet,
  type SpreadsheetParser,
} from './types'
import { isTicked, normaliseHeader, parseGrams, parseLooseDate, parseLooseTime } from './values'

export type SheetKind = 'momma' | 'kitten-weights' | 'chart' | 'unknown'

const POOP_EMOJI = /💩|🐈‍⬛?💩/u

function hasWord(header: string, ...words: string[]): boolean {
  return words.some((word) => header.includes(word))
}

/** True for a "BKP 💩" kitten-poop column that must never be treated as a weight. */
export function isBackupColumn(rawHeader: string): boolean {
  const header = normaliseHeader(rawHeader)
  return hasWord(header, 'bkp', 'backup', 'back up')
}

function looksLikeMomma(sheet: LegacySheet): boolean {
  return sheet.headers.some((header) => {
    if (POOP_EMOJI.test(header)) return true
    const normalised = normaliseHeader(header)
    return hasWord(
      normalised,
      'food',
      'feed',
      'fed',
      'formula',
      'poop',
      'litter change',
      'litter box',
    )
  })
}

function looksLikeWeights(sheet: LegacySheet): boolean {
  const numericColumns = sheet.headers.filter((header) => {
    if (isBackupColumn(header) || POOP_EMOJI.test(header)) return false
    const samples = sheet.rows
      .map((row) => (row[header] ?? '').trim())
      .filter(Boolean)
      .slice(0, 15)
    if (samples.length < 2) return false
    const numeric = samples.filter((sample) => parseGrams(sample) !== null).length
    return numeric >= Math.ceil(samples.length * 0.6)
  })
  return numericColumns.length >= 1
}

/** Classifies a tab/file by its name first, then by its column shape. */
export function classifySheet(sheet: LegacySheet): SheetKind {
  const name = normaliseHeader(sheet.name.replace(/\.csv$/i, ''))
  if (hasWord(name, 'chart', 'graph')) return 'chart'
  if (hasWord(name, 'weight', 'weigh')) return 'kitten-weights'
  if (hasWord(name, 'momma', 'mumma', 'mamma', 'mama', 'mom', 'mum', 'mother')) return 'momma'
  if (looksLikeMomma(sheet)) return 'momma'
  if (looksLikeWeights(sheet)) return 'kitten-weights'
  return 'unknown'
}

type MommaRole =
  'date' | 'time' | 'feeding' | 'poop' | 'backup-poop' | 'litter-change' | 'notes' | 'ignore'

interface MommaColumn {
  header: string
  role: MommaRole
  /** Time implied by a column header such as "7am" or "Breakfast (6:00)". */
  impliedTime: string | null
  mealNumber: number | null
  /** A shared "Pouch >3" cell contains pouch 4, 5, 6... in entry order. */
  isOverflowMeal: boolean
}

function isOverflowMealHeader(rawHeader: string): boolean {
  return />+\s*3|3\s*\+|(?:more|greater)\s+than\s+3|after\s+3/i.test(rawHeader)
}

function mommaColumns(sheet: LegacySheet): MommaColumn[] {
  let mealCounter = 0
  return sheet.headers.map((rawHeader) => {
    const header = normaliseHeader(rawHeader)
    const impliedTime = parseLooseTime(rawHeader) ?? null
    const base = {
      header: rawHeader,
      impliedTime,
      mealNumber: null as number | null,
      isOverflowMeal: false,
    }

    if (!header && !POOP_EMOJI.test(rawHeader)) return { ...base, role: 'ignore' as MommaRole }
    if (isBackupColumn(rawHeader)) return { ...base, role: 'backup-poop' as MommaRole }
    if (POOP_EMOJI.test(rawHeader)) return { ...base, role: 'poop' as MommaRole }
    if (hasWord(header, 'date', 'day of', 'dato') || header === 'day' || header === 'days')
      return { ...base, role: 'date' as MommaRole }
    if (
      hasWord(header, 'litter change', 'litter box', 'litter tray', 'box change', 'litter changed')
    )
      return { ...base, role: 'litter-change' as MommaRole }
    if (hasWord(header, 'poop', 'poo', 'stool', 'bathroom', 'toilet'))
      return { ...base, role: 'poop' as MommaRole }
    if (hasWord(header, 'note', 'comment', 'observation', 'remark'))
      return { ...base, role: 'notes' as MommaRole }
    if (
      hasWord(
        header,
        'food',
        'feed',
        'fed',
        'formula',
        'meal',
        'breakfast',
        'lunch',
        'dinner',
        'supper',
        'brekkie',
        'ate',
        'pouch',
      ) ||
      impliedTime
    ) {
      mealCounter += 1
      return {
        ...base,
        role: 'feeding' as MommaRole,
        mealNumber: mealCounter,
        isOverflowMeal: isOverflowMealHeader(rawHeader),
      }
    }
    if (hasWord(header, 'time', 'clock', 'when')) return { ...base, role: 'time' as MommaRole }
    return { ...base, role: 'ignore' as MommaRole }
  })
}

/** Splits "6:30 wet; 10:00 dry" into individual entries. */
function splitEntries(value: string): string[] {
  return value
    .split(/[;\n|]+/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function stripLeadingTime(value: string): string {
  return value.replace(/^\d{1,2}([:.]\d{2})?\s*(am|pm)?\s*[-–—:]?\s*/i, '').trim()
}

function normalisePoopNote(value: string): string {
  return value
    .replace(/[()]/g, '')
    .replace(/\bx\s+(\d+)/gi, 'x$1')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function parseKittenPoopEntry(entry: string): {
  time: string | null
  note: string | null
  kittenName: string | null
} {
  const timeText = entry.match(/\b\d{1,2}[:.]\d{2}(?=\D|$)/)?.[0] ?? null
  const time = timeText ? parseLooseTime(timeText) : null
  const beforeTime = timeText ? entry.slice(0, entry.indexOf(timeText)).trim() : ''
  const kittenName = beforeTime && !/^\?+$/.test(beforeTime) ? beforeTime : null
  const note = normalisePoopNote(
    entry
      .replace(timeText ?? '', '')
      .replace(kittenName ?? '', '')
      .replace(/^\s*[?:;–—-]+\s*|\s*[;,–—-]+\s*$/g, '')
      .replace(/^ish$/i, ''),
  )

  return { time, note: note || null, kittenName }
}

function parseMommaSheet(sheet: LegacySheet, result: LegacyParseResult) {
  const columns = mommaColumns(sheet)
  for (const column of columns) {
    if (!result.columnRoles.some((entry) => entry.header === column.header)) {
      result.columnRoles.push({
        header: column.header,
        role: column.role === 'backup-poop' ? 'kitten poop' : column.role,
      })
    }
  }

  const dateColumn = columns.find((column) => column.role === 'date')
  const timeColumn = columns.find((column) => column.role === 'time')
  const notesColumns = columns.filter((column) => column.role === 'notes')
  const feedingColumns = columns.filter((column) => column.role === 'feeding')
  const poopColumns = columns.filter((column) => column.role === 'poop')
  const kittenPoopColumns = columns.filter((column) => column.role === 'backup-poop')
  const changeColumns = columns.filter((column) => column.role === 'litter-change')

  if (!dateColumn) {
    result.skipped.push({ sheet: sheet.name, row: 1, reason: 'No date column found' })
    return
  }

  let lastDate: string | null = null

  sheet.rows.forEach((row, index) => {
    const rowNumber = index + 2
    const cell = (column?: MommaColumn) => (column ? (row[column.header] ?? '').trim() : '')
    const filled = Object.values(row).some((value) => (value ?? '').trim() !== '')
    if (!filled) return

    const parsedDate = parseLooseDate(cell(dateColumn))
    const date = parsedDate ?? lastDate
    if (!date) {
      // Only report rows that actually carried data we could not place.
      result.skipped.push({
        sheet: sheet.name,
        row: rowNumber,
        reason: cell(dateColumn) ? 'Unreadable date' : 'Empty date',
      })
      return
    }
    lastDate = date

    const rowTime = parseLooseTime(cell(timeColumn))
    const notes =
      notesColumns
        .map((column) => cell(column))
        .filter(Boolean)
        .join(' — ') || null

    for (const column of feedingColumns) {
      const value = cell(column)
      if (!value) continue
      for (const [entryIndex, entry] of splitEntries(value).entries()) {
        const entryTime = parseLooseTime(entry)
        const food = stripLeadingTime(entry) || (isTicked(entry) ? 'Fed' : entry)
        result.feedings.push({
          date,
          time: entryTime ?? column.impliedTime ?? rowTime ?? '12:00:00',
          food: food || 'Fed',
          meal_number: column.isOverflowMeal ? 4 + entryIndex : column.mealNumber,
          notes: null,
        })
      }
    }

    for (const column of poopColumns) {
      const value = cell(column)
      if (!value) continue
      for (const entry of splitEntries(value)) {
        if (/^n(o|one)?$/i.test(entry)) continue
        const entryTime = parseLooseTime(entry)
        const note = normalisePoopNote(stripLeadingTime(entry))
        result.poops.push({
          date,
          time: entryTime ?? column.impliedTime ?? rowTime ?? '12:00:00',
          note: note && !isTicked(note) ? note : null,
          kittenName: null,
          subjectType: 'mother',
        })
      }
    }

    for (const column of kittenPoopColumns) {
      const value = cell(column)
      if (!value) continue
      for (const entry of splitEntries(value)) {
        if (/^n(o|one)?$/i.test(entry)) continue
        const parsed = parseKittenPoopEntry(entry)
        result.poops.push({
          date,
          time: parsed.time ?? column.impliedTime ?? rowTime ?? '12:00:00',
          note: parsed.note,
          kittenName: parsed.kittenName,
          subjectType: 'kitten',
        })
      }
    }

    for (const column of changeColumns) {
      const value = cell(column)
      if (!value) continue
      for (const entry of splitEntries(value)) {
        if (/^n(o|one)?$/i.test(entry)) continue
        result.litterChanges.push({
          date,
          time: parseLooseTime(entry) ?? column.impliedTime ?? rowTime ?? '12:00:00',
          notes: stripLeadingTime(entry) || null,
        })
      }
    }

    if (notes) result.notes.push({ date, note: notes })
  })
}

function parseWeightsSheet(
  sheet: LegacySheet,
  result: LegacyParseResult,
  kittenNames: Set<string>,
) {
  const dateHeader =
    sheet.headers.find((header) => {
      const normalised = normaliseHeader(header)
      return hasWord(normalised, 'date', 'day of') || normalised === 'day'
    }) ??
    sheet.headers.find((header) =>
      sheet.rows.some((row) => parseLooseDate(row[header] ?? '') !== null),
    )

  if (!dateHeader) {
    result.skipped.push({ sheet: sheet.name, row: 1, reason: 'No date column found' })
    return
  }

  const notesHeaders = sheet.headers.filter((header) =>
    hasWord(normaliseHeader(header), 'note', 'comment', 'observation'),
  )
  const timeHeader = sheet.headers.find((header) => hasWord(normaliseHeader(header), 'time'))

  const kittenHeaders = sheet.headers.filter((header) => {
    if (header === dateHeader || header === timeHeader) return false
    if (notesHeaders.includes(header)) return false
    if (isBackupColumn(header) || POOP_EMOJI.test(header)) return false
    const normalised = normaliseHeader(header)
    if (!normalised) return false
    if (
      hasWord(normalised, 'day', 'age', 'total', 'average', 'avg', 'sum', 'diff', 'gain', 'change')
    )
      return false
    return sheet.rows.some((row) => parseGrams(row[header] ?? '') !== null)
  })

  for (const header of sheet.headers) {
    if (result.columnRoles.some((entry) => entry.header === header)) continue
    const role = kittenHeaders.includes(header)
      ? `kitten weight — ${cleanKittenName(header)}`
      : header === dateHeader
        ? 'date'
        : header === timeHeader
          ? 'time'
          : notesHeaders.includes(header)
            ? 'notes'
            : isBackupColumn(header)
              ? 'kitten poop'
              : 'ignore'
    result.columnRoles.push({ header, role })
  }

  let lastDate: string | null = null

  sheet.rows.forEach((row, index) => {
    const rowNumber = index + 2
    const filled = Object.values(row).some((value) => (value ?? '').trim() !== '')
    if (!filled) return

    const weights = kittenHeaders
      .map((header) => ({ name: cleanKittenName(header), grams: parseGrams(row[header] ?? '') }))
      .filter((entry): entry is { name: string; grams: number } => entry.grams !== null)

    const parsedDate = parseLooseDate((row[dateHeader] ?? '').trim())
    const date = parsedDate ?? lastDate
    if (!date) {
      if (weights.length) {
        result.skipped.push({
          sheet: sheet.name,
          row: rowNumber,
          reason: (row[dateHeader] ?? '').trim() ? 'Unreadable date' : 'Empty date',
        })
      }
      return
    }
    lastDate = date
    if (!weights.length) return

    for (const weight of weights) kittenNames.add(weight.name)
    const notes = notesHeaders
      .map((header) => (row[header] ?? '').trim())
      .filter(Boolean)
      .join(' — ')

    result.weighIns.push({
      date,
      time: parseLooseTime(timeHeader ? (row[timeHeader] ?? '') : '') ?? '12:00:00',
      notes: notes || null,
      weights: weights.map((entry) => ({ kittenName: entry.name, grams: entry.grams })),
    })
  })
}

function cleanKittenName(header: string): string {
  return (
    header
      .replace(/\((?:g|grams?|kg|weight)\)/gi, '')
      .replace(/\b(weight|weigh|grams?|wt)\b/gi, '')
      .replace(/[-–—:]+$/, '')
      .trim() || header.trim()
  )
}

/**
 * Parser for the historical "Kitty Tracker" workbook: a Momma tab with
 * one row per day (feedings, 💩, litter changes, notes), a Kitten weights tab
 * with one column per kitten, and a Chart tab that is ignored.
 */
export const workbookParser: SpreadsheetParser = {
  id: 'legacy-foster-workbook',
  label: 'Kitty Tracker workbook (Momma + Kitten weights)',
  description:
    'Multi-sheet historical workbooks. The Momma tab supplies feedings, 💩 entries, litter changes and notes; the Kitten weights tab supplies weigh-in sessions. Chart and unknown tabs are ignored.',
  detect: (sheets) => {
    const kinds = sheets.map(classifySheet)
    const momma = kinds.filter((kind) => kind === 'momma').length
    const weights = kinds.filter((kind) => kind === 'kitten-weights').length
    if (momma && weights) return 0.98
    if (momma || weights) return 0.9
    return 0
  },
  parse: (sheets) => {
    const result = emptyResult(workbookParser.id, workbookParser.label)
    const kittenNames = new Set<string>()

    for (const sheet of sheets) {
      const kind = classifySheet(sheet)
      if (kind === 'chart' || kind === 'unknown') {
        result.ignoredSheets.push(`${sheet.name} (${kind === 'chart' ? 'chart' : 'unrecognised'})`)
        continue
      }
      result.sheetsSeen.push(`${sheet.name} → ${kind === 'momma' ? 'Momma' : 'Kitten weights'}`)
      if (kind === 'momma') parseMommaSheet(sheet, result)
      else parseWeightsSheet(sheet, result, kittenNames)
    }

    result.kittenNames = [...kittenNames]
    return result
  },
}
