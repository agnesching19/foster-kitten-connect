import { PageHeader } from '@/components/foster/layout/PageHeader'
import { Card } from '@/components/foster/ui/Card'

export function CommunityPage() {
  return (
    <div>
      <PageHeader title="Community" subtitle="Foster cats shared by their carers" />
      <Card className="py-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-2xl">
          🐾
        </div>
        <h2 className="mt-4 text-lg font-semibold text-ink">The community board is coming next</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted">
          Foster records are private by default. Once sharing controls are ready, carers will be
          able to choose which foster stories appear here.
        </p>
      </Card>
    </div>
  )
}
