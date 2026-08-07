import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/foster/ui/Button'
import { Card, CardHeader } from '@/components/foster/ui/Card'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { littersQueryOptions, pickCurrentLitter, profilesQueryOptions } from '@/lib/foster-queries'

const inputClass =
  'min-h-11 min-w-0 flex-1 rounded-xl border border-border bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100'

export function CollaborationCard() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data: litters = [] } = useQuery(littersQueryOptions)
  const { data: profiles = [] } = useQuery(profilesQueryOptions)
  const litter = pickCurrentLitter(litters)
  const isOwner = Boolean(user && litter?.user_id === user.id)
  const [selectedUserId, setSelectedUserId] = useState('')

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

  const collaboratorIds = new Set(collaborators.map((entry) => entry.user_id))
  const availableProfiles = profiles.filter(
    (profile) => profile.id !== litter?.user_id && !collaboratorIds.has(profile.id),
  )

  const addCollaborator = useMutation({
    mutationFn: async (userId: string) => {
      if (!litter) throw new Error('No batch selected')
      const { error } = await supabase.from('litter_collaborators').insert({
        litter_id: litter.id,
        user_id: userId,
        role: 'editor',
      })
      if (error) throw error
    },
    onSuccess: async () => {
      setSelectedUserId('')
      await queryClient.invalidateQueries({ queryKey: ['litter-collaborators', litter?.id] })
      toast.success('Editor added')
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
      toast.success('Editor removed')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not remove the editor'),
  })

  const profileName = (userId: string) =>
    profiles.find((profile) => profile.id === userId)?.display_name ?? 'Foster carer'

  return (
    <Card>
      <CardHeader
        title="Batch access"
        subtitle={
          litter
            ? `Choose who can add, edit and delete records for ${litter.litter_name || litter.mother_name}.`
            : 'Add a batch before inviting another editor.'
        }
      />

      {!user || !litter ? (
        <p className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-muted">
          Sign in and select a batch to manage access.
        </p>
      ) : (
        <div className="grid gap-3">
          <div className="rounded-xl border border-border bg-gray-50 px-3 py-2.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Owner</p>
            <p className="mt-0.5 text-sm font-semibold text-ink">
              {profileName(litter.user_id)}
              {litter.user_id === user.id ? ' (you)' : ''}
            </p>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted">Loading editors…</p>
          ) : collaborators.length ? (
            <ul className="divide-y divide-border rounded-xl border border-border px-3">
              {collaborators.map((entry) => (
                <li key={entry.user_id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {profileName(entry.user_id)}
                      {entry.user_id === user.id ? ' (you)' : ''}
                    </p>
                    <p className="text-xs text-muted">Editor</p>
                  </div>
                  {isOwner ? (
                    <Button
                      size="md"
                      variant="secondary"
                      className="min-h-9 px-3 py-1.5"
                      disabled={removeCollaborator.isPending}
                      onClick={() => removeCollaborator.mutate(entry.user_id)}
                    >
                      Remove
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-border px-3 py-3 text-sm text-muted">
              No additional editors yet.
            </p>
          )}

          {isOwner ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                aria-label="Select an editor"
                value={selectedUserId}
                onChange={(event) => setSelectedUserId(event.target.value)}
                className={inputClass}
              >
                <option value="">Select a user…</option>
                {availableProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.display_name}
                  </option>
                ))}
              </select>
              <Button
                size="md"
                disabled={!selectedUserId || addCollaborator.isPending}
                onClick={() => addCollaborator.mutate(selectedUserId)}
              >
                {addCollaborator.isPending ? 'Adding…' : 'Add editor'}
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted">Only the batch owner can change editor access.</p>
          )}
        </div>
      )}
    </Card>
  )
}
