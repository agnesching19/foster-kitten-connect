import { Link, useLocation } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { littersQueryOptions, pickCurrentLitter } from '@/lib/foster-queries'
import { getNavLinkClass, navItems } from './navItems'

const dotColors = ['bg-brand-400', 'bg-brand-500', 'bg-amber-400', 'bg-orange-400']

export function SidebarNav() {
  const pathname = useLocation({ select: (location) => location.pathname })
  const { data: litters = [] } = useQuery(littersQueryOptions)
  const totalCats = litters.reduce((sum, litter) => sum + litter.kittens.length + 1, 0)
  const current = pickCurrentLitter(litters)
  const kittens = current?.kittens ?? []

  return (
    <aside className="hidden md:flex md:w-64 md:shrink-0 md:flex-col md:border-r md:border-border md:bg-surface-raised lg:w-72">
      <div className="border-b border-border px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
          Foster Tracker
        </p>
        <p className="mt-1 text-base font-semibold text-ink">All foster batches</p>
        <p className="text-sm text-muted">{litters.length} batches · {totalCats} cats</p>
      </div>

      <nav aria-label="Main navigation" className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)
            return (
              <li key={item.to}>
                <Link to={item.to} className={getNavLinkClass(isActive, 'sidebar')}>
                  {item.icon(isActive)}
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-border px-5 py-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Active batch
        </p>
        {kittens.length ? (
          <ul className="space-y-2">
            {kittens.map((kitten, index) => (
              <li key={kitten.id} className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotColors[index % dotColors.length]}`}
                  aria-hidden
                />
                <span className="truncate text-sm text-ink">{kitten.name}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No active batch</p>
        )}
      </div>
    </aside>
  )
}
