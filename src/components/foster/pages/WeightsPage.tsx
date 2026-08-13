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
import {
  KittenWeightHistoryDialog,
  type WeightHistoryKitten,
} from '@/components/foster/weights/KittenWeightHistoryDialog'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { WeighInDialog } from '@/components/foster/dialogs/WeighInDialog'
import { ConfirmDialog } from '@/components/foster/settings/ConfirmDialog'
import {
  daysBetween,
  historicalWeighInsQueryOptions,
  littersQueryOptions,
  logAuthorName,
  pickCurrentLitter,
  profilesQueryOptions,
  weighInsQueryOptions,
  type WeighInRow,
} from '@/lib/foster-queries'
import { formatRelativeDay } from '@/utils/formatDate'
import { useLitterAccess } from '@/hooks/useLitterAccess'
import { groupWeighInsByDay } from '@/lib/weight-history'
import { BatchContextBar } from '@/components/foster/layout/BatchContextBar'

const iconButtonClass =
  'flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-sm text-muted transition hover:bg-brand-50 hover:text-ink'

export function WeightsPage({ litterId }: { litterId?: string }) {
  const queryClient = useQueryClient()
  const { data: litters = [] } = useQuery(littersQueryOptions)
  const litter = litterId
    ? litters.find((item) => item.id === litterId)
    : pickCurrentLitter(litters)
  const { canEdit: hasEditAccess } = useLitterAccess(litter)
  const canEdit = hasEditAccess && litter?.status === 'active'
  const { data: weighIns = [], isLoading } = useQuery(weighInsQueryOptions(litter?.id))
  const historicalLitterIds = litters
    .filter((item) => item.id !== litter?.id && item.status === 'completed')
    .map((item) => item.id)
  const { data: historicalWeighIns = [] } = useQuery(
    historicalWeighInsQueryOptions(historicalLitterIds),
  )
  const { data: profiles = [] } = useQuery(profilesQueryOptions)
  const dob = litter?.date_of_birth ?? null

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<WeighInRow | null>(null)
  const [pendingDelete, setPendingDelete] = useState<WeighInRow | null>(null)
  const [selectedMonth, setSelectedMonth] = useState('')
  const [openDays, setOpenDays] = useState<Record<string, boolean>>({})
  const [historyKitten, setHistoryKitten] = useState<WeightHistoryKitten | null>(null)

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

  // Use the latest reading for each kitten on a day, then compare it with that
  // kitten's reading from the previous day it was weighed.
  const days = useMemo(() => {
    const previousWeightByKitten = new Map<string, number>()
    return groupWeighInsByDay(weighIns)
      .reverse()
      .map((day) => ({
        ...day,
        daysOld: dob ? daysBetween(dob, day.date) : null,
        weights: day.weights.map((weight) => {
          const previousGrams = previousWeightByKitten.get(weight.kitten_id)
          previousWeightByKitten.set(weight.kitten_id, weight.grams)
          return {
            ...weight,
            changePercent:
              previousGrams && previousGrams > 0
                ? ((weight.grams - previousGrams) / previousGrams) * 100
                : null,
          }
        }),
      }))
      .reverse()
  }, [weighIns, dob])

  const months = useMemo(() => [...new Set(days.map((day) => day.date.slice(0, 7)))], [days])
  const activeMonth = months.includes(selectedMonth) ? selectedMonth : (months[0] ?? '')
  const visibleDays = days.filter((day) => day.date.startsWith(activeMonth))
  const visibleSessionCount = visibleDays.reduce((total, day) => total + day.sessions.length, 0)
  const isDayOpen = (date: string, index: number) => openDays[date] ?? index < 2
  const allDaysOpen = visibleDays.every((day, index) => isDayOpen(day.date, index))
  const kittensWithWeights = (litter?.kittens ?? []).filter((kitten) =>
    weighIns.some((session) => session.weights.some((weight) => weight.kitten_id === kitten.id)),
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
      <BatchContextBar litter={litter} litters={litters} section="weights" />

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

      <KittenWeightHistoryDialog
        kitten={historyKitten}
        weighIns={weighIns}
        onClose={() => setHistoryKitten(null)}
      />

      {isLoading ? (
        <Card>
          <p className="text-sm text-muted">Loading weigh-ins…</p>
        </Card>
      ) : days.length ? (
        <div className="space-y-4 xl:space-y-6">
          <Card padding="lg">
            <CardHeader title="Growth chart" subtitle="Kitten weight over time" />
            <WeightChart
              weighIns={weighIns}
              dateOfBirth={dob}
              historicalSeries={historicalWeighIns}
            />
            <div className="mt-4 border-t border-border pt-4">
              <p className="mb-3 text-sm font-medium text-ink">View individual history</p>
              <div className="flex flex-wrap gap-2">
                {kittensWithWeights.map((kitten) => (
                  <button
                    key={kitten.id}
                    type="button"
                    onClick={() =>
                      setHistoryKitten({
                        id: kitten.id,
                        name: kitten.name,
                        avatarPath: kitten.avatar_path,
                        colour: kitten.tag_colour,
                      })
                    }
                    className="flex min-h-12 items-center gap-2 rounded-2xl border border-border bg-white px-3 py-2 text-left text-sm font-medium text-ink transition hover:border-brand-300 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
                    aria-label={`View ${kitten.name}'s weight history`}
                  >
                    <KittenAvatar
                      name={kitten.name}
                      avatarPath={kitten.avatar_path}
                      colour={kitten.tag_colour}
                      size="sm"
                      photoPreview={false}
                    />
                    <span>{kitten.name}</span>
                  </button>
                ))}
              </div>
            </div>
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
                {visibleDays.length} day{visibleDays.length === 1 ? '' : 's'} ·{' '}
                {visibleSessionCount} weigh-in{visibleSessionCount === 1 ? '' : 's'}
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

          <div className="grid items-start gap-3 xl:grid-cols-2 xl:gap-4">
            {visibleDays.map((day, index) => {
              const open = isDayOpen(day.date, index)
              const singleSession = day.sessions.length === 1 ? day.sessions[0]! : null
              const authors = [
                ...new Set(day.sessions.map((session) => logAuthorName(profiles, session.user_id))),
              ]
              return (
                <Collapsible
                  key={day.date}
                  open={open}
                  onOpenChange={(nextOpen) =>
                    setOpenDays((current) => ({ ...current, [day.date]: nextOpen }))
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
                              {formatRelativeDay(day.date)}
                            </span>
                            <span className="mt-0.5 block text-sm text-muted">
                              {formatSessionTimes(day.sessions)} ·{' '}
                              {day.daysOld != null ? `Day ${day.daysOld} · ` : ''}
                              {day.weights.length} kitten{day.weights.length === 1 ? '' : 's'} ·{' '}
                              {day.sessions.length} session{day.sessions.length === 1 ? '' : 's'}
                            </span>
                            <span className="mt-1 block text-xs text-muted">
                              Added by {authors.join(' & ')}
                            </span>
                          </span>
                          <ChevronDown
                            aria-hidden
                            className={`h-5 w-5 shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
                          />
                        </button>
                      </CollapsibleTrigger>
                      {canEdit && singleSession ? (
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            className={iconButtonClass}
                            aria-label="Edit weigh-in"
                            onClick={() => {
                              setEditing(singleSession)
                              setDialogOpen(true)
                            }}
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            className={iconButtonClass}
                            aria-label="Delete weigh-in"
                            onClick={() => setPendingDelete(singleSession)}
                          >
                            ✕
                          </button>
                        </div>
                      ) : null}
                    </div>
                    <CollapsibleContent>
                      <ul className="mt-3 grid gap-2 border-t border-border/70 pt-3 sm:grid-cols-2">
                        {day.weights.map((weight) => (
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
                      {day.sessions.length > 1 ? (
                        <div className="mt-3 border-t border-border/70 pt-3">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                            Weigh-in sessions
                          </p>
                          <ul className="grid gap-2">
                            {day.sessions.map((session) => (
                              <li
                                key={session.id}
                                className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-white px-3 py-2"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-ink">
                                    {session.time.slice(0, 5)} · {session.weights.length} kitten
                                    {session.weights.length === 1 ? '' : 's'}
                                  </p>
                                  <p className="truncate text-xs text-muted">
                                    Added by {logAuthorName(profiles, session.user_id)}
                                    {session.notes ? ` · ${session.notes}` : ''}
                                  </p>
                                </div>
                                {canEdit ? (
                                  <div className="flex shrink-0 items-center gap-1">
                                    <button
                                      type="button"
                                      className={iconButtonClass}
                                      aria-label={`Edit ${session.time.slice(0, 5)} weigh-in`}
                                      onClick={() => {
                                        setEditing(session)
                                        setDialogOpen(true)
                                      }}
                                    >
                                      ✎
                                    </button>
                                    <button
                                      type="button"
                                      className={iconButtonClass}
                                      aria-label={`Delete ${session.time.slice(0, 5)} weigh-in`}
                                      onClick={() => setPendingDelete(session)}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : singleSession?.notes ? (
                        <p className="mt-3 text-sm text-muted">{singleSession.notes}</p>
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
            description={litter ? 'Record a weigh-in to track growth.' : 'Add a batch first.'}
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

function formatSessionTimes(sessions: WeighInRow[]) {
  const latest = sessions[0]?.time.slice(0, 5) ?? ''
  const earliest = sessions.at(-1)?.time.slice(0, 5) ?? latest
  return earliest === latest ? latest : `${earliest}–${latest}`
}
