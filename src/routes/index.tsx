import { createFileRoute } from '@tanstack/react-router'
import { DashboardPage } from '@/components/foster/pages/DashboardPage'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Kitty Tracker | Every Batch in One Place' },
      {
        name: 'description',
        content:
          'Track foster momma cats and their kittens: batches, feedings, weights, bathroom logs and litter-box changes.',
      },
      {
        property: 'og:title',
        content: 'Kitty Tracker | Every Batch in One Place',
      },
      {
        property: 'og:description',
        content:
          'Track foster momma cats and their kittens: batches, feedings, weights, bathroom logs and litter-box changes.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: DashboardPage,
})
