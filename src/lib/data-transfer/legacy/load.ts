import JSZip from 'jszip'
import { parseCsv } from '../csv'
import type { LegacySheet } from './types'

function toSheet(name: string, text: string): LegacySheet | null {
  if (!text.trim()) return null
  const { headers, rows } = parseCsv(text)
  if (!headers.length) return null
  return { name, headers, rows }
}

export async function sheetsFromFiles(files: File[]): Promise<LegacySheet[]> {
  const sheets: LegacySheet[] = []
  for (const file of files) {
    const lower = file.name.toLowerCase()
    if (lower.endsWith('.zip')) {
      const zip = await JSZip.loadAsync(file)
      for (const entry of Object.values(zip.files)) {
        const name = entry.name.split('/').pop() ?? entry.name
        if (entry.dir || !name.toLowerCase().endsWith('.csv')) continue
        const sheet = toSheet(name, await entry.async('string'))
        if (sheet) sheets.push(sheet)
      }
    } else {
      const sheet = toSheet(file.name, await file.text())
      if (sheet) sheets.push(sheet)
    }
  }
  if (!sheets.length) throw new Error('No readable CSV content was found in those files.')
  return sheets
}

/** Fetches a public Google Sheet tab as CSV (the sheet must be link-viewable). */
export async function sheetsFromGoogleUrl(url: string): Promise<LegacySheet[]> {
  const trimmed = url.trim()
  const id = trimmed.match(/\/spreadsheets\/d\/([\w-]+)/)?.[1]
  if (!id) throw new Error('That does not look like a Google Sheets link.')
  const gid = trimmed.match(/[#&?]gid=(\d+)/)?.[1]
  const exportUrl =
    `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv` +
    (gid ? `&gid=${gid}` : '')

  let response: Response
  try {
    response = await fetch(exportUrl)
  } catch {
    throw new Error(
      'Could not reach that spreadsheet. Make sure sharing is set to "Anyone with the link", or download the tab as CSV and upload it here.',
    )
  }
  if (!response.ok) {
    throw new Error(
      `Google returned ${response.status}. Set sharing to "Anyone with the link", or upload the tab as a CSV instead.`,
    )
  }
  const text = await response.text()
  const sheet = toSheet(gid ? `Google Sheet (gid ${gid})` : 'Google Sheet', text)
  if (!sheet) throw new Error('That sheet tab appears to be empty.')
  return [sheet]
}