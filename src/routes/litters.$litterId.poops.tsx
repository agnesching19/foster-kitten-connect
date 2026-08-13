import { createFileRoute } from '@tanstack/react-router'
import { PoopsPage } from '@/components/foster/pages/PoopsPage'
export const Route = createFileRoute('/litters/$litterId/poops')({ component: Page })
function Page() {
  const { litterId } = Route.useParams()
  return <PoopsPage litterId={litterId} />
}
