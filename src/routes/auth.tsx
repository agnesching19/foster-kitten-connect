import { createFileRoute } from '@tanstack/react-router'
import { AuthPage } from '@/components/foster/pages/AuthPage'

export const Route = createFileRoute('/auth')({
  head: () => ({
    meta: [
      { title: 'Sign In | Foster Tracker' },
      {
        name: 'description',
        content:
          'Sign in or create an account to log feedings, weights and litter records for your foster cats.',
      },
      { property: 'og:title', content: 'Sign In | Foster Tracker' },
      {
        property: 'og:description',
        content: 'Access your foster kitten tracker account.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: AuthPage,
})
