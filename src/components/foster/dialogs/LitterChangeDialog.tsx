import { useEffect, useState } from 'react'
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
import type { LitterChangeRow } from '@/lib/foster-queries'
import { sendLogNotification } from '@/lib/push-notifications'

interface LitterChangeDialogProps {
  open: boolean
  onClose: () => void
  litterId: string | undefined
  change?: LitterChangeRow | null
}

export function LitterChangeDialog({ open, onClose, litterId, change }: LitterChangeDialogProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [date, setDate] = useState(todayIso())
  const [time, setTime] = useState(nowTime())
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) return
    setDate(change?.date ?? todayIso())
    setTime(change?.time.slice(0, 5) ?? nowTime())
    setNotes(change?.notes ?? '')
  }, [open, change])

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('You need to be signed in.')
      if (!litterId) throw new Error('Add a batch first.')
      const payload = { date, time, notes: notes.trim() || null }
      const { error } = change
        ? await supabase.from('litter_changes').update(payload).eq('id', change.id)
        : await supabase
            .from('litter_changes')
            .insert({ ...payload, litter_id: litterId, user_id: user.id })
      if (error) throw error
    },
    onSuccess: async () => {
      if (!change && litterId) void sendLogNotification(litterId, 'litter_change', 1)
      await queryClient.invalidateQueries({ queryKey: ['litter-changes', litterId] })
      toast.success(change ? 'Litter box change updated' : 'Litter box change logged')
      onClose()
    },
    onError: (error: Error) => toast.error(error.message || 'Could not save the litter box change'),
  })

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={change ? 'Edit litter box change' : 'Log litter box change'}
      subtitle="When the tray was last cleaned"
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
        <label className="sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-ink">Notes</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className={inputClass}
            placeholder="Optional"
          />
        </label>
        <DialogActions
          busy={mutation.isPending}
          onCancel={onClose}
          saveLabel={change ? 'Save changes' : 'Save change'}
        />
      </form>
    </FormDialog>
  )
}
