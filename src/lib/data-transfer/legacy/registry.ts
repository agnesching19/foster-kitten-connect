import { currentExportParser } from './current-export-parser'
import { legacyTemplateParser } from './legacy-template-parser'
import type { LegacySheet, SpreadsheetParser } from './types'

/** Add future spreadsheet templates here — nothing else needs to change. */
export const spreadsheetParsers: SpreadsheetParser[] = [currentExportParser, legacyTemplateParser]

export function pickParser(sheets: LegacySheet[]): SpreadsheetParser {
  let best = legacyTemplateParser
  let bestScore = -1
  for (const parser of spreadsheetParsers) {
    const score = parser.detect(sheets)
    if (score > bestScore) {
      best = parser
      bestScore = score
    }
  }
  return best
}