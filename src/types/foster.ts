export type KittenColor =
  | 'pink'
  | 'red'
  | 'purple'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'orange'

export interface Kitten {
  id: string
  name: string
  color: KittenColor
  coat: string
}

export interface Feeding {
  id: string
  time: string
  food: string
  pouch: 1 | 2 | 3 | 4
}

export interface DailyFeedings {
  date: string
  feedings: Feeding[]
}

export interface PoopEntry {
  id: string
  time: string
  subject: 'momma' | 'kitten'
  note?: string
}

export interface DailyPoops {
  date: string
  entries: PoopEntry[]
}

export interface LitterChange {
  id: string
  date: string
  time: string
}

export interface WeightEntry {
  kittenId: string
  grams: number
  changePercent?: number
}

export interface WeighIn {
  id: string
  date: string
  time: string
  daysOld: number
  weights: WeightEntry[]
}

export interface DailyNote {
  date: string
  text: string
}

export interface FosterBatch {
  id: string
  mommaName: string
  arrived: string
  left?: string
  kittens: string[]
  recordLabel?: string
  albumUrl?: string
  status: 'active' | 'completed'
}
