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

interface PoopDialogProps {
  open: boolean
  onClose: () => void
  litterId: string | undefined
  entry?: PoopRow | null
}

export function PoopDialog({ open, onClose, litterId, entry }: PoopDialogProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data: kittens = [] } = useQuery(kittensQueryOptions(litterId))
  const [date, setDate] = useState(todayIso())
  const [time, setTime] = useState(nowTime())
  const [kittenId, setKittenId] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!open) return
    setDate(entry?.date ?? todayIso())
    setTime(entry?.time.slice(0, 5) ?? nowTime())
    setKittenId(entry?.kitten_id ?? '')
    setNote(entry?.note ?? '')
  }, [open, entry])

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('You need to be signed in.')
      if (!litterId) throw new Error('Add a litter first.')
      const payload = { date, time, kitten_id: kittenId || null, note: note.trim() || null }
      const { error } = entry
        ? await supabase.from('poop_entries').update(payload).eq('id', entry.id)
        : await supabase
            .from('poop_entries')
            .insert({ ...payload, litter_id: litterId, user_id: user.id })
      if (error) throw error
    },
    onSuccess: async () => {
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
      subtitle="Kitten is optional — leave it blank if unknown"
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
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
        </label>
        <label>
          <span className="mb-1 block text-sm font-medium text-ink">Time *</span>
          <input type="time" required value={time} onChange={(e) => setTime(e.target.value)} className={inputClass} />
        </label>
        <label className="sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-ink">Kitten</span>
          <select value={kittenId} onChange={(e) => setKittenId(e.target.value)} className={inputClass}>
            <option value="">Not identified</option>
            {kittens.map((kitten) => (
              <option key={kitten.id} value={kitten.id}>
                {kitten.name}
              </option>
            ))}
          </select>
        </label>
        <label className="sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-ink">Notes</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={inputClass} placeholder="Optional" />
        </label>
        <DialogActions busy={mutation.isPending} onCancel={onClose} saveLabel={entry ? 'Save changes' : 'Save entry'} />
      </form>
    </FormDialog>
  )
}
