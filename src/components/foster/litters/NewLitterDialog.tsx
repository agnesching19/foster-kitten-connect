import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/foster/ui/Button'

interface NewLitterDialogProps {
  open: boolean
  onClose: () => void
}

const inputClass =
  'min-h-11 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100'

export function NewLitterDialog({ open, onClose }: NewLitterDialogProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [motherName, setMotherName] = useState('')
  const [litterName, setLitterName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [arrived, setArrived] = useState('')
  const [leftDate, setLeftDate] = useState('')
  const [status, setStatus] = useState<'active' | 'completed'>('active')
  const [externalRecord, setExternalRecord] = useState('')
  const [albumUrl, setAlbumUrl] = useState('')

  function reset() {
    setMotherName('')
    setLitterName('')
    setDateOfBirth('')
    setArrived('')
    setLeftDate('')
    setStatus('active')
    setExternalRecord('')
    setAlbumUrl('')
  }

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('You need to be signed in to add a litter.')
      const { error } = await supabase.from('litters').insert({
        user_id: user.id,
        mother_name: motherName.trim(),
        litter_name: litterName.trim() || null,
        date_of_birth: dateOfBirth || null,
        arrived,
        left_date: leftDate || null,
        status,
        external_record: externalRecord.trim() || null,
        album_url: albumUrl.trim() || null,
      })
      if (error) throw error
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['litters'] })
      toast.success('Litter added')
      reset()
      onClose()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Could not save the litter')
    },
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-litter-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border bg-surface-raised p-5 shadow-lg sm:rounded-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="new-litter-title" className="text-lg font-semibold text-ink">New litter</h2>
            <p className="mt-0.5 text-sm text-muted">Add a foster batch to your dashboard</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted transition hover:bg-brand-50 hover:text-ink"
          >
            ✕
          </button>
        </div>

        {!user ? (
          <div className="rounded-xl bg-gray-50 px-3 py-4 text-sm text-muted">
            <p className="font-medium text-ink">Sign in required</p>
            <p className="mt-1">Litters are saved to your account, so please sign in first.</p>
            <Button
              size="md"
              className="mt-3"
              onClick={() => {
                onClose()
                navigate({ to: '/auth' })
              }}
            >
              Go to sign in
            </Button>
          </div>
        ) : (
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault()
              mutation.mutate()
            }}
          >
            <label className="sm:col-span-2">
              <span className="mb-1 block text-sm font-medium text-ink">Mother's name *</span>
              <input required value={motherName} onChange={(e) => setMotherName(e.target.value)} className={inputClass} placeholder="e.g. Willow" />
            </label>
            <label className="sm:col-span-2">
              <span className="mb-1 block text-sm font-medium text-ink">Litter name</span>
              <input value={litterName} onChange={(e) => setLitterName(e.target.value)} className={inputClass} placeholder="Optional" />
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium text-ink">Date of birth</span>
              <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className={inputClass} />
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium text-ink">Arrival date *</span>
              <input type="date" required value={arrived} onChange={(e) => setArrived(e.target.value)} className={inputClass} />
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium text-ink">Departure date</span>
              <input type="date" value={leftDate} onChange={(e) => setLeftDate(e.target.value)} className={inputClass} />
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium text-ink">Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value as 'active' | 'completed')} className={inputClass}>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </label>
            <label className="sm:col-span-2">
              <span className="mb-1 block text-sm font-medium text-ink">External record</span>
              <input value={externalRecord} onChange={(e) => setExternalRecord(e.target.value)} className={inputClass} placeholder="Optional reference" />
            </label>
            <label className="sm:col-span-2">
              <span className="mb-1 block text-sm font-medium text-ink">Photo album URL</span>
              <input type="url" value={albumUrl} onChange={(e) => setAlbumUrl(e.target.value)} className={inputClass} placeholder="https://" />
            </label>

            <div className="mt-1 flex gap-2 sm:col-span-2">
              <Button type="submit" size="md" fullWidth disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving…' : 'Save litter'}
              </Button>
              <Button type="button" variant="secondary" size="md" onClick={onClose} disabled={mutation.isPending}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
