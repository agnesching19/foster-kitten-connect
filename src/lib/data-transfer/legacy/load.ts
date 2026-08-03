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

const TAB_CANDIDATES = [
  'Momma',
  'Mumma',
  'Mamma',
  'Mama',
  'Mom',
  'Mum',
  'Mother',
  'Kitten weights',
  'Kitten Weights',
  'Kitten weight',
  'Kittens weights',
  'Weights',
  'Weight',
]

function gvizUrl(id: string, params: string): string {
  return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&${params}`
}

async function fetchCsv(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    return await response.text()
  } catch {
    return null
  }
}

/**
 * Reads a public Google Sheets workbook. Every known tab name is requested plus
 * the default tab (or an explicit #gid=…), so multi-sheet workbooks import in
 * one go. The workbook must be shared as "Anyone with the link".
 */
export async function sheetsFromGoogleUrl(url: string): Promise<LegacySheet[]> {
  const trimmed = url.trim()
  const id = trimmed.match(/\/spreadsheets\/d\/([\w-]+)/)?.[1]
  if (!id) throw new Error('That does not look like a Google Sheets link.')
  const gid = trimmed.match(/[#&?]gid=(\d+)/)?.[1]

  const sheets: LegacySheet[] = []
  const seen = new Set<string>()
  let reachable = false

  const add = (name: string, text: string | null) => {
    if (text === null) return
    reachable = true
    const fingerprint = text.slice(0, 400)
    if (seen.has(fingerprint)) return
    seen.add(fingerprint)
    const sheet = toSheet(name, text)
    if (sheet) sheets.push(sheet)
  }

  // Default tab (or the explicitly linked one).
  add(gid ? `Google Sheet (gid ${gid})` : 'Google Sheet', await fetchCsv(gvizUrl(id, gid ? `gid=${gid}` : 'gid=0')))

  if (!gid) {
    const results = await Promise.all(
      TAB_CANDIDATES.map(async (name) => ({
        name,
        text: await fetchCsv(gvizUrl(id, `sheet=${encodeURIComponent(name)}`)),
      })),
    )
    for (const entry of results) add(entry.name, entry.text)
  }

  if (!sheets.length) {
    throw new Error(
      reachable
        ? 'That workbook was reachable but no readable tabs were found. Download the tabs as CSV and upload them here instead.'
        : 'Could not read that workbook. Set sharing to "Anyone with the link", or download the tabs as CSV and upload them here.',
    )
  }
  return sheets
}
