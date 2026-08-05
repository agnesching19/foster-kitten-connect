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
import { KittenAvatar } from '@/components/foster/ui/KittenAvatar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { PoopDialog } from '@/components/foster/dialogs/PoopDialog'
import { ConfirmDialog } from '@/components/foster/settings/ConfirmDialog'
import {
  groupByDate,
  littersQueryOptions,
  logAuthorName,
  pickCurrentLitter,
  poopsQueryOptions,
  profilesQueryOptions,
  type PoopRow,
  type ProfileRow,
} from '@/lib/foster-queries'
import { formatRelativeDay } from '@/utils/formatDate'
import { useLitterAccess } from '@/hooks/useLitterAccess'

const iconButtonClass =
  'flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-sm text-muted transition hover:bg-brand-50 hover:text-ink'

export function PoopsPage() {
  const queryClient = useQueryClient()
  const { data: litters = [], isLoading: littersLoading } = useQuery(littersQueryOptions)
  const litter = pickCurrentLitter(litters)
  const { canEdit } = useLitterAccess(litter)
  const { data: entries = [], isLoading } = useQuery(poopsQueryOptions(litter?.id))
  const { data: profiles = [] } = useQuery(profilesQueryOptions)
  const days = useMemo(() => groupByDate(entries), [entries])
  const months = useMemo(() => [...new Set(days.map((day) => day.date.slice(0, 7)))], [days])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PoopRow | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PoopRow | null>(null)
  const [selectedMonth, setSelectedMonth] = useState('')
  const [openDays, setOpenDays] = useState<Record<string, boolean>>({})

  const activeMonth = months.includes(selectedMonth) ? selectedMonth : (months[0] ?? '')
  const visibleDays = days.filter((day) => day.date.startsWith(activeMonth))
  const visibleEntryCount = visibleDays.reduce((total, day) => total + day.items.length, 0)
  const isDayOpen = (date: string, index: number) => openDays[date] ?? index < 2
  const allDaysOpen = visibleDays.every((day, index) => isDayOpen(day.date, index))

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

      <PoopDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        litterId={litter?.id}
        entry={editing}
        motherName={litter?.mother_name ?? null}
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
        <div className="space-y-4 lg:space-y-6">
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-raised p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <div className="flex min-w-0 items-center gap-3">
              <label htmlFor="poop-month" className="shrink-0 text-sm font-medium text-ink">
                Month
              </label>
              <select
                id="poop-month"
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
                {visibleDays.length} day{visibleDays.length === 1 ? '' : 's'} · {visibleEntryCount}{' '}
                entr{visibleEntryCount === 1 ? 'y' : 'ies'}
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
                <PoopDayCard
                  key={day.date}
                  date={day.date}
                  entries={day.items}
                  profiles={profiles}
                  motherName={litter?.mother_name ?? null}
                  canEdit={canEdit}
                  open={open}
                  onOpenChange={(nextOpen) =>
                    setOpenDays((current) => ({ ...current, [day.date]: nextOpen }))
                  }
                  onEdit={(entry) => {
                    setEditing(entry)
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
            icon="💩"
            title="No entries yet"
            description={litter ? 'Log a poop to start tracking.' : 'Add a litter first.'}
          />
        </Card>
      )}
    </div>
  )
}

function PoopDayCard({
  date,
  entries,
  profiles,
  motherName,
  canEdit,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: {
  date: string
  entries: PoopRow[]
  profiles: ProfileRow[]
  motherName: string | null
  canEdit: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (entry: PoopRow) => void
  onDelete: (entry: PoopRow) => void
}) {
  const groups = [
    {
      key: 'mother',
      label: `Momma${motherName ? ` (${motherName})` : ''}`,
      entries: entries.filter((entry) => entry.subject_type === 'mother'),
    },
    {
      key: 'kitten',
      label: 'Kittens',
      entries: entries.filter((entry) => entry.subject_type === 'kitten'),
    },
  ].filter((group) => group.entries.length)

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
                {entries.length} entr{entries.length === 1 ? 'y' : 'ies'}
              </span>
            </span>
            <ChevronDown
              aria-hidden
              className={`h-5 w-5 shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-3 space-y-4 border-t border-border/70 pt-3">
            {groups.map((group) => (
              <section
                key={group.key}
                className={`overflow-hidden rounded-xl border ${
                  group.key === 'mother' ? 'border-amber-200' : 'border-brand-200'
                }`}
              >
                <div
                  className={`flex items-center justify-between gap-3 px-3 py-2.5 ${
                    group.key === 'mother' ? 'bg-amber-100/70' : 'bg-brand-50'
                  }`}
                >
                  <h3 className="text-sm font-semibold text-ink">{group.label}</h3>
                  <span className="text-xs text-muted">
                    {group.entries.length} entr{group.entries.length === 1 ? 'y' : 'ies'}
                  </span>
                </div>
                <ul className="divide-y divide-border/70 bg-white px-3">
                  {group.entries.map((entry) => (
                    <li
                      key={entry.id}
                      className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1 py-3 last:pb-4"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-lg">
                        💩
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <p className="text-base font-semibold tabular-nums text-ink">
                            {entry.time.slice(0, 5)}
                          </p>
                          {entry.subject_type === 'mother' ? (
                            <Badge label="Momma" color="neutral" />
                          ) : entry.kitten_id ? (
                            <span className="flex items-center gap-1.5">
                              <KittenAvatar
                                name={entry.kittens?.name ?? 'Kitten'}
                                avatarPath={entry.kittens?.avatar_path ?? null}
                                colour={entry.kittens?.tag_colour ?? null}
                                size="sm"
                              />
                              <Badge label={entry.kittens?.name ?? 'Kitten'} color="neutral" />
                            </span>
                          ) : (
                            <Badge label="Not identified" color="neutral" />
                          )}
                        </div>
                        {entry.note ? (
                          <p className="mt-0.5 text-sm text-muted">{formatPoopNote(entry.note)}</p>
                        ) : null}
                        <p className="mt-1 text-xs text-muted">
                          Added by {logAuthorName(profiles, entry.user_id)}
                        </p>
                      </div>
                      {canEdit ? (
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            className={iconButtonClass}
                            aria-label="Edit entry"
                            onClick={() => onEdit(entry)}
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            className={iconButtonClass}
                            aria-label="Delete entry"
                            onClick={() => onDelete(entry)}
                          >
                            ✕
                          </button>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
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

function formatPoopNote(note: string) {
  return note
    .replace(/[()]/g, '')
    .replace(/\bx\s+(\d+)/gi, 'x$1')
    .replace(/\s{2,}/g, ' ')
    .trim()
}
