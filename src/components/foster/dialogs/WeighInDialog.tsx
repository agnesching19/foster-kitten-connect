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
import { KittenAvatar } from '@/components/foster/ui/KittenAvatar'
import { catsQueryOptions, daysBetween, type WeighInRow } from '@/lib/foster-queries'
import { sendLogNotification } from '@/lib/push-notifications'

interface WeighInDialogProps {
  open: boolean
  onClose: () => void
  litterId: string | undefined
  dateOfBirth: string | null
  session?: WeighInRow | null
}

export function WeighInDialog({
  open,
  onClose,
  litterId,
  dateOfBirth,
  session,
}: WeighInDialogProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data: kittens = [] } = useQuery(catsQueryOptions(litterId))
  const [date, setDate] = useState(todayIso())
  const [time, setTime] = useState(nowTime())
  const [notes, setNotes] = useState('')
  const [grams, setGrams] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return
    setDate(session?.date ?? todayIso())
    setTime(session?.time.slice(0, 5) ?? nowTime())
    setNotes(session?.notes ?? '')
    const next: Record<string, string> = {}
    for (const weight of session?.weights ?? []) next[weight.kitten_id] = String(weight.grams)
    setGrams(next)
  }, [open, session])

  const daysOld = dateOfBirth && date ? daysBetween(dateOfBirth, date) : null

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('You need to be signed in.')
      if (!litterId) throw new Error('Add a batch first.')
      const entries = kittens
        .map((kitten) => ({ kitten_id: kitten.id, grams: Number(grams[kitten.id]) }))
        .filter((entry) => Number.isFinite(entry.grams) && entry.grams > 0)
      if (!entries.length) throw new Error('Enter at least one weight.')

      let weighInId = session?.id
      if (weighInId) {
        const { error } = await supabase
          .from('weigh_ins')
          .update({ date, time, notes: notes.trim() || null })
          .eq('id', weighInId)
        if (error) throw error
        const { error: deleteError } = await supabase
          .from('weights')
          .delete()
          .eq('weigh_in_id', weighInId)
        if (deleteError) throw deleteError
      } else {
        const { data, error } = await supabase
          .from('weigh_ins')
          .insert({
            litter_id: litterId,
            user_id: user.id,
            date,
            time,
            notes: notes.trim() || null,
          })
          .select('id')
          .single()
        if (error) throw error
        weighInId = data.id
      }

      const { error: weightsError } = await supabase.from('weights').insert(
        entries.map((entry) => ({
          user_id: user.id,
          weigh_in_id: weighInId!,
          kitten_id: entry.kitten_id,
          grams: entry.grams,
        })),
      )
      if (weightsError) throw weightsError
      return entries.length
    },
    onSuccess: async (kittenCount) => {
      if (!session && litterId) void sendLogNotification(litterId, 'weigh_in', kittenCount)
      await queryClient.invalidateQueries({ queryKey: ['weigh-ins', litterId] })
      toast.success(session ? 'Weigh-in updated' : 'Weigh-in saved')
      onClose()
    },
    onError: (error: Error) => toast.error(error.message || 'Could not save the weigh-in'),
  })

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={session ? 'Edit weigh-in' : 'New weigh-in'}
      subtitle="One session records every cat's weight"
    >
      <form
        className="grid min-w-0 gap-4 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault()
          mutation.mutate()
        }}
      >
        <label className="min-w-0">
          <span className="mb-1 block text-sm font-medium text-ink">Date *</span>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="min-w-0">
          <span className="mb-1 block text-sm font-medium text-ink">Time *</span>
          <input
            type="time"
            required
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="min-w-0 sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-ink">Days old</span>
          <input
            readOnly
            value={daysOld != null ? `Day ${daysOld}` : 'Add a date of birth to the batch'}
            className={`${inputClass} bg-gray-50 text-muted`}
          />
        </label>

        <div className="min-w-0 sm:col-span-2">
          <p className="mb-2 text-sm font-medium text-ink">Weights (grams)</p>
          {kittens.length ? (
            <div className="grid min-w-0 gap-2 sm:grid-cols-2">
              {kittens.map((kitten) => (
                <label key={kitten.id} className="flex min-w-0 items-center gap-2">
                  <KittenAvatar
                    name={kitten.name}
                    avatarPath={kitten.avatar_path}
                    colour={kitten.tag_colour}
                    size="sm"
                  />
                  <span className="w-20 shrink-0 truncate text-sm text-ink sm:w-24">
                    {kitten.name}
                  </span>
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={grams[kitten.id] ?? ''}
                    onChange={(e) => setGrams((prev) => ({ ...prev, [kitten.id]: e.target.value }))}
                    className={`${inputClass} flex-1 basis-0`}
                    placeholder="g"
                    aria-label={`Weight for ${kitten.name}`}
                  />
                </label>
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-gray-50 px-3 py-3 text-sm text-muted">
              Add cats to this batch first.
            </p>
          )}
        </div>

        <label className="min-w-0 sm:col-span-2">
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
          saveLabel={session ? 'Save changes' : 'Save weigh-in'}
        />
      </form>
    </FormDialog>
  )
}
