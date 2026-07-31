import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/foster/layout/PageHeader'
import { Button } from '@/components/foster/ui/Button'
import { Card, CardHeader } from '@/components/foster/ui/Card'
import { EmptyState } from '@/components/foster/ui/EmptyState'
import {
  litterChangesQueryOptions,
  littersQueryOptions,
  pickCurrentLitter,
} from '@/lib/foster-queries'
import { formatRelativeDay } from '@/utils/formatDate'

export function LitterPage() {
  const { data: litters = [] } = useQuery(littersQueryOptions)
  const litter = pickCurrentLitter(litters)
  const { data: changes = [], isLoading } = useQuery(litterChangesQueryOptions(litter?.id))
  const lastChange = changes[0]

  return (
    <div>
      <PageHeader title="Litter" subtitle="Litter box maintenance" />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-8 xl:grid-cols-[minmax(0,22rem)_1fr]">
        <Card className="h-fit bg-brand-50 border-brand-200">
          <CardHeader
            title="Last changed"
            subtitle={lastChange ? formatRelativeDay(lastChange.date) : 'No changes yet'}
          />
          <p className="text-3xl font-bold tabular-nums text-brand-700 md:text-4xl">
            {lastChange?.time.slice(0, 5) ?? '—'}
          </p>
          <Button fullWidth className="mt-4 md:max-w-none">
            Log litter change now
          </Button>
        </Card>

        <section aria-label="Change history">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            History
          </h2>
          {isLoading ? (
            <Card>
              <p className="text-sm text-muted">Loading history…</p>
            </Card>
          ) : changes.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {changes.map((change) => (
                <Card key={change.id} padding="sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-lg">
                        🧹
                      </span>
                      <div>
                        <p className="font-semibold text-ink">
                          {formatRelativeDay(change.date)}
                        </p>
                        <p className="text-sm text-muted">{change.time.slice(0, 5)}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <EmptyState
                icon="🧹"
                title="No litter changes yet"
                description={litter ? 'Log a change to start the history.' : 'Add a litter first.'}
              />
            </Card>
          )}
        </section>
      </div>
    </div>
  )
}
