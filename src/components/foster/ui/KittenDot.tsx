export type TagColour =
  | 'blue'
  | 'pink'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'purple'
  | 'white'
  | 'grey'
  | 'brown'
  | 'black'

export const TAG_COLOURS: TagColour[] = [
  'blue',
  'pink',
  'red',
  'orange',
  'yellow',
  'green',
  'purple',
  'white',
  'grey',
  'brown',
  'black',
]

const swatch: Record<TagColour, string> = {
  blue: 'bg-sky-500',
  pink: 'bg-pink-400',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-400',
  green: 'bg-emerald-500',
  purple: 'bg-purple-500',
  white: 'bg-white border border-gray-300',
  grey: 'bg-gray-400',
  brown: 'bg-amber-800',
  black: 'bg-gray-900',
}

const NEUTRAL = 'bg-gray-300'

export function KittenDot({
  colour,
  size = 'sm',
  className = '',
}: {
  colour?: TagColour | null
  size?: 'sm' | 'md'
  className?: string
}) {
  const dimension = size === 'md' ? 'h-3 w-3' : 'h-2.5 w-2.5'
  return (
    <span
      aria-hidden
      title={colour ?? 'No colour'}
      className={`inline-block shrink-0 rounded-full ${dimension} ${colour ? swatch[colour] : NEUTRAL} ${className}`}
    />
  )
}
