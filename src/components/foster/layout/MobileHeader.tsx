import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { littersQueryOptions, pickCurrentLitter } from '@/lib/foster-queries'
import { AuthStatus } from './AuthStatus'

const dotColors = ['bg-brand-400', 'bg-brand-500', 'bg-amber-400', 'bg-orange-400']

export function MobileHeader() {
  const { data: litters = [] } = useQuery(littersQueryOptions)
  const current = pickCurrentLitter(litters)
  const kittens = current?.kittens ?? []

  return (
    <div className="sticky top-0 z-40 border-b border-border bg-brand-50/90 px-4 py-3 backdrop-blur-md pt-[max(0.75rem,env(safe-area-inset-top))] md:hidden">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
            Foster Tracker
          </p>
          <p className="text-sm font-medium text-ink">
            {current
              ? `${litters.length} batches · ${current.mother_name} + ${kittens.length} active`
              : `${litters.length} batches`}
          </p>
        </div>
        <div className="flex items-center gap-3">
        <div className="flex -space-x-1">
          {kittens.slice(0, 4).map((kitten, index) => (
            <span
              key={kitten.id}
              className={`inline-block h-3 w-3 rounded-full ring-2 ring-brand-50 ${dotColors[index % dotColors.length]}`}
              title={kitten.name}
            />
          ))}
          {kittens.length > 4 ? (
            <span className="flex h-3 w-3 items-center justify-center rounded-full bg-gray-300 text-[8px] font-bold text-gray-700 ring-2 ring-brand-50">
              +{kittens.length - 4}
            </span>
          ) : null}
        </div>
        <AuthStatus variant="mobile" />
        <Link
          to="/settings"
          aria-label="Settings"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted transition hover:bg-brand-100 hover:text-ink"
        >
          <svg aria-hidden className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </Link>
        </div>
      </div>
    </div>
  )
}
