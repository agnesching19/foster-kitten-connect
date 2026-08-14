export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatRelativeDay(dateStr: string): string {
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const date = new Date(dateStr + 'T12:00:00')
  const diffDays = Math.round((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return formatDate(dateStr)
}

export function formatKittenAge(dateOfBirth: string, today = new Date()): string | null {
  const birthDate = new Date(`${dateOfBirth}T12:00:00`)
  const currentDate = new Date(today)
  currentDate.setHours(12, 0, 0, 0)

  const daysOld = Math.round((currentDate.getTime() - birthDate.getTime()) / 86_400_000)
  if (daysOld < 0) return null

  if (daysOld >= 12 * 7) {
    const {
      years = 0,
      months = 0,
      days = 0,
    } = intervalToDuration({
      start: birthDate,
      end: currentDate,
    })
    const parts: string[] = []

    if (years > 0) parts.push(`${years} ${years === 1 ? 'year' : 'years'}`)
    if (months > 0) parts.push(`${months} ${months === 1 ? 'month' : 'months'}`)
    if (days > 0) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`)

    return parts.join(' ')
  }

  const weeks = Math.floor(daysOld / 7)
  const days = daysOld % 7
  const parts: string[] = []

  if (weeks > 0) parts.push(`${weeks} ${weeks === 1 ? 'week' : 'weeks'}`)
  if (days > 0 || weeks === 0) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`)

  return parts.join(' ')
}
import { intervalToDuration } from 'date-fns'
