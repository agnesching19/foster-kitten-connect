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
import type { FeedingRow } from '@/lib/foster-queries'

interface FeedingDialogProps {
  open: boolean
  onClose: () => void
  litterId: string | undefined
  feeding?: FeedingRow | null
}

export function FeedingDialog({ open, onClose, litterId, feeding }: FeedingDialogProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [date, setDate] = useState(todayIso())
  const [time, setTime] = useState(nowTime())
  const [food, setFood] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) return
    setDate(feeding?.date ?? todayIso())
    setTime(feeding?.time.slice(0, 5) ?? nowTime())
    setFood(feeding?.food ?? '')
    setNotes(feeding?.notes ?? '')
  }, [open, feeding])

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('You need to be signed in.')
      if (!litterId) throw new Error('Add a litter first.')
      const payload = {
        date,
        time,
        food: food.trim(),
        notes: notes.trim() || null,
      }
      const { error } = feeding
        ? await supabase.from('feedings').update(payload).eq('id', feeding.id)
        : await supabase
            .from('feedings')
            .insert({ ...payload, litter_id: litterId, user_id: user.id })
      if (error) throw error
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['feedings', litterId] })
      toast.success(feeding ? 'Feeding updated' : 'Feeding logged')
      onClose()
    },
    onError: (error: Error) => toast.error(error.message || 'Could not save the feeding'),
  })

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={feeding ? 'Edit feeding' : 'Log feeding'}
      subtitle="Date, time and what was served"
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
          <span className="mb-1 block text-sm font-medium text-ink">Food *</span>
          <input
            required
            value={food}
            onChange={(e) => setFood(e.target.value)}
            className={inputClass}
            placeholder="e.g. chicken pouch"
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
          saveLabel={feeding ? 'Save changes' : 'Save feeding'}
        />
      </form>
    </FormDialog>
  )
}
