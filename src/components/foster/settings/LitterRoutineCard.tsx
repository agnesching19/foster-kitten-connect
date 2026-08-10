import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Clock3 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/foster/ui/Button'
import { Card } from '@/components/foster/ui/Card'
import { inputClass } from '@/components/foster/ui/FormDialog'
import { useLitterAccess } from '@/hooks/useLitterAccess'
import { littersQueryOptions, pickCurrentLitter } from '@/lib/foster-queries'

const routinePresets = [1, 2, 3, 7]

export function LitterRoutineCard() {
  const queryClient = useQueryClient()
  const { data: litters = [] } = useQuery(littersQueryOptions)
  const litter = pickCurrentLitter(litters)
  const { isOwner } = useLitterAccess(litter)
  const [days, setDays] = useState(2)

  useEffect(() => {
    setDays((litter?.litter_change_interval_hours ?? 48) / 24)
  }, [litter?.litter_change_interval_hours])

  const updateRoutine = useMutation({
    mutationFn: async () => {
      if (!litter) throw new Error('Add a batch first.')
      const hours = Math.round(days * 24)
      if (hours < 6 || hours > 720) {
        throw new Error('Choose a routine between 6 hours and 30 days.')
      }
      const { error } = await supabase
        .from('litters')
        .update({ litter_change_interval_hours: hours })
        .eq('id', litter.id)
      if (error) throw error
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['litters'] })
      toast.success('Litter-box routine updated')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not update the routine'),
  })

  const savedDays = (litter?.litter_change_interval_hours ?? 48) / 24
  const hasChanges = Math.round(days * 24) !== (litter?.litter_change_interval_hours ?? 48)

  return (
    <Card>
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
          <Clock3 aria-hidden className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-ink">Change routine</h2>
          <p className="mt-1 text-sm text-muted">
            Set how often the litter boxes should be changed for{' '}
            {litter?.litter_name ?? 'the current batch'}.
          </p>
        </div>
      </div>

      {litter ? (
        <div className="mt-5 grid gap-4">
          <label>
            <span className="mb-1 block text-sm font-medium text-ink">Change every</span>
            <div className="relative max-w-xs">
              <input
                type="number"
                inputMode="decimal"
                min={0.25}
                max={30}
                step={0.25}
                value={days}
                disabled={!isOwner}
                onChange={(event) => setDays(Number(event.target.value))}
                className={`${inputClass} pr-16`}
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted">
                days
              </span>
            </div>
          </label>

          <div className="flex flex-wrap gap-2" aria-label="Routine presets">
            {routinePresets.map((preset) => (
              <button
                key={preset}
                type="button"
                disabled={!isOwner}
                aria-pressed={days === preset}
                className={`min-h-10 rounded-xl border px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  days === preset
                    ? 'border-brand-400 bg-brand-50 text-brand-700'
                    : 'border-border bg-white text-ink hover:bg-surface'
                }`}
                onClick={() => setDays(preset)}
              >
                {preset} day{preset === 1 ? '' : 's'}
              </button>
            ))}
          </div>

          <p className="text-sm text-muted">
            The freshness indicator will become due after {formatDays(days)}.
          </p>

          {isOwner ? (
            <Button
              className="w-fit"
              disabled={!hasChanges || updateRoutine.isPending}
              onClick={() => updateRoutine.mutate()}
            >
              {updateRoutine.isPending ? 'Saving…' : 'Save routine'}
            </Button>
          ) : (
            <p className="rounded-xl bg-surface p-3 text-sm text-muted">
              The batch owner controls this routine. It is currently set to {formatDays(savedDays)}.
            </p>
          )}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">Add a batch before setting a routine.</p>
      )}
    </Card>
  )
}

function formatDays(days: number) {
  if (days < 1) return `${Math.round(days * 24)} hours`
  return `${days.toLocaleString(undefined, { maximumFractionDigits: 2 })} day${days === 1 ? '' : 's'}`
}
