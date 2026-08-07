import { createFileRoute } from '@tanstack/react-router'
import { AuthPage } from '@/components/foster/pages/AuthPage'

export const Route = createFileRoute('/auth')({
  head: () => ({
    meta: [
      { title: 'Sign In | Kitty Tracker' },
      {
        name: 'description',
        content:
          'Sign in or create an account to log feedings, weights and litter-box records for your foster cats.',
      },
      { property: 'og:title', content: 'Sign In | Kitty Tracker' },
      {
        property: 'og:description',
        content: 'Access your Kitty Tracker account.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: AuthPage,
})
