import type { ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/foster/ui/Button'
import { useAuth } from '@/hooks/useAuth'

export const inputClass =
  'block min-h-11 min-w-0 max-w-full w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 [&::-webkit-date-and-time-value]:text-left'

interface FormDialogProps {
  open: boolean
  title: string
  subtitle?: string
  onClose: () => void
  requireAuth?: boolean
  children: ReactNode
}

export function FormDialog({
  open,
  title,
  subtitle,
  onClose,
  requireAuth = true,
  children,
}: FormDialogProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const id = `dialog-${title.replace(/\s+/g, '-').toLowerCase()}`

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border bg-surface-raised p-5 pb-[calc(5rem+env(safe-area-inset-bottom))] shadow-lg sm:rounded-2xl sm:pb-5"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id={id} className="text-lg font-semibold text-ink">
              {title}
            </h2>
            {subtitle ? <p className="mt-0.5 text-sm text-muted">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted transition hover:bg-brand-50 hover:text-ink"
          >
            ✕
          </button>
        </div>

        {requireAuth && !user ? (
          <div className="rounded-xl bg-gray-50 px-3 py-4 text-sm text-muted">
            <p className="font-medium text-ink">Sign in required</p>
            <p className="mt-1">Records are saved to your account, so please sign in first.</p>
            <Button
              size="md"
              className="mt-3"
              onClick={() => {
                onClose()
                navigate({ to: '/auth' })
              }}
            >
              Go to sign in
            </Button>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}

export function DialogActions({
  busy,
  onCancel,
  saveLabel = 'Save',
}: {
  busy: boolean
  onCancel: () => void
  saveLabel?: string
}) {
  return (
    <div className="mt-1 flex gap-2 sm:col-span-2">
      <Button type="submit" size="md" fullWidth disabled={busy}>
        {busy ? 'Saving…' : saveLabel}
      </Button>
      <Button type="button" variant="secondary" size="md" onClick={onCancel} disabled={busy}>
        Cancel
      </Button>
    </div>
  )
}

export function todayIso() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function nowTime() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}
