import type { NoteCategory } from '@/lib/foster-queries'

export const noteCategories: { value: NoteCategory; label: string; emoji: string }[] = [
  { value: 'milestone', label: 'Milestone', emoji: '🌟' },
  { value: 'behaviour', label: 'Behaviour', emoji: '🐾' },
  { value: 'health', label: 'Health', emoji: '🩺' },
  { value: 'medication', label: 'Medication', emoji: '💊' },
  { value: 'appointment', label: 'Appointment', emoji: '📅' },
  { value: 'general', label: 'General', emoji: '📝' },
]
