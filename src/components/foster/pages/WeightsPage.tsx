import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { PageHeader } from '@/components/foster/layout/PageHeader'
import { Badge } from '@/components/foster/ui/Badge'
import { Button } from '@/components/foster/ui/Button'
import { Card, CardHeader } from '@/components/foster/ui/Card'
import { EmptyState } from '@/components/foster/ui/EmptyState'
import { KittenDot } from '@/components/foster/ui/KittenDot'
import { WeighInDialog } from '@/components/foster/logs/WeighInDialog'
import { ConfirmDialog } from '@/components/foster/settings/ConfirmDialog'
import {
  daysBetween,
  littersQueryOptions,
  pickCurrentLitter,
  weighInsQueryOptions,
  type WeighInRow,
} from '@/lib/foster-queries'
import { formatRelativeDay } from '@/utils/formatDate'

const iconButtonClass =
  'flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-sm text-muted transition hover:bg-brand-50 hover:text-ink'

export function WeightsPage() {
  const queryClient = useQueryClient()
  const { data: litters = [] } = useQuery(littersQueryOptions)
  const litter = pickCurrentLitter(litters)
  const { data: weighIns = [], isLoading } = useQuery(weighInsQueryOptions(litter?.id))
  const dob = litter?.date_of_birth ?? null

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<WeighInRow | null>(null)
  const [pendingDelete, setPendingDelete] = useState<WeighInRow | null>(null)

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error: weightsError } = await supabase.from('weights').delete().eq('weigh_in_id', id)
      if (weightsError) throw weightsError
      const { error } = await supabase.from('weigh_ins').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: async () => {
      setPendingDelete(null)
      await queryClient.invalidateQueries({ queryKey: ['weigh-ins', litter?.id] })
      toast.success('Weigh-in deleted')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not delete the weigh-in'),
  })

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
          <Button
            size="md"
            className="shrink-0"
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
          >
            + Weigh
          </Button>
        }
      />

      <WeighInDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        litterId={litter?.id}
        dateOfBirth={dob}
        session={editing}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this weigh-in?"
        description="Every kitten weight in this session will be removed too."
        confirmLabel="Delete"
        busy={remove.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && remove.mutate(pendingDelete.id)}
      />

      {isLoading ? (
        <Card>
          <p className="text-sm text-muted">Loading weigh-ins…</p>
        </Card>
      ) : sessions.length ? (
        <div className="grid gap-4 xl:grid-cols-2 xl:gap-6">
          {sessions.map((session) => (
            <Card key={session.id}>
              <div className="flex items-start justify-between gap-2">
                <CardHeader
                  title={formatRelativeDay(session.date)}
                  subtitle={`${session.time.slice(0, 5)}${session.daysOld != null ? ` · Day ${session.daysOld}` : ''}`}
                />
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    className={iconButtonClass}
                    aria-label="Edit weigh-in"
                    onClick={() => {
                      const original = weighIns.find((item) => item.id === session.id) ?? null
                      setEditing(original)
                      setDialogOpen(true)
                    }}
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    className={iconButtonClass}
                    aria-label="Delete weigh-in"
                    onClick={() => setPendingDelete(weighIns.find((i) => i.id === session.id) ?? null)}
                  >
                    ✕
                  </button>
                </div>
              </div>
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
              {session.notes ? (
                <p className="mt-3 text-sm text-muted">{session.notes}</p>
              ) : null}
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
