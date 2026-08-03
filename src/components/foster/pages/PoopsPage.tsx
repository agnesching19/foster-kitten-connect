import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { PageHeader } from '@/components/foster/layout/PageHeader'
import { Badge } from '@/components/foster/ui/Badge'
import { Button } from '@/components/foster/ui/Button'
import { Card, CardHeader } from '@/components/foster/ui/Card'
import { EmptyState } from '@/components/foster/ui/EmptyState'
import { KittenDot } from '@/components/foster/ui/KittenDot'
import { PoopDialog } from '@/components/foster/logs/PoopDialog'
import { ConfirmDialog } from '@/components/foster/settings/ConfirmDialog'
import {
  groupByDate,
  littersQueryOptions,
  pickCurrentLitter,
  poopsQueryOptions,
  type PoopRow,
} from '@/lib/foster-queries'
import { formatRelativeDay } from '@/utils/formatDate'

const iconButtonClass =
  'flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-sm text-muted transition hover:bg-brand-50 hover:text-ink'

export function PoopsPage() {
  const queryClient = useQueryClient()
  const { data: litters = [], isLoading: littersLoading } = useQuery(littersQueryOptions)
  const litter = pickCurrentLitter(litters)
  const { data: entries = [], isLoading } = useQuery(poopsQueryOptions(litter?.id))
  const days = groupByDate(entries)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PoopRow | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PoopRow | null>(null)

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('poop_entries').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: async () => {
      setPendingDelete(null)
      await queryClient.invalidateQueries({ queryKey: ['poops', litter?.id] })
      toast.success('Entry deleted')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not delete the entry'),
  })

  return (
    <div>
      <PageHeader
        title="Poops"
        subtitle="Bathroom log"
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

      <PoopDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        litterId={litter?.id}
        entry={editing}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this entry?"
        description="This cannot be undone."
        confirmLabel="Delete"
        busy={remove.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && remove.mutate(pendingDelete.id)}
      />

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
                    className="flex items-center justify-between gap-2 rounded-xl bg-gray-50 px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-lg">
                        💩
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-ink">{entry.time.slice(0, 5)}</p>
                        <p className="truncate text-sm text-muted">
                          {entry.note ? entry.note : 'No note'}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {entry.kitten_id ? (
                        <span className="flex items-center gap-1.5">
                          <KittenDot colour={entry.kittens?.tag_colour ?? null} />
                          <Badge label={entry.kittens?.name ?? 'Kitten'} color="neutral" />
                        </span>
                      ) : (
                        <Badge label="Not identified" color="neutral" />
                      )}
                      <button
                        type="button"
                        className={iconButtonClass}
                        aria-label="Edit entry"
                        onClick={() => {
                          setEditing(entry)
                          setDialogOpen(true)
                        }}
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        className={iconButtonClass}
                        aria-label="Delete entry"
                        onClick={() => setPendingDelete(entry)}
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
            icon="💩"
            title="No entries yet"
            description={litter ? 'Log a poop to start tracking.' : 'Add a litter first.'}
          />
        </Card>
      )}
    </div>
  )
}
