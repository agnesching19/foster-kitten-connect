import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PageHeader } from '@/components/foster/layout/PageHeader'
import { Button } from '@/components/foster/ui/Button'
import { Card } from '@/components/foster/ui/Card'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'

type Mode = 'signin' | 'signup' | 'forgot' | 'reset'

const inputClass =
  'min-h-11 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100'

export function AuthPage({ initialMode }: { initialMode?: 'reset' }) {
  const [mode, setMode] = useState<Mode>(initialMode ?? 'signin')
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!loading && user && mode !== 'reset') navigate({ to: '/', replace: true })
  }, [loading, user, mode, navigate])

  function changeMode(nextMode: Mode) {
    setMode(nextMode)
    setPassword('')
    setConfirmPassword('')
    setResetEmailSent(false)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?mode=reset`,
        })
        if (error) throw error
        setResetEmailSent(true)
      } else if (mode === 'reset') {
        if (password !== confirmPassword) throw new Error('Passwords do not match')
        const { error } = await supabase.auth.updateUser({ password })
        if (error) throw error
        await queryClient.invalidateQueries()
        toast.success('Password updated')
        navigate({ to: '/', replace: true })
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: displayName.trim() },
          },
        })
        if (error) throw error
        if (data.session) {
          await queryClient.invalidateQueries()
          toast.success('Account created — you are signed in')
          navigate({ to: '/', replace: true })
        } else {
          toast.success('Check your email to confirm your account')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        await queryClient.invalidateQueries()
        toast.success('Signed in')
        navigate({ to: '/', replace: true })
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title={
          mode === 'signin'
            ? 'Sign in'
            : mode === 'signup'
              ? 'Create account'
              : mode === 'forgot'
                ? 'Reset your password'
                : 'Choose a new password'
        }
        subtitle={
          mode === 'forgot'
            ? "We'll email you a secure password reset link"
            : mode === 'reset'
              ? 'Enter a new password for your account'
              : 'Sign in to add and edit foster records'
        }
      />

      <Card className="mx-auto max-w-md" padding="lg">
        {(mode === 'signin' || mode === 'signup') && (
          <div
            className="mb-4 flex rounded-xl border border-border bg-white p-1"
            aria-label="Auth mode"
          >
            {(['signin', 'signup'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => changeMode(option)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${mode === option ? 'bg-brand-100 text-brand-800' : 'text-muted hover:text-ink'}`}
              >
                {option === 'signin' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>
        )}

        {mode === 'reset' && loading ? (
          <p role="status" className="py-6 text-center text-sm text-muted">
            Verifying your reset link…
          </p>
        ) : mode === 'reset' && !user ? (
          <div role="alert" className="text-center">
            <h2 className="text-lg font-semibold text-ink">This reset link is no longer valid</h2>
            <p className="mt-1 text-sm text-muted">
              Password reset links can expire or only be used once. Request a new link to continue.
            </p>
            <Button type="button" fullWidth className="mt-5" onClick={() => changeMode('forgot')}>
              Request a new link
            </Button>
            <Button
              type="button"
              variant="secondary"
              fullWidth
              className="mt-2"
              onClick={() => changeMode('signin')}
            >
              Back to sign in
            </Button>
          </div>
        ) : mode === 'forgot' && resetEmailSent ? (
          <div role="status" className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-xl text-brand-800">
              ✓
            </div>
            <h2 className="mt-3 text-lg font-semibold text-ink">Check your email</h2>
            <p className="mt-1 text-sm text-muted">
              If an account exists for {email}, we’ve sent it a password reset link.
            </p>
            <Button
              type="button"
              variant="secondary"
              fullWidth
              className="mt-5"
              onClick={() => changeMode('signin')}
            >
              Back to sign in
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' ? (
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-ink">Display name</span>
                <input
                  type="text"
                  required
                  maxLength={80}
                  autoComplete="name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className={inputClass}
                />
              </label>
            ) : null}
            {mode !== 'reset' ? (
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-ink">Email</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={inputClass}
                />
              </label>
            ) : null}
            {mode !== 'forgot' ? (
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-ink">
                  {mode === 'reset' ? 'New password' : 'Password'}
                </span>
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={inputClass}
                />
              </label>
            ) : null}
            {mode === 'reset' ? (
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-ink">
                  Confirm new password
                </span>
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className={inputClass}
                />
              </label>
            ) : null}
            {mode === 'signin' ? (
              <div className="text-right">
                <button
                  type="button"
                  className="text-sm font-semibold text-brand-700 hover:text-brand-800"
                  onClick={() => changeMode('forgot')}
                >
                  Forgot password?
                </button>
              </div>
            ) : null}
            <Button type="submit" fullWidth disabled={submitting} className="mt-2">
              {submitting
                ? 'Please wait…'
                : mode === 'signin'
                  ? 'Sign in'
                  : mode === 'signup'
                    ? 'Create account'
                    : mode === 'forgot'
                      ? 'Send reset link'
                      : 'Update password'}
            </Button>
            {mode === 'forgot' ? (
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={() => changeMode('signin')}
              >
                Back to sign in
              </Button>
            ) : null}
          </form>
        )}
      </Card>
    </div>
  )
}
