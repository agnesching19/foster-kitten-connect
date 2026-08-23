import { useEffect, useMemo, useState } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/foster/layout/PageHeader'
import { Button } from '@/components/foster/ui/Button'
import { Card, CardHeader } from '@/components/foster/ui/Card'
import { EmptyState } from '@/components/foster/ui/EmptyState'
import { nowTime, todayIso } from '@/components/foster/ui/FormDialog'
import { LitterChangeDialog } from '@/components/foster/dialogs/LitterChangeDialog'
import { ConfirmDialog } from '@/components/foster/settings/ConfirmDialog'
import {
  litterChangesQueryOptions,
  littersQueryOptions,
  logAuthorName,
  pickCurrentLitter,
  profilesQueryOptions,
  type LitterChangeRow,
} from '@/lib/foster-queries'
import { formatRelativeDay } from '@/utils/formatDate'
import { useLitterAccess } from '@/hooks/useLitterAccess'
import { BatchContextBar } from '@/components/foster/layout/BatchContextBar'
import { LoadMoreButton } from '@/components/foster/ui/LoadMoreButton'

const iconButtonClass =
  'flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-sm text-muted transition hover:bg-brand-50 hover:text-ink'

export function LitterPage({ litterId }: { litterId?: string }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data: litters = [] } = useQuery(littersQueryOptions)
  const litter = litterId
    ? litters.find((item) => item.id === litterId)
    : pickCurrentLitter(litters)
  const { canEdit: hasEditAccess } = useLitterAccess(litter)
  const canEdit = hasEditAccess && litter?.status === 'active'
  const changesQuery = useInfiniteQuery(litterChangesQueryOptions(litter?.id))
  const changes = useMemo(() => changesQuery.data?.pages.flat() ?? [], [changesQuery.data])
  const { isLoading } = changesQuery
  const { data: profiles = [] } = useQuery(profilesQueryOptions)
  const lastChange = changes[0]
  const months = useMemo(
    () => [...new Set(changes.map((change) => change.date.slice(0, 7)))],
    [changes],
  )
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const routineHours = litter?.litter_change_interval_hours ?? 48
  const freshness = lastChange ? litterFreshness(lastChange, now, routineHours) : null

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [editing, setEditing] = useState<LitterChangeRow | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<LitterChangeRow | null>(null)
  const [selectedMonth, setSelectedMonth] = useState('')
  const activeMonth = months.includes(selectedMonth) ? selectedMonth : (months[0] ?? '')
  const visibleChanges = changes.filter((change) => change.date.startsWith(activeMonth))

  const logNow = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('You need to be signed in.')
      if (!litter) throw new Error('Add a batch first.')
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
      toast.success('Litter box change logged')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not log the litter box change'),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('litter_changes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: async () => {
      setPendingDelete(null)
      await queryClient.invalidateQueries({ queryKey: ['litter-changes', litter?.id] })
      toast.success('Litter box change deleted')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not delete the record'),
  })

  return (
    <div>
      <PageHeader title="Litter box" subtitle="Cleaning and maintenance history" />
      <BatchContextBar litter={litter} litters={litters} section="litter" />

      <ConfirmDialog
        open={confirmOpen}
        title="Log a litter box change now?"
        description={`This saves a change for ${todayIso()} at ${nowTime()}.`}
        confirmLabel="Log change"
        busy={logNow.isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => logNow.mutate()}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this litter box change?"
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

      <div
        className={
          litter?.status === 'completed'
            ? 'grid gap-5'
            : 'grid gap-5 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-8 xl:grid-cols-[minmax(0,22rem)_1fr]'
        }
      >
        {litter?.status !== 'completed' ? (
          <Card
            className={`h-fit border ${freshness?.cardClass ?? 'border-brand-200 bg-brand-50'}`}
          >
            <CardHeader
              title="Litter-box freshness"
              subtitle={lastChange ? `Changed ${freshness?.elapsed} ago` : 'No changes yet'}
            />
            {freshness ? (
              <>
                <div className="flex items-center gap-4">
                  <span
                    role="img"
                    aria-label={freshness.label}
                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/75 text-4xl shadow-sm transition-opacity"
                    style={{ opacity: freshness.emojiOpacity }}
                  >
                    {freshness.emoji}
                  </span>
                  <div className="min-w-0">
                    <p className={`text-xl font-bold ${freshness.textClass}`}>{freshness.label}</p>
                    <p className="mt-1 text-sm text-muted">{freshness.dueText}</p>
                    <p className="mt-1 text-xs text-muted">
                      Last changed {formatRelativeDay(lastChange!.date)} at{' '}
                      {lastChange!.time.slice(0, 5)}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="h-2 overflow-hidden rounded-full bg-white/80">
                    <div
                      className={`h-full rounded-full transition-[width] ${freshness.barClass}`}
                      style={{ width: `${freshness.progressPercent}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-muted">
                    <span>Just changed</span>
                    <span>{formatRoutine(routineHours)} routine</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-3xl font-bold text-brand-700 md:text-4xl">—</p>
            )}
            {canEdit ? (
              <Button
                fullWidth
                className="mt-4 md:max-w-none"
                disabled={!litter || logNow.isPending}
                onClick={() => setConfirmOpen(true)}
              >
                Log litter box change now
              </Button>
            ) : null}
          </Card>
        ) : null}

        <section aria-label="Change history">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">History</h2>
          {isLoading ? (
            <Card>
              <p className="text-sm text-muted">Loading history…</p>
            </Card>
          ) : changes.length ? (
            <div className="space-y-3">
              <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-raised p-3 shadow-sm sm:flex-row sm:items-center sm:p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <label
                    htmlFor="litter-change-month"
                    className="shrink-0 text-sm font-medium text-ink"
                  >
                    Month
                  </label>
                  <select
                    id="litter-change-month"
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
                    {visibleChanges.length} change{visibleChanges.length === 1 ? '' : 's'}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 xl:grid-cols-2">
                {visibleChanges.map((change) => (
                  <LitterChangeHistoryCard
                    key={change.id}
                    change={change}
                    author={logAuthorName(profiles, change.user_id)}
                    canEdit={canEdit}
                    onEdit={() => {
                      setEditing(change)
                      setDialogOpen(true)
                    }}
                    onDelete={() => setPendingDelete(change)}
                  />
                ))}
              </div>
              <LoadMoreButton
                hasMore={Boolean(changesQuery.hasNextPage)}
                loading={changesQuery.isFetchingNextPage}
                onLoad={() => void changesQuery.fetchNextPage()}
              />
            </div>
          ) : (
            <Card>
              <EmptyState
                icon="🧹"
                title="No litter box changes yet"
                description={litter ? 'Log a change to start the history.' : 'Add a batch first.'}
              />
            </Card>
          )}
        </section>
      </div>
    </div>
  )
}

function LitterChangeHistoryCard({
  change,
  author,
  canEdit,
  onEdit,
  onDelete,
}: {
  change: LitterChangeRow
  author: string
  canEdit: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <Card padding="sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-xl">
            🧹
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-ink">{formatRelativeDay(change.date)}</p>
            <p className="text-sm text-muted">{change.time.slice(0, 5)}</p>
            {change.notes ? <p className="truncate text-xs text-muted">{change.notes}</p> : null}
            <p className="truncate text-xs text-muted">Added by {author}</p>
          </div>
        </div>
        {canEdit ? (
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              className={iconButtonClass}
              aria-label="Edit change"
              onClick={onEdit}
            >
              ✎
            </button>
            <button
              type="button"
              className={iconButtonClass}
              aria-label="Delete change"
              onClick={onDelete}
            >
              ×
            </button>
          </div>
        ) : null}
      </div>
    </Card>
  )
}

function formatMonth(month: string) {
  return new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${month}-01T12:00:00`))
}

function litterFreshness(change: LitterChangeRow, now: number, targetHours: number) {
  const changedAt = new Date(`${change.date}T${change.time}`).getTime()
  const elapsedMs = Math.max(0, now - changedAt)
  const targetMs = targetHours * 60 * 60 * 1000
  const progress = elapsedMs / targetMs
  const remainingMs = targetMs - elapsedMs

  if (progress >= 1) {
    return {
      emoji: '🤢',
      emojiOpacity: 1,
      label: 'Change due',
      elapsed: formatDuration(elapsedMs),
      dueText: `${formatDuration(Math.abs(remainingMs))} overdue`,
      progressPercent: 100,
      cardClass: 'border-red-200 bg-red-50',
      textClass: 'text-red-700',
      barClass: 'bg-red-500',
    }
  }

  const status =
    progress >= 0.875
      ? {
          emoji: '😐',
          label: 'Due soon',
          cardClass: 'border-orange-200 bg-orange-50',
          textClass: 'text-orange-700',
          barClass: 'bg-orange-500',
        }
      : progress >= 0.5
        ? {
            emoji: '🙂',
            label: 'Still fresh',
            cardClass: 'border-amber-200 bg-amber-50',
            textClass: 'text-amber-700',
            barClass: 'bg-amber-500',
          }
        : {
            emoji: '😸',
            label: 'Fresh and clean',
            cardClass: 'border-emerald-200 bg-emerald-50',
            textClass: 'text-emerald-700',
            barClass: 'bg-emerald-500',
          }

  return {
    ...status,
    emojiOpacity: Math.max(0.55, 1 - progress * 0.45),
    elapsed: formatDuration(elapsedMs),
    dueText: `${formatDuration(remainingMs)} until the next change`,
    progressPercent: Math.max(2, progress * 100),
  }
}

function formatDuration(milliseconds: number) {
  const totalMinutes = Math.max(0, Math.floor(milliseconds / 60_000))
  if (totalMinutes < 1) return 'less than a minute'
  if (totalMinutes < 60) return `${totalMinutes}m`
  const totalHours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (totalHours < 24) return `${totalHours}h${minutes ? ` ${minutes}m` : ''}`
  const days = Math.floor(totalHours / 24)
  const hours = totalHours % 24
  return `${days}d${hours ? ` ${hours}h` : ''}`
}

function formatRoutine(hours: number) {
  if (hours < 24) return `${hours}-hour`
  const days = hours / 24
  return `${days.toLocaleString(undefined, { maximumFractionDigits: 2 })}-day`
}
