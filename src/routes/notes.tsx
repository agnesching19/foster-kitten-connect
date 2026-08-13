import { createFileRoute } from '@tanstack/react-router'
import { NotesPage } from '@/components/foster/pages/NotesPage'

export const Route = createFileRoute('/notes')({
  head: () => ({
    meta: [
      { title: 'Notes | Kitty Tracker' },
      {
        name: 'description',
        content: 'Track kitten milestones, behaviour, health and general observations.',
      },
    ],
  }),
  component: NotesPage,
})
