import type { Reminder } from '../shared/reminderTypes'

declare global {
  interface Window {
    reminderApi?: {
      getStatus: () => Promise<{ ok: true; app: string }>
      listReminders: () => Promise<Reminder[]>
      createReminder: (input: {
        title: string
        notes?: string
        type: Reminder['type']
        recurrence?: Reminder['recurrence']
        timezone: string
        dueAtMs: number
        enabled?: boolean
      }) => Promise<Reminder>
      updateReminder: (input: {
        id: string
        title?: string
        notes?: string
        type?: Reminder['type']
        recurrence?: Reminder['recurrence']
        timezone?: string
        dueAtMs?: number
        enabled?: boolean
      }) => Promise<Reminder>
      deleteReminder: (id: string) => Promise<void>
    }
  }
}

export {}

