import { Button } from './Button'

export function LoadMoreButton({
  hasMore,
  loading,
  onLoad,
  label = 'Load older records',
}: {
  hasMore: boolean
  loading: boolean
  onLoad: () => void
  label?: string
}) {
  if (!hasMore) return null
  return (
    <div className="mt-5 flex justify-center">
      <Button size="md" variant="secondary" disabled={loading} onClick={onLoad}>
        {loading ? 'Loading…' : label}
      </Button>
    </div>
  )
}
