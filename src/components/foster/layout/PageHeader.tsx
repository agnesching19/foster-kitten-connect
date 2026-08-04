import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
  avatar?: ReactNode
}

export function PageHeader({ title, subtitle, action, avatar }: PageHeaderProps) {
  return (
    <header className="mb-5 flex items-start justify-between gap-4 md:mb-6">
      <div className="flex min-w-0 items-center gap-3">
        {avatar}
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight text-ink md:text-3xl">
            {title}
          </h1>
          {subtitle ? <p className="mt-1 text-sm text-muted md:text-base">{subtitle}</p> : null}
        </div>
      </div>
      {action}
    </header>
  )
}
