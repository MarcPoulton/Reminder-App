export type ReminderType = 'one_time' | 'recurring'

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly'

export type Reminder = {
  id: string
  title: string
  notes?: string

  type: ReminderType
  recurrence?: RecurrenceFrequency

  timezone: string
  dueAtMs: number

  enabled: boolean
  createdAtMs: number
  updatedAtMs: number

  lastFiredAtMs?: number | null
}

