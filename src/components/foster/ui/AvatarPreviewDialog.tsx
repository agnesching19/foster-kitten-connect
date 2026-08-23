import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { Minus, Plus, RotateCcw, X } from 'lucide-react'
import { recordImageTraffic } from '@/lib/traffic-monitor'

const MIN_SCALE = 1
const MAX_SCALE = 4
const SCALE_STEP = 0.5

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
  const [scale, setScale] = useState(MIN_SCALE)

  const updateScale = (nextScale: number) => {
    setScale(Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale)))
  }

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

  useEffect(() => {
    if (open) setScale(MIN_SCALE)
  }, [open, imageUrl])

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
      <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden">
        <button
          type="button"
          autoFocus
          onClick={onClose}
          aria-label="Close photo preview"
          className="absolute right-2 top-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-xl text-white transition hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white"
        >
          <X aria-hidden="true" className="h-6 w-6" />
        </button>
        <div className="flex min-h-0 w-full flex-1 items-center justify-center overflow-auto p-2 sm:p-8">
          <img
            src={imageUrl}
            alt={`${name} full-size avatar`}
            className={`max-h-[76dvh] max-w-[92vw] select-none rounded-2xl object-contain shadow-2xl transition-transform duration-200 ${scale < MAX_SCALE ? 'cursor-zoom-in' : 'cursor-zoom-out'}`}
            style={{ transform: `scale(${scale})` }}
            draggable={false}
            onLoad={(event) => recordImageTraffic('preview', event.currentTarget.currentSrc)}
            onClick={() => updateScale(scale === MAX_SCALE ? MIN_SCALE : scale + SCALE_STEP)}
            onWheel={(event) => {
              event.preventDefault()
              updateScale(scale + (event.deltaY < 0 ? SCALE_STEP : -SCALE_STEP))
            }}
          />
        </div>
        <div className="z-10 mb-2 flex items-center gap-2 rounded-full bg-black/70 p-1.5 text-white shadow-lg">
          <button
            type="button"
            onClick={() => updateScale(scale - SCALE_STEP)}
            disabled={scale === MIN_SCALE}
            aria-label="Zoom out"
            className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-white/15 disabled:opacity-40"
          >
            <Minus aria-hidden="true" className="h-5 w-5" />
          </button>
          <span className="min-w-12 text-center text-sm font-medium">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => updateScale(scale + SCALE_STEP)}
            disabled={scale === MAX_SCALE}
            aria-label="Zoom in"
            className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-white/15 disabled:opacity-40"
          >
            <Plus aria-hidden="true" className="h-5 w-5" />
          </button>
          {scale > MIN_SCALE ? (
            <button
              type="button"
              onClick={() => setScale(MIN_SCALE)}
              aria-label="Reset zoom"
              className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-white/15"
            >
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <p id={titleId} className="mb-2 rounded-full bg-black/60 px-4 py-2 text-sm text-white">
          {name} · Tap photo to zoom
        </p>
      </div>
    </div>,
    document.body,
  )
}
