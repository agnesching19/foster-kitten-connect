import { createFileRoute } from '@tanstack/react-router'
import { FeedingsPage } from '@/components/foster/pages/FeedingsPage'
export const Route = createFileRoute('/litters/$litterId/feedings')({ component: Page })
function Page() {
  const { litterId } = Route.useParams()
  return <FeedingsPage litterId={litterId} />
}
