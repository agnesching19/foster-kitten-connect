import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/foster/layout/PageHeader'
import { Card } from '@/components/foster/ui/Card'
import { NewLitterDialog } from '@/components/foster/litters/NewLitterDialog'
import { KittenAvatar } from '@/components/foster/ui/KittenAvatar'
import { CatAvatar } from '@/components/foster/ui/CatAvatar'
import { littersQueryOptions, type LitterRow } from '@/lib/foster-queries'

type Filter = 'all' | 'active' | 'completed'

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

function formatDate(date: string) {
  return dateFormat.format(new Date(`${date}T12:00:00`))
}

export function DashboardPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const { data: litters = [], isLoading } = useQuery(littersQueryOptions)

  const totalKittens = litters.reduce((sum, litter) => sum + litter.kittens.length, 0)
  const activeLitters = litters.filter((litter) => litter.status === 'active')
  const earliestArrival = litters.length
    ? litters.reduce(
        (min, litter) => (litter.arrived < min ? litter.arrived : min),
        litters[0]!.arrived,
      )
    : null

  const visibleLitters = useMemo(() => {
    const search = query.trim().toLowerCase()
    return litters.filter((litter) => {
      const matchesFilter = filter === 'all' || litter.status === filter
      const matchesSearch =
        !search ||
        litter.mother_name.toLowerCase().includes(search) ||
        litter.kittens.some((kitten) => kitten.name.toLowerCase().includes(search))
      return matchesFilter && matchesSearch
    })
  }, [filter, query, litters])

  return (
    <div>
      <PageHeader
        title="Foster dashboard"
        subtitle="Every batch, past and present, in one place"
        action={
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
          >
            <span aria-hidden>＋</span>
            <span className="hidden sm:inline">New litter</span>
            <span className="sr-only sm:hidden">New litter</span>
          </button>
        }
      />

      <NewLitterDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />

      <section aria-label="Foster summary" className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric
          label="Total cats fostered"
          value={String(totalKittens + litters.length)}
          note="Mamas + kittens"
          icon="♥"
        />
        <Metric
          label="Batches"
          value={String(litters.length)}
          note={earliestArrival ? `Since ${formatDate(earliestArrival)}` : 'No batches yet'}
          icon="⌂"
        />
        <Metric
          label="Currently in care"
          value={String(activeLitters.reduce((sum, litter) => sum + litter.kittens.length + 1, 0))}
          note={`${activeLitters.length} active batch${activeLitters.length === 1 ? '' : 'es'}`}
          icon="●"
          active
        />
        <Metric
          label="Kittens fostered"
          value={String(totalKittens)}
          note="Across all batches"
          icon="✦"
        />
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
            {litters.length ? 'No matching batches' : 'No litters yet'}
          </p>
          <p className="mt-1 text-sm text-muted">
            {litters.length
              ? 'Try another name or filter.'
              : 'Add your first foster litter to get started.'}
          </p>
        </Card>
      )}
    </div>
  )
}

function Metric({
  label,
  value,
  note,
  icon,
  active = false,
}: {
  label: string
  value: string
  note: string
  icon: string
  active?: boolean
}) {
  return (
    <Card className={active ? 'border-brand-200 bg-brand-50' : ''}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-ink">{value}</p>
          <p className="mt-1 text-xs text-muted">{note}</p>
        </div>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${active ? 'bg-brand-200 text-brand-800' : 'bg-gray-100 text-gray-500'}`}
          aria-hidden
        >
          {icon}
        </span>
      </div>
    </Card>
  )
}

function BatchCard({ litter }: { litter: LitterRow }) {
  const isActive = litter.status === 'active'
  return (
    <Card className="group transition hover:-translate-y-0.5 hover:shadow-md" padding="lg">
      <div className="flex items-start gap-4">
        <CatAvatar name={litter.mother_name} avatarPath={litter.mother_avatar_path} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-ink">{litter.mother_name}</h3>
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
            <p className="text-right">
              <span className="text-2xl font-bold text-ink">{litter.kittens.length}</span>
              <span className="ml-1 text-sm text-muted">kittens</span>
            </p>
          </div>

          <div className="mt-4 rounded-xl bg-gray-50 px-3 py-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
              The litter
            </p>
            {litter.kittens.length ? (
              <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm leading-relaxed text-ink">
                {litter.kittens.map((k) => (
                  <li key={k.id} className="flex items-center gap-1.5">
                    <KittenAvatar
                      name={k.name}
                      avatarPath={k.avatar_path}
                      colour={k.tag_colour}
                      size="sm"
                    />
                    <span>{k.name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm leading-relaxed text-ink">No kittens recorded</p>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
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
        </div>
      </div>
    </Card>
  )
}
