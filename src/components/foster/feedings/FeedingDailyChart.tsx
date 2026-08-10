import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import type { FeedingRow } from '@/lib/foster-queries'

const wetConfig = {
  pouches: { label: 'Pouches', color: '#f97316' },
} satisfies ChartConfig

const dryConfig = {
  bowlEquivalent: { label: 'Bowl equivalents', color: '#f59e0b' },
} satisfies ChartConfig

interface DailyFoodTotal {
  date: string
  pouches: number
  bowlEquivalent: number
}

export function FeedingDailyChart({ feedings }: { feedings: FeedingRow[] }) {
  const data = useMemo(() => dailyFoodTotals(feedings), [feedings])

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <FoodBarChart
        title="Wet food"
        subtitle="Pouches served per day"
        data={data}
        dataKey="pouches"
        config={wetConfig}
        color="var(--color-pouches)"
        allowDecimals={false}
        formatValue={(value) => `${value} pouch${value === 1 ? '' : 'es'}`}
      />
      <FoodBarChart
        title="Dry food"
        subtitle="Approximate full-bowl equivalents per day"
        data={data}
        dataKey="bowlEquivalent"
        config={dryConfig}
        color="var(--color-bowlEquivalent)"
        allowDecimals
        formatValue={(value) => `${formatNumber(value)} bowl equivalent${value === 1 ? '' : 's'}`}
      />
    </div>
  )
}

function FoodBarChart({
  title,
  subtitle,
  data,
  dataKey,
  config,
  color,
  allowDecimals,
  formatValue,
}: {
  title: string
  subtitle: string
  data: DailyFoodTotal[]
  dataKey: 'pouches' | 'bowlEquivalent'
  config: ChartConfig
  color: string
  allowDecimals: boolean
  formatValue: (value: number) => string
}) {
  return (
    <section className="min-w-0">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-0.5 text-xs text-muted">{subtitle}</p>
      <ChartContainer
        config={config}
        className="mt-2 h-[180px] w-full min-w-0"
        aria-label={`${title} served daily`}
      >
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tickLine={false}
            axisLine={false}
            minTickGap={18}
          />
          <YAxis
            allowDecimals={allowDecimals}
            tickFormatter={formatNumber}
            tickLine={false}
            axisLine={false}
            width={42}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(_, payload) => {
                  const date = payload?.[0]?.payload?.date
                  return typeof date === 'string' ? formatLongDate(date) : ''
                }}
                formatter={(value, name, item) => (
                  <div className="flex w-full items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-sm"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-muted-foreground">{config[String(name)]?.label}</span>
                    <span className="ml-auto font-mono font-medium tabular-nums text-foreground">
                      {formatValue(Number(value))}
                    </span>
                  </div>
                )}
              />
            }
          />
          <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ChartContainer>
    </section>
  )
}

function dailyFoodTotals(feedings: FeedingRow[]) {
  if (!feedings.length) return []

  const dates = feedings.map((feeding) => feeding.date).sort()
  const latestDate = dates.at(-1)!
  const latest = new Date(`${latestDate}T12:00:00`)
  const start = new Date(latest)
  start.setDate(start.getDate() - 13)
  const monthStart = new Date(`${latestDate.slice(0, 7)}-01T12:00:00`)
  if (start < monthStart) start.setTime(monthStart.getTime())

  const totals = new Map<string, DailyFoodTotal>()
  for (const feeding of feedings) {
    const day = totals.get(feeding.date) ?? {
      date: feeding.date,
      pouches: 0,
      bowlEquivalent: 0,
    }
    if (feeding.feeding_type === 'dry') {
      day.bowlEquivalent += ((feeding.bowl_count ?? 0) * (feeding.top_up_percent ?? 0)) / 100
    } else {
      day.pouches += feeding.pouch_count
    }
    totals.set(feeding.date, day)
  }

  const data: DailyFoodTotal[] = []
  for (const date = new Date(start); date <= latest; date.setDate(date.getDate() + 1)) {
    const key = toIsoDate(date)
    data.push(totals.get(key) ?? { date: key, pouches: 0, bowlEquivalent: 0 })
  }
  return data
}

function toIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatNumber(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
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
