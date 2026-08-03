import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { PageHeader } from '@/components/foster/layout/PageHeader'
import { Badge } from '@/components/foster/ui/Badge'
import { Button } from '@/components/foster/ui/Button'
import { Card, CardHeader } from '@/components/foster/ui/Card'
import { EmptyState } from '@/components/foster/ui/EmptyState'
import { FeedingDialog } from '@/components/foster/dialogs/FeedingDialog'
import { ConfirmDialog } from '@/components/foster/settings/ConfirmDialog'
import {
  feedingsQueryOptions,
  groupByDate,
  littersQueryOptions,
  pickCurrentLitter,
  type FeedingRow,
} from '@/lib/foster-queries'
import { formatRelativeDay } from '@/utils/formatDate'

const iconButtonClass =
  'flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-sm text-muted transition hover:bg-brand-50 hover:text-ink'

export function FeedingsPage() {
  const queryClient = useQueryClient()
  const { data: litters = [], isLoading: littersLoading } = useQuery(littersQueryOptions)
  const litter = pickCurrentLitter(litters)
  const { data: feedings = [], isLoading } = useQuery(feedingsQueryOptions(litter?.id))
  const days = groupByDate(feedings)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<FeedingRow | null>(null)
  const [pendingDelete, setPendingDelete] = useState<FeedingRow | null>(null)

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('feedings').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: async () => {
      setPendingDelete(null)
      await queryClient.invalidateQueries({ queryKey: ['feedings', litter?.id] })
      toast.success('Feeding deleted')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not delete the feeding'),
  })

  return (
    <div>
      <PageHeader
        title="Feedings"
        subtitle={litter ? `${litter.mother_name}'s daily pouches` : 'Daily pouches'}
        action={
          <Button
            size="md"
            className="shrink-0"
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
          >
            + Log
          </Button>
        }
      />

      <FeedingDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        litterId={litter?.id}
        feeding={editing}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this feeding?"
        description="This cannot be undone."
        confirmLabel="Delete"
        busy={remove.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && remove.mutate(pendingDelete.id)}
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
              <ul className="divide-y divide-border/70">
                {day.items.map((feeding) => (
                  <li
                    key={feeding.id}
                    className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1 py-3 first:pt-0 last:pb-0"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-lg">
                      🍼
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="text-base font-semibold tabular-nums text-ink">
                          {feeding.time.slice(0, 5)}
                        </p>
                        {feeding.meal_number != null ? (
                          <Badge
                            label={feeding.meal_number > 3 ? 'Pouch 4+' : `Pouch ${feeding.meal_number}`}
                            color="brand"
                          />
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-sm capitalize text-muted">{feeding.food}</p>
                      {feeding.notes ? (
                        <p className="mt-0.5 text-xs text-muted">{feeding.notes}</p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        className={iconButtonClass}
                        aria-label="Edit feeding"
                        onClick={() => {
                          setEditing(feeding)
                          setDialogOpen(true)
                        }}
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        className={iconButtonClass}
                        aria-label="Delete feeding"
                        onClick={() => setPendingDelete(feeding)}
                      >
                        ✕
                      </button>
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
            icon="🍼"
            title="No feedings logged"
            description={litter ? 'Log a feeding to start the daily record.' : 'Add a litter first.'}
          />
        </Card>
      )}
    </div>
  )
}
