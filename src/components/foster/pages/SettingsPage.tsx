import { useRef, useState } from 'react'
import { PageHeader } from '@/components/foster/layout/PageHeader'
import { BackupCard } from '@/components/foster/settings/BackupCard'
import { CollaborationCard } from '@/components/foster/settings/CollaborationCard'
import { ExportDataCard } from '@/components/foster/settings/ExportDataCard'
import { ImportDataCard, type ImportMethod } from '@/components/foster/settings/ImportDataCard'
import { LegacyImportCard } from '@/components/foster/settings/LegacyImportCard'
import { LiveCamAccessCard } from '@/components/foster/settings/LiveCamAccessCard'
import { ProfileCard } from '@/components/foster/settings/ProfileCard'

export function SettingsPage() {
  const importRef = useRef<HTMLDivElement>(null)
  const [importMethod, setImportMethod] = useState<ImportMethod>('sheets')

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Data management — import your existing records, export CSV bundles and keep backups."
      />

      <div className="grid gap-4">
        <ProfileCard />
        <CollaborationCard />
        <LiveCamAccessCard />
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
      </div>
    </div>
  )
}
