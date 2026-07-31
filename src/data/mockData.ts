import type {
  DailyFeedings,
  DailyNote,
  DailyPoops,
  Kitten,
  LitterChange,
  WeighIn,
  FosterBatch,
} from '@/types/foster'

export const fosterBatches: FosterBatch[] = [
  {
    id: 'amber-seven',
    mommaName: 'Amber',
    arrived: '2026-06-19',
    kittens: ['Blue', 'Red', 'Pink', 'Purple', 'White', 'Green', 'Runt'],
    recordLabel: 'Amber + SEVEN',
    albumUrl: 'https://photos.app.goo.gl/8gfYPp2mPAjgsDhV8',
    status: 'active',
  },
  {
    id: 'tilly-burritos',
    mommaName: 'Tilly',
    arrived: '2026-02-13',
    left: '2026-05-13',
    kittens: ['Carlita', 'Olito'],
    recordLabel: 'Tilly + burritos',
    albumUrl: 'https://photos.app.goo.gl/xJsKbHN3UXnu2BcJ9',
    status: 'completed',
  },
  {
    id: 'trixie',
    mommaName: 'Trixie',
    arrived: '2026-01-28',
    left: '2026-02-13',
    kittens: [],
    recordLabel: 'Trixie 貓貓',
    albumUrl: 'https://photos.app.goo.gl/bupes8YihebNJ8hA6',
    status: 'completed',
  },
  {
    id: 'mimi-minis',
    mommaName: 'Mimi',
    arrived: '2025-09-20',
    left: '2025-10-10',
    kittens: ['Amy', 'Barlow', 'Charlie', 'Del'],
    recordLabel: 'Mimi + mini Mimis',
    albumUrl: 'https://photos.app.goo.gl/m3YFG1NPnfi2FxH6',
    status: 'completed',
  },
  {
    id: 'kylo-four',
    mommaName: 'Kylo',
    arrived: '2025-08-07',
    left: '2025-08-27',
    kittens: ['Rufus', 'Nori', 'Michael', 'William'],
    recordLabel: 'Kylo + 4',
    albumUrl: 'https://photos.app.goo.gl/FfoFXtLo8tXYmNuR8',
    status: 'completed',
  },
  {
    id: 'ninja-four',
    mommaName: 'Ninja',
    arrived: '2025-06-17',
    left: '2025-07-29',
    kittens: ['Coffee', 'Coke', 'Cola', 'Milkshake'],
    recordLabel: 'Ninja and kittens',
    albumUrl: 'https://photos.app.goo.gl/F56Y4gGqpsfhtvTs7',
    status: 'completed',
  },
  {
    id: 'squeak-three',
    mommaName: 'Squeak',
    arrived: '2025-02-04',
    left: '2025-03-30',
    kittens: ['Bubble', 'Marble', 'Oreo'],
    recordLabel: 'Photo of paper record',
    albumUrl: 'https://photos.app.goo.gl/D91sjg2BPxK1WRu5',
    status: 'completed',
  },
]

export const mommaName = 'Amber'

export const litterName = 'Seven'

export const kittens: Kitten[] = [
  { id: 'k1', name: 'Pink', color: 'pink', coat: 'ginger' },
  { id: 'k2', name: 'Red', color: 'red', coat: 'ginger' },
  { id: 'k3', name: 'Purple', color: 'purple', coat: 'ginger' },
  { id: 'k4', name: 'Blue', color: 'blue', coat: 'ginger' },
  { id: 'k5', name: 'Green', color: 'green', coat: 'white' },
  { id: 'k6', name: 'Yellow', color: 'yellow', coat: 'white' },
  { id: 'k7', name: 'Rosti', color: 'orange', coat: 'white' },
]

export const recentFeedings: DailyFeedings[] = [
  {
    date: '2026-07-31',
    feedings: [
      { id: 'f1', time: '07:00', food: 'beef', pouch: 1 },
      { id: 'f2', time: '13:05', food: 'tin chicken', pouch: 2 },
      { id: 'f3', time: '19:50', food: 'beef', pouch: 3 },
    ],
  },
  {
    date: '2026-07-30',
    feedings: [
      { id: 'f4', time: '07:15', food: 'chicken', pouch: 1 },
      { id: 'f5', time: '15:30', food: 'chicken', pouch: 2 },
      { id: 'f6', time: '21:40', food: 'cod', pouch: 3 },
      { id: 'f7', time: '22:05', food: 'white fish', pouch: 4 },
    ],
  },
]

export const recentPoops: DailyPoops[] = [
  {
    date: '2026-07-31',
    entries: [
      { id: 'p1', time: '10:30', subject: 'momma', note: 'LARGE' },
      { id: 'p2', time: '06:40', subject: 'kitten' },
    ],
  },
  {
    date: '2026-07-30',
    entries: [
      { id: 'p3', time: '19:00', subject: 'momma', note: 'HUGE!' },
      { id: 'p4', time: '09:20', subject: 'kitten' },
    ],
  },
]

export const litterChanges: LitterChange[] = [
  { id: 'l1', date: '2026-07-31', time: '10:55' },
  { id: 'l2', date: '2026-07-30', time: '17:30' },
  { id: 'l3', date: '2026-07-29', time: '14:00' },
]

export const recentWeighIns: WeighIn[] = [
  {
    id: 'w1',
    date: '2026-07-26',
    time: '18:00',
    daysOld: 47,
    weights: [
      { kittenId: 'k1', grams: 820, changePercent: 8.2 },
      { kittenId: 'k2', grams: 780, changePercent: 7.1 },
      { kittenId: 'k3', grams: 850, changePercent: 9.0 },
      { kittenId: 'k4', grams: 710, changePercent: 6.5 },
      { kittenId: 'k5', grams: 690, changePercent: 5.8 },
      { kittenId: 'k6', grams: 740, changePercent: 7.4 },
      { kittenId: 'k7', grams: 760, changePercent: 6.9 },
    ],
  },
  {
    id: 'w2',
    date: '2026-07-24',
    time: '19:30',
    daysOld: 45,
    weights: [
      { kittenId: 'k1', grams: 758, changePercent: 7.5 },
      { kittenId: 'k2', grams: 728, changePercent: 6.8 },
      { kittenId: 'k3', grams: 780, changePercent: 8.1 },
      { kittenId: 'k4', grams: 667, changePercent: 6.2 },
      { kittenId: 'k5', grams: 652, changePercent: 5.5 },
      { kittenId: 'k6', grams: 689, changePercent: 6.9 },
      { kittenId: 'k7', grams: 711, changePercent: 6.4 },
    ],
  },
]

export const recentNotes: DailyNote[] = [
  {
    date: '2026-07-31',
    text: 'Momma is panting a lot after feeding. All kittens active and nursing well.',
  },
  {
    date: '2026-07-30',
    text: 'Amber moved 5/7 kittens to the new bed. Binned the leftovers in bowl.',
  },
]
