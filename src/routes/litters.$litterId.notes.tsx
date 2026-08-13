import { createFileRoute } from '@tanstack/react-router'
import { NotesPage } from '@/components/foster/pages/NotesPage'
export const Route = createFileRoute('/litters/$litterId/notes')({ component: Page })
function Page() {
  const { litterId } = Route.useParams()
  return <NotesPage litterId={litterId} />
}
