import { Link, useLocation } from '@tanstack/react-router'
import { getNavLinkClass, navItems } from './navItems'

function useIsActive() {
  const pathname = useLocation({ select: (location) => location.pathname })
  return (to: string) =>
    to === '/'
      ? pathname === '/' || /^\/litters\/[^/]+$/.test(pathname)
      : pathname === to || pathname.startsWith(`${to}/`) || pathname.endsWith(to)
}

export function MobileNav() {
  const pathname = useLocation({ select: (location) => location.pathname })
  const isActivePath = useIsActive()
  const selectedBatchId = pathname.match(/^\/litters\/([^/]+)/)?.[1] ?? ''

  return (
    <nav
      aria-label="Main navigation"
      className="border-b border-border bg-surface-raised/95 backdrop-blur-md md:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-1 sm:max-w-none sm:px-4">
        {navItems
          .filter((item) => item.to !== '/notes')
          .map((item) => {
            const isActive = isActivePath(item.to)
            const batchDestination = item.batchSection
              ? (`/litters/$litterId/${item.batchSection}` as const)
              : '/litters/$litterId'
            return (
              <li key={item.to} className="flex-1">
                <Link
                  to={selectedBatchId ? batchDestination : item.to}
                  params={{ litterId: selectedBatchId }}
                  className={getNavLinkClass(isActive, 'bottom')}
                >
                  {item.icon(isActive)}
                  <span>{item.shortLabel}</span>
                </Link>
              </li>
            )
          })}
      </ul>
    </nav>
  )
}
