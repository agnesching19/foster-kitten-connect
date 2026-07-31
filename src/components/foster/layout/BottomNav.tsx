import { NavLink } from 'react-router-dom'
import { getNavLinkClass, navItems } from './navItems'

export function BottomNav() {
  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface-raised/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-1 sm:max-w-none sm:px-4">
        {navItems.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => getNavLinkClass(isActive, 'bottom')}
            >
              {({ isActive }) => (
                <>
                  {item.icon(isActive)}
                  <span>{item.shortLabel}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
