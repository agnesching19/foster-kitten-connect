import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/foster/layout/PageHeader'
import { Badge } from '@/components/foster/ui/Badge'
import { Button } from '@/components/foster/ui/Button'
import { Card, CardHeader } from '@/components/foster/ui/Card'
import { EmptyState } from '@/components/foster/ui/EmptyState'
import { KittenDot } from '@/components/foster/ui/KittenDot'
import {
  groupByDate,
  littersQueryOptions,
  pickCurrentLitter,
  poopsQueryOptions,
} from '@/lib/foster-queries'
import { formatRelativeDay } from '@/utils/formatDate'

export function PoopsPage() {
  const { data: litters = [], isLoading: littersLoading } = useQuery(littersQueryOptions)
  const litter = pickCurrentLitter(litters)
  const { data: entries = [], isLoading } = useQuery(poopsQueryOptions(litter?.id))
  const days = groupByDate(entries)
  const mother = litter?.mother_name ?? 'Momma'

  return (
    <div>
      <PageHeader
        title="Poops"
        subtitle={`${mother} & kitten bathroom log`}
        action={
          <Button size="md" className="shrink-0">
            + Log
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:max-w-md md:mb-6">
        <Button variant="secondary" fullWidth>
          Momma 💩
        </Button>
        <Button variant="secondary" fullWidth>
          Kitten 💩
        </Button>
      </div>

      {littersLoading || isLoading ? (
        <Card>
          <p className="text-sm text-muted">Loading entries…</p>
        </Card>
      ) : days.length ? (
        <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
          {days.map((day) => (
            <Card key={day.date}>
              <CardHeader
                title={formatRelativeDay(day.date)}
                subtitle={`${day.items.length} entr${day.items.length === 1 ? 'y' : 'ies'}`}
              />
              <ul className="space-y-2 md:grid md:grid-cols-2 md:gap-2 md:space-y-0">
                {day.items.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-lg">
                        💩
                      </span>
                      <div>
                        <p className="font-semibold text-ink">{entry.time.slice(0, 5)}</p>
                        <p className="text-sm text-muted">{entry.note ? entry.note : 'No note'}</p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1.5">
                      {entry.kitten_id ? <KittenDot colour={entry.kittens?.tag_colour ?? null} /> : null}
                      <Badge
                        label={entry.kittens?.name ?? mother}
                        color={entry.kitten_id ? 'neutral' : 'brand'}
                      />
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon="💩"
            title="No entries yet"
            description={litter ? 'Log a poop to start tracking.' : 'Add a litter first.'}
          />
        </Card>
      )}
    </div>
  )
}
