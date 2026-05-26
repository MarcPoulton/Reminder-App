import { DateTime } from 'luxon'
import type { RecurrenceFrequency } from '../../shared/reminderTypes'

export function computeNextDueAtMs(params: {
  dueAtMs: number
  timezone: string
  recurrence: RecurrenceFrequency
}): number {
  const { dueAtMs, timezone, recurrence } = params
  const dt = DateTime.fromMillis(dueAtMs, { zone: timezone })
  if (!dt.isValid) throw new Error('Invalid dueAtMs/timezone')

  switch (recurrence) {
    case 'daily':
      return dt.plus({ days: 1 }).toUTC().toMillis()
    case 'weekly':
      return dt.plus({ weeks: 1 }).toUTC().toMillis()
    case 'monthly':
      return dt.plus({ months: 1 }).toUTC().toMillis()
    default:
      // Exhaustiveness for future changes.
      throw new Error(`Unsupported recurrence: ${recurrence as string}`)
  }
}

