import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/foster/layout/PageHeader'
import { Badge } from '@/components/foster/ui/Badge'
import { Button } from '@/components/foster/ui/Button'
import { Card, CardHeader } from '@/components/foster/ui/Card'
import { EmptyState } from '@/components/foster/ui/EmptyState'
import { KittenDot } from '@/components/foster/ui/KittenDot'
import {
  daysBetween,
  littersQueryOptions,
  pickCurrentLitter,
  weighInsQueryOptions,
} from '@/lib/foster-queries'
import { formatRelativeDay } from '@/utils/formatDate'

export function WeightsPage() {
  const { data: litters = [] } = useQuery(littersQueryOptions)
  const litter = pickCurrentLitter(litters)
  const { data: weighIns = [], isLoading } = useQuery(weighInsQueryOptions(litter?.id))
  const dob = litter?.date_of_birth ?? null

  // Sessions are newest-first; compare each kitten against the previous session.
  const sessions = useMemo(
    () =>
      weighIns.map((session, index) => {
        const previous = weighIns[index + 1]
        return {
          ...session,
          daysOld: dob ? daysBetween(dob, session.date) : null,
          weights: session.weights.map((weight) => {
            const before = previous?.weights.find((w) => w.kitten_id === weight.kitten_id)
            return {
              ...weight,
              changePercent:
                before && before.grams > 0
                  ? ((weight.grams - before.grams) / before.grams) * 100
                  : null,
            }
          }),
        }
      }),
    [weighIns, dob],
  )

  return (
    <div>
      <PageHeader
        title="Weights"
        subtitle="Kitten growth tracking"
        action={
          <Button size="md" className="shrink-0">
            + Weigh
          </Button>
        }
      />

      {isLoading ? (
        <Card>
          <p className="text-sm text-muted">Loading weigh-ins…</p>
        </Card>
      ) : sessions.length ? (
        <div className="grid gap-4 xl:grid-cols-2 xl:gap-6">
          {sessions.map((session) => (
            <Card key={session.id}>
              <CardHeader
                title={formatRelativeDay(session.date)}
                subtitle={`${session.time.slice(0, 5)}${session.daysOld != null ? ` · Day ${session.daysOld}` : ''}`}
              />
              <ul className="grid gap-2 sm:grid-cols-2">
                {session.weights.map((weight) => (
                  <li
                    key={weight.kitten_id}
                    className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <KittenDot colour={weight.kittens?.tag_colour ?? null} size="md" />
                      <Badge label={weight.kittens?.name ?? 'Kitten'} color="brand" size="md" />
                    </div>
                    <div className="text-right">
                      <p className="font-semibold tabular-nums text-ink">
                        {weight.grams}
                        <span className="ml-0.5 text-sm font-normal text-muted">g</span>
                      </p>
                      {weight.changePercent != null ? (
                        <p
                          className={`text-xs font-medium ${weight.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {weight.changePercent >= 0 ? '+' : ''}
                          {weight.changePercent.toFixed(1)}%
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon="⚖️"
            title="No weigh-ins yet"
            description={litter ? 'Record a weigh-in to track growth.' : 'Add a litter first.'}
          />
        </Card>
      )}
    </div>
  )
}
