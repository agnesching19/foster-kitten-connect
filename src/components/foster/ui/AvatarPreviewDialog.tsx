import { useEffect, useId } from 'react'
import { createPortal } from 'react-dom'

export function AvatarPreviewDialog({
  open,
  name,
  imageUrl,
  onClose,
}: {
  open: boolean
  name: string
  imageUrl: string
  onClose: () => void
}) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="relative flex max-h-full max-w-full flex-col items-center">
        <button
          type="button"
          autoFocus
          onClick={onClose}
          aria-label="Close photo preview"
          className="absolute right-2 top-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-xl text-white transition hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white"
        >
          ✕
        </button>
        <img
          src={imageUrl}
          alt={`${name} full-size avatar`}
          className="max-h-[82dvh] max-w-[92vw] rounded-2xl object-contain shadow-2xl"
        />
        <p id={titleId} className="mt-3 rounded-full bg-black/60 px-4 py-2 text-sm text-white">
          {name}
        </p>
      </div>
    </div>,
    document.body,
  )
}
