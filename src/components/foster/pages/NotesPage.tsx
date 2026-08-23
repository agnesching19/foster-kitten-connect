import { useMemo, useState } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/foster/ui/Button'
import { Card } from '@/components/foster/ui/Card'
import { EmptyState } from '@/components/foster/ui/EmptyState'
import { PageHeader } from '@/components/foster/layout/PageHeader'
import { ConfirmDialog } from '@/components/foster/settings/ConfirmDialog'
import { NoteDialog } from '@/components/foster/dialogs/NoteDialog'
import { noteCategories } from '@/lib/note-categories'
import { useLitterAccess } from '@/hooks/useLitterAccess'
import {
  dailyNotesQueryOptions,
  kittensQueryOptions,
  littersQueryOptions,
  logAuthorName,
  pickCurrentLitter,
  profilesQueryOptions,
  type DailyNoteRow,
  type NoteCategory,
} from '@/lib/foster-queries'
import { formatRelativeDay } from '@/utils/formatDate'
import { BatchContextBar } from '@/components/foster/layout/BatchContextBar'
import { LoadMoreButton } from '@/components/foster/ui/LoadMoreButton'

const iconButtonClass =
  'flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-sm text-muted transition hover:bg-brand-50 hover:text-ink'

export function NotesPage({ litterId }: { litterId?: string }) {
  const queryClient = useQueryClient()
  const { data: litters = [] } = useQuery(littersQueryOptions)
  const litter = litterId
    ? litters.find((item) => item.id === litterId)
    : pickCurrentLitter(litters)
  const { canEdit: hasEditAccess } = useLitterAccess(litter)
  const canEdit = hasEditAccess && litter?.status === 'active'
  const notesQuery = useInfiniteQuery(dailyNotesQueryOptions(litter?.id))
  const notes = useMemo(() => notesQuery.data?.pages.flat() ?? [], [notesQuery.data])
  const { isLoading } = notesQuery
  const { data: kittens = [] } = useQuery(kittensQueryOptions(litter?.id))
  const { data: profiles = [] } = useQuery(profilesQueryOptions)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<DailyNoteRow | null>(null)
  const [pendingDelete, setPendingDelete] = useState<DailyNoteRow | null>(null)
  const [selectedMonth, setSelectedMonth] = useState('')
  const [category, setCategory] = useState<'all' | NoteCategory>('all')
  const [subject, setSubject] = useState('all')
  const months = useMemo(() => [...new Set(notes.map((entry) => entry.date.slice(0, 7)))], [notes])
  const activeMonth = months.includes(selectedMonth) ? selectedMonth : (months[0] ?? '')
  const visibleNotes = useMemo(
    () =>
      notes.filter((entry) => {
        if (!entry.date.startsWith(activeMonth)) return false
        if (category !== 'all' && entry.category !== category) return false
        if (subject === 'batch' || subject === 'mother') return entry.subject_type === subject
        if (subject !== 'all') return entry.kitten_ids.includes(subject)
        return true
      }),
    [activeMonth, category, notes, subject],
  )
  const grouped = useMemo(() => groupByDate(visibleNotes), [visibleNotes])

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('daily_notes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: async () => {
      setPendingDelete(null)
      await queryClient.invalidateQueries({ queryKey: ['daily-notes', litter?.id] })
      toast.success('Note deleted')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not delete the note'),
  })

  return (
    <div>
      <PageHeader
        title="Notes"
        subtitle="Milestones, behaviour, health and everyday observations"
        action={
          canEdit ? (
            <Button
              size="md"
              onClick={() => {
                setEditing(null)
                setDialogOpen(true)
              }}
            >
              + Add note
            </Button>
          ) : null
        }
      />
      <BatchContextBar litter={litter} litters={litters} section="notes" />
      <NoteDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        litterId={litter?.id}
        kittens={kittens}
        motherName={litter?.primary_cat?.name}
        primaryLabel={litter?.batch_type === 'single' ? 'Foster cat' : 'Momma'}
        showKittens={litter?.batch_type !== 'single'}
        entry={editing}
      />
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this note?"
        description="This cannot be undone."
        confirmLabel="Delete"
        busy={remove.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && remove.mutate(pendingDelete.id)}
      />

      <Card padding="sm" className="mb-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,12rem)_1fr_1fr]">
          <label>
            <span className="mb-1 block text-sm font-medium text-ink">Month</span>
            <select
              value={activeMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-ink"
            >
              {months.map((month) => (
                <option key={month} value={month}>
                  {formatMonth(month)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-sm font-medium text-ink">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as 'all' | NoteCategory)}
              className="min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-ink"
            >
              <option value="all">All categories</option>
              {noteCategories.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.emoji} {item.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-sm font-medium text-ink">Subject</span>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-ink"
            >
              <option value="all">Everyone</option>
              <option value="batch">Whole batch</option>
              <option value="mother">
                {litter?.batch_type === 'single' ? 'Foster cat' : 'Momma'}
                {litter?.primary_cat ? ` (${litter.primary_cat.name})` : ''}
              </option>
              {kittens.map((kitten) => (
                <option key={kitten.id} value={kitten.id}>
                  {kitten.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      {isLoading ? (
        <Card>
          <p className="text-sm text-muted">Loading notes…</p>
        </Card>
      ) : grouped.length ? (
        <div>
          <div className="grid items-start gap-5 lg:grid-cols-2">
            {grouped.map((day) => (
              <section key={day.date}>
                <h2 className="mb-2 text-sm font-semibold text-muted">
                  {formatRelativeDay(day.date)}
                </h2>
                <div className="grid gap-3">
                  {day.items.map((entry) => {
                    const categoryMeta =
                      noteCategories.find((item) => item.value === entry.category) ??
                      noteCategories.at(-1)!
                    return (
                      <Card
                        key={entry.id}
                        padding="sm"
                        className={
                          entry.importance === 'important' ? 'border-amber-300 bg-amber-50/40' : ''
                        }
                      >
                        <div className="flex justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xl">{categoryMeta.emoji}</span>
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-ink">
                                {categoryMeta.label}
                              </span>
                              {entry.importance === 'important' ? (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                                  Important
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-3 whitespace-pre-wrap text-sm text-ink">
                              {entry.note}
                            </p>
                            <p className="mt-3 text-xs text-muted">
                              {entry.time ? `${entry.time.slice(0, 5)} · ` : ''}
                              {subjectLabel(
                                entry,
                                litter?.primary_cat?.name,
                                litter?.batch_type === 'single' ? 'Foster cat' : 'Momma',
                                kittens,
                              )}{' '}
                              · Added by {logAuthorName(profiles, entry.user_id)}
                            </p>
                          </div>
                          {canEdit ? (
                            <div className="flex shrink-0 gap-1">
                              <button
                                type="button"
                                className={iconButtonClass}
                                aria-label="Edit note"
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
                                aria-label="Delete note"
                                onClick={() => setPendingDelete(entry)}
                              >
                                ×
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <EmptyState
            icon="📝"
            title={notes.length ? 'No matching notes' : 'No notes yet'}
            description={
              notes.length
                ? 'Try changing the filters.'
                : 'Add a milestone, health update or general observation.'
            }
          />
        </Card>
      )}
      <LoadMoreButton
        hasMore={Boolean(notesQuery.hasNextPage)}
        loading={notesQuery.isFetchingNextPage}
        onLoad={() => void notesQuery.fetchNextPage()}
      />
    </div>
  )
}

function groupByDate(notes: DailyNoteRow[]) {
  const groups = new Map<string, DailyNoteRow[]>()
  notes.forEach((entry) => groups.set(entry.date, [...(groups.get(entry.date) ?? []), entry]))
  return Array.from(groups, ([date, items]) => ({ date, items }))
}

function formatMonth(month: string) {
  return new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${month}-01T12:00:00`))
}

function subjectLabel(
  entry: DailyNoteRow,
  motherName: string | undefined,
  primaryLabel: string,
  kittens: { id: string; name: string }[],
) {
  if (entry.subject_type === 'batch') return 'Whole batch'
  if (entry.subject_type === 'mother')
    return motherName ? `${primaryLabel} (${motherName})` : primaryLabel
  return (
    entry.kitten_ids
      .map((id) => kittens.find((kitten) => kitten.id === id)?.name)
      .filter(Boolean)
      .join(', ') || 'Kittens'
  )
}
