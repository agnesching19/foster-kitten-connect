import { createFileRoute } from '@tanstack/react-router'
import { WeightsPage } from '@/components/foster/pages/WeightsPage'
export const Route = createFileRoute('/litters/$litterId/weights')({ component: Page })
function Page() {
  const { litterId } = Route.useParams()
  return <WeightsPage litterId={litterId} />
}
