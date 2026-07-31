import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/foster/layout/PageHeader'
import { Badge } from '@/components/foster/ui/Badge'
import { Button } from '@/components/foster/ui/Button'
import { Card, CardHeader } from '@/components/foster/ui/Card'
import { EmptyState } from '@/components/foster/ui/EmptyState'
import {
  feedingsQueryOptions,
  groupByDate,
  littersQueryOptions,
  pickCurrentLitter,
} from '@/lib/foster-queries'
import { formatRelativeDay } from '@/utils/formatDate'

export function FeedingsPage() {
  const { data: litters = [], isLoading: littersLoading } = useQuery(littersQueryOptions)
  const litter = pickCurrentLitter(litters)
  const { data: feedings = [], isLoading } = useQuery(feedingsQueryOptions(litter?.id))
  const days = groupByDate(feedings)

  return (
    <div>
      <PageHeader
        title="Feedings"
        subtitle={litter ? `${litter.mother_name}'s daily pouches` : 'Daily pouches'}
        action={
          <Button size="md" className="shrink-0">
            + Log
          </Button>
        }
      />

      {littersLoading || isLoading ? (
        <Card>
          <p className="text-sm text-muted">Loading feedings…</p>
        </Card>
      ) : days.length ? (
        <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
          {days.map((day) => (
            <Card key={day.date}>
              <CardHeader
                title={formatRelativeDay(day.date)}
                subtitle={`${day.items.length} feeding${day.items.length === 1 ? '' : 's'}`}
              />
              <ul className="space-y-2 md:grid md:grid-cols-2 md:gap-2 md:space-y-0">
                {day.items.map((feeding) => (
                  <li
                    key={feeding.id}
                    className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 md:flex-col md:items-start md:gap-2 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-lg">
                        🍼
                      </span>
                      <div>
                        <p className="font-semibold text-ink">{feeding.time.slice(0, 5)}</p>
                        <p className="text-sm capitalize text-muted">{feeding.food}</p>
                      </div>
                    </div>
                    {feeding.meal_number != null ? (
                      <Badge
                        label={feeding.meal_number > 3 ? 'Pouch 4+' : `Pouch ${feeding.meal_number}`}
                        color="brand"
                      />
                    ) : null}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon="🍼"
            title="No feedings logged"
            description={litter ? 'Log a feeding to start the daily record.' : 'Add a litter first.'}
          />
        </Card>
      )}
    </div>
  )
}
