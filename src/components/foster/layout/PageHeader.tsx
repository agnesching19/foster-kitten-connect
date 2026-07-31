import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <header className="mb-5 flex items-start justify-between gap-4 md:mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-muted md:text-base">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </header>
  )
}
