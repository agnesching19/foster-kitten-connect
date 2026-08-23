type TrafficMetric = {
  count: number
  errors: number
  bytes: number
}

const FLUSH_DELAY_MS = 60_000
const metrics = new Map<string, TrafficMetric>()
let authToken: string | null = null
let flushTimer: ReturnType<typeof setTimeout> | undefined
let flushing = false

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => void flush())
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flush()
  })
}

export function setTrafficMonitorAuthToken(token: string | null): void {
  authToken = token
  if (token && metrics.size) scheduleFlush()
}

export function recordSupabaseTraffic(metric: string, response: Response): void {
  if (response.url.includes('/rpc/record_traffic_metrics')) return
  const contentLength = Number(response.headers.get('content-length'))
  record(metric, response.ok ? 0 : 1, Number.isFinite(contentLength) ? contentLength : 0)

  if (!Number.isFinite(contentLength) || contentLength <= 0) {
    void response
      .arrayBuffer()
      .then((body) => addBytes(metric, body.byteLength))
      .catch(() => undefined)
  }
}

export function recordImageTraffic(
  metric: 'community-thumbnail' | 'private-thumbnail' | 'preview',
  url: string,
): void {
  let bytes = 0
  if (typeof performance !== 'undefined') {
    const entry = performance.getEntriesByName(url).at(-1) as PerformanceResourceTiming | undefined
    bytes = entry?.transferSize ?? 0
  }
  record(`image:${metric}`, 0, bytes)
}

export function classifySupabaseRequest(input: RequestInfo | URL): string {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  const pathname = new URL(
    url,
    typeof window === 'undefined' ? 'http://localhost' : window.location.origin,
  ).pathname
  if (pathname.includes('/storage/v1/')) return 'api:storage'
  if (pathname.includes('/auth/v1/')) return 'api:auth'
  if (pathname.includes('/functions/v1/')) return 'api:function'
  if (pathname.includes('/rest/v1/rpc/')) return 'api:rpc'
  if (pathname.includes('/rest/v1/')) return 'api:database'
  return 'api:other'
}

function record(metric: string, errors: number, bytes: number): void {
  const current = metrics.get(metric) ?? { count: 0, errors: 0, bytes: 0 }
  current.count += 1
  current.errors += errors
  current.bytes += Math.max(0, Math.round(bytes))
  metrics.set(metric, current)
  scheduleFlush()
}

function addBytes(metric: string, bytes: number): void {
  const current = metrics.get(metric)
  if (!current) return
  current.bytes += Math.max(0, Math.round(bytes))
}

function scheduleFlush(): void {
  if (!authToken || flushTimer || typeof window === 'undefined') return
  flushTimer = setTimeout(() => {
    flushTimer = undefined
    void flush()
  }, FLUSH_DELAY_MS)
}

async function flush(): Promise<void> {
  if (flushing || !authToken || !metrics.size) return
  const supabaseUrl = import.meta.env['VITE_SUPABASE_URL'] as string | undefined
  const publishableKey = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] as string | undefined
  if (!supabaseUrl || !publishableKey) return

  const batch = [...metrics.entries()].map(([metric, value]) => ({ metric, ...value }))
  metrics.clear()
  flushing = true
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/record_traffic_metrics`, {
      method: 'POST',
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ metric_batch: batch }),
      keepalive: true,
    })
    if (!response.ok) throw new Error(`Traffic metrics returned ${response.status}`)
  } catch {
    for (const item of batch) {
      const current = metrics.get(item.metric) ?? { count: 0, errors: 0, bytes: 0 }
      current.count += item.count
      current.errors += item.errors
      current.bytes += item.bytes
      metrics.set(item.metric, current)
    }
  } finally {
    flushing = false
    if (metrics.size) scheduleFlush()
  }
}
