import { Link, useLocation } from '@tanstack/react-router'
import { fosterBatches, kittens } from '@/data/mockData'
import type { KittenColor } from '@/types/foster'
import { getNavLinkClass, navItems } from './navItems'

const kittenDotColors: Record<KittenColor, string> = {
  pink: 'bg-pink-400',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-400',
  orange: 'bg-orange-400',
}

export function SidebarNav() {
  const pathname = useLocation({ select: (location) => location.pathname })

  return (
    <aside className="hidden md:flex md:w-64 md:shrink-0 md:flex-col md:border-r md:border-border md:bg-surface-raised lg:w-72">
      <div className="border-b border-border px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
          Foster Tracker
        </p>
        <p className="mt-1 text-base font-semibold text-ink">All foster batches</p>
        <p className="text-sm text-muted">{fosterBatches.length} batches · {fosterBatches.reduce((sum, batch) => sum + batch.kittens.length + 1, 0)} cats</p>
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
        <ul className="space-y-2">
          {kittens.map((kitten) => (
            <li key={kitten.id} className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${kittenDotColors[kitten.color]}`}
                aria-hidden
              />
              <span className="truncate text-sm text-ink">{kitten.name}</span>
              <span className="truncate text-xs text-muted capitalize">{kitten.coat}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
