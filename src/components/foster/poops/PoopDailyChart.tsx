import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import type { PoopRow } from '@/lib/foster-queries'

export function PoopDailyChart({
  entries,
  primaryLabel = 'Momma',
}: {
  entries: PoopRow[]
  primaryLabel?: string
}) {
  const config = {
    mother: { label: primaryLabel, color: '#f59e0b' },
    kitten: { label: 'Kittens', color: '#f97316' },
  } satisfies ChartConfig
  const data = useMemo(() => {
    const totals = new Map<string, { date: string; mother: number; kitten: number }>()
    for (const entry of [...entries].reverse()) {
      const day = totals.get(entry.date) ?? { date: entry.date, mother: 0, kitten: 0 }
      day[entry.subject_type] += 1
      totals.set(entry.date, day)
    }
    return [...totals.values()]
  }, [entries])

  return (
    <ChartContainer
      config={config}
      className="h-[220px] w-full min-w-0"
      aria-label="Daily poop counts"
    >
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tickLine={false}
          axisLine={false}
          minTickGap={24}
        />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                const date = payload?.[0]?.payload?.date
                return typeof date === 'string' ? formatLongDate(date) : ''
              }}
            />
          }
        />
        <Bar
          dataKey="mother"
          name={primaryLabel}
          stackId="poops"
          fill="var(--color-mother)"
          radius={[0, 0, 0, 0]}
        />
        <Bar dataKey="kitten" stackId="poops" fill="var(--color-kitten)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(
    new Date(`${date}T12:00:00`),
  )
}

function formatLongDate(date: string) {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${date}T12:00:00`))
}
