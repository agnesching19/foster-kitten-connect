import { PageHeader } from '@/components/foster/layout/PageHeader'
import { Badge } from '@/components/foster/ui/Badge'
import { Button } from '@/components/foster/ui/Button'
import { Card, CardHeader } from '@/components/foster/ui/Card'
import { mommaName, recentPoops } from '@/data/mockData'
import { formatRelativeDay } from '@/utils/formatDate'

export function PoopsPage() {
  return (
    <div>
      <PageHeader
        title="Poops"
        subtitle={`${mommaName} & kitten bathroom log`}
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

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        {recentPoops.map((day) => (
          <Card key={day.date}>
            <CardHeader
              title={formatRelativeDay(day.date)}
              subtitle={`${day.entries.length} entr${day.entries.length === 1 ? 'y' : 'ies'}`}
            />
            <ul className="space-y-2 md:grid md:grid-cols-2 md:gap-2 md:space-y-0">
              {day.entries.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-lg">
                      💩
                    </span>
                    <div>
                      <p className="font-semibold text-ink">{entry.time}</p>
                      {entry.note ? (
                        <p className="text-sm text-muted">{entry.note}</p>
                      ) : (
                        <p className="text-sm text-muted">No note</p>
                      )}
                    </div>
                  </div>
                  <Badge
                    label={entry.subject === 'momma' ? mommaName : 'Kitten'}
                    color={entry.subject === 'momma' ? 'brand' : 'neutral'}
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
