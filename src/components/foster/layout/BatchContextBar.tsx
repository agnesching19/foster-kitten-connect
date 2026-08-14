import { Link, useNavigate } from '@tanstack/react-router'
import { batchDisplayName, type LitterRow } from '@/lib/foster-queries'

export type BatchSection = 'feedings' | 'poops' | 'weights' | 'litter' | 'notes'

export function BatchContextBar({
  litter,
  litters,
  section,
}: {
  litter: LitterRow | undefined
  litters: LitterRow[]
  section: BatchSection
}) {
  const navigate = useNavigate()
  if (!litter) return null

  return (
    <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-border bg-surface-raised p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4">
      <div className="flex min-w-0 items-center gap-3">
        <label htmlFor={`batch-${section}`} className="shrink-0 text-sm font-medium text-ink">
          Batch
        </label>
        <select
          id={`batch-${section}`}
          value={litter.id}
          onChange={(event) =>
            navigate({
              to: `/litters/$litterId/${section}`,
              params: { litterId: event.target.value },
            })
          }
          className="min-h-11 min-w-0 flex-1 rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium text-ink sm:w-56 sm:flex-none"
        >
          {litters.map((item) => (
            <option key={item.id} value={item.id}>
              {batchDisplayName(item)} {item.status === 'completed' ? '· Completed' : '· Active'}
            </option>
          ))}
        </select>
        <span
          className={`hidden rounded-full px-2.5 py-1 text-xs font-semibold sm:inline ${litter.status === 'completed' ? 'bg-gray-100 text-muted' : 'bg-emerald-100 text-emerald-700'}`}
        >
          {litter.status === 'completed' ? 'Read-only archive' : 'Active batch'}
        </span>
      </div>
      <Link
        to="/litters/$litterId"
        params={{ litterId: litter.id }}
        className="min-h-11 rounded-xl px-3 py-3 text-center text-sm font-semibold text-brand-700 hover:bg-brand-50"
      >
        Batch overview
      </Link>
    </div>
  )
}
