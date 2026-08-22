import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/foster/ui/Button'
import { Card, CardHeader } from '@/components/foster/ui/Card'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import {
  batchDisplayName,
  littersQueryOptions,
  pickCurrentLitter,
  profilesQueryOptions,
} from '@/lib/foster-queries'

const inputClass =
  'min-h-11 min-w-0 flex-1 rounded-xl border border-border bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100'

type AccessScope = 'batch' | 'existing' | 'future'

export function CollaborationCard() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data: litters = [] } = useQuery(littersQueryOptions)
  const { data: profiles = [] } = useQuery(profilesQueryOptions)
  const ownedLitters = litters.filter((litter) => litter.user_id === user?.id)
  const defaultLitter = pickCurrentLitter(ownedLitters)
  const [selectedLitterId, setSelectedLitterId] = useState('')
  const [collaboratorEmail, setCollaboratorEmail] = useState('')
  const [accessScope, setAccessScope] = useState<AccessScope>('batch')
  const litter = ownedLitters.find((item) => item.id === selectedLitterId) ?? defaultLitter

  useEffect(() => {
    if (!selectedLitterId && defaultLitter) setSelectedLitterId(defaultLitter.id)
  }, [defaultLitter, selectedLitterId])

  const { data: collaborators = [], isLoading } = useQuery({
    queryKey: ['litter-collaborators', litter?.id],
    enabled: Boolean(user && litter),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('litter_collaborators')
        .select('litter_id, user_id, role, created_at')
        .eq('litter_id', litter!.id)
        .order('created_at')
      if (error) throw error
      return data ?? []
    },
  })

  const { data: futureEditors = [] } = useQuery({
    queryKey: ['future-foster-editors', user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('foster_editor_defaults')
        .select('owner_id, user_id, created_at')
        .eq('owner_id', user!.id)
        .order('created_at')
      if (error) throw error
      return data ?? []
    },
  })

  const addCollaborator = useMutation({
    mutationFn: async (email: string) => {
      if (!litter) throw new Error('No batch selected')
      const { error } =
        accessScope === 'batch'
          ? await supabase.rpc('add_litter_collaborator_by_email', {
              target_litter_id: litter.id,
              target_email: email.trim(),
            })
          : await supabase.rpc('add_foster_editor_by_email', {
              target_email: email.trim(),
              include_future: accessScope === 'future',
            })
      if (error) throw error
    },
    onSuccess: async () => {
      setCollaboratorEmail('')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['litter-collaborators'] }),
        queryClient.invalidateQueries({ queryKey: ['future-foster-editors', user?.id] }),
        queryClient.invalidateQueries({ queryKey: ['profiles'] }),
      ])
      toast.success(
        accessScope === 'batch'
          ? 'Editor added to this batch'
          : accessScope === 'existing'
            ? 'Editor added to all existing batches'
            : 'Editor added to existing and future batches',
      )
    },
    onError: (error: Error) => toast.error(error.message || 'Could not add the editor'),
  })

  const removeCollaborator = useMutation({
    mutationFn: async (userId: string) => {
      if (!litter) throw new Error('No batch selected')
      const { error } = await supabase
        .from('litter_collaborators')
        .delete()
        .eq('litter_id', litter.id)
        .eq('user_id', userId)
      if (error) throw error
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['litter-collaborators', litter?.id] })
      toast.success('Editor removed from this batch')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not remove the editor'),
  })

  const removeFutureEditor = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('foster_editor_defaults')
        .delete()
        .eq('owner_id', user!.id)
        .eq('user_id', userId)
      if (error) throw error
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['future-foster-editors', user?.id] })
      toast.success('Automatic future access stopped')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not update future access'),
  })

  const profileName = (userId: string) =>
    profiles.find((profile) => profile.id === userId)?.display_name ?? 'Foster carer'

  return (
    <Card>
      <CardHeader
        title="Batch access"
        subtitle="Choose which current, previous and future batches another fosterer can edit."
      />

      {!user || !ownedLitters.length || !litter ? (
        <p className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-muted">
          Sign in and add a batch before inviting another editor.
        </p>
      ) : (
        <div className="grid gap-4">
          <label>
            <span className="mb-1 block text-sm font-medium text-ink">Manage access for</span>
            <select
              value={litter.id}
              onChange={(event) => setSelectedLitterId(event.target.value)}
              className={inputClass}
            >
              {ownedLitters.map((item) => (
                <option key={item.id} value={item.id}>
                  {batchDisplayName(item)} · {item.status === 'active' ? 'Active' : 'Completed'}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-xl border border-border bg-gray-50 px-3 py-2.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Owner</p>
            <p className="mt-0.5 text-sm font-semibold text-ink">
              {profileName(litter.user_id)} (you)
            </p>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted">Loading editors…</p>
          ) : collaborators.length ? (
            <ul className="divide-y divide-border rounded-xl border border-border px-3">
              {collaborators.map((entry) => (
                <li key={entry.user_id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">{profileName(entry.user_id)}</p>
                    <p className="text-xs text-muted">Editor</p>
                  </div>
                  <Button
                    size="md"
                    variant="secondary"
                    className="min-h-9 px-3 py-1.5"
                    disabled={removeCollaborator.isPending}
                    onClick={() => removeCollaborator.mutate(entry.user_id)}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-border px-3 py-3 text-sm text-muted">
              No additional editors for {batchDisplayName(litter)}.
            </p>
          )}

          <div className="grid gap-2 rounded-xl border border-border p-3">
            <input
              type="email"
              aria-label="Editor's email address"
              placeholder="Editor’s account email"
              value={collaboratorEmail}
              onChange={(event) => setCollaboratorEmail(event.target.value)}
              className={inputClass}
            />
            <label className="text-sm font-medium text-ink" htmlFor="access-scope">
              Give access to
            </label>
            <select
              id="access-scope"
              value={accessScope}
              onChange={(event) => setAccessScope(event.target.value as AccessScope)}
              className={inputClass}
            >
              <option value="batch">This batch only</option>
              <option value="existing">All my existing batches</option>
              <option value="future">All existing and future batches</option>
            </select>
            <Button
              size="md"
              disabled={!collaboratorEmail.trim() || addCollaborator.isPending}
              onClick={() => addCollaborator.mutate(collaboratorEmail)}
            >
              {addCollaborator.isPending ? 'Adding…' : 'Add editor'}
            </Button>
          </div>

          {futureEditors.length ? (
            <div>
              <p className="mb-2 text-sm font-semibold text-ink">Automatic future access</p>
              <ul className="divide-y divide-border rounded-xl border border-border px-3">
                {futureEditors.map((entry) => (
                  <li key={entry.user_id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">{profileName(entry.user_id)}</p>
                      <p className="text-xs text-muted">Added automatically to new batches</p>
                    </div>
                    <Button
                      size="md"
                      variant="secondary"
                      className="min-h-9 px-3 py-1.5"
                      disabled={removeFutureEditor.isPending}
                      onClick={() => removeFutureEditor.mutate(entry.user_id)}
                    >
                      Stop
                    </Button>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted">
                Stopping future access does not remove access already granted to existing batches.
              </p>
            </div>
          ) : null}
        </div>
      )}
    </Card>
  )
}
