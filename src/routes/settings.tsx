import { createFileRoute } from '@tanstack/react-router'
import { SettingsPage } from '@/components/foster/pages/SettingsPage'

export const Route = createFileRoute('/settings')({
  head: () => ({
    meta: [
      { title: 'Settings & Data Management | Kitty Tracker' },
      {
        name: 'description',
        content:
          'Import batches, kittens and logs from CSV or Google Sheets, export CSV bundles and download complete backups of your foster records.',
      },
      { property: 'og:title', content: 'Settings & Data Management | Kitty Tracker' },
      {
        property: 'og:description',
        content: 'Import, export and back up your foster kitten records.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: SettingsPage,
})
