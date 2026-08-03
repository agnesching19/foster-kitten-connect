import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/foster/ui/Button'
import { Card, CardHeader } from '@/components/foster/ui/Card'
import { useAuth } from '@/hooks/useAuth'
import { littersQueryOptions } from '@/lib/foster-queries'
import {
  runLegacyImport,
  type LegacyImportSummary,
} from '@/lib/data-transfer/legacy/import'
import { sheetsFromFiles, sheetsFromGoogleUrl } from '@/lib/data-transfer/legacy/load'
import { pickParser } from '@/lib/data-transfer/legacy/registry'
import { totalRecords, type LegacyParseResult } from '@/lib/data-transfer/legacy/types'
import { ProgressBar } from './ProgressBar'

const inputClass =
  'min-h-11 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100'

const NEW_LITTER = '__new__'

export function LegacyImportCard() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const { data: litters = [] } = useQuery(littersQueryOptions)

  const [url, setUrl] = useState('')
  const [parsing, setParsing] = useState(false)
  const [result, setResult] = useState<LegacyParseResult | null>(null)
  const [litterId, setLitterId] = useState<string>(NEW_LITTER)
  const [motherName, setMotherName] = useState('')
  const [litterName, setLitterName] = useState('')
  const [arrived, setArrived] = useState(() => new Date().toISOString().slice(0, 10))
  const [progress, setProgress] = useState<{ step: string; percent: number } | null>(null)
  const [summary, setSummary] = useState<LegacyImportSummary | null>(null)

  function reset() {
    setResult(null)
    setSummary(null)
    setProgress(null)
    setUrl('')
    if (inputRef.current) inputRef.current.value = ''
  }

  async function analyse(load: () => Promise<ReturnType<typeof sheetsFromFiles>>) {
    setParsing(true)
    setSummary(null)
    try {
      const sheets = await load()
      const parser = pickParser(sheets)
      const parsed = parser.parse(sheets)
      setResult(parsed)
      if (!totalRecords(parsed)) {
        toast.error('No recognisable records were found in that spreadsheet.')
      } else if (parser.id === 'current-export') {
        toast.message('This looks like an export from this app — the Import CSV card below keeps IDs intact.')
      }
    } catch (error) {
      toast.error((error as Error).message || 'Could not read that spreadsheet')
    } finally {
      setParsing(false)
    }
  }

  async function startImport() {
    if (!result || !user) return
    setProgress({ step: 'Starting…', percent: 0 })
    try {
      const outcome = await runLegacyImport(
        result,
        {
          userId: user.id,
          litterId: litterId === NEW_LITTER ? null : litterId,
          newLitter:
            litterId === NEW_LITTER
              ? { mother_name: motherName.trim(), litter_name: litterName.trim() || null, arrived }
              : undefined,
        },
        setProgress,
      )
      setSummary(outcome)
      setResult(null)
      if (inputRef.current) inputRef.current.value = ''
      await queryClient.invalidateQueries()
      toast.success(`Imported ${outcome.totalImported} records`)
    } catch (error) {
      toast.error((error as Error).message || 'Import failed')
    } finally {
      setProgress(null)
    }
  }

  const counts = result
    ? [
        ['feedings', result.feedings.length],
        ['poop entries', result.poops.length],
        ['litter changes', result.litterChanges.length],
        ['weigh-ins', result.weighIns.length],
        [
          'kitten weights',
          result.weighIns.reduce((sum, weighIn) => sum + weighIn.weights.length, 0),
        ],
        ['notes', result.notes.length],
      ] as [string, number][]
    : []

  const skippedGroups = result
    ? [...result.skipped.reduce((map, entry) => {
        map.set(entry.reason, (map.get(entry.reason) ?? 0) + 1)
        return map
      }, new Map<string, number>())]
    : []

  return (
    <Card>
      <CardHeader
        title="Import existing Foster Kitten Tracker spreadsheet"
        subtitle="For migrating your historical Google Sheets. Columns are detected from their headers and contents, so file names and column order do not matter. Unrecognised rows are skipped, never fatal."
      />

      <div className="grid gap-3">
        <label>
          <span className="mb-1 block text-sm font-medium text-ink">Google Sheets URL</span>
          <div className="flex flex-wrap gap-2">
            <input
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/…"
              className={`${inputClass} sm:flex-1`}
            />
            <Button
              size="md"
              variant="secondary"
              disabled={parsing || !url.trim() || Boolean(progress)}
              onClick={() => void analyse(() => sheetsFromGoogleUrl(url))}
            >
              {parsing ? 'Reading…' : 'Read sheet'}
            </Button>
          </div>
          <span className="mt-1 block text-xs text-muted">
            The sheet must be shared as “Anyone with the link”. Add <code>#gid=…</code> to target a
            specific tab.
          </span>
        </label>

        <div>
          <span className="mb-1 block text-sm font-medium text-ink">…or upload a CSV export</span>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".csv,.zip"
            className="hidden"
            onChange={(event) => {
              const files = event.target.files
              if (files?.length) void analyse(() => sheetsFromFiles([...files]))
            }}
          />
          <Button
            size="md"
            onClick={() => inputRef.current?.click()}
            disabled={parsing || Boolean(progress) || !user}
          >
            {parsing ? 'Reading…' : 'Choose spreadsheet CSV'}
          </Button>
        </div>
      </div>

      {!user ? (
        <p className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-sm text-muted">
          Sign in to import data.
        </p>
      ) : null}

      {result ? (
        <div className="mt-4 grid gap-3 rounded-xl border border-border bg-surface p-4">
          <p className="text-sm font-semibold text-ink">
            Detected as: {result.parserLabel}
          </p>

          <ul className="grid gap-1 text-sm text-muted sm:grid-cols-2">
            {counts.map(([label, count]) => (
              <li key={label} className="flex justify-between gap-2">
                <span>{label}</span>
                <span className="font-medium text-ink">{count}</span>
              </li>
            ))}
          </ul>

          {result.kittenNames.length ? (
            <p className="text-xs text-muted">
              Kittens found: {result.kittenNames.join(', ')} — any missing ones are created.
            </p>
          ) : null}

          <details className="text-xs text-muted">
            <summary className="cursor-pointer">Detected columns</summary>
            <ul className="mt-1 grid gap-0.5">
              {result.columnRoles.map((column) => (
                <li key={column.header}>
                  <span className="text-ink">{column.header || '(unnamed)'}</span> → {column.role}
                </li>
              ))}
            </ul>
          </details>

          {skippedGroups.length ? (
            <div className="text-xs text-muted">
              <p className="font-medium text-ink">Will be skipped</p>
              <ul className="mt-1 grid gap-0.5">
                {skippedGroups.map(([reason, count]) => (
                  <li key={reason}>
                    {count} × {reason.toLowerCase()}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <label>
            <span className="mb-1 block text-sm font-medium text-ink">Import into</span>
            <select
              value={litterId}
              onChange={(event) => setLitterId(event.target.value)}
              className={inputClass}
            >
              <option value={NEW_LITTER}>Create a new litter…</option>
              {litters.map((litter) => (
                <option key={litter.id} value={litter.id}>
                  {litter.litter_name || litter.mother_name} ({litter.arrived})
                </option>
              ))}
            </select>
          </label>

          {litterId === NEW_LITTER ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <label>
                <span className="mb-1 block text-sm font-medium text-ink">Mother's name</span>
                <input
                  value={motherName}
                  onChange={(event) => setMotherName(event.target.value)}
                  className={inputClass}
                  placeholder="Amber"
                />
              </label>
              <label>
                <span className="mb-1 block text-sm font-medium text-ink">Litter name</span>
                <input
                  value={litterName}
                  onChange={(event) => setLitterName(event.target.value)}
                  className={inputClass}
                  placeholder="Amber + SEVEN"
                />
              </label>
              <label>
                <span className="mb-1 block text-sm font-medium text-ink">Arrival date</span>
                <input
                  type="date"
                  value={arrived}
                  onChange={(event) => setArrived(event.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              size="md"
              disabled={
                Boolean(progress) ||
                !totalRecords(result) ||
                (litterId === NEW_LITTER && !motherName.trim())
              }
              onClick={() => void startImport()}
            >
              Import {totalRecords(result)} records
            </Button>
            <Button size="md" variant="secondary" onClick={reset} disabled={Boolean(progress)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {progress ? <ProgressBar label={progress.step} percent={progress.percent} /> : null}

      {summary ? (
        <div className="mt-4 rounded-xl border border-border bg-brand-50 p-4">
          <p className="text-sm font-semibold text-ink">Imported</p>
          <ul className="mt-1 grid gap-1 text-sm text-muted sm:grid-cols-2">
            <li className="flex justify-between gap-2">
              <span>feedings</span>
              <span className="font-medium text-ink">{summary.imported.feedings}</span>
            </li>
            <li className="flex justify-between gap-2">
              <span>poop entries</span>
              <span className="font-medium text-ink">{summary.imported.poops}</span>
            </li>
            <li className="flex justify-between gap-2">
              <span>litter changes</span>
              <span className="font-medium text-ink">{summary.imported.litterChanges}</span>
            </li>
            <li className="flex justify-between gap-2">
              <span>weigh-ins</span>
              <span className="font-medium text-ink">{summary.imported.weighIns}</span>
            </li>
            <li className="flex justify-between gap-2">
              <span>kitten weights</span>
              <span className="font-medium text-ink">{summary.imported.weights}</span>
            </li>
            <li className="flex justify-between gap-2">
              <span>notes</span>
              <span className="font-medium text-ink">{summary.imported.notes}</span>
            </li>
          </ul>
          {summary.createdKittens.length ? (
            <p className="mt-2 text-xs text-muted">
              Created kittens: {summary.createdKittens.join(', ')}
            </p>
          ) : null}
          {summary.skipped.length ? (
            <>
              <p className="mt-3 text-sm font-semibold text-ink">Skipped</p>
              <ul className="mt-1 grid gap-0.5 text-sm text-muted">
                {summary.skipped.map((entry) => (
                  <li key={entry.reason}>
                    {entry.count} {entry.reason.toLowerCase()}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          <div className="mt-3">
            <Button size="md" variant="secondary" onClick={reset}>
              Import another spreadsheet
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  )
}