import { createFileRoute } from '@tanstack/react-router'
import { CommunityPage } from '@/components/foster/pages/CommunityPage'

export const Route = createFileRoute('/community')({
  head: () => ({
    meta: [
      { title: 'Community | Kitty Tracker' },
      {
        name: 'description',
        content: 'Meet foster cats and families shared by the Kitty Tracker community.',
      },
      { property: 'og:title', content: 'Community | Kitty Tracker' },
      {
        property: 'og:description',
        content: 'Meet foster cats and families shared by their carers.',
      },
      { property: 'og:type', content: 'website' },
    ],
  }),
  component: CommunityPage,
})
