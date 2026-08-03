import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/foster/ui/Button'
import { Card, CardHeader } from '@/components/foster/ui/Card'
import { useAuth } from '@/hooks/useAuth'
import {
  buildImportPreview,
  runImport,
  type ConflictStrategy,
  type ImportPreview,
  type ImportSummary,
} from '@/lib/data-transfer/import'
import { tableSpecs } from '@/lib/data-transfer/tables'
import { ConfirmDialog } from './ConfirmDialog'
import { ImportPreviewPanel } from './ImportPreviewPanel'
import { ProgressBar } from './ProgressBar'

interface CsvImportCardProps {
  title?: string
  description?: string
  accept?: string
  buttonLabel?: string
}

export function CsvImportCard({
  title = 'Import CSV',
  description = 'Import one or more CSV files previously exported by this app. Files are validated and previewed before anything is written.',
  accept = '.csv,.zip',
  buttonLabel = 'Choose files',
}: CsvImportCardProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)

  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [strategy, setStrategy] = useState<ConflictStrategy>('skip')
  const [validating, setValidating] = useState(false)
  const [progress, setProgress] = useState<{ step: string; percent: number } | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [summary, setSummary] = useState<ImportSummary | null>(null)

  function reset() {
    setPreview(null)
    setProgress(null)
    setSummary(null)
    setStrategy('skip')
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return
    setValidating(true)
    setSummary(null)
    try {
      const result = await buildImportPreview([...files])
      setPreview(result)
      if (!result.totalRows) toast.error('No importable rows were found in those files.')
    } catch (error) {
      toast.error((error as Error).message || 'Could not read those files')
    } finally {
      setValidating(false)
    }
  }

  async function startImport() {
    if (!preview || !user) return
    setConfirmOpen(false)
    setProgress({ step: 'Starting…', percent: 0 })
    try {
      const result = await runImport(preview, { userId: user.id, strategy }, setProgress)
      setSummary(result)
      setPreview(null)
      if (inputRef.current) inputRef.current.value = ''
      await queryClient.invalidateQueries()
      toast.success(`Imported ${result.totalInserted} records`)
    } catch (error) {
      toast.error((error as Error).message || 'Import failed')
    } finally {
      setProgress(null)
    }
  }

  const hasConflicts = Boolean(preview?.existingLitterIds.length)

  return (
    <Card>
      <CardHeader title={title} subtitle={description} />

      <p className="mb-3 text-xs text-muted">
        Expected file names: {tableSpecs.map((spec) => spec.file).join(', ')} — or a ZIP export
        from this app.
      </p>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          size="md"
          onClick={() => inputRef.current?.click()}
          disabled={validating || Boolean(progress) || !user}
        >
          {validating ? 'Validating…' : buttonLabel}
        </Button>
        {preview || summary ? (
          <Button size="md" variant="secondary" onClick={reset} disabled={Boolean(progress)}>
            Clear
          </Button>
        ) : null}
      </div>

      {!user ? (
        <p className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-sm text-muted">
          Sign in to import data.
        </p>
      ) : null}

      {preview ? (
        <>
          <ImportPreviewPanel
            preview={preview}
            strategy={strategy}
            onStrategyChange={setStrategy}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="md"
              disabled={!preview.totalRows || Boolean(progress)}
              onClick={() => {
                if (hasConflicts && strategy !== 'skip') setConfirmOpen(true)
                else void startImport()
              }}
            >
              Import {preview.totalRows} rows
            </Button>
            <Button size="md" variant="secondary" onClick={reset} disabled={Boolean(progress)}>
              Cancel
            </Button>
          </div>
        </>
      ) : null}

      {progress ? <ProgressBar label={progress.step} percent={progress.percent} /> : null}

      {summary ? (
        <div className="mt-4 rounded-xl border border-border bg-brand-50 p-4">
          <p className="text-sm font-semibold text-ink">
            Import complete — {summary.totalInserted} records
          </p>
          <ul className="mt-1 grid gap-1 text-sm text-muted sm:grid-cols-2">
            {Object.entries(summary.inserted).map(([label, count]) => (
              <li key={label} className="flex justify-between gap-2">
                <span>{label}</span>
                <span className="font-medium text-ink">{count}</span>
              </li>
            ))}
          </ul>
          {summary.skippedLitters ? (
            <p className="mt-1 text-xs text-muted">
              {summary.skippedLitters} existing litter(s) were skipped.
            </p>
          ) : null}
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        title={strategy === 'replace' ? 'Replace existing records?' : 'Merge into existing litters?'}
        description={
          strategy === 'replace'
            ? 'Kittens, feedings, bathroom entries, litter changes, weigh-ins, weights and notes for the matching litters will be deleted and re-imported. This cannot be undone.'
            : 'Matching records will be updated with the values from your files.'
        }
        confirmLabel={strategy === 'replace' ? 'Replace data' : 'Merge data'}
        onConfirm={() => void startImport()}
        onCancel={() => setConfirmOpen(false)}
      />
    </Card>
  )
}