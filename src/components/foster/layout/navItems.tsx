import type { ReactNode } from 'react'

export interface NavItem {
  to: string
  label: string
  shortLabel: string
  icon: (active: boolean) => ReactNode
}

export const navItems: NavItem[] = [
  {
    to: '/',
    label: 'Dashboard',
    shortLabel: 'Home',
    icon: (active) => (
      <svg
        aria-hidden
        className="h-6 w-6 shrink-0"
        fill={active ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={active ? 0 : 1.75}
      >
        {active ? (
          <path d="M11.47 3.841a1.25 1.25 0 011.06 0l8.5 4.25A1.25 1.25 0 0121 8.987V19a2 2 0 01-2 2h-3.25a.75.75 0 01-.75-.75V14a1.25 1.25 0 00-1.25-1.25h-2.5A1.25 1.25 0 009 14v6.25a.75.75 0 01-.75.75H5a2 2 0 01-2-2V8.987a1.25 1.25 0 01.47-.896l8.5-4.25z" />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
          />
        )}
      </svg>
    ),
  },
  {
    to: '/feedings',
    label: 'Feedings',
    shortLabel: 'Feed',
    icon: (active) => (
      <svg
        aria-hidden
        className="h-6 w-6 shrink-0"
        fill={active ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={active ? 0 : 1.75}
      >
        {active ? (
          <path d="M12 2.25c-2.429 0-4.817.178-7.152.521C2.87 3.061 1.5 4.795 1.5 6.741v6.018c0 1.946 1.37 3.68 3.348 3.97 2.335.343 4.723.521 7.152.521s4.817-.178 7.152-.521c1.978-.29 3.348-2.024 3.348-3.97V6.741c0-1.946-1.37-3.68-3.348-3.97C16.817 2.428 14.429 2.25 12 2.25z" />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.125-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12"
          />
        )}
      </svg>
    ),
  },
  {
    to: '/poops',
    label: 'Poops',
    shortLabel: 'Poops',
    icon: (active) => (
      <svg
        aria-hidden
        className="h-6 w-6 shrink-0"
        fill={active ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={active ? 0 : 1.75}
      >
        {active ? (
          <path
            fillRule="evenodd"
            d="M12 2.25c-2.429 0-4.817.178-7.152.521C2.87 3.061 1.5 4.795 1.5 6.741v6.018c0 1.946 1.37 3.68 3.348 3.97 2.335.343 4.723.521 7.152.521s4.817-.178 7.152-.521c1.978-.29 3.348-2.024 3.348-3.97V6.741c0-1.946-1.37-3.68-3.348-3.97C16.817 2.428 14.429 2.25 12 2.25zm0 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z"
            clipRule="evenodd"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        )}
      </svg>
    ),
  },
  {
    to: '/weights',
    label: 'Weights',
    shortLabel: 'Weight',
    icon: (active) => (
      <svg
        aria-hidden
        className="h-6 w-6 shrink-0"
        fill={active ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={active ? 0 : 1.75}
      >
        {active ? (
          <path
            fillRule="evenodd"
            d="M12 2.25a.75.75 0 01.75.75v16.19l2.47-2.47a.75.75 0 111.06 1.06l-3.75 3.75a.75.75 0 01-1.06 0l-3.75-3.75a.75.75 0 111.06-1.06l2.47 2.47V3a.75.75 0 01.75-.75z"
            clipRule="evenodd"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
          />
        )}
      </svg>
    ),
  },
  {
    to: '/litter',
    label: 'Litter',
    shortLabel: 'Litter',
    icon: (active) => (
      <svg
        aria-hidden
        className="h-6 w-6 shrink-0"
        fill={active ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={active ? 0 : 1.75}
      >
        {active ? (
          <path
            fillRule="evenodd"
            d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm.75 4.5a.75.75 0 00-1.5 0v4.19l-2.47 2.47a.75.75 0 101.06 1.06l3-3a.75.75 0 00.22-.53V6.75z"
            clipRule="evenodd"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        )}
      </svg>
    ),
  },
]

export function getNavLinkClass(isActive: boolean, variant: 'bottom' | 'sidebar') {
  if (variant === 'bottom') {
    return [
      'flex min-h-[4.25rem] flex-col items-center justify-center gap-1 px-1 py-2',
      'text-xs font-medium transition-colors',
      isActive ? 'text-brand-600' : 'text-muted active:text-brand-500',
    ].join(' ')
  }

  return [
    'flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5',
    'text-sm font-medium transition-colors',
    isActive
      ? 'bg-brand-100 text-brand-800'
      : 'text-muted hover:bg-brand-50 hover:text-ink',
  ].join(' ')
}
