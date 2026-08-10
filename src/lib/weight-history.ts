import type { WeighInRow } from '@/lib/foster-queries'

export type WeighInWeight = WeighInRow['weights'][number]

export interface DailyWeighIn {
  date: string
  sessions: WeighInRow[]
  weights: Array<WeighInWeight & { sessionId: string; sessionTime: string }>
}

/**
 * Combines split weigh-in sessions into one day. If a kitten was weighed more
 * than once that day, its latest reading is the day's value.
 */
export function groupWeighInsByDay(weighIns: WeighInRow[]): DailyWeighIn[] {
  const sessionsByDate = new Map<string, WeighInRow[]>()
  for (const session of weighIns) {
    const sessions = sessionsByDate.get(session.date)
    if (sessions) sessions.push(session)
    else sessionsByDate.set(session.date, [session])
  }

  return [...sessionsByDate.entries()]
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([date, sessions]) => {
      const sortedSessions = [...sessions].sort((left, right) =>
        right.time.localeCompare(left.time),
      )
      const weightsByKitten = new Map<string, DailyWeighIn['weights'][number]>()
      for (const session of sortedSessions) {
        for (const weight of session.weights) {
          if (!weightsByKitten.has(weight.kitten_id)) {
            weightsByKitten.set(weight.kitten_id, {
              ...weight,
              sessionId: session.id,
              sessionTime: session.time,
            })
          }
        }
      }
      return { date, sessions: sortedSessions, weights: [...weightsByKitten.values()] }
    })
}
