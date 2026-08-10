import { FormDialog } from '@/components/foster/ui/FormDialog'
import { KittenAvatar } from '@/components/foster/ui/KittenAvatar'
import { WeightChart } from '@/components/foster/weights/WeightChart'
import type { TagColour } from '@/components/foster/ui/KittenDot'
import type { WeighInRow } from '@/lib/foster-queries'
import { formatRelativeDay } from '@/utils/formatDate'
import { groupWeighInsByDay } from '@/lib/weight-history'

export interface WeightHistoryKitten {
  id: string
  name: string
  avatarPath: string | null
  colour: TagColour | null
}

export function KittenWeightHistoryDialog({
  kitten,
  weighIns,
  onClose,
}: {
  kitten: WeightHistoryKitten | null
  weighIns: WeighInRow[]
  onClose: () => void
}) {
  const kittenWeighIns = kitten
    ? weighIns
        .map((session) => ({
          ...session,
          weights: session.weights.filter((weight) => weight.kitten_id === kitten.id),
        }))
        .filter((session) => session.weights.length > 0)
    : []
  const kittenDays = groupWeighInsByDay(kittenWeighIns)
  const latestWeight = kittenDays[0]?.weights[0]?.grams

  return (
    <FormDialog
      open={Boolean(kitten)}
      onClose={onClose}
      title={kitten ? `${kitten.name}'s weight history` : 'Weight history'}
      subtitle={
        kitten
          ? `${kittenDays.length} day${kittenDays.length === 1 ? '' : 's'}${latestWeight ? ` · Latest ${latestWeight}g` : ''}`
          : ''
      }
      requireAuth={false}
    >
      {kitten ? (
        <div className="grid min-w-0 max-w-full gap-4 overflow-hidden">
          <div className="flex items-center gap-3">
            <KittenAvatar
              name={kitten.name}
              avatarPath={kitten.avatarPath}
              colour={kitten.colour}
              size="lg"
            />
            <div>
              <p className="font-semibold text-ink">{kitten.name}</p>
              <p className="text-sm text-muted">
                {latestWeight ? `${latestWeight}g latest weight` : 'No weights recorded'}
              </p>
            </div>
          </div>

          <div className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-border bg-white p-2 sm:p-3">
            <WeightChart weighIns={kittenWeighIns} showLegend={false} />
          </div>

          <ol className="min-w-0 max-w-full divide-y divide-border overflow-hidden rounded-xl border border-border px-3">
            {kittenDays.map((day) => (
              <li key={day.date} className="flex min-w-0 items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{formatRelativeDay(day.date)}</p>
                  <p className="text-xs text-muted">{day.weights[0]?.sessionTime.slice(0, 5)}</p>
                </div>
                <p className="ml-auto shrink-0 text-right font-semibold tabular-nums text-ink">
                  {day.weights[0]?.grams}
                  <span className="ml-0.5 text-sm font-normal text-muted">g</span>
                </p>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </FormDialog>
  )
}
