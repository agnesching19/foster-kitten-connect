import { useMemo, useState } from 'react'
import { Area, CartesianGrid, Line, ComposedChart, XAxis, YAxis } from 'recharts'
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import type { TagColour } from '@/components/foster/ui/KittenDot'
import { daysBetween, type HistoricalWeightRange, type WeighInRow } from '@/lib/foster-queries'
import { groupWeighInsByDay } from '@/lib/weight-history'

const lineColours: Record<TagColour, string> = {
  blue: '#0ea5e9',
  pink: '#f472b6',
  red: '#ef4444',
  orange: '#f97316',
  yellow: '#eab308',
  green: '#10b981',
  purple: '#a855f7',
  white: '#94a3b8',
  grey: '#6b7280',
  brown: '#92400e',
  black: '#111827',
}

const fallbackColours = ['#ea580c', '#0891b2', '#7c3aed', '#db2777', '#16a34a']

function parseDay(date: string) {
  return new Date(`${date}T12:00:00`).getTime()
}

function formatAxisDate(timestamp: number) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
  }).format(timestamp)
}

function formatTooltipDate(timestamp: number) {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(timestamp)
}

export function WeightChart({
  weighIns,
  showLegend = true,
  dateOfBirth,
  historicalRange = [],
}: {
  weighIns: WeighInRow[]
  showLegend?: boolean
  dateOfBirth?: string | null
  historicalRange?: HistoricalWeightRange[]
}) {
  const [hiddenKittenIds, setHiddenKittenIds] = useState<Set<string>>(() => new Set())
  const [compareHistory, setCompareHistory] = useState(false)
  const { chartData, kittens, config } = useMemo(() => {
    const days = groupWeighInsByDay(weighIns)
    const kittenDetails = new Map<string, { id: string; name: string; colour: TagColour | null }>()

    for (const day of days) {
      for (const weight of day.weights) {
        if (!kittenDetails.has(weight.kitten_id)) {
          kittenDetails.set(weight.kitten_id, {
            id: weight.kitten_id,
            name: weight.kittens?.name ?? 'Cat',
            colour: weight.kittens?.tag_colour ?? null,
          })
        }
      }
    }

    const series = [...kittenDetails.values()]
    const chartConfig = Object.fromEntries(
      series.map((kitten, index) => [
        kitten.id,
        {
          label: kitten.name,
          color: kitten.colour
            ? lineColours[kitten.colour]
            : fallbackColours[index % fallbackColours.length]!,
        },
      ]),
    ) satisfies ChartConfig

    const data = [...days].reverse().map((day) => ({
      timestamp: parseDay(day.date),
      ...Object.fromEntries(day.weights.map((weight) => [weight.kitten_id, weight.grams])),
    }))

    return { chartData: data, kittens: series, config: chartConfig }
  }, [weighIns])

  const ageChartData = useMemo(() => {
    if (!dateOfBirth) return []
    const byAge = new Map<number, Record<string, number | [number, number]>>()
    for (const day of groupWeighInsByDay(weighIns)) {
      const age = daysBetween(dateOfBirth, day.date)
      const row = byAge.get(age) ?? {}
      day.weights.forEach((weight) => {
        row[weight.kitten_id] = weight.grams
      })
      byAge.set(age, row)
    }
    historicalRange.forEach((range) => {
      const row = byAge.get(range.age_days) ?? {}
      row['historicalRange'] = [range.min_grams, range.max_grams]
      byAge.set(range.age_days, row)
    })
    return [...byAge]
      .sort(([left], [right]) => left - right)
      .map(([age, values]) => ({ age, ...values }))
  }, [dateOfBirth, historicalRange, weighIns])

  const canCompare = Boolean(dateOfBirth && historicalRange.length)
  const showingHistory = compareHistory && canCompare
  const displayedData = showingHistory ? ageChartData : chartData

  const visibleKittenCount = kittens.filter((kitten) => !hiddenKittenIds.has(kitten.id)).length

  const toggleKitten = (kittenId: string) => {
    setHiddenKittenIds((current) => {
      const next = new Set(current)
      if (next.has(kittenId)) {
        next.delete(kittenId)
      } else if (kittens.filter((kitten) => !current.has(kitten.id)).length > 1) {
        next.add(kittenId)
      }
      return next
    })
  }

  if (!chartData.length || !kittens.length) return null

  return (
    <div>
      <div className="mb-3">
        <label
          className={`flex min-h-11 items-center gap-2 text-sm font-medium ${canCompare ? 'text-ink' : 'text-muted'}`}
        >
          <input
            type="checkbox"
            checked={showingHistory}
            disabled={!canCompare}
            onChange={(event) => setCompareHistory(event.target.checked)}
          />
          Compare with previous kittens' range by age
        </label>
        {!canCompare ? (
          <p className="text-xs text-muted">
            Available when the batch owner has another completed kitten batch with a date of birth
            and weight records.
          </p>
        ) : null}
      </div>
      <ChartContainer
        config={config}
        className="h-[280px] w-full min-w-0 sm:h-[340px]"
        aria-label="Cat weight over time"
      >
        <ComposedChart
          accessibilityLayer
          data={displayedData}
          margin={{ top: 8, right: 12, bottom: 4, left: 0 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey={showingHistory ? 'age' : 'timestamp'}
            type="number"
            scale={showingHistory ? 'linear' : 'time'}
            domain={['dataMin', 'dataMax']}
            tickFormatter={showingHistory ? (age: number) => `Day ${age}` : formatAxisDate}
            tickLine={false}
            axisLine={false}
            minTickGap={32}
          />
          <YAxis
            width={48}
            tickFormatter={(value: number) => `${value}g`}
            tickLine={false}
            axisLine={false}
            domain={[
              (minimum: number) => Math.max(0, Math.floor((minimum - 50) / 50) * 50),
              (maximum: number) => Math.ceil((maximum + 50) / 50) * 50,
            ]}
          />
          <ChartTooltip
            content={(tooltipProps) => (
              <ChartTooltipContent
                active={tooltipProps.active}
                label={tooltipProps.label}
                payload={[...(tooltipProps.payload ?? [])].sort(
                  (left, right) => Number(right.value) - Number(left.value),
                )}
                labelFormatter={(_, payload) => {
                  if (showingHistory) {
                    const age = payload?.[0]?.payload?.age
                    return typeof age === 'number' ? `Day ${age}` : ''
                  }
                  const timestamp = payload?.[0]?.payload?.timestamp
                  return typeof timestamp === 'number' ? formatTooltipDate(timestamp) : ''
                }}
                formatter={(value, name, item) => (
                  <div className="flex w-full items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-muted-foreground">{config[String(name)]?.label}</span>
                    <span className="ml-auto font-mono font-medium tabular-nums text-foreground">
                      {Number(value).toLocaleString()}g
                    </span>
                  </div>
                )}
              />
            )}
          />
          {showingHistory ? (
            <Area
              type="monotone"
              dataKey="historicalRange"
              tooltipType="none"
              stroke="#94a3b8"
              fill="#cbd5e1"
              fillOpacity={0.3}
              connectNulls
              name="Previous kittens’ range"
            />
          ) : null}
          {showLegend ? (
            <ChartLegend
              content={() => (
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-3">
                  {kittens.map((kitten) => {
                    const isVisible = !hiddenKittenIds.has(kitten.id)
                    const cannotHide = isVisible && visibleKittenCount === 1

                    return (
                      <button
                        key={kitten.id}
                        type="button"
                        aria-pressed={isVisible}
                        disabled={cannotHide}
                        className={`flex items-center gap-1.5 text-xs transition-opacity sm:text-sm ${
                          isVisible ? 'opacity-100' : 'opacity-40'
                        } ${cannotHide ? 'cursor-default' : 'cursor-pointer hover:opacity-70'}`}
                        onClick={() => toggleKitten(kitten.id)}
                      >
                        <span
                          className="h-2 w-2 shrink-0 rounded-[2px]"
                          style={{ backgroundColor: config[kitten.id]?.color }}
                        />
                        <span className={isVisible ? undefined : 'line-through'}>
                          {kitten.name}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            />
          ) : null}
          {kittens.map((kitten) => (
            <Line
              key={kitten.id}
              type="monotone"
              dataKey={kitten.id}
              stroke={`var(--color-${kitten.id})`}
              strokeWidth={2.5}
              dot={{ r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: 'white' }}
              connectNulls
              hide={hiddenKittenIds.has(kitten.id)}
            />
          ))}
        </ComposedChart>
      </ChartContainer>
      {showingHistory ? (
        <p className="mt-2 text-center text-xs text-muted">
          Shaded area: observed range from completed batches with known dates of birth.
        </p>
      ) : null}
    </div>
  )
}
