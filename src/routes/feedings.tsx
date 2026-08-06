import { createFileRoute } from '@tanstack/react-router'
import { FeedingsPage } from '@/components/foster/pages/FeedingsPage'

export const Route = createFileRoute('/feedings')({
  head: () => ({
    meta: [
      { title: 'Feedings Log | Kitty Tracker' },
      {
        name: 'description',
        content:
          'Daily feeding log for your foster momma cat — pouches, times and food types at a glance.',
      },
      { property: 'og:title', content: 'Feedings Log | Kitty Tracker' },
      {
        property: 'og:description',
        content: 'Track every pouch and mealtime for your foster momma cat.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: FeedingsPage,
})
