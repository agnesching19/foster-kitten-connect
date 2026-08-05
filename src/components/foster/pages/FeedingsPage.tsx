import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { PageHeader } from '@/components/foster/layout/PageHeader'
import { Badge } from '@/components/foster/ui/Badge'
import { Button } from '@/components/foster/ui/Button'
import { Card } from '@/components/foster/ui/Card'
import { EmptyState } from '@/components/foster/ui/EmptyState'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { FeedingDialog } from '@/components/foster/dialogs/FeedingDialog'
import { ConfirmDialog } from '@/components/foster/settings/ConfirmDialog'
import {
  feedingsQueryOptions,
  groupByDate,
  littersQueryOptions,
  logAuthorName,
  pickCurrentLitter,
  profilesQueryOptions,
  type FeedingRow,
  type ProfileRow,
} from '@/lib/foster-queries'
import { formatRelativeDay } from '@/utils/formatDate'
import { useLitterAccess } from '@/hooks/useLitterAccess'

const iconButtonClass =
  'flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-sm text-muted transition hover:bg-brand-50 hover:text-ink'

export function FeedingsPage() {
  const queryClient = useQueryClient()
  const { data: litters = [], isLoading: littersLoading } = useQuery(littersQueryOptions)
  const litter = pickCurrentLitter(litters)
  const { canEdit } = useLitterAccess(litter)
  const { data: feedings = [], isLoading } = useQuery(feedingsQueryOptions(litter?.id))
  const { data: profiles = [] } = useQuery(profilesQueryOptions)
  const days = useMemo(() => groupByDate(feedings), [feedings])
  const months = useMemo(() => [...new Set(days.map((day) => day.date.slice(0, 7)))], [days])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<FeedingRow | null>(null)
  const [pendingDelete, setPendingDelete] = useState<FeedingRow | null>(null)
  const [selectedMonth, setSelectedMonth] = useState('')
  const [openDays, setOpenDays] = useState<Record<string, boolean>>({})

  const activeMonth = months.includes(selectedMonth) ? selectedMonth : (months[0] ?? '')
  const visibleDays = days.filter((day) => day.date.startsWith(activeMonth))
  const visibleFeedingCount = visibleDays.reduce((total, day) => total + day.items.length, 0)
  const isDayOpen = (date: string, index: number) => openDays[date] ?? index < 2
  const allDaysOpen = visibleDays.every((day, index) => isDayOpen(day.date, index))

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
          canEdit ? (
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
          ) : null
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
        <div className="space-y-4 lg:space-y-6">
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-raised p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <div className="flex min-w-0 items-center gap-3">
              <label htmlFor="feeding-month" className="shrink-0 text-sm font-medium text-ink">
                Month
              </label>
              <select
                id="feeding-month"
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
                {visibleDays.length} day{visibleDays.length === 1 ? '' : 's'} ·{' '}
                {visibleFeedingCount} feeding{visibleFeedingCount === 1 ? '' : 's'}
              </p>
            </div>
            <button
              type="button"
              className="min-h-11 shrink-0 rounded-xl px-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
              onClick={() =>
                setOpenDays((current) => ({
                  ...current,
                  ...Object.fromEntries(visibleDays.map((day) => [day.date, !allDaysOpen])),
                }))
              }
            >
              {allDaysOpen ? 'Collapse all' : 'Expand all'}
            </button>
          </div>

          <div className="grid items-start gap-3 lg:grid-cols-2 lg:gap-4">
            {visibleDays.map((day, index) => {
              const open = isDayOpen(day.date, index)
              return (
                <FeedingDayCard
                  key={day.date}
                  date={day.date}
                  feedings={day.items}
                  profiles={profiles}
                  canEdit={canEdit}
                  open={open}
                  onOpenChange={(nextOpen) =>
                    setOpenDays((current) => ({ ...current, [day.date]: nextOpen }))
                  }
                  onEdit={(feeding) => {
                    setEditing(feeding)
                    setDialogOpen(true)
                  }}
                  onDelete={setPendingDelete}
                />
              )
            })}
          </div>
        </div>
      ) : (
        <Card>
          <EmptyState
            icon="🍼"
            title="No feedings logged"
            description={
              litter ? 'Log a feeding to start the daily record.' : 'Add a litter first.'
            }
          />
        </Card>
      )}
    </div>
  )
}

function FeedingDayCard({
  date,
  feedings,
  profiles,
  canEdit,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: {
  date: string
  feedings: FeedingRow[]
  profiles: ProfileRow[]
  canEdit: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (feeding: FeedingRow) => void
  onDelete: (feeding: FeedingRow) => void
}) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <Card>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex min-h-11 w-full items-center justify-between gap-3 text-left"
          >
            <span>
              <span className="block font-semibold text-ink">{formatRelativeDay(date)}</span>
              <span className="mt-0.5 block text-sm text-muted">
                {feedings.length} feeding{feedings.length === 1 ? '' : 's'}
              </span>
            </span>
            <ChevronDown
              aria-hidden
              className={`h-5 w-5 shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ul className="mt-3 divide-y divide-border/70 border-t border-border/70">
            {feedings.map((feeding) => (
              <li
                key={feeding.id}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1 py-3 last:pb-0"
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
                      <Badge label={`Pouch ${feeding.meal_number}`} color="brand" />
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-sm capitalize text-muted">{feeding.food}</p>
                  {feeding.notes && <p className="mt-0.5 text-xs text-muted">{feeding.notes}</p>}
                  <p className="mt-1 text-xs text-muted">
                    Added by {logAuthorName(profiles, feeding.user_id)}
                  </p>
                </div>
                {canEdit ? (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      className={iconButtonClass}
                      aria-label="Edit feeding"
                      onClick={() => onEdit(feeding)}
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      className={iconButtonClass}
                      aria-label="Delete feeding"
                      onClick={() => onDelete(feeding)}
                    >
                      ✕
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

function formatMonth(month: string) {
  return new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${month}-01T12:00:00`))
}
