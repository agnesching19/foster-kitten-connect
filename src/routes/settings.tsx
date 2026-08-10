import { createFileRoute } from '@tanstack/react-router'
import { SettingsPage, type SettingsSection } from '@/components/foster/pages/SettingsPage'

const settingsSections: SettingsSection[] = [
  'profile',
  'notifications',
  'feeding',
  'litter-routine',
  'access',
  'data',
]

export const Route = createFileRoute('/settings')({
  validateSearch: (search: Record<string, unknown>): { section?: SettingsSection } => {
    const section = search['section']
    return typeof section === 'string' && settingsSections.includes(section as SettingsSection)
      ? { section: section as SettingsSection }
      : {}
  },
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
