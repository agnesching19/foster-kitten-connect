import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/foster/ui/Button'
import { CatAvatar } from '@/components/foster/ui/CatAvatar'
import { inputClass } from '@/components/foster/ui/FormDialog'
import { removeCatAvatars, uploadCatAvatar } from '@/lib/avatar-storage'
import type { LitterRow } from '@/lib/foster-queries'

interface NewLitterDialogProps {
  open: boolean
  onClose: () => void
  litter?: LitterRow | null
}

export function NewLitterDialog({ open, onClose, litter }: NewLitterDialogProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = Boolean(litter)

  const [batchType, setBatchType] = useState<'family' | 'single' | 'kittens_only'>('family')
  const [motherName, setMotherName] = useState('')
  const [litterName, setLitterName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [arrived, setArrived] = useState('')
  const [leftDate, setLeftDate] = useState('')
  const [status, setStatus] = useState<'active' | 'completed'>('active')
  const [externalRecord, setExternalRecord] = useState('')
  const [albumUrl, setAlbumUrl] = useState('')
  const [motherAvatar, setMotherAvatar] = useState<File | null>(null)
  const [removeMotherAvatar, setRemoveMotherAvatar] = useState(false)

  function reset() {
    setBatchType('family')
    setMotherName('')
    setLitterName('')
    setDateOfBirth('')
    setArrived('')
    setLeftDate('')
    setStatus('active')
    setExternalRecord('')
    setAlbumUrl('')
    setMotherAvatar(null)
    setRemoveMotherAvatar(false)
  }

  useEffect(() => {
    if (!open) return
    if (litter) {
      setBatchType(litter.batch_type)
      setMotherName(litter.primary_cat?.name ?? litter.mother_name)
      setLitterName(litter.litter_name ?? '')
      setDateOfBirth(litter.date_of_birth ?? '')
      setArrived(litter.arrived)
      setLeftDate(litter.left_date ?? '')
      setStatus(litter.status)
      setExternalRecord(litter.external_record ?? '')
      setAlbumUrl(litter.album_url ?? '')
      setMotherAvatar(null)
      setRemoveMotherAvatar(false)
    } else {
      reset()
    }
  }, [open, litter])

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('You need to be signed in to add a batch.')
      const litterId = litter?.id ?? crypto.randomUUID()
      let avatarPath = removeMotherAvatar
        ? null
        : (litter?.primary_cat?.avatar_path ?? litter?.mother_avatar_path ?? null)
      let uploadedPath: string | null = null

      if (motherAvatar) {
        uploadedPath = await uploadCatAvatar(motherAvatar, `${user.id}/mothers/${litterId}`)
        avatarPath = uploadedPath
      }

      const payload = {
        batch_type: batchType,
        mother_name: motherName.trim(),
        mother_avatar_path: avatarPath,
        litter_name: litterName.trim() || null,
        date_of_birth: dateOfBirth || null,
        arrived,
        left_date: leftDate || null,
        status,
        external_record: externalRecord.trim() || null,
        album_url: albumUrl.trim() || null,
      }
      const { error } = litter
        ? await supabase.from('litters').update(payload).eq('id', litter.id)
        : await supabase.from('litters').insert({ id: litterId, user_id: user.id, ...payload })
      if (error) {
        if (uploadedPath) {
          try {
            await removeCatAvatars([uploadedPath])
          } catch (removeError) {
            console.warn('Could not clean up the uploaded mother avatar', removeError)
          }
        }
        throw error
      }

      const primaryCat = litter?.primary_cat
      if (batchType === 'kittens_only') {
        if (primaryCat) {
          const { error: catError } = await supabase
            .from('kittens')
            .delete()
            .eq('id', primaryCat.id)
          if (catError) throw catError
        }
      } else {
        const { error: catError } = await supabase.from('kittens').upsert({
          id: primaryCat?.id ?? crypto.randomUUID(),
          user_id: user.id,
          litter_id: litterId,
          name: motherName.trim(),
          sort_order: -1,
          role: batchType === 'single' ? 'single' : 'mother',
          date_of_birth: batchType === 'single' ? dateOfBirth || null : null,
          avatar_path: avatarPath,
          tag_colour: null,
        })
        if (catError) throw catError
      }

      if (litter?.mother_avatar_path && litter.mother_avatar_path !== avatarPath) {
        try {
          await removeCatAvatars([litter.mother_avatar_path])
        } catch (removeError) {
          console.warn('Could not remove the previous mother avatar', removeError)
        }
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['litters'] }),
        queryClient.invalidateQueries({ queryKey: ['cats', litter?.id] }),
      ])
      toast.success(isEdit ? 'Batch updated' : 'Batch added')
      if (!isEdit) reset()
      onClose()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Could not save the batch')
    },
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-litter-title"
        className="max-h-[90vh] w-full min-w-0 max-w-lg overflow-x-hidden overflow-y-auto rounded-t-2xl border border-border bg-surface-raised p-5 pb-[calc(5rem+env(safe-area-inset-bottom))] shadow-lg sm:rounded-2xl sm:pb-5"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="new-litter-title" className="text-lg font-semibold text-ink">
              {isEdit ? 'Edit batch' : 'New batch'}
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              {isEdit ? 'Update this batch’s details' : 'Add a foster batch to your dashboard'}
            </p>
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
            <p className="mt-1">Batches are saved to your account, so please sign in first.</p>
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
            className="grid min-w-0 gap-4 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault()
              mutation.mutate()
            }}
          >
            <fieldset className="min-w-0 sm:col-span-2">
              <legend className="mb-2 text-sm font-medium text-ink">Who are you fostering?</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {(
                  [
                    ['family', 'Mother + kittens'],
                    ['single', 'Single cat'],
                    ['kittens_only', 'Kittens only'],
                  ] as const
                ).map(([value, label]) => (
                  <label
                    key={value}
                    className={`flex min-h-11 items-center justify-center rounded-xl border px-3 py-2 text-center text-sm font-medium transition ${(litter?.primary_cat && value === 'kittens_only') || (litter?.kittens.length && value === 'single') ? 'cursor-not-allowed bg-gray-50 text-muted opacity-50' : 'cursor-pointer'} ${batchType === value ? 'border-brand-400 bg-brand-100 text-brand-800' : 'border-border bg-white text-muted hover:bg-brand-50'}`}
                  >
                    <input
                      type="radio"
                      name="batch-type"
                      value={value}
                      checked={batchType === value}
                      disabled={Boolean(
                        (litter?.primary_cat && value === 'kittens_only') ||
                        (litter?.kittens.length && value === 'single'),
                      )}
                      onChange={() => setBatchType(value)}
                      className="sr-only"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
            {batchType !== 'kittens_only' ? (
              <label className="min-w-0 sm:col-span-2">
                <span className="mb-1 block text-sm font-medium text-ink">
                  {batchType === 'single' ? "Cat's name *" : "Mother's name *"}
                </span>
                <input
                  required
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Willow"
                />
              </label>
            ) : null}
            {batchType !== 'kittens_only' ? (
              <div className="flex min-w-0 items-center gap-3 overflow-hidden rounded-xl bg-gray-50 px-3 py-3 sm:col-span-2">
                <CatAvatar
                  name={motherName || (batchType === 'single' ? 'Foster cat' : 'Mother cat')}
                  avatarPath={
                    removeMotherAvatar
                      ? null
                      : (litter?.primary_cat?.avatar_path ?? litter?.mother_avatar_path ?? null)
                  }
                  size="lg"
                />
                <div className="min-w-0 flex-1">
                  <label className="block text-sm font-medium text-ink">
                    {batchType === 'single' ? "Cat's photo" : "Mother's photo"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="mt-1 block w-full min-w-0 max-w-full text-sm text-muted file:mr-2 file:rounded-lg file:border-0 file:bg-brand-100 file:px-3 file:py-2 file:font-medium file:text-brand-800"
                      onChange={(event) => {
                        setMotherAvatar(event.target.files?.[0] ?? null)
                        setRemoveMotherAvatar(false)
                      }}
                    />
                  </label>
                  {(litter?.primary_cat?.avatar_path ?? litter?.mother_avatar_path) &&
                  !motherAvatar ? (
                    <button
                      type="button"
                      className="mt-2 text-sm font-medium text-red-600 hover:text-red-700"
                      onClick={() => setRemoveMotherAvatar((current) => !current)}
                    >
                      {removeMotherAvatar ? 'Keep current photo' : 'Remove photo'}
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
            <label className="min-w-0 sm:col-span-2">
              <span className="mb-1 block text-sm font-medium text-ink">Batch name</span>
              <input
                value={litterName}
                onChange={(e) => setLitterName(e.target.value)}
                className={inputClass}
                placeholder="Optional"
              />
            </label>
            <label className="min-w-0">
              <span className="mb-1 block text-sm font-medium text-ink">Date of birth</span>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="min-w-0">
              <span className="mb-1 block text-sm font-medium text-ink">Arrival date *</span>
              <input
                type="date"
                required
                value={arrived}
                onChange={(e) => setArrived(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="min-w-0">
              <span className="mb-1 block text-sm font-medium text-ink">Departure date</span>
              <input
                type="date"
                value={leftDate}
                onChange={(e) => setLeftDate(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="min-w-0">
              <span className="mb-1 block text-sm font-medium text-ink">Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'completed')}
                className={inputClass}
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </label>
            <label className="min-w-0 sm:col-span-2">
              <span className="mb-1 block text-sm font-medium text-ink">External record</span>
              <input
                value={externalRecord}
                onChange={(e) => setExternalRecord(e.target.value)}
                className={inputClass}
                placeholder="Optional reference"
              />
            </label>
            <label className="min-w-0 sm:col-span-2">
              <span className="mb-1 block text-sm font-medium text-ink">Photo album URL</span>
              <input
                type="url"
                value={albumUrl}
                onChange={(e) => setAlbumUrl(e.target.value)}
                className={inputClass}
                placeholder="https://"
              />
            </label>

            <div className="mt-1 flex gap-2 sm:col-span-2">
              <Button type="submit" size="md" fullWidth disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Save batch'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={onClose}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
