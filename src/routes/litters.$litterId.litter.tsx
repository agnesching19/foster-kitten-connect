import { createFileRoute } from '@tanstack/react-router'
import { LitterPage } from '@/components/foster/pages/LitterPage'
export const Route = createFileRoute('/litters/$litterId/litter')({ component: Page })
function Page() {
  const { litterId } = Route.useParams()
  return <LitterPage litterId={litterId} />
}
