import type { ConflictStrategy, ImportPreview } from '@/lib/data-transfer/import'

const inputClass =
  'min-h-11 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100'

interface ImportPreviewPanelProps {
  preview: ImportPreview
  strategy: ConflictStrategy
  onStrategyChange: (strategy: ConflictStrategy) => void
}

export function ImportPreviewPanel({
  preview,
  strategy,
  onStrategyChange,
}: ImportPreviewPanelProps) {
  const conflicting = preview.litters.filter((litter) =>
    preview.existingLitterIds.includes(litter.id),
  )

  return (
    <div className="mt-4 rounded-xl border border-border bg-white p-4">
      <p className="text-sm font-semibold text-ink">
        Preview · {preview.totalRows} row{preview.totalRows === 1 ? '' : 's'}
      </p>

      <ul className="mt-2 grid gap-1 text-sm text-muted sm:grid-cols-2">
        {preview.tables.map((table) => (
          <li key={table.spec.table} className="flex justify-between gap-2">
            <span>{table.spec.label}</span>
            <span className="font-medium text-ink">{table.rows.length}</span>
          </li>
        ))}
      </ul>

      {preview.issues.length ? (
        <div className="mt-3 rounded-xl bg-red-50 px-3 py-2">
          <p className="text-sm font-semibold text-red-700">
            {preview.issues.length} validation issue{preview.issues.length === 1 ? '' : 's'}
          </p>
          <ul className="mt-1 max-h-40 space-y-0.5 overflow-y-auto text-xs text-red-700">
            {preview.issues.slice(0, 50).map((issue, index) => (
              <li key={index}>
                {issue.file}
                {issue.row ? ` (row ${issue.row})` : ''}: {issue.message}
              </li>
            ))}
          </ul>
          <p className="mt-1 text-xs text-red-700">
            Rows with issues are skipped; everything else can still be imported.
          </p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-brand-700">No validation issues found.</p>
      )}

      {conflicting.length ? (
        <div className="mt-3">
          <p className="text-sm font-semibold text-ink">
            {conflicting.length} batch{conflicting.length === 1 ? '' : 'es'} already exist
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {conflicting.map((litter) => litter.label).join(', ')}
          </p>
          <label className="mt-2 block">
            <span className="mb-1 block text-sm font-medium text-ink">
              How should we handle them?
            </span>
            <select
              value={strategy}
              onChange={(event) => onStrategyChange(event.target.value as ConflictStrategy)}
              className={inputClass}
            >
              <option value="skip">Skip — leave existing batches untouched</option>
              <option value="merge">Merge — update matching records, keep the rest</option>
              <option value="replace">Replace — delete existing records, then import</option>
            </select>
          </label>
        </div>
      ) : null}
    </div>
  )
}
