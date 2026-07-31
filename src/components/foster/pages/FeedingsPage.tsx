import { PageHeader } from '@/components/foster/layout/PageHeader'
import { Badge } from '@/components/foster/ui/Badge'
import { Button } from '@/components/foster/ui/Button'
import { Card, CardHeader } from '@/components/foster/ui/Card'
import { mommaName, recentFeedings } from '@/data/mockData'
import { formatRelativeDay } from '@/utils/formatDate'

export function FeedingsPage() {
  return (
    <div>
      <PageHeader
        title="Feedings"
        subtitle={`${mommaName}'s daily pouches`}
        action={
          <Button size="md" className="shrink-0">
            + Log
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        {recentFeedings.map((day) => (
          <Card key={day.date}>
            <CardHeader
              title={formatRelativeDay(day.date)}
              subtitle={`${day.feedings.length} feeding${day.feedings.length === 1 ? '' : 's'}`}
            />
            <ul className="space-y-2 md:grid md:grid-cols-2 md:gap-2 md:space-y-0">
              {day.feedings.map((feeding) => (
                <li
                  key={feeding.id}
                  className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 md:flex-col md:items-start md:gap-2 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-lg">
                      🍼
                    </span>
                    <div>
                      <p className="font-semibold text-ink">{feeding.time}</p>
                      <p className="text-sm capitalize text-muted">{feeding.food}</p>
                    </div>
                  </div>
                  <Badge
                    label={feeding.pouch > 3 ? 'Pouch 4+' : `Pouch ${feeding.pouch}`}
                    color="brand"
                  />
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  )
}
