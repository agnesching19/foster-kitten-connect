import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown } from 'lucide-react'
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
import { CountStepper } from '@/components/foster/ui/CountStepper'

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
  const [flavours, setFlavours] = useState<string[]>([''])
  const [customFlavours, setCustomFlavours] = useState<boolean[]>([false])
  const [notes, setNotes] = useState('')
  const [pouchCount, setPouchCount] = useState(1)
  const { data: storedPresets } = useQuery({
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
  const foodPresets = useMemo(
    () => (storedPresets ?? []).map((preset) => preset.name),
    [storedPresets],
  )

  useEffect(() => {
    if (!open) return
    setDate(feeding?.date ?? todayIso())
    setTime(feeding?.time.slice(0, 5) ?? nowTime())
    const nextFlavours = feeding?.flavours?.length ? feeding.flavours : [feeding?.food ?? '']
    setFlavours(nextFlavours)
    setCustomFlavours(
      nextFlavours.map((flavour) => Boolean(flavour) && !foodPresets.includes(flavour)),
    )
    setNotes(feeding?.notes ?? '')
    setPouchCount(feeding?.pouch_count ?? 1)
  }, [open, feeding, foodPresets])

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('You need to be signed in.')
      if (!litterId) throw new Error('Add a batch first.')
      const normalisedFlavours = flavours.map((flavour) => flavour.trim().toLowerCase())
      if (normalisedFlavours.some((flavour) => !flavour)) {
        throw new Error('Choose a flavour for every pouch.')
      }
      const normalisedFood = normalisedFlavours.join(' + ')
      const payload = {
        date,
        time,
        food: normalisedFood,
        flavours: normalisedFlavours,
        notes: notes.trim() || null,
        pouch_count: pouchCount,
      }
      const { error } = feeding
        ? await supabase.from('feedings').update(payload).eq('id', feeding.id)
        : await supabase
            .from('feedings')
            .insert({ ...payload, litter_id: litterId, user_id: user.id })
      if (error) throw error

      for (const flavour of new Set(normalisedFlavours)) {
        if (!foodPresets.includes(flavour)) {
          const { error: presetError } = await supabase
            .from('feeding_food_presets')
            .insert({ name: flavour, created_by: user.id })
          if (presetError && presetError.code !== '23505') {
            console.warn('Could not save the new food preset', presetError)
          }
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
        <div className="sm:col-span-2">
          <label htmlFor="feeding-pouch-count" className="mb-1 block text-sm font-medium text-ink">
            Pouch count *
          </label>
          <CountStepper
            id="feeding-pouch-count"
            value={pouchCount}
            onChange={(count) => {
              setPouchCount(count)
              setFlavours((current) =>
                Array.from({ length: count }, (_, index) => current[index] ?? current.at(-1) ?? ''),
              )
              setCustomFlavours((current) =>
                Array.from({ length: count }, (_, index) => current[index] ?? false),
              )
            }}
          />
          <span className="mt-1 block text-xs text-muted">
            Number of pouches served during this feeding.
          </span>
        </div>
        <fieldset className="min-w-0 sm:col-span-2">
          <legend className="mb-2 text-sm font-medium text-ink">
            {pouchCount === 1 ? 'Flavour *' : 'Flavours *'}
          </legend>
          <div className="grid gap-3">
            {flavours.map((flavour, index) => (
              <div key={index} className="grid min-w-0 gap-1">
                <label htmlFor={`feeding-flavour-${index}`} className="text-xs text-muted">
                  Pouch {index + 1}
                </label>
                <div className="relative min-w-0">
                  <select
                    id={`feeding-flavour-${index}`}
                    value={customFlavours[index] ? '__other__' : flavour}
                    onChange={(event) => {
                      const custom = event.target.value === '__other__'
                      setCustomFlavours((current) =>
                        current.map((value, itemIndex) => (itemIndex === index ? custom : value)),
                      )
                      setFlavours((current) =>
                        current.map((value, itemIndex) =>
                          itemIndex === index ? (custom ? '' : event.target.value) : value,
                        ),
                      )
                    }}
                    className={`${inputClass} appearance-none pr-12`}
                    required
                  >
                    <option value="">Choose flavour…</option>
                    {foodPresets.map((preset) => (
                      <option key={preset} value={preset}>
                        {preset.replace(/\b\w/g, (letter) => letter.toUpperCase())}
                      </option>
                    ))}
                    <option value="__other__">Other flavour…</option>
                  </select>
                  <ChevronDown
                    aria-hidden
                    className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                  />
                </div>
                {customFlavours[index] ? (
                  <input
                    required
                    value={flavour}
                    onChange={(event) =>
                      setFlavours((current) =>
                        current.map((value, itemIndex) =>
                          itemIndex === index ? event.target.value : value,
                        ),
                      )
                    }
                    className={inputClass}
                    placeholder="Enter another flavour"
                    maxLength={80}
                    aria-label={`Other flavour for pouch ${index + 1}`}
                  />
                ) : null}
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">
            New flavours are saved to the preset list automatically.
          </p>
        </fieldset>
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
