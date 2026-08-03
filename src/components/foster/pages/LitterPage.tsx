import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/foster/layout/PageHeader'
import { Button } from '@/components/foster/ui/Button'
import { Card, CardHeader } from '@/components/foster/ui/Card'
import { EmptyState } from '@/components/foster/ui/EmptyState'
import { nowTime, todayIso } from '@/components/foster/ui/FormDialog'
import { LitterChangeDialog } from '@/components/foster/logs/LitterChangeDialog'
import { ConfirmDialog } from '@/components/foster/settings/ConfirmDialog'
import {
  litterChangesQueryOptions,
  littersQueryOptions,
  pickCurrentLitter,
  type LitterChangeRow,
} from '@/lib/foster-queries'
import { formatRelativeDay } from '@/utils/formatDate'

const iconButtonClass =
  'flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-sm text-muted transition hover:bg-brand-50 hover:text-ink'

export function LitterPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data: litters = [] } = useQuery(littersQueryOptions)
  const litter = pickCurrentLitter(litters)
  const { data: changes = [], isLoading } = useQuery(litterChangesQueryOptions(litter?.id))
  const lastChange = changes[0]

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [editing, setEditing] = useState<LitterChangeRow | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<LitterChangeRow | null>(null)

  const logNow = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('You need to be signed in.')
      if (!litter) throw new Error('Add a litter first.')
      const { error } = await supabase.from('litter_changes').insert({
        litter_id: litter.id,
        user_id: user.id,
        date: todayIso(),
        time: nowTime(),
      })
      if (error) throw error
    },
    onSuccess: async () => {
      setConfirmOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['litter-changes', litter?.id] })
      toast.success('Litter change logged')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not log the litter change'),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('litter_changes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: async () => {
      setPendingDelete(null)
      await queryClient.invalidateQueries({ queryKey: ['litter-changes', litter?.id] })
      toast.success('Litter change deleted')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not delete the record'),
  })

  return (
    <div>
      <PageHeader title="Litter" subtitle="Litter box maintenance" />

      <ConfirmDialog
        open={confirmOpen}
        title="Log a litter change now?"
        description={`This saves a change for ${todayIso()} at ${nowTime()}.`}
        confirmLabel="Log change"
        busy={logNow.isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => logNow.mutate()}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this litter change?"
        description="This cannot be undone."
        confirmLabel="Delete"
        busy={remove.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && remove.mutate(pendingDelete.id)}
      />

      <LitterChangeDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        litterId={litter?.id}
        change={editing}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-8 xl:grid-cols-[minmax(0,22rem)_1fr]">
        <Card className="h-fit bg-brand-50 border-brand-200">
          <CardHeader
            title="Last changed"
            subtitle={lastChange ? formatRelativeDay(lastChange.date) : 'No changes yet'}
          />
          <p className="text-3xl font-bold tabular-nums text-brand-700 md:text-4xl">
            {lastChange?.time.slice(0, 5) ?? '—'}
          </p>
          <Button
            fullWidth
            className="mt-4 md:max-w-none"
            disabled={!litter || logNow.isPending}
            onClick={() => setConfirmOpen(true)}
          >
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
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-lg">
                        🧹
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-ink">
                          {formatRelativeDay(change.date)}
                        </p>
                        <p className="text-sm text-muted">{change.time.slice(0, 5)}</p>
                        {change.notes ? (
                          <p className="truncate text-xs text-muted">{change.notes}</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        className={iconButtonClass}
                        aria-label="Edit litter change"
                        onClick={() => {
                          setEditing(change)
                          setDialogOpen(true)
                        }}
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        className={iconButtonClass}
                        aria-label="Delete litter change"
                        onClick={() => setPendingDelete(change)}
                      >
                        ✕
                      </button>
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
