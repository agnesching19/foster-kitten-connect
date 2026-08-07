import { useRef, useState } from 'react'
import { Link, useSearch } from '@tanstack/react-router'
import { ArrowLeft, ChevronRight, Database, PawPrint, UserRound, UsersRound } from 'lucide-react'
import { PageHeader } from '@/components/foster/layout/PageHeader'
import { BackupCard } from '@/components/foster/settings/BackupCard'
import { CollaborationCard } from '@/components/foster/settings/CollaborationCard'
import { ExportDataCard } from '@/components/foster/settings/ExportDataCard'
import { FeedingFlavoursCard } from '@/components/foster/settings/FeedingFlavoursCard'
import { ImportDataCard, type ImportMethod } from '@/components/foster/settings/ImportDataCard'
import { LegacyImportCard } from '@/components/foster/settings/LegacyImportCard'
import { LiveCamAccessCard } from '@/components/foster/settings/LiveCamAccessCard'
import { ProfileCard } from '@/components/foster/settings/ProfileCard'

export type SettingsSection = 'profile' | 'feeding' | 'access' | 'data'

const settingsSections: Array<{
  id: SettingsSection
  title: string
  description: string
  icon: typeof UserRound
}> = [
  {
    id: 'profile',
    title: 'Your profile',
    description: 'Update the name shown beside the records you add.',
    icon: UserRound,
  },
  {
    id: 'feeding',
    title: 'Feeding flavours',
    description: 'Add, rename or remove the quick pouch options.',
    icon: PawPrint,
  },
  {
    id: 'access',
    title: 'People & access',
    description: 'Manage batch collaborators and private live-cam access.',
    icon: UsersRound,
  },
  {
    id: 'data',
    title: 'Data management',
    description: 'Import, export, restore and back up your records.',
    icon: Database,
  },
]

export function SettingsPage() {
  const { section } = useSearch({ from: '/settings' })
  const importRef = useRef<HTMLDivElement>(null)
  const [importMethod, setImportMethod] = useState<ImportMethod>('sheets')

  if (!section) {
    return (
      <div>
        <PageHeader title="Settings" subtitle="Choose what you would like to manage." />
        <div className="grid gap-4 sm:grid-cols-2">
          {settingsSections.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.id}
                to="/settings"
                search={{ section: item.id }}
                className="group flex min-h-36 items-start gap-4 rounded-2xl border border-border bg-surface-raised p-5 shadow-sm transition hover:border-brand-300 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                  <Icon aria-hidden="true" className="h-6 w-6" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-semibold text-ink">{item.title}</span>
                  <span className="mt-1 block text-sm leading-5 text-muted">
                    {item.description}
                  </span>
                </span>
                <ChevronRight
                  aria-hidden="true"
                  className="mt-3 h-5 w-5 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-brand-700"
                />
              </Link>
            )
          })}
        </div>
      </div>
    )
  }

  const current = settingsSections.find((item) => item.id === section)

  return (
    <div>
      <Link
        to="/settings"
        search={{}}
        className="mb-3 inline-flex min-h-11 items-center gap-2 rounded-xl pr-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        All settings
      </Link>
      <PageHeader
        title={current?.title ?? 'Settings'}
        subtitle={current?.description ?? 'Choose what you would like to manage.'}
      />

      <div className="grid gap-4">
        {section === 'profile' ? <ProfileCard /> : null}
        {section === 'feeding' ? <FeedingFlavoursCard /> : null}
        {section === 'access' ? (
          <>
            <CollaborationCard />
            <LiveCamAccessCard />
          </>
        ) : null}
        {section === 'data' ? (
          <>
            <div ref={importRef} className="scroll-mt-24">
              <ImportDataCard method={importMethod} onMethodChange={setImportMethod} />
            </div>
            <LegacyImportCard />
            <ExportDataCard />
            <BackupCard
              onRestore={() => {
                setImportMethod('csv')
                requestAnimationFrame(() =>
                  importRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
                )
              }}
            />
          </>
        ) : null}
      </div>
    </div>
  )
}
