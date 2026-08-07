import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/foster/ui/Button'
import { Card, CardHeader } from '@/components/foster/ui/Card'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { profilesQueryOptions } from '@/lib/foster-queries'
import { isLiveCamsAdmin } from '@/lib/live-cams'

const inputClass =
  'min-h-11 min-w-0 flex-1 rounded-xl border border-border bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100'

export function LiveCamAccessCard() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedUserId, setSelectedUserId] = useState('')
  const admin = isLiveCamsAdmin(user?.email)
  const { data: profiles = [] } = useQuery(profilesQueryOptions)

  const { data: accessList = [], isLoading } = useQuery({
    queryKey: ['live-cam-access-list'],
    enabled: admin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('live_cam_access')
        .select('user_id, created_at')
        .order('created_at')
      if (error) throw error
      return data ?? []
    },
  })

  const accessIds = new Set(accessList.map((entry) => entry.user_id))
  const availableProfiles = profiles.filter((profile) => !accessIds.has(profile.id))
  const profileName = (userId: string) =>
    profiles.find((profile) => profile.id === userId)?.display_name ?? 'Kitty Tracker user'

  const grantAccess = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from('live_cam_access').insert({ user_id: userId })
      if (error) throw error
    },
    onSuccess: async () => {
      setSelectedUserId('')
      await queryClient.invalidateQueries({ queryKey: ['live-cam-access-list'] })
      toast.success('Live cam access granted')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not grant access'),
  })

  const revokeAccess = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from('live_cam_access').delete().eq('user_id', userId)
      if (error) throw error
    },
    onSuccess: async (_data, userId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['live-cam-access-list'] }),
        queryClient.invalidateQueries({ queryKey: ['live-cam-access', userId] }),
      ])
      toast.success('Live cam access removed')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not remove access'),
  })

  if (!admin) return null

  return (
    <Card>
      <CardHeader
        title="Live cam access"
        subtitle="Choose which registered Kitty Tracker users can see the private Live cams link."
      />

      <div className="grid gap-3">
        {isLoading ? (
          <p className="text-sm text-muted">Loading camera access…</p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border px-3">
            {accessList.map((entry) => {
              const isYou = entry.user_id === user?.id
              return (
                <li key={entry.user_id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {profileName(entry.user_id)}
                      {isYou ? ' (you)' : ''}
                    </p>
                    <p className="text-xs text-muted">{isYou ? 'Camera admin' : 'Can view cams'}</p>
                  </div>
                  {!isYou && (
                    <Button
                      size="md"
                      variant="secondary"
                      className="min-h-9 px-3 py-1.5"
                      disabled={revokeAccess.isPending}
                      onClick={() => revokeAccess.mutate(entry.user_id)}
                    >
                      Remove
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            aria-label="Select a user for live cam access"
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
            disabled={!selectedUserId || grantAccess.isPending}
            onClick={() => grantAccess.mutate(selectedUserId)}
          >
            {grantAccess.isPending ? 'Adding…' : 'Grant access'}
          </Button>
        </div>

        <p className="text-xs text-muted">
          This controls who sees the link in Kitty Tracker. The camera website should also require
          authentication if the URL itself must remain private.
        </p>
      </div>
    </Card>
  )
}
