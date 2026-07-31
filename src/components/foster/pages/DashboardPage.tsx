import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { PageHeader } from '@/components/foster/layout/PageHeader'
import { Card } from '@/components/foster/ui/Card'
import { fosterBatches } from '@/data/mockData'
import type { FosterBatch } from '@/types/foster'

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
  const totalKittens = fosterBatches.reduce((sum, batch) => sum + batch.kittens.length, 0)
  const activeBatches = fosterBatches.filter((batch) => batch.status === 'active')

  const visibleBatches = useMemo(() => {
    const search = query.trim().toLowerCase()
    return fosterBatches.filter((batch) => {
      const matchesFilter = filter === 'all' || batch.status === filter
      const matchesSearch =
        !search ||
        batch.mommaName.toLowerCase().includes(search) ||
        batch.kittens.some((kitten) => kitten.toLowerCase().includes(search))
      return matchesFilter && matchesSearch
    })
  }, [filter, query])

  return (
    <div>
      <PageHeader
        title="Foster dashboard"
        subtitle="Every batch, past and present, in one place"
      />

      <section aria-label="Foster summary" className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Total cats fostered" value={String(totalKittens + fosterBatches.length)} note="Mamas + kittens" icon="♥" />
        <Metric label="Batches" value={String(fosterBatches.length)} note="Since February 2025" icon="⌂" />
        <Metric label="Currently in care" value={String(activeBatches.reduce((sum, batch) => sum + batch.kittens.length + 1, 0))} note={`${activeBatches.length} active batch`} icon="●" active />
        <Metric label="Kittens fostered" value={String(totalKittens)} note="Across all batches" icon="✦" />
      </section>

      <section className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-xl border border-border bg-white p-1" aria-label="Filter batches">
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
          <span className="pointer-events-none absolute left-3 top-2.5 text-muted" aria-hidden>⌕</span>
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
        <p className="text-sm text-muted">{visibleBatches.length} shown</p>
      </div>

      {visibleBatches.length ? (
        <section className="grid gap-4 lg:grid-cols-2" aria-live="polite">
          {visibleBatches.map((batch) => <BatchCard key={batch.id} batch={batch} />)}
        </section>
      ) : (
        <Card className="py-12 text-center">
          <p className="font-medium text-ink">No matching batches</p>
          <p className="mt-1 text-sm text-muted">Try another name or filter.</p>
        </Card>
      )}
    </div>
  )
}

function Metric({ label, value, note, icon, active = false }: { label: string; value: string; note: string; icon: string; active?: boolean }) {
  return (
    <Card className={active ? 'border-brand-200 bg-brand-50' : ''}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-ink">{value}</p>
          <p className="mt-1 text-xs text-muted">{note}</p>
        </div>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${active ? 'bg-brand-200 text-brand-800' : 'bg-gray-100 text-gray-500'}`} aria-hidden>{icon}</span>
      </div>
    </Card>
  )
}

function BatchCard({ batch }: { batch: FosterBatch }) {
  const isActive = batch.status === 'active'
  return (
    <Card className="group transition hover:-translate-y-0.5 hover:shadow-md" padding="lg">
      <div className="flex items-start gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl ${isActive ? 'bg-brand-100' : 'bg-gray-100'}`} aria-hidden>🐈</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-ink">{batch.mommaName}</h3>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                  {isActive ? 'In care' : 'Completed'}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-muted">Arrived {formatDate(batch.arrived)}{batch.left ? ` · Left ${formatDate(batch.left)}` : ''}</p>
            </div>
            <p className="text-right"><span className="text-2xl font-bold text-ink">{batch.kittens.length}</span><span className="ml-1 text-sm text-muted">kittens</span></p>
          </div>

          <div className="mt-4 rounded-xl bg-gray-50 px-3 py-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">The litter</p>
            <p className="text-sm leading-relaxed text-ink">{batch.kittens.length ? batch.kittens.join(' · ') : 'No kittens recorded'}</p>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {isActive ? (
              <Link to="/feedings" className="inline-flex min-h-10 items-center rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white transition hover:bg-brand-600">Open batch →</Link>
            ) : null}
            {batch.albumUrl ? <a href={batch.albumUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-xl px-3 text-sm font-semibold text-brand-700 hover:bg-brand-50">View album ↗</a> : null}
            {batch.recordLabel ? <span className="ml-auto truncate text-xs text-muted" title={batch.recordLabel}>Record: {batch.recordLabel}</span> : null}
          </div>
        </div>
      </div>
    </Card>
  )
}
