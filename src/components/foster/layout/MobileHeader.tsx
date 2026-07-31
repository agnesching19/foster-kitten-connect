import { useQuery } from '@tanstack/react-query'
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
        </div>
      </div>
    </div>
  )
}
