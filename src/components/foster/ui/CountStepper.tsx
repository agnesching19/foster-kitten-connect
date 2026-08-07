import { Minus, Plus } from 'lucide-react'

export function CountStepper({
  id,
  value,
  onChange,
  min = 1,
  max = 50,
}: {
  id: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
}) {
  const setWithinRange = (nextValue: number) => onChange(Math.max(min, Math.min(max, nextValue)))

  return (
    <div className="grid min-w-0 grid-cols-[3rem_minmax(0,1fr)_3rem] overflow-hidden rounded-xl border border-border bg-white focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
      <button
        type="button"
        onClick={() => setWithinRange(value - 1)}
        disabled={value <= min}
        aria-label="Decrease count"
        className="flex min-h-12 items-center justify-center border-r border-border text-ink transition hover:bg-brand-50 active:bg-brand-100 disabled:text-muted disabled:opacity-40"
      >
        <Minus aria-hidden="true" className="h-5 w-5" />
      </button>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        required
        value={value}
        onChange={(event) => setWithinRange(Number(event.target.value))}
        className="min-h-12 min-w-0 appearance-none bg-white px-2 text-center text-base font-semibold tabular-nums text-ink outline-none"
      />
      <button
        type="button"
        onClick={() => setWithinRange(value + 1)}
        disabled={value >= max}
        aria-label="Increase count"
        className="flex min-h-12 items-center justify-center border-l border-border text-ink transition hover:bg-brand-50 active:bg-brand-100 disabled:text-muted disabled:opacity-40"
      >
        <Plus aria-hidden="true" className="h-5 w-5" />
      </button>
    </div>
  )
}
