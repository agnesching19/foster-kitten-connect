import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/foster/ui/Button'
import { Card, CardHeader } from '@/components/foster/ui/Card'
import { buildExportZip, downloadBlob } from '@/lib/data-transfer/export'
import { ProgressBar } from './ProgressBar'
import { ConfirmDialog } from './ConfirmDialog'

interface BackupCardProps {
  onRestore: () => void
}

export function BackupCard({ onRestore }: BackupCardProps) {
  const [progress, setProgress] = useState<{ step: string; percent: number } | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  async function backup() {
    setProgress({ step: 'Starting…', percent: 0 })
    try {
      const result = await buildExportZip(null, setProgress)
      downloadBlob(result.blob, result.filename.replace('all-data', 'backup'))
      toast.success('Backup downloaded')
    } catch (error) {
      toast.error((error as Error).message || 'Backup failed')
    } finally {
      setProgress(null)
    }
  }

  return (
    <Card>
      <CardHeader
        title="Backup & restore"
        subtitle="Download a complete backup of every batch and log, or restore from a backup you saved earlier. Backups use the same ZIP format as exports."
      />

      <div className="flex flex-wrap gap-2">
        <Button size="md" onClick={() => void backup()} disabled={Boolean(progress)}>
          {progress ? 'Backing up…' : 'Download backup'}
        </Button>
        <Button size="md" variant="secondary" onClick={() => setConfirmOpen(true)}>
          Restore from backup
        </Button>
      </div>

      {progress ? <ProgressBar label={progress.step} percent={progress.percent} /> : null}

      <ConfirmDialog
        open={confirmOpen}
        title="Restore from a backup?"
        description="Restoring uses the CSV import above: pick your backup ZIP, review the preview, and choose how to handle batches that already exist."
        confirmLabel="Take me there"
        onConfirm={() => {
          setConfirmOpen(false)
          onRestore()
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </Card>
  )
}
