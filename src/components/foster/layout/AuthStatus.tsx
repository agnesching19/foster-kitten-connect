import { Link, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export function AuthStatus({ variant }: { variant: 'sidebar' | 'mobile' }) {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  async function handleSignOut() {
    await queryClient.cancelQueries()
    queryClient.clear()
    await supabase.auth.signOut()
    toast.success('Signed out')
    navigate({ to: '/auth', replace: true })
  }

  if (loading) return null

  if (!user) {
    return (
      <Link
        to="/auth"
        className={
          variant === 'sidebar'
            ? 'flex min-h-11 items-center justify-center rounded-xl bg-brand-500 px-3 text-sm font-semibold text-white transition hover:bg-brand-600'
            : 'inline-flex min-h-9 items-center rounded-xl bg-brand-500 px-3 text-xs font-semibold text-white transition hover:bg-brand-600'
        }
      >
        Sign in
      </Link>
    )
  }

  if (variant === 'mobile') {
    return (
      <button
        type="button"
        onClick={handleSignOut}
        className="inline-flex min-h-9 items-center rounded-xl border border-border bg-white px-3 text-xs font-semibold text-ink transition hover:bg-brand-50"
      >
        Sign out
      </button>
    )
  }

  return (
    <div>
      <p className="truncate text-xs text-muted" title={user.email ?? ''}>
        {user.email}
      </p>
      <button
        type="button"
        onClick={handleSignOut}
        className="mt-2 flex min-h-10 w-full items-center justify-center rounded-xl border border-border bg-white px-3 text-sm font-semibold text-ink transition hover:bg-brand-50"
      >
        Sign out
      </button>
    </div>
  )
}
