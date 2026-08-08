import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
import { kittensQueryOptions, type PoopRow } from '@/lib/foster-queries'
import { CountStepper } from '@/components/foster/ui/CountStepper'

interface PoopDialogProps {
  open: boolean
  onClose: () => void
  litterId: string | undefined
  entries?: PoopRow[]
  motherName?: string | null
  /** Optional entry point hint: a Momma-specific launcher defaults to mother. */
  defaultSubject?: 'mother' | 'kitten'
}

// Remembers the last subject picked during this browser session.
let lastSubject: 'mother' | 'kitten' = 'kitten'

export function PoopDialog({
  open,
  onClose,
  litterId,
  entries = [],
  motherName,
  defaultSubject,
}: PoopDialogProps) {
  const { user } = useAuth()
  const entry = entries[0] ?? null
  const queryClient = useQueryClient()
  const { data: kittens = [] } = useQuery(kittensQueryOptions(litterId))
  const [date, setDate] = useState(todayIso())
  const [time, setTime] = useState(nowTime())
  const [subject, setSubject] = useState<'mother' | 'kitten'>('kitten')
  const [kittenId, setKittenId] = useState('')
  const [note, setNote] = useState('')
  const [portions, setPortions] = useState(1)
  const [motherCount, setMotherCount] = useState(0)
  const [kittenCount, setKittenCount] = useState(0)

  useEffect(() => {
    if (!open) return
    setDate(entry?.date ?? todayIso())
    setTime(entry?.time.slice(0, 5) ?? nowTime())
    const nextSubject = entry?.subject_type ?? defaultSubject ?? lastSubject
    setSubject(nextSubject)
    setKittenId(entry?.kitten_id ?? '')
    setNote(entry?.note ?? '')
    setPortions(Math.max(1, entries.length))
    setMotherCount(0)
    setKittenCount(0)
  }, [open, entry, entries.length, defaultSubject])

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('You need to be signed in.')
      if (!litterId) throw new Error('Add a batch first.')
      const sharedPayload = {
        date,
        time,
        note: note.trim() || null,
      }
      if (entry) {
        const payload = {
          ...sharedPayload,
          subject_type: subject,
          kitten_id: subject === 'kitten' ? kittenId || null : null,
        }
        const retainedIds = entries.slice(0, portions).map((item) => item.id)
        const removedIds = entries.slice(portions).map((item) => item.id)
        if (retainedIds.length) {
          const { error } = await supabase
            .from('poop_entries')
            .update(payload)
            .in('id', retainedIds)
          if (error) throw error
        }
        if (removedIds.length) {
          const { error } = await supabase.from('poop_entries').delete().in('id', removedIds)
          if (error) throw error
        }
        const additional = Math.max(0, portions - entries.length)
        if (additional) {
          const { error } = await supabase.from('poop_entries').insert(
            Array.from({ length: additional }, () => ({
              ...payload,
              litter_id: litterId,
              user_id: user.id,
            })),
          )
          if (error) throw error
        }
      } else {
        if (motherCount + kittenCount < 1) throw new Error('Add at least one poop.')
        const rows = [
          ...Array.from({ length: motherCount }, () => ({
            ...sharedPayload,
            subject_type: 'mother' as const,
            kitten_id: null,
            litter_id: litterId,
            user_id: user.id,
          })),
          ...Array.from({ length: kittenCount }, () => ({
            ...sharedPayload,
            subject_type: 'kitten' as const,
            kitten_id: kittenId || null,
            litter_id: litterId,
            user_id: user.id,
          })),
        ]
        const { error } = await supabase.from('poop_entries').insert(rows)
        if (error) throw error
      }
    },
    onSuccess: async () => {
      lastSubject = entry ? subject : motherCount > 0 && kittenCount === 0 ? 'mother' : 'kitten'
      await queryClient.invalidateQueries({ queryKey: ['poops', litterId] })
      toast.success(entry ? 'Entry updated' : 'Poop logged')
      onClose()
    },
    onError: (error: Error) => toast.error(error.message || 'Could not save the entry'),
  })

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={entry ? 'Edit entry' : 'Log poop'}
      subtitle={
        !entry
          ? 'Record Momma and kitten poops together'
          : subject === 'mother'
            ? 'Recording a poop for the mother cat'
            : 'Kitten is optional — leave it blank if unknown'
      }
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
        {entry ? (
          <label className="sm:col-span-2">
            <span className="mb-1 block text-sm font-medium text-ink">Subject *</span>
            <select
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value as 'mother' | 'kitten')}
              className={inputClass}
            >
              <option value="mother">{motherName ? `Mother (${motherName})` : 'Mother'}</option>
              <option value="kitten">Kitten</option>
            </select>
          </label>
        ) : (
          <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
            <div>
              <label
                htmlFor="mother-poop-count"
                className="mb-1 block text-sm font-medium text-ink"
              >
                {motherName ? `Momma (${motherName})` : 'Momma'}
              </label>
              <CountStepper
                id="mother-poop-count"
                value={motherCount}
                min={0}
                onChange={setMotherCount}
              />
            </div>
            <div>
              <label
                htmlFor="kitten-poop-count"
                className="mb-1 block text-sm font-medium text-ink"
              >
                Kittens
              </label>
              <CountStepper
                id="kitten-poop-count"
                value={kittenCount}
                min={0}
                onChange={setKittenCount}
              />
            </div>
            <p className="text-xs text-muted sm:col-span-2">
              Each poop is saved separately and counted in the daily totals.
            </p>
          </div>
        )}
        {(entry ? subject === 'kitten' : kittenCount > 0) ? (
          <label className="sm:col-span-2">
            <span className="mb-1 block text-sm font-medium text-ink">Kitten</span>
            <select
              value={kittenId}
              onChange={(e) => setKittenId(e.target.value)}
              className={inputClass}
            >
              <option value="">Not identified</option>
              {kittens.map((kitten) => (
                <option key={kitten.id} value={kitten.id}>
                  {kitten.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {entry ? (
          <div className="sm:col-span-2">
            <label htmlFor="poop-count" className="mb-1 block text-sm font-medium text-ink">
              Count *
            </label>
            <CountStepper id="poop-count" value={portions} onChange={setPortions} />
            <span className="mt-1 block text-xs text-muted">
              Number of poops recorded at this time. Each is counted separately in daily totals.
            </span>
          </div>
        ) : null}
        <label className="sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-ink">Notes</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className={inputClass}
            placeholder="Optional"
          />
        </label>
        <DialogActions
          busy={mutation.isPending}
          onCancel={onClose}
          saveLabel={entry ? 'Save changes' : 'Save entry'}
        />
      </form>
    </FormDialog>
  )
}
