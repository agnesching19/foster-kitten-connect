export type CsvRow = Record<string, string>

export function parseCsv(text: string): { headers: string[]; rows: CsvRow[] } {
  const clean = text.replace(/^\uFEFF/, '')
  const table: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < clean.length; i += 1) {
    const char = clean[i]
    if (inQuotes) {
      if (char === '"') {
        if (clean[i + 1] === '"') {
          field += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }
    if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && clean[i + 1] === '\n') i += 1
      row.push(field)
      field = ''
      table.push(row)
      row = []
    } else {
      field += char
    }
  }
  if (field.length || row.length) {
    row.push(field)
    table.push(row)
  }

  const nonEmpty = table.filter((line) => line.some((cell) => cell.trim() !== ''))
  const headerLine = nonEmpty.shift()
  if (!headerLine) return { headers: [], rows: [] }
  const headers = headerLine.map((header) => header.trim())

  const rows = nonEmpty.map((line) => {
    const record: CsvRow = {}
    headers.forEach((header, index) => {
      record[header] = (line[index] ?? '').trim()
    })
    return record
  })

  return { headers, rows }
}

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  const text = Array.isArray(value) ? JSON.stringify(value) : String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map((header) => escapeCell(row[header])).join(','))
  }
  return `${lines.join('\n')}\n`
}
