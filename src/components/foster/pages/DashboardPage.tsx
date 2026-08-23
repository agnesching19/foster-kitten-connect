import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/foster/layout/PageHeader'
import { Card } from '@/components/foster/ui/Card'
import { NewLitterDialog } from '@/components/foster/litters/NewLitterDialog'
import { KittenAvatar } from '@/components/foster/ui/KittenAvatar'
import { CatAvatar } from '@/components/foster/ui/CatAvatar'
import { useAuth } from '@/hooks/useAuth'
import {
  batchDisplayName,
  dashboardQuickViewQueryOptions,
  littersQueryOptions,
  pickCurrentLitter,
  type LitterRow,
} from '@/lib/foster-queries'

type Filter = 'all' | 'active' | 'completed'

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

function formatDate(date: string) {
  return dateFormat.format(new Date(`${date}T12:00:00`))
}

function todayIso() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const { data: litters = [], isLoading, error: littersError } = useQuery(littersQueryOptions)
  const currentLitter = pickCurrentLitter(litters)
  const today = todayIso()
  const { data: quickView } = useQuery(dashboardQuickViewQueryOptions(currentLitter?.id, today))
  const heaviestKitten = quickView?.latestWeights.reduce<DashboardQuickViewWeight | undefined>(
    (heaviest, weight) => (!heaviest || weight.grams > heaviest.grams ? weight : heaviest),
    undefined,
  )

  const visibleLitters = useMemo(() => {
    const search = query.trim().toLowerCase()
    return litters.filter((litter) => {
      const matchesFilter = filter === 'all' || litter.status === filter
      const matchesSearch =
        !search ||
        batchDisplayName(litter).toLowerCase().includes(search) ||
        litter.primary_cat?.name.toLowerCase().includes(search) ||
        litter.kittens.some((kitten) => kitten.name.toLowerCase().includes(search))
      return matchesFilter && matchesSearch
    })
  }, [filter, query, litters])

  if (authLoading) {
    return (
      <Card className="py-12 text-center">
        <p className="text-sm text-muted">Loading your fosters…</p>
      </Card>
    )
  }

  if (!user) {
    return (
      <div>
        <PageHeader title="My fosters" subtitle="Your private foster workspace" />
        <Card className="py-12 text-center">
          <h2 className="font-semibold text-ink">Sign in to see your foster cats</h2>
          <p className="mt-1 text-sm text-muted">
            Your batches and care records are private to you and invited collaborators.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link
              to="/auth"
              className="inline-flex min-h-11 items-center rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white transition hover:bg-brand-600"
            >
              Sign in
            </Link>
            <Link
              to="/community"
              className="inline-flex min-h-11 items-center rounded-xl border border-border bg-white px-4 text-sm font-semibold text-ink transition hover:bg-brand-50"
            >
              Visit community
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  if (littersError) {
    return (
      <div>
        <PageHeader title="My fosters" subtitle="Your foster batches, past and present" />
        <Card className="py-12 text-center">
          <h2 className="font-semibold text-ink">Your fosters could not be loaded</h2>
          <p role="alert" className="mt-1 text-sm text-muted">
            Please refresh the page. If this continues, check the database connection.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="My fosters"
        subtitle="Your foster batches, past and present"
        action={
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
          >
            <span aria-hidden>＋</span>
            <span className="hidden sm:inline">New batch</span>
            <span className="sr-only sm:hidden">New batch</span>
          </button>
        }
      />

      <NewLitterDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />

      <section aria-labelledby="quick-view-title" className="mb-6">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 id="quick-view-title" className="text-lg font-semibold text-ink">
            Quick view
          </h2>
          <p className="truncate text-sm text-muted">
            {currentLitter ? batchDisplayName(currentLitter) : 'No active batch'}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <QuickViewCard
            to="/feedings"
            label="Meals today"
            value={String(quickView?.mealsToday ?? 0)}
            note={quickView?.mealsToday === 1 ? 'wet-food meal today' : 'wet-food meals today'}
            icon="🍼"
            active
          />
          <QuickViewCard
            to="/weights"
            label="Heaviest cat"
            value={heaviestKitten?.kittens?.name ?? '—'}
            note={
              heaviestKitten
                ? `${heaviestKitten.grams}g · ${formatDate(heaviestKitten.date)}`
                : 'No weigh-ins yet'
            }
            icon="↗"
          />
          <QuickViewCard
            to="/litter"
            label="Last litter box change"
            value={
              quickView?.latestLitterChange
                ? quickView.latestLitterChange.date === today
                  ? 'Today'
                  : formatDate(quickView.latestLitterChange.date)
                : '—'
            }
            note={
              quickView?.latestLitterChange
                ? `at ${quickView.latestLitterChange.time.slice(0, 5)}`
                : 'No changes logged yet'
            }
            icon="◷"
          />
        </div>
      </section>

      <section className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="flex rounded-xl border border-border bg-white p-1"
          aria-label="Filter batches"
        >
          {(['all', 'active', 'completed'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={`rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors ${filter === option ? 'bg-brand-100 text-brand-800' : 'text-muted hover:text-ink'}`}
            >
              {option}
            </button>
          ))}
        </div>
        <label className="relative block sm:w-72">
          <span className="sr-only">Search batches</span>
          <span className="pointer-events-none absolute left-3 top-2.5 text-muted" aria-hidden>
            ⌕
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search mama or kitten"
            className="min-h-11 w-full rounded-xl border border-border bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </label>
      </section>

      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-ink">Foster batches</h2>
        <p className="text-sm text-muted">{visibleLitters.length} shown</p>
      </div>

      {isLoading ? (
        <Card className="py-12 text-center">
          <p className="text-sm text-muted">Loading batches…</p>
        </Card>
      ) : visibleLitters.length ? (
        <section className="grid gap-4 lg:grid-cols-2" aria-live="polite">
          {visibleLitters.map((litter) => (
            <BatchCard key={litter.id} litter={litter} />
          ))}
        </section>
      ) : (
        <Card className="py-12 text-center">
          <p className="font-medium text-ink">
            {litters.length ? 'No matching batches' : 'No batches yet'}
          </p>
          <p className="mt-1 text-sm text-muted">
            {litters.length
              ? 'Try another name or filter.'
              : 'Add your first foster batch to get started.'}
          </p>
        </Card>
      )}
    </div>
  )
}

type DashboardQuickViewWeight = {
  date: string
  grams: number
  kittens: { name: string } | null
}

function QuickViewCard({
  to,
  label,
  value,
  note,
  icon,
  active = false,
}: {
  to: '/feedings' | '/weights' | '/litter'
  label: string
  value: string
  note: string
  icon: string
  active?: boolean
}) {
  return (
    <Link
      to={to}
      className={`rounded-2xl border bg-surface-raised p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${active ? 'border-brand-200 bg-brand-50' : 'border-border'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
          <p className="mt-2 truncate text-2xl font-bold tracking-tight text-ink">{value}</p>
          <p className="mt-1 text-xs text-muted">{note}</p>
        </div>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${active ? 'bg-brand-200 text-brand-800' : 'bg-gray-100 text-gray-500'}`}
          aria-hidden
        >
          {icon}
        </span>
      </div>
    </Link>
  )
}

function BatchCard({ litter }: { litter: LitterRow }) {
  const isActive = litter.status === 'active'
  const primaryCat = litter.primary_cat
  const displayName =
    litter.batch_type === 'kittens_only'
      ? batchDisplayName(litter)
      : (primaryCat?.name ?? litter.mother_name)
  return (
    <Card
      className="group flex h-full flex-col transition hover:-translate-y-0.5 hover:shadow-md"
      padding="lg"
    >
      <div className="flex items-start gap-4">
        <CatAvatar
          name={displayName}
          avatarPath={primaryCat?.avatar_path ?? litter.mother_avatar_path}
          size="lg"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-ink">{displayName}</h3>
                <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-800">
                  {litter.batch_type === 'single'
                    ? 'Single foster'
                    : litter.batch_type === 'kittens_only'
                      ? 'Kittens only'
                      : 'Family'}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}
                >
                  {isActive ? 'In care' : 'Completed'}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-muted">
                Arrived {formatDate(litter.arrived)}
                {litter.left_date ? ` · Left ${formatDate(litter.left_date)}` : ''}
              </p>
            </div>
            {litter.batch_type !== 'single' ? (
              <p className="text-right">
                <span className="text-2xl font-bold text-ink">{litter.kittens.length}</span>
                <span className="ml-1 text-sm text-muted">kittens</span>
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {litter.batch_type !== 'single' ? (
        <div className="mt-4 w-full rounded-xl bg-gray-50 px-3 py-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
            The kittens
          </p>
          {litter.kittens.length ? (
            <ul className="flex flex-wrap items-center gap-2 text-sm leading-relaxed text-ink">
              {litter.kittens.map((k) => (
                <li key={k.id} className="flex items-center gap-2 rounded-lg bg-white px-2 py-1.5">
                  <KittenAvatar
                    name={k.name}
                    avatarPath={k.avatar_path}
                    colour={k.tag_colour}
                    size="sm"
                  />
                  <span className="leading-snug">{k.name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm leading-relaxed text-ink">No kittens recorded</p>
          )}
        </div>
      ) : null}

      <div className="mt-auto flex w-full flex-wrap items-center gap-2 pt-4">
        {isActive ? (
          <Link
            to="/litters/$litterId"
            params={{ litterId: litter.id }}
            className="inline-flex min-h-10 items-center rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            Open batch →
          </Link>
        ) : (
          <Link
            to="/litters/$litterId"
            params={{ litterId: litter.id }}
            className="inline-flex min-h-10 items-center rounded-xl px-3 text-sm font-semibold text-brand-700 hover:bg-brand-50"
          >
            Open batch →
          </Link>
        )}
        {litter.album_url ? (
          <a
            href={litter.album_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-10 items-center rounded-xl px-3 text-sm font-semibold text-brand-700 hover:bg-brand-50"
          >
            View album ↗
          </a>
        ) : null}
        {litter.external_record ? (
          <span className="ml-auto truncate text-xs text-muted" title={litter.external_record}>
            Record: {litter.external_record}
          </span>
        ) : null}
      </div>
    </Card>
  )
}
