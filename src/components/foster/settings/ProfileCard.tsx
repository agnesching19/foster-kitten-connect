import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/foster/ui/Button'
import { Card, CardHeader } from '@/components/foster/ui/Card'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { profilesQueryOptions } from '@/lib/foster-queries'

const inputClass =
  'min-h-11 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100'

export function ProfileCard() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data: profiles = [] } = useQuery(profilesQueryOptions)
  const profile = profiles.find((item) => item.id === user?.id)
  const [displayName, setDisplayName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile) setDisplayName(profile.display_name)
  }, [profile])

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) return
    const name = displayName.trim()
    if (!name) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, display_name: name }, { onConflict: 'id' })
      if (error) throw error
      await queryClient.invalidateQueries({ queryKey: ['profiles'] })
      toast.success('Display name updated')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update your display name')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader
        title="Your profile"
        subtitle="This name appears beside feedings, bathroom entries, weigh-ins and litter changes you add."
      />
      {user ? (
        <form onSubmit={save} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1">
            <span className="mb-1 block text-sm font-medium text-ink">Display name</span>
            <input
              required
              maxLength={80}
              autoComplete="name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className={inputClass}
            />
          </label>
          <Button
            type="submit"
            size="md"
            disabled={saving || !displayName.trim() || displayName.trim() === profile?.display_name}
          >
            {saving ? 'Saving…' : 'Save name'}
          </Button>
        </form>
      ) : (
        <p className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-muted">
          Sign in to edit your profile.
        </p>
      )}
    </Card>
  )
}
