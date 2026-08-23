import { supabase } from '@/integrations/supabase/client'

export const VAPID_PUBLIC_KEY =
  'BOrv7AvwBvotcnsq_uy0y3DEA2asqhZ-a1G3Z13rzaqLK4SGQvoVRd06-pel07FswiD3AtsVWz44rjS0bsFSZts'

export type LogNotificationType =
  'feeding' | 'dry_top_up' | 'treat' | 'poop' | 'weigh_in' | 'litter_change'

export function supportsPushNotifications() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export function isStandaloneWebApp() {
  if (typeof window === 'undefined') return false
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean }
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    navigatorWithStandalone.standalone === true
  )
}

export async function registerPushServiceWorker() {
  if (!('serviceWorker' in navigator)) return null
  return navigator.serviceWorker.register('/sw.js')
}

export async function currentPushSubscription() {
  if (!supportsPushNotifications()) return null
  const registration = await registerPushServiceWorker()
  return registration?.pushManager.getSubscription() ?? null
}

export async function enablePushNotifications(userId: string) {
  if (!supportsPushNotifications()) throw new Error('Push notifications are not supported here.')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Notification permission was not granted.')
  const registration = await registerPushServiceWorker()
  if (!registration) throw new Error('Could not start notification support.')
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    }))
  const json = subscription.toJSON()
  if (!json.keys?.['p256dh'] || !json.keys['auth'])
    throw new Error('The browser returned an invalid subscription.')
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh: json.keys['p256dh'],
      auth: json.keys['auth'],
      user_agent: navigator.userAgent,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' },
  )
  if (error) throw error
  return subscription
}

export async function disablePushNotifications() {
  const subscription = await currentPushSubscription()
  if (!subscription) return
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', subscription.endpoint)
  if (error) throw error
  await subscription.unsubscribe()
}

export async function sendLogNotification(
  litterId: string,
  type: LogNotificationType,
  count: number,
) {
  const { error } = await supabase.functions.invoke('send-log-notification', {
    body: { litterId, type, count },
  })
  if (error) console.warn('Could not send log notification', error)
}

function urlBase64ToUint8Array(value: string) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4)
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)))
}
