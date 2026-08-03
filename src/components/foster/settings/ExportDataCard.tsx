import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/foster/ui/Button'
import { Card, CardHeader } from '@/components/foster/ui/Card'
import { buildExportZip, downloadBlob } from '@/lib/data-transfer/export'
import { littersQueryOptions, pickCurrentLitter } from '@/lib/foster-queries'
import { ProgressBar } from './ProgressBar'

type Scope = 'current' | 'selected' | 'all'

const inputClass =
  'min-h-11 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100'

export function ExportDataCard() {
  const { data: litters = [] } = useQuery(littersQueryOptions)
  const current = pickCurrentLitter(litters)

  const [scope, setScope] = useState<Scope>('current')
  const [selected, setSelected] = useState<string[]>([])
  const [progress, setProgress] = useState<{ step: string; percent: number } | null>(null)
  const [lastCounts, setLastCounts] = useState<Record<string, number> | null>(null)

  function litterIdsForScope(): string[] | null {
    if (scope === 'all') return null
    if (scope === 'current') return current ? [current.id] : []
    return selected
  }

  async function exportNow() {
    const ids = litterIdsForScope()
    if (ids && ids.length === 0) {
      toast.error(scope === 'current' ? 'No current litter to export.' : 'Select at least one litter.')
      return
    }
    setProgress({ step: 'Starting…', percent: 0 })
    setLastCounts(null)
    try {
      const result = await buildExportZip(ids, setProgress)
      downloadBlob(result.blob, result.filename)
      setLastCounts(result.counts)
      toast.success('Export ready')
    } catch (error) {
      toast.error((error as Error).message || 'Export failed')
    } finally {
      setProgress(null)
    }
  }

  return (
    <Card>
      <CardHeader
        title="Export data"
        subtitle="Download a ZIP with one CSV per table. IDs and relationships are preserved, so an export can be imported again later."
      />

      <div className="grid gap-3">
        <label>
          <span className="mb-1 block text-sm font-medium text-ink">What to export</span>
          <select
            value={scope}
            onChange={(event) => setScope(event.target.value as Scope)}
            className={inputClass}
          >
            <option value="current">
              Current litter{current ? ` — ${current.litter_name || current.mother_name}` : ''}
            </option>
            <option value="selected">Selected litters</option>
            <option value="all">All data</option>
          </select>
        </label>

        {scope === 'selected' ? (
          <fieldset className="rounded-xl border border-border bg-white p-3">
            <legend className="px-1 text-sm font-medium text-ink">Litters</legend>
            {litters.length ? (
              <ul className="grid gap-1">
                {litters.map((litter) => (
                  <li key={litter.id}>
                    <label className="flex items-center gap-2 text-sm text-ink">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-border"
                        checked={selected.includes(litter.id)}
                        onChange={(event) =>
                          setSelected((previous) =>
                            event.target.checked
                              ? [...previous, litter.id]
                              : previous.filter((id) => id !== litter.id),
                          )
                        }
                      />
                      <span>{litter.litter_name || litter.mother_name}</span>
                    </label>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No litters yet.</p>
            )}
          </fieldset>
        ) : null}
      </div>

      <div className="mt-3">
        <Button size="md" onClick={() => void exportNow()} disabled={Boolean(progress)}>
          {progress ? 'Exporting…' : 'Export ZIP'}
        </Button>
      </div>

      {progress ? <ProgressBar label={progress.step} percent={progress.percent} /> : null}

      {lastCounts ? (
        <ul className="mt-4 grid gap-1 rounded-xl border border-border bg-brand-50 p-4 text-sm text-muted sm:grid-cols-2">
          {Object.entries(lastCounts).map(([label, count]) => (
            <li key={label} className="flex justify-between gap-2">
              <span>{label}</span>
              <span className="font-medium text-ink">{count}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  )
}