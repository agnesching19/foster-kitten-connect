interface ProgressBarProps {
  label: string
  percent: number
}

export function ProgressBar({ label, percent }: ProgressBarProps) {
  return (
    <div className="mt-3">
      <div className="mb-1 flex items-center justify-between text-xs text-muted">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-2 w-full overflow-hidden rounded-full bg-brand-100"
      >
        <div
          className="h-full rounded-full bg-brand-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}