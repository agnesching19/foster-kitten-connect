import { createFileRoute } from '@tanstack/react-router'
import { FeedingsPage } from '@/components/foster/pages/FeedingsPage'

export const Route = createFileRoute('/feedings')({
  head: () => ({
    meta: [
      { title: 'Feedings Log | Kitty Tracker' },
      {
        name: 'description',
        content:
          'Daily food log for foster cats — wet-food meals, dry-food top-ups and treats at a glance.',
      },
      { property: 'og:title', content: 'Feedings Log | Kitty Tracker' },
      {
        property: 'og:description',
        content: 'Track wet-food meals, shared-bowl dry-food top-ups and treats for foster cats.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: FeedingsPage,
})
