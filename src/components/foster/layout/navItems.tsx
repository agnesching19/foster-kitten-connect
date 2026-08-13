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
            transform="rotate(180 12 12)"
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
    label: 'Litter box',
    shortLabel: 'Litter box',
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
  {
    to: '/notes',
    label: 'Notes',
    shortLabel: 'Notes',
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
          <path d="M5.625 3.75A2.625 2.625 0 003 6.375v11.25a2.625 2.625 0 002.625 2.625h12.75A2.625 2.625 0 0021 17.625V6.375a2.625 2.625 0 00-2.625-2.625H5.625zM7.5 8.25a.75.75 0 000 1.5h9a.75.75 0 000-1.5h-9zm0 3.75a.75.75 0 000 1.5h9a.75.75 0 000-1.5h-9zm0 3.75a.75.75 0 000 1.5h5.25a.75.75 0 000-1.5H7.5z" />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-8.625A2.625 2.625 0 0016.875 3h-10.5A2.625 2.625 0 003.75 5.625v12.75A2.625 2.625 0 006.375 21h8.625m4.5-6.75L15 18.75m4.5-4.5v3.375A1.125 1.125 0 0118.375 18.75H15"
          />
        )}
      </svg>
    ),
  },
]

export function getNavLinkClass(isActive: boolean, variant: 'bottom' | 'sidebar') {
  return getNavLinkClasses(isActive, variant)
}

export const settingsNavItem: NavItem = {
  to: '/settings',
  label: 'Settings',
  shortLabel: 'Settings',
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
          d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889a7.5 7.5 0 00-1.352.783l-.99-.36a1.875 1.875 0 00-2.203.808l-.922 1.597a1.875 1.875 0 00.35 2.32l.79.71a7.5 7.5 0 000 1.506l-.79.71a1.875 1.875 0 00-.35 2.32l.922 1.597c.46.796 1.404 1.13 2.203.808l.99-.36c.424.31.877.573 1.352.783l.178 1.072c.151.904.933 1.567 1.85 1.567h1.844c.917 0 1.699-.663 1.85-1.567l.178-1.072a7.5 7.5 0 001.352-.783l.99.36a1.875 1.875 0 002.203-.808l.922-1.597a1.875 1.875 0 00-.35-2.32l-.79-.71a7.5 7.5 0 000-1.506l.79-.71a1.875 1.875 0 00.35-2.32l-.922-1.597a1.875 1.875 0 00-2.203-.808l-.99.36a7.5 7.5 0 00-1.352-.783l-.178-1.072A1.875 1.875 0 0012.922 2.25h-1.844zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z"
          clipRule="evenodd"
        />
      ) : (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894zM15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      )}
    </svg>
  ),
}

export const liveCamsNavItem = {
  href: 'https://kittycams.bosh.me/',
  label: 'Live cams',
  icon: (
    <svg
      aria-hidden
      className="h-6 w-6 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 10.5l4.72-2.36a.75.75 0 011.08.67v6.38a.75.75 0 01-1.08.67l-4.72-2.36m-9 4.5h6a3 3 0 003-3V9a3 3 0 00-3-3h-6a3 3 0 00-3 3v6a3 3 0 003 3z"
      />
    </svg>
  ),
}

function getNavLinkClasses(isActive: boolean, variant: 'bottom' | 'sidebar') {
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
    isActive ? 'bg-brand-100 text-brand-800' : 'text-muted hover:bg-brand-50 hover:text-ink',
  ].join(' ')
}
