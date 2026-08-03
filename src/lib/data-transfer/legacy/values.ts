/** Loose value parsing helpers shared by every spreadsheet parser. */

export function normaliseHeader(header: string): string {
  return header
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const MONTHS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
]

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** Accepts YYYY-MM-DD, DD/MM/YYYY, MM/DD/YY, "12 Mar 2024", "Mar 12" etc. */
export function parseLooseDate(raw: string, fallbackYear = new Date().getFullYear()): string | null {
  const value = raw.trim()
  if (!value) return null

  const iso = value.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/)
  if (iso) return `${iso[1]}-${pad(Number(iso[2]))}-${pad(Number(iso[3]))}`

  const slash = value.match(/^(\d{1,2})[-/.](\d{1,2})(?:[-/.](\d{2,4}))?/)
  if (slash) {
    let a = Number(slash[1])
    let b = Number(slash[2])
    // Day-first unless impossible (US-style sheets).
    if (a > 12 && b <= 12) {
      // already day/month
    } else if (b > 12 && a <= 12) {
      const swap = a
      a = b
      b = swap
    }
    if (a < 1 || a > 31 || b < 1 || b > 12) return null
    let year = slash[3] ? Number(slash[3]) : fallbackYear
    if (year < 100) year += year > 70 ? 1900 : 2000
    return `${year}-${pad(b)}-${pad(a)}`
  }

  const textual = value
    .toLowerCase()
    .replace(/(\d+)(st|nd|rd|th)/g, '$1')
    .match(/(?:(\d{1,2})\s+)?([a-z]{3,})\.?(?:\s+(\d{1,2}))?(?:[,\s]+(\d{2,4}))?/)
  if (textual) {
    const monthIndex = MONTHS.indexOf((textual[2] ?? '').slice(0, 3))
    if (monthIndex >= 0) {
      const day = Number(textual[1] ?? textual[3] ?? NaN)
      if (Number.isInteger(day) && day >= 1 && day <= 31) {
        let year = textual[4] ? Number(textual[4]) : fallbackYear
        if (year < 100) year += 2000
        return `${year}-${pad(monthIndex + 1)}-${pad(day)}`
      }
    }
  }

  return null
}

/** Accepts 7:05, 07:05:00, "7.05", "7am", "7:05 PM". */
export function parseLooseTime(raw: string): string | null {
  const value = raw.trim().toLowerCase()
  if (!value) return null
  const match = value.match(/^(\d{1,2})(?:[:.h](\d{2}))?(?::(\d{2}))?\s*(am|pm)?/)
  if (!match) return null
  let hours = Number(match[1])
  const minutes = Number(match[2] ?? '0')
  if (!Number.isInteger(hours) || hours > 23 || minutes > 59) return null
  if (match[4] === 'pm' && hours < 12) hours += 12
  if (match[4] === 'am' && hours === 12) hours = 0
  return `${pad(hours)}:${pad(minutes)}:00`
}

const TRUTHY = new Set([
  'x',
  'xx',
  'y',
  'yes',
  'yep',
  'yeah',
  'true',
  '1',
  'done',
  'ok',
  'poop',
  'pooped',
  'changed',
  'change',
  '✓',
  '✔',
  'check',
])

/** True when a tick-style cell should count as an event. */
export function isTicked(raw: string): boolean {
  const value = raw.trim().toLowerCase()
  if (!value) return false
  if (TRUTHY.has(value)) return true
  if (parseLooseTime(value)) return true
  return false
}

/** Weight cells: "112", "112g", "0.112 kg", "4 oz", "3.9". */
export function parseGrams(raw: string): number | null {
  const value = raw.trim().toLowerCase().replace(/,/g, '')
  if (!value) return null
  const match = value.match(/(-?\d+(?:\.\d+)?)\s*(g|gram|grams|kg|kilograms?|oz|ounces?|lb|lbs)?/)
  if (!match) return null
  const amount = Number(match[1])
  if (!Number.isFinite(amount) || amount <= 0) return null
  const unit = match[2] ?? ''
  let grams = amount
  if (unit.startsWith('kg') || unit.startsWith('kilo')) grams = amount * 1000
  else if (unit.startsWith('oz') || unit.startsWith('ounce')) grams = amount * 28.3495
  else if (unit.startsWith('lb')) grams = amount * 453.592
  else if (!unit && amount > 0 && amount < 10) grams = amount * 1000 // bare kg value
  const rounded = Math.round(grams)
  return rounded > 0 && rounded < 20_000 ? rounded : null
}