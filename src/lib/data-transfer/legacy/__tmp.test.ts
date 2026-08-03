import { expect, test } from 'vitest'
import { workbookParser, classifySheet } from '@/lib/data-transfer/legacy/workbook-parser'
import { parseLooseDate } from '@/lib/data-transfer/legacy/values'

test('dates', () => {
  expect(parseLooseDate('Fri, 19 June 2026')).toBe('2026-06-19')
  expect(parseLooseDate('Sat, 20 June 2026')).toBe('2026-06-20')
})

test('workbook', () => {
  const momma = {
    name: 'Amber + SEVEN - Momma.csv',
    headers: ['Date', 'Food', '💩', 'BKP 💩', 'Litter change', 'Notes'],
    rows: [
      { Date: 'Fri, 19 June 2026', Food: '7:00 wet; 13:00 dry', '💩': '8:00; 20:00', 'BKP 💩': '400', 'Litter change': 'x', Notes: 'settled in' },
      { Date: '', Food: '', '💩': '', 'BKP 💩': '', 'Litter change': '', Notes: '' },
      { Date: 'Sat, 20 June 2026', Food: 'x', '💩': '', 'BKP 💩': '410', 'Litter change': '', Notes: '' },
    ],
  }
  const weights = {
    name: 'Amber + SEVEN - Kitten weights.csv',
    headers: ['Date', 'Bo', 'Pip', 'Notes'],
    rows: [
      { Date: 'Fri, 19 June 2026', Bo: '112', Pip: '120', Notes: '' },
      { Date: 'Sat, 20 June 2026', Bo: '125', Pip: '131', Notes: 'good' },
    ],
  }
  const chart = { name: 'Amber + SEVEN - Chart.csv', headers: ['Date', 'Bo'], rows: [{ Date: 'x', Bo: '1' }] }
  expect(classifySheet(chart)).toBe('chart')
  const r = workbookParser.parse([momma, weights, chart])
  expect(r.feedings.length).toBe(3)
  expect(r.poops.length).toBe(2)
  expect(r.litterChanges.length).toBe(1)
  expect(r.weighIns.length).toBe(2)
  expect(r.notes.length).toBe(1)
  expect(r.kittenNames.sort()).toEqual(['Bo', 'Pip'])
  expect(r.skipped.length).toBe(0)
  expect(r.ignoredSheets.length).toBe(1)
})
