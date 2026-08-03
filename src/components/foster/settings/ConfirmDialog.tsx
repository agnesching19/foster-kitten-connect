import type { ReactNode } from 'react'
import { Button } from '@/components/foster/ui/Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: ReactNode
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  busy?: boolean
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Continue',
  onConfirm,
  onCancel,
  busy = false,
}: ConfirmDialogProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-border bg-surface-raised p-5 shadow-lg sm:rounded-2xl"
      >
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        {description ? <div className="mt-2 text-sm text-muted">{description}</div> : null}
        <div className="mt-4 flex gap-2">
          <Button size="md" fullWidth onClick={onConfirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </Button>
          <Button size="md" variant="secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}