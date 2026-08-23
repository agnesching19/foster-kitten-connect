import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardHeader } from '@/components/foster/ui/Card'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { isLiveCamsAdmin } from '@/lib/live-cams'

type TrafficSummaryRow = {
  day: string
  metric: string
  request_count: number
  error_count: number
  response_bytes: number
}

export function TrafficMonitoringCard() {
  const { user } = useAuth()
  const admin = isLiveCamsAdmin(user?.email)
  const {
    data: rows = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['traffic-metrics', 14],
    enabled: admin,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<TrafficSummaryRow[]> => {
      const { data, error: queryError } = await supabase.rpc('traffic_metrics_summary', {
        days_back: 14,
      })
      if (queryError) throw queryError
      return (data ?? []) as TrafficSummaryRow[]
    },
  })

  const days = useMemo(() => {
    const grouped = new Map<string, TrafficSummaryRow[]>()
    for (const row of rows) grouped.set(row.day, [...(grouped.get(row.day) ?? []), row])
    return [...grouped].map(([day, metrics]) => ({
      day,
      requests: metrics.reduce((total, metric) => total + Number(metric.request_count), 0),
      errors: metrics.reduce((total, metric) => total + Number(metric.error_count), 0),
      bytes: metrics.reduce((total, metric) => total + Number(metric.response_bytes), 0),
      images: metrics
        .filter((metric) => metric.metric.startsWith('image:'))
        .reduce((total, metric) => total + Number(metric.request_count), 0),
    }))
  }, [rows])
  const latestMetrics = rows.filter((row) => row.day === days[0]?.day)

  if (!admin) return null

  return (
    <Card>
      <CardHeader
        title="Traffic monitoring"
        subtitle="Aggregated Supabase requests, errors and observable transfer volume for the last 14 days."
      />
      <p className="mb-4 rounded-xl bg-brand-50 px-3 py-2 text-xs text-muted">
        Metrics are batched once per minute and contain no URLs, emails or record contents. Supabase
        Usage remains the source of truth for billing because browsers cannot expose every CDN byte.
      </p>

      {isLoading ? (
        <p className="text-sm text-muted">Loading traffic metrics…</p>
      ) : error ? (
        <p role="alert" className="text-sm text-red-600">
          Traffic metrics could not be loaded.
        </p>
      ) : days.length ? (
        <div className="grid gap-4">
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-3 py-2 font-semibold">Day</th>
                  <th className="px-3 py-2 text-right font-semibold">Requests</th>
                  <th className="px-3 py-2 text-right font-semibold">Images</th>
                  <th className="px-3 py-2 text-right font-semibold">Errors</th>
                  <th className="px-3 py-2 text-right font-semibold">Observed transfer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {days.map((day) => (
                  <tr key={day.day}>
                    <td className="px-3 py-2.5 font-medium text-ink">{formatDay(day.day)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-ink">{day.requests}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-ink">{day.images}</td>
                    <td
                      className={`px-3 py-2.5 text-right tabular-nums ${day.errors ? 'font-semibold text-red-600' : 'text-muted'}`}
                    >
                      {day.errors}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-ink">
                      {formatBytes(day.bytes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-ink">Latest day by category</h3>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[28rem] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Category</th>
                    <th className="px-3 py-2 text-right font-semibold">Requests</th>
                    <th className="px-3 py-2 text-right font-semibold">Errors</th>
                    <th className="px-3 py-2 text-right font-semibold">Transfer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {latestMetrics.map((metric) => (
                    <tr key={metric.metric}>
                      <td className="px-3 py-2.5 font-medium text-ink">
                        {formatMetric(metric.metric)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-ink">
                        {Number(metric.request_count)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-muted">
                        {Number(metric.error_count)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-ink">
                        {formatBytes(Number(metric.response_bytes))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border px-3 py-4 text-sm text-muted">
          No traffic has been recorded yet. Metrics will appear after signed-in users run the
          updated app for about a minute.
        </p>
      )}
    </Card>
  )
}

function formatDay(day: string): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(
    new Date(`${day}T12:00:00`),
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatMetric(metric: string): string {
  return metric
    .replace('api:', 'API · ')
    .replace('image:', 'Image · ')
    .replaceAll('-', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}
