import { PageHeader } from '@/components/foster/layout/PageHeader'
import { Button } from '@/components/foster/ui/Button'
import { Card, CardHeader } from '@/components/foster/ui/Card'
import { litterChanges } from '@/data/mockData'
import { formatRelativeDay } from '@/utils/formatDate'

export function LitterPage() {
  const lastChange = litterChanges[0]

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
            {lastChange?.time ?? '—'}
          </p>
          <Button fullWidth className="mt-4 md:max-w-none">
            Log litter change now
          </Button>
        </Card>

        <section aria-label="Change history">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            History
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {litterChanges.map((change) => (
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
                      <p className="text-sm text-muted">{change.time}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
