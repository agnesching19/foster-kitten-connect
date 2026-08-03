import { useRef } from 'react'
import { PageHeader } from '@/components/foster/layout/PageHeader'
import { BackupCard } from '@/components/foster/settings/BackupCard'
import { CsvImportCard } from '@/components/foster/settings/CsvImportCard'
import { ExportDataCard } from '@/components/foster/settings/ExportDataCard'
import { GoogleSheetsImportCard } from '@/components/foster/settings/GoogleSheetsImportCard'
import { LegacyImportCard } from '@/components/foster/settings/LegacyImportCard'

export function SettingsPage() {
  const csvRef = useRef<HTMLDivElement>(null)

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Data management — import your existing records, export CSV bundles and keep backups."
      />

      <div className="grid gap-4">
        <GoogleSheetsImportCard />
        <LegacyImportCard />
        <div ref={csvRef} className="scroll-mt-24">
          <CsvImportCard />
        </div>
        <ExportDataCard />
        <BackupCard
          onRestore={() => csvRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        />
      </div>
    </div>
  )
}