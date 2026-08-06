import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/foster/ui/Button'
import { Card, CardHeader } from '@/components/foster/ui/Card'
import { findTemplate, sheetTemplates, validateSheetUrl } from '@/lib/data-transfer/sheets'

const inputClass =
  'min-h-11 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100'

export function GoogleSheetsImportCard({ embedded = false }: { embedded?: boolean }) {
  const [url, setUrl] = useState('')
  const [templateId, setTemplateId] = useState(sheetTemplates[0]!.id)
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)

  const template = sheetTemplates.find((item) => item.id === templateId)!

  async function validate() {
    const urlError = validateSheetUrl(url)
    if (urlError) {
      setError(urlError)
      return
    }
    setError(null)
    setChecking(true)
    try {
      const adapter = findTemplate(url) ?? template
      await adapter.buildPreview(url)
    } catch (caught) {
      setError((caught as Error).message)
      toast.error((caught as Error).message)
    } finally {
      setChecking(false)
    }
  }

  const content = (
    <>
      {embedded ? (
        <p className="mb-3 text-sm text-muted">
          Paste a link to a spreadsheet that follows the Kitty Tracker template. It is validated and
          previewed before anything is imported.
        </p>
      ) : (
        <CardHeader
          title="Import from Google Sheets"
          subtitle="Recommended migration path. Paste the link to a spreadsheet that follows the Kitty Tracker template — it is validated and previewed before anything is imported."
        />
      )}

      <div className="grid gap-3">
        <label>
          <span className="mb-1 block text-sm font-medium text-ink">Spreadsheet template</span>
          <select
            value={templateId}
            onChange={(event) => setTemplateId(event.target.value)}
            className={inputClass}
          >
            {sheetTemplates.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-muted">{template.description}</span>
        </label>

        <label>
          <span className="mb-1 block text-sm font-medium text-ink">Google Sheets URL</span>
          <input
            type="url"
            value={url}
            onChange={(event) => {
              setUrl(event.target.value)
              setError(null)
            }}
            placeholder="https://docs.google.com/spreadsheets/d/…"
            className={inputClass}
          />
        </label>
      </div>

      {error ? (
        <p role="alert" className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {error}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="md" onClick={() => void validate()} disabled={checking}>
          {checking ? 'Validating…' : 'Validate spreadsheet'}
        </Button>
      </div>

      <p className="mt-3 text-xs text-muted">
        Sheet reading is not switched on yet. Until then, export each tab as CSV (File → Download →
        CSV) and use the CSV or ZIP tab — the same validation, preview and duplicate handling
        applies.
      </p>
    </>
  )

  return embedded ? <div>{content}</div> : <Card>{content}</Card>
}
