import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type NotificationType = 'feeding' | 'dry_top_up' | 'poop' | 'weigh_in' | 'litter_change'

interface RequestBody {
  litterId: string
  type: NotificationType
  count: number
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authorization = request.headers.get('Authorization')
    if (!authorization) return json({ error: 'Missing authorization' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
    })
    const admin = createClient(supabaseUrl, serviceRoleKey)
    const { data: authData, error: authError } = await userClient.auth.getUser()
    const actor = authData.user
    if (authError || !actor) return json({ error: 'Invalid authorization' }, 401)

    const body = (await request.json()) as RequestBody
    if (!body.litterId || !['feeding', 'poop', 'weigh_in', 'litter_change'].includes(body.type)) {
      return json({ error: 'Invalid notification request' }, 400)
    }
    const count = Math.max(1, Math.min(50, Math.round(Number(body.count) || 1)))

    const { data: litter, error: litterError } = await admin
      .from('litters')
      .select('user_id, mother_name, litter_name')
      .eq('id', body.litterId)
      .single()
    if (litterError || !litter) return json({ error: 'Batch not found' }, 404)

    const { data: collaborators, error: collaboratorsError } = await admin
      .from('litter_collaborators')
      .select('user_id')
      .eq('litter_id', body.litterId)
    if (collaboratorsError) throw collaboratorsError
    const memberIds = new Set([
      litter.user_id,
      ...(collaborators ?? []).map((item) => item.user_id),
    ])
    if (!memberIds.has(actor.id)) return json({ error: 'Not allowed for this batch' }, 403)
    memberIds.delete(actor.id)
    if (!memberIds.size) return json({ sent: 0 })

    const { data: subscriptions, error: subscriptionError } = await admin
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .in('user_id', [...memberIds])
    if (subscriptionError) throw subscriptionError
    if (!subscriptions?.length) return json({ sent: 0 })

    const { data: profile } = await admin
      .from('profiles')
      .select('display_name')
      .eq('id', actor.id)
      .maybeSingle()
    const actorName = profile?.display_name ?? actor.email?.split('@')[0] ?? 'A collaborator'
    const batchName = litter.litter_name || litter.mother_name
    const notification = notificationContent(body.type, count, actorName, batchName, body.litterId)

    webpush.setVapidDetails(
      Deno.env.get('VAPID_SUBJECT') ?? 'mailto:agnesching19@gmail.com',
      Deno.env.get('VAPID_PUBLIC_KEY')!,
      Deno.env.get('VAPID_PRIVATE_KEY')!,
    )

    let sent = 0
    await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: { p256dh: subscription.p256dh, auth: subscription.auth },
            },
            JSON.stringify(notification),
          )
          sent += 1
        } catch (error) {
          const statusCode = (error as { statusCode?: number }).statusCode
          if (statusCode === 404 || statusCode === 410) {
            await admin.from('push_subscriptions').delete().eq('id', subscription.id)
            return
          }
          console.error('Push delivery failed', error)
        }
      }),
    )

    return json({ sent })
  } catch (error) {
    console.error(error)
    return json({ error: error instanceof Error ? error.message : 'Notification failed' }, 500)
  }
})

function notificationContent(
  type: NotificationType,
  count: number,
  actor: string,
  batch: string,
  litterId: string,
) {
  if (type === 'feeding') {
    return {
      title: `${batch}: feeding logged`,
      body: `${actor} logged ${count} pouch${count === 1 ? '' : 'es'}.`,
      url: '/feedings',
      tag: `${litterId}-feeding`,
    }
  }
  if (type === 'dry_top_up') {
    return {
      title: `${batch}: dry food topped up`,
      body: `${actor} topped up ${count} shared bowl${count === 1 ? '' : 's'}.`,
      url: '/feedings',
      tag: `${litterId}-dry-top-up`,
    }
  }
  if (type === 'poop') {
    return {
      title: `${batch}: poop logged`,
      body: `${actor} logged ${count} poop${count === 1 ? '' : 's'}.`,
      url: '/poops',
      tag: `${litterId}-poop`,
    }
  }
  if (type === 'weigh_in') {
    return {
      title: `${batch}: weigh-in logged`,
      body: `${actor} recorded ${count} kitten weight${count === 1 ? '' : 's'}.`,
      url: '/weights',
      tag: `${litterId}-weigh-in`,
    }
  }
  return {
    title: `${batch}: litter box changed`,
    body: `${actor} logged a litter-box change.`,
    url: '/litter',
    tag: `${litterId}-litter-change`,
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
