import type { KittenColor } from '@/types/foster'

interface BadgeProps {
  label: string
  color?: KittenColor | 'neutral' | 'brand'
  size?: 'sm' | 'md'
}

const kittenColorClasses: Record<KittenColor, string> = {
  pink: 'bg-pink-100 text-pink-800 ring-pink-200',
  red: 'bg-red-100 text-red-800 ring-red-200',
  purple: 'bg-purple-100 text-purple-800 ring-purple-200',
  blue: 'bg-blue-100 text-blue-800 ring-blue-200',
  green: 'bg-green-100 text-green-800 ring-green-200',
  yellow: 'bg-yellow-100 text-yellow-800 ring-yellow-200',
  orange: 'bg-orange-100 text-orange-800 ring-orange-200',
}

const neutralClasses = 'bg-gray-100 text-gray-700 ring-gray-200'
const brandClasses = 'bg-brand-100 text-brand-800 ring-brand-200'

export function Badge({ label, color = 'neutral', size = 'sm' }: BadgeProps) {
  const colorClass =
    color === 'neutral'
      ? neutralClasses
      : color === 'brand'
        ? brandClasses
        : kittenColorClasses[color]

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'

  return (
    <span
      className={[
        'inline-flex items-center rounded-full font-medium ring-1 ring-inset',
        colorClass,
        sizeClass,
      ].join(' ')}
    >
      {label}
    </span>
  )
}
