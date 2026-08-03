import type { ImportPreview } from './import'

/**
 * Adapter contract for spreadsheet templates. Additional templates (other
 * rescues' layouts, Excel exports, …) can be registered here later without
 * touching the Settings UI.
 */
export interface SheetTemplateAdapter {
  id: string
  label: string
  description: string
  /** True when this adapter recognises the sheet at the given URL. */
  matches: (url: string) => boolean
  /** Fetches + parses the sheet into the same preview shape as CSV import. */
  buildPreview: (url: string) => Promise<ImportPreview>
}

export class SheetTemplateNotReadyError extends Error {}

export const fosterTrackerTemplate: SheetTemplateAdapter = {
  id: 'foster-tracker-v1',
  label: 'Foster Kitten Tracker template',
  description:
    'Tabs: Litters, Kittens, Feedings, Poops, Litter changes, Weigh-ins, Weights, Notes.',
  matches: (url) => /docs\.google\.com\/spreadsheets\//.test(url),
  buildPreview: async () => {
    throw new SheetTemplateNotReadyError(
      'Google Sheets parsing is not enabled yet. Export your sheet tabs as CSV and use “Import CSV” for now.',
    )
  },
}

export const sheetTemplates: SheetTemplateAdapter[] = [fosterTrackerTemplate]

export function validateSheetUrl(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return 'Paste a Google Sheets link first.'
  if (!/^https:\/\/docs\.google\.com\/spreadsheets\/d\/[\w-]+/.test(trimmed)) {
    return 'That does not look like a Google Sheets link (https://docs.google.com/spreadsheets/d/…).'
  }
  return null
}

export function findTemplate(url: string): SheetTemplateAdapter | undefined {
  return sheetTemplates.find((template) => template.matches(url.trim()))
}