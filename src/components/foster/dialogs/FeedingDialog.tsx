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
  const [pouchCount, setPouchCount] = useState(1)
  const { data: storedPresets = [] } = useQuery({
    queryKey: ['feeding-food-presets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feeding_food_presets')
        .select('id, name')
        .order('name')
      if (error) throw error
      return data
    },
    enabled: open && Boolean(user),
  })
  const foodPresets = storedPresets.map((preset) => preset.name)

  useEffect(() => {
    if (!open) return
    setDate(feeding?.date ?? todayIso())
    setTime(feeding?.time.slice(0, 5) ?? nowTime())
    setFood(feeding?.food ?? '')
    setNotes(feeding?.notes ?? '')
    setPouchCount(feeding?.pouch_count ?? 1)
  }, [open, feeding])

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('You need to be signed in.')
      if (!litterId) throw new Error('Add a batch first.')
      const normalisedFood = food.trim().toLowerCase()
      const payload = {
        date,
        time,
        food: normalisedFood,
        notes: notes.trim() || null,
        pouch_count: pouchCount,
      }
      const { error } = feeding
        ? await supabase.from('feedings').update(payload).eq('id', feeding.id)
        : await supabase
            .from('feedings')
            .insert({ ...payload, litter_id: litterId, user_id: user.id })
      if (error) throw error

      if (!foodPresets.includes(normalisedFood)) {
        const { error: presetError } = await supabase
          .from('feeding_food_presets')
          .insert({ name: normalisedFood, created_by: user.id })
        if (presetError && presetError.code !== '23505') {
          console.warn('Could not save the new food preset', presetError)
        }
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['feedings', litterId] }),
        queryClient.invalidateQueries({ queryKey: ['feeding-food-presets'] }),
      ])
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
        <fieldset className="min-w-0 sm:col-span-2">
          <legend className="mb-2 text-sm font-medium text-ink">Food *</legend>
          <div className="mb-3 flex flex-wrap gap-2">
            {foodPresets.map((preset) => {
              const selected = food.trim().toLowerCase() === preset
              return (
                <button
                  key={preset}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setFood(preset)}
                  className={`rounded-full border px-3 py-2 text-sm capitalize transition ${
                    selected
                      ? 'border-brand-500 bg-brand-100 font-medium text-brand-800'
                      : 'border-border bg-white text-ink hover:border-brand-300 hover:bg-brand-50'
                  }`}
                >
                  {preset}
                </button>
              )
            })}
          </div>
          <label>
            <span className="mb-1 block text-xs text-muted">Or enter another flavour</span>
            <input
              required
              value={food}
              onChange={(e) => setFood(e.target.value)}
              className={inputClass}
              placeholder="e.g. turkey"
              maxLength={80}
            />
          </label>
          <p className="mt-1 text-xs text-muted">
            New flavours are saved to the preset list automatically.
          </p>
        </fieldset>
        <label className="sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-ink">Pouch count *</span>
          <input
            type="number"
            min={1}
            max={50}
            required
            value={pouchCount}
            onChange={(event) =>
              setPouchCount(Math.max(1, Math.min(50, Number(event.target.value))))
            }
            className={inputClass}
          />
          <span className="mt-1 block text-xs text-muted">
            Number of pouches served during this feeding.
          </span>
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
