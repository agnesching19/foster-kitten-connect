export const LIVE_CAMS_ADMIN_EMAIL = 'agnesching19@gmail.com'

export function isLiveCamsAdmin(email: string | null | undefined) {
  return email?.trim().toLowerCase() === LIVE_CAMS_ADMIN_EMAIL
}
