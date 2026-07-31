import { fosterBatches, kittens, mommaName } from '@/data/mockData'
import type { KittenColor } from '@/types/foster'

const kittenDotColors: Record<KittenColor, string> = {
  pink: 'bg-pink-400',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-400',
  orange: 'bg-orange-400',
}

export function MobileHeader() {
  return (
    <div className="sticky top-0 z-40 border-b border-border bg-brand-50/90 px-4 py-3 backdrop-blur-md pt-[max(0.75rem,env(safe-area-inset-top))] md:hidden">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
            Foster Tracker
          </p>
          <p className="text-sm font-medium text-ink">
            {fosterBatches.length} batches · {mommaName} + {kittens.length} active
          </p>
        </div>
        <div className="flex -space-x-1">
          {kittens.slice(0, 4).map((kitten) => (
            <span
              key={kitten.id}
              className={`inline-block h-3 w-3 rounded-full ring-2 ring-brand-50 ${kittenDotColors[kitten.color]}`}
              title={kitten.name}
            />
          ))}
          {kittens.length > 4 ? (
            <span className="flex h-3 w-3 items-center justify-center rounded-full bg-gray-300 text-[8px] font-bold text-gray-700 ring-2 ring-brand-50">
              +{kittens.length - 4}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}