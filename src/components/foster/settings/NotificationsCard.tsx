import { useEffect, useState } from 'react'
import { Bell, BellOff, Smartphone } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/foster/ui/Button'
import { Card } from '@/components/foster/ui/Card'
import {
  currentPushSubscription,
  disablePushNotifications,
  enablePushNotifications,
  isStandaloneWebApp,
  supportsPushNotifications,
} from '@/lib/push-notifications'

export function NotificationsCard() {
  const { user } = useAuth()
  const [enabled, setEnabled] = useState(false)
  const [checking, setChecking] = useState(true)
  const [busy, setBusy] = useState(false)
  const [supported, setSupported] = useState<boolean | null>(null)
  const [standalone, setStandalone] = useState(false)

  useEffect(() => {
    const nextSupported = supportsPushNotifications()
    setSupported(nextSupported)
    setStandalone(isStandaloneWebApp())
    if (!nextSupported) {
      setChecking(false)
      return
    }
    currentPushSubscription()
      .then((subscription) => setEnabled(Boolean(subscription)))
      .finally(() => setChecking(false))
  }, [])

  const toggle = async () => {
    if (!user) return
    setBusy(true)
    try {
      if (enabled) {
        await disablePushNotifications()
        setEnabled(false)
        toast.success('Notifications disabled on this device')
      } else {
        await enablePushNotifications(user.id)
        setEnabled(true)
        toast.success('Notifications enabled on this device')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update notifications')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
          {enabled ? (
            <Bell aria-hidden className="h-5 w-5" />
          ) : (
            <BellOff aria-hidden className="h-5 w-5" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-ink">Push notifications</h2>
          <p className="mt-1 text-sm text-muted">
            Get notified when another collaborator adds a feeding, poop, weigh-in or litter-box
            change.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-gray-50 p-4">
        {supported == null ? (
          <p className="text-sm text-muted">Checking notification support…</p>
        ) : !supported ? (
          <p className="text-sm text-muted">
            This browser does not support web push notifications.
          </p>
        ) : !standalone && /iPad|iPhone|iPod/.test(navigator.userAgent) ? (
          <div className="flex gap-3">
            <Smartphone aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-muted" />
            <p className="text-sm text-muted">
              On iPhone or iPad, add Kitty Tracker to your Home Screen first, then open it from the
              new icon to enable notifications.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-ink">
                {checking
                  ? 'Checking this device…'
                  : enabled
                    ? 'Enabled on this device'
                    : 'Disabled on this device'}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                Settings apply separately to each browser or device.
              </p>
            </div>
            <Button
              disabled={checking || busy || !user}
              onClick={toggle}
              variant={enabled ? 'secondary' : 'primary'}
            >
              {busy ? 'Updating…' : enabled ? 'Turn off' : 'Enable notifications'}
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
