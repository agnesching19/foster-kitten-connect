import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/foster/layout/PageHeader'
import { Card } from '@/components/foster/ui/Card'
import { KittensSection } from '@/components/foster/kittens/KittensSection'
import { littersQueryOptions } from '@/lib/foster-queries'
import { formatDate } from '@/utils/formatDate'

export const Route = createFileRoute('/litters/$litterId')({
  head: () => ({
    meta: [
      { title: 'Litter details | Foster Kitten Tracker' },
      {
        name: 'description',
        content:
          'Manage a foster litter: view arrival details and add, rename, reorder or remove kittens.',
      },
      { property: 'og:title', content: 'Litter details | Foster Kitten Tracker' },
      {
        property: 'og:description',
        content: 'Manage the kittens in a foster litter and keep their details up to date.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: LitterDetailPage,
  errorComponent: ({ error }) => (
    <Card className="py-12 text-center">
      <p role="alert" className="text-sm text-muted">
        {error.message}
      </p>
    </Card>
  ),
  notFoundComponent: () => (
    <Card className="py-12 text-center">
      <p className="text-sm text-muted">Litter not found.</p>
    </Card>
  ),
})

function LitterDetailPage() {
  const { litterId } = Route.useParams()
  const { data: litters = [], isLoading } = useQuery(littersQueryOptions)
  const litter = litters.find((item) => item.id === litterId)

  if (isLoading) {
    return (
      <Card className="py-12 text-center">
        <p className="text-sm text-muted">Loading litter…</p>
      </Card>
    )
  }

  if (!litter) {
    return (
      <Card className="py-12 text-center">
        <p className="font-medium text-ink">Litter not found</p>
        <Link to="/" className="mt-2 inline-block text-sm font-semibold text-brand-700">
          Back to dashboard
        </Link>
      </Card>
    )
  }

  return (
    <div>
      <Link to="/" className="mb-3 inline-block text-sm font-semibold text-brand-700">
        ← Back to dashboard
      </Link>
      <PageHeader
        title={litter.litter_name || litter.mother_name}
        subtitle={`Arrived ${formatDate(litter.arrived)}${litter.left_date ? ` · Left ${formatDate(litter.left_date)}` : ''}`}
      />
      <KittensSection litterId={litter.id} />
    </div>
  )
}
