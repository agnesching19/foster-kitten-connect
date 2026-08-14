import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import {
  DialogActions,
  FormDialog,
  inputClass,
  nowTime,
  todayIso,
} from '@/components/foster/ui/FormDialog'
import type {
  DailyNoteRow,
  KittenRow,
  NoteCategory,
  NoteImportance,
  NoteSubject,
} from '@/lib/foster-queries'
import { noteCategories } from '@/lib/note-categories'

const healthTerms = [
  'vomit',
  'diarrhoea',
  'diarrhea',
  'not eating',
  'letharg',
  'sick',
  'blood',
  'cough',
  'sneeze',
  'wound',
]

export function NoteDialog({
  open,
  onClose,
  litterId,
  kittens,
  motherName,
  primaryLabel,
  showKittens,
  entry,
}: {
  open: boolean
  onClose: () => void
  litterId: string | undefined
  kittens: KittenRow[]
  motherName: string | undefined
  primaryLabel: string
  showKittens: boolean
  entry?: DailyNoteRow | null
}) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [date, setDate] = useState(todayIso())
  const [time, setTime] = useState(nowTime())
  const [category, setCategory] = useState<NoteCategory>('general')
  const [importance, setImportance] = useState<NoteImportance>('normal')
  const [subject, setSubject] = useState<NoteSubject>('batch')
  const [kittenIds, setKittenIds] = useState<string[]>([])
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!open) return
    setDate(entry?.date ?? todayIso())
    setTime(entry?.time?.slice(0, 5) ?? nowTime())
    setCategory(entry?.category ?? 'general')
    setImportance(entry?.importance ?? 'normal')
    setSubject(entry?.subject_type ?? 'batch')
    setKittenIds(entry?.kitten_ids ?? [])
    setNote(entry?.note ?? '')
  }, [entry, open])

  const suggestsHealth = useMemo(
    () => category !== 'health' && healthTerms.some((term) => note.toLowerCase().includes(term)),
    [category, note],
  )

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('You need to be signed in.')
      if (!litterId) throw new Error('Add a batch first.')
      if (!note.trim()) throw new Error('Add a note first.')
      if (subject === 'kittens' && kittenIds.length === 0)
        throw new Error('Choose at least one kitten.')
      const payload = {
        date,
        time,
        note: note.trim(),
        category,
        importance,
        subject_type: subject,
        kitten_ids: subject === 'kittens' ? kittenIds : [],
      }
      const { error } = entry
        ? await supabase.from('daily_notes').update(payload).eq('id', entry.id)
        : await supabase.from('daily_notes').insert({
            ...payload,
            litter_id: litterId,
            user_id: user.id,
          })
      if (error) throw error
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['daily-notes', litterId] })
      toast.success(entry ? 'Note updated' : 'Note added')
      onClose()
    },
    onError: (error: Error) => toast.error(error.message || 'Could not save the note'),
  })

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={entry ? 'Edit note' : 'Add note'}
      subtitle="Record milestones, behaviour, health and general observations"
    >
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault()
          mutation.mutate()
        }}
      >
        <label>
          <span className="mb-1 block text-sm font-medium text-ink">Date *</span>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </label>
        <label>
          <span className="mb-1 block text-sm font-medium text-ink">Time *</span>
          <input
            type="time"
            required
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={inputClass}
          />
        </label>
        <label>
          <span className="mb-1 block text-sm font-medium text-ink">Category *</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as NoteCategory)}
            className={inputClass}
          >
            {noteCategories.map((option) => (
              <option key={option.value} value={option.value}>
                {option.emoji} {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-1 block text-sm font-medium text-ink">Importance</span>
          <select
            value={importance}
            onChange={(e) => setImportance(e.target.value as NoteImportance)}
            className={inputClass}
          >
            <option value="normal">Normal</option>
            <option value="important">Important</option>
          </select>
        </label>
        <label className="sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-ink">About *</span>
          <select
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value as NoteSubject)
              if (e.target.value !== 'kittens') setKittenIds([])
            }}
            className={inputClass}
          >
            <option value="batch">Whole batch</option>
            <option value="mother">
              {primaryLabel}
              {motherName ? ` (${motherName})` : ''}
            </option>
            {showKittens && <option value="kittens">One or more kittens</option>}
          </select>
        </label>
        {subject === 'kittens' ? (
          <fieldset className="rounded-xl border border-border p-3 sm:col-span-2">
            <legend className="px-1 text-sm font-medium text-ink">Kittens *</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {kittens.map((kitten) => (
                <label
                  key={kitten.id}
                  className="flex min-h-11 items-center gap-2 rounded-xl bg-gray-50 px-3 text-sm text-ink"
                >
                  <input
                    type="checkbox"
                    checked={kittenIds.includes(kitten.id)}
                    onChange={(e) =>
                      setKittenIds((current) =>
                        e.target.checked
                          ? [...current, kitten.id]
                          : current.filter((id) => id !== kitten.id),
                      )
                    }
                  />
                  {kitten.name}
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}
        <label className="sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-ink">Note *</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            required
            className={inputClass}
            placeholder="What happened?"
          />
        </label>
        {suggestsHealth ? (
          <button
            type="button"
            className="rounded-xl bg-amber-50 px-3 py-2 text-left text-sm text-amber-800 sm:col-span-2"
            onClick={() => setCategory('health')}
          >
            This may be health-related. Tag as Health?
          </button>
        ) : null}
        <DialogActions
          busy={mutation.isPending}
          onCancel={onClose}
          saveLabel={entry ? 'Save changes' : 'Add note'}
        />
      </form>
    </FormDialog>
  )
}
