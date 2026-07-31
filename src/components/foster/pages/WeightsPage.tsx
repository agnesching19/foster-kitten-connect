import { PageHeader } from '@/components/foster/layout/PageHeader'
import { Badge } from '@/components/foster/ui/Badge'
import { Button } from '@/components/foster/ui/Button'
import { Card, CardHeader } from '@/components/foster/ui/Card'
import { kittens, recentWeighIns } from '@/data/mockData'
import { formatRelativeDay } from '@/utils/formatDate'

export function WeightsPage() {
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

      <div className="grid gap-4 xl:grid-cols-2 xl:gap-6">
        {recentWeighIns.map((session) => (
          <Card key={session.id}>
            <CardHeader
              title={formatRelativeDay(session.date)}
              subtitle={`${session.time} · Day ${session.daysOld}`}
            />
            <ul className="grid gap-2 sm:grid-cols-2">
              {session.weights.map((weight) => {
                const kitten = kittens.find((k) => k.id === weight.kittenId)
                if (!kitten) return null

                return (
                  <li
                    key={weight.kittenId}
                    className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <Badge label={kitten.name} color={kitten.color} size="md" />
                      <span className="text-sm text-muted capitalize">{kitten.coat}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold tabular-nums text-ink">
                        {weight.grams}
                        <span className="ml-0.5 text-sm font-normal text-muted">g</span>
                      </p>
                      {weight.changePercent != null ? (
                        <p className="text-xs font-medium text-green-600">
                          +{weight.changePercent.toFixed(1)}%
                        </p>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  )
}
