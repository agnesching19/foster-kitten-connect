import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/components/foster/layout/PageHeader'
import { Card } from '@/components/foster/ui/Card'
import { CatAvatar } from '@/components/foster/ui/CatAvatar'
import { KittenAvatar } from '@/components/foster/ui/KittenAvatar'
import { communityBatchesQueryOptions, type CommunityBatch } from '@/lib/foster-queries'
import { formatDate } from '@/utils/formatDate'
import { useAuth } from '@/hooks/useAuth'

type Filter = 'all' | 'active' | 'completed'

export function CommunityPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const {
    data: batches = [],
    isLoading,
    error,
  } = useQuery({
    ...communityBatchesQueryOptions,
    enabled: Boolean(user),
  })

  useEffect(() => {
    if (!authLoading && !user) void navigate({ to: '/auth', replace: true })
  }, [authLoading, navigate, user])
  const visibleBatches = useMemo(
    () => batches.filter((batch) => filter === 'all' || batch.status === filter),
    [batches, filter],
  )

  return (
    <div>
      <PageHeader title="Community" subtitle="Foster cats shared by their carers" />

      <div className="mb-4 flex items-center justify-between gap-3">
        <div
          className="flex rounded-xl border border-border bg-white p-1"
          aria-label="Filter community fosters"
        >
          {(['all', 'active', 'completed'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={`rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors ${filter === option ? 'bg-brand-100 text-brand-800' : 'text-muted hover:text-ink'}`}
            >
              {option === 'active' ? 'In care' : option}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted">{visibleBatches.length} shared</p>
      </div>

      {authLoading || !user || isLoading ? (
        <Card className="py-12 text-center">
          <p className="text-sm text-muted">Loading community fosters…</p>
        </Card>
      ) : error ? (
        <Card className="py-12 text-center">
          <p role="alert" className="text-sm text-muted">
            The community board could not be loaded.
          </p>
        </Card>
      ) : visibleBatches.length ? (
        <section className="grid gap-4 lg:grid-cols-2" aria-live="polite">
          {visibleBatches.map((batch) => (
            <CommunityBatchCard key={batch.id} batch={batch} />
          ))}
        </section>
      ) : (
        <Card className="py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-2xl">
            🐾
          </div>
          <h2 className="mt-4 text-lg font-semibold text-ink">
            {batches.length ? 'No matching fosters' : 'No foster stories shared yet'}
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            {batches.length
              ? 'Try another community filter.'
              : 'Foster records stay private unless their carer chooses to share them here.'}
          </p>
        </Card>
      )}
    </div>
  )
}

function CommunityBatchCard({ batch }: { batch: CommunityBatch }) {
  const primaryCat =
    batch.cats.find((cat) => cat.role === 'mother' || cat.role === 'single') ?? batch.cats[0]
  const typeLabel =
    batch.batch_type === 'single'
      ? 'Single foster'
      : batch.batch_type === 'kittens_only'
        ? 'Kittens only'
        : 'Family'

  return (
    <Card className="flex h-full flex-col" padding="lg">
      <div className="flex items-start gap-3">
        <CatAvatar
          name={batch.display_name}
          avatarPath={primaryCat?.avatar_path ?? null}
          publicThumbnailPath={primaryCat?.avatar_path ?? null}
          size="lg"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-ink">{batch.display_name}</h2>
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-800">
              {typeLabel}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${batch.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-muted'}`}
            >
              {batch.status === 'active' ? 'In care' : 'Completed'}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-muted">Fostered by {batch.fosterer_name}</p>
          <p className="mt-1 text-xs text-muted">
            Arrived {formatDate(batch.arrived)}
            {batch.left_date ? ` · Left ${formatDate(batch.left_date)}` : ''}
          </p>
        </div>
      </div>

      {batch.community_summary ? (
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ink">
          {batch.community_summary}
        </p>
      ) : null}

      {batch.cats.length ? (
        <div className="mt-4 rounded-xl bg-gray-50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            {batch.cats.length === 1 ? 'Foster cat' : 'Foster cats'}
          </p>
          <ul className="flex flex-wrap gap-2">
            {batch.cats.map((cat, index) => (
              <li
                key={`${cat.role}-${cat.name}-${index}`}
                className="flex items-center gap-2 rounded-lg bg-white px-2 py-1.5 text-sm text-ink"
              >
                <KittenAvatar
                  name={cat.name}
                  avatarPath={cat.avatar_path}
                  publicThumbnailPath={cat.avatar_path}
                  colour={cat.tag_colour}
                  size="sm"
                />
                <span>{cat.name}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  )
}
