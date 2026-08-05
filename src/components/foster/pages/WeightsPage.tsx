import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { PageHeader } from '@/components/foster/layout/PageHeader'
import { Button } from '@/components/foster/ui/Button'
import { Card, CardHeader } from '@/components/foster/ui/Card'
import { EmptyState } from '@/components/foster/ui/EmptyState'
import { KittenAvatar } from '@/components/foster/ui/KittenAvatar'
import { WeightChart } from '@/components/foster/weights/WeightChart'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { WeighInDialog } from '@/components/foster/dialogs/WeighInDialog'
import { ConfirmDialog } from '@/components/foster/settings/ConfirmDialog'
import {
  daysBetween,
  littersQueryOptions,
  logAuthorName,
  pickCurrentLitter,
  profilesQueryOptions,
  weighInsQueryOptions,
  type WeighInRow,
} from '@/lib/foster-queries'
import { formatRelativeDay } from '@/utils/formatDate'
import { useLitterAccess } from '@/hooks/useLitterAccess'

const iconButtonClass =
  'flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-sm text-muted transition hover:bg-brand-50 hover:text-ink'

export function WeightsPage() {
  const queryClient = useQueryClient()
  const { data: litters = [] } = useQuery(littersQueryOptions)
  const litter = pickCurrentLitter(litters)
  const { canEdit } = useLitterAccess(litter)
  const { data: weighIns = [], isLoading } = useQuery(weighInsQueryOptions(litter?.id))
  const { data: profiles = [] } = useQuery(profilesQueryOptions)
  const dob = litter?.date_of_birth ?? null

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<WeighInRow | null>(null)
  const [pendingDelete, setPendingDelete] = useState<WeighInRow | null>(null)
  const [selectedMonth, setSelectedMonth] = useState('')
  const [openSessions, setOpenSessions] = useState<Record<string, boolean>>({})

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

  const months = useMemo(
    () => [...new Set(sessions.map((session) => session.date.slice(0, 7)))],
    [sessions],
  )
  const activeMonth = months.includes(selectedMonth) ? selectedMonth : (months[0] ?? '')
  const visibleSessions = sessions.filter((session) => session.date.startsWith(activeMonth))
  const isSessionOpen = (id: string, index: number) => openSessions[id] ?? index < 2
  const allSessionsOpen = visibleSessions.every((session, index) =>
    isSessionOpen(session.id, index),
  )

  return (
    <div>
      <PageHeader
        title="Weights"
        subtitle="Kitten growth tracking"
        action={
          canEdit ? (
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
          ) : null
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
        <div className="space-y-4 xl:space-y-6">
          <Card padding="lg">
            <CardHeader title="Growth chart" subtitle="Kitten weight over time" />
            <WeightChart weighIns={weighIns} />
          </Card>

          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-raised p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <div className="flex min-w-0 items-center gap-3">
              <label htmlFor="weight-month" className="shrink-0 text-sm font-medium text-ink">
                Month
              </label>
              <select
                id="weight-month"
                value={activeMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="min-h-11 min-w-0 flex-1 rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 sm:w-44 sm:flex-none"
              >
                {months.map((month) => (
                  <option key={month} value={month}>
                    {formatMonth(month)}
                  </option>
                ))}
              </select>
              <p className="hidden text-sm text-muted md:block">
                {visibleSessions.length} weigh-in{visibleSessions.length === 1 ? '' : 's'}
              </p>
            </div>
            <button
              type="button"
              className="min-h-11 shrink-0 rounded-xl px-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
              onClick={() =>
                setOpenSessions((current) => ({
                  ...current,
                  ...Object.fromEntries(
                    visibleSessions.map((session) => [session.id, !allSessionsOpen]),
                  ),
                }))
              }
            >
              {allSessionsOpen ? 'Collapse all' : 'Expand all'}
            </button>
          </div>

          <div className="grid items-start gap-3 xl:grid-cols-2 xl:gap-4">
            {visibleSessions.map((session, index) => {
              const open = isSessionOpen(session.id, index)
              return (
                <Collapsible
                  key={session.id}
                  open={open}
                  onOpenChange={(nextOpen) =>
                    setOpenSessions((current) => ({ ...current, [session.id]: nextOpen }))
                  }
                >
                  <Card>
                    <div className="flex items-start justify-between gap-2">
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="flex min-h-11 min-w-0 flex-1 items-center justify-between gap-3 text-left"
                        >
                          <span>
                            <span className="block font-semibold text-ink">
                              {formatRelativeDay(session.date)}
                            </span>
                            <span className="mt-0.5 block text-sm text-muted">
                              {session.time.slice(0, 5)}
                              {session.daysOld != null ? ` · Day ${session.daysOld}` : ''} ·{' '}
                              {session.weights.length} kitten
                              {session.weights.length === 1 ? '' : 's'}
                            </span>
                            <span className="mt-1 block text-xs text-muted">
                              Added by {logAuthorName(profiles, session.user_id)}
                            </span>
                          </span>
                          <ChevronDown
                            aria-hidden
                            className={`h-5 w-5 shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
                          />
                        </button>
                      </CollapsibleTrigger>
                      {canEdit ? (
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            className={iconButtonClass}
                            aria-label="Edit weigh-in"
                            onClick={() => {
                              const original =
                                weighIns.find((item) => item.id === session.id) ?? null
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
                            onClick={() =>
                              setPendingDelete(
                                weighIns.find((item) => item.id === session.id) ?? null,
                              )
                            }
                          >
                            ✕
                          </button>
                        </div>
                      ) : null}
                    </div>
                    <CollapsibleContent>
                      <ul className="mt-3 grid gap-2 border-t border-border/70 pt-3 sm:grid-cols-2">
                        {session.weights.map((weight) => (
                          <li
                            key={weight.kitten_id}
                            className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-gray-50 px-3 py-3"
                          >
                            <KittenAvatar
                              name={weight.kittens?.name ?? 'Kitten'}
                              avatarPath={weight.kittens?.avatar_path ?? null}
                              colour={weight.kittens?.tag_colour ?? null}
                            />
                            <p className="min-w-0 text-sm font-medium leading-snug text-ink">
                              {weight.kittens?.name ?? 'Kitten'}
                            </p>
                            <div className="shrink-0 text-right">
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
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )
            })}
          </div>
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

function formatMonth(month: string) {
  return new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${month}-01T12:00:00`))
}
