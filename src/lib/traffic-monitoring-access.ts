const TRAFFIC_MONITORING_ADMIN_EMAILS = new Set([
  'agnesching19@gmail.com',
  'simon.r.clark@gmail.com',
])

export function isTrafficMonitoringAdmin(email: string | null | undefined) {
  return TRAFFIC_MONITORING_ADMIN_EMAILS.has(email?.trim().toLowerCase() ?? '')
}
