import { DateTime } from 'luxon'
import type { Reminder, ReminderType, RecurrenceFrequency } from '../../shared/reminderTypes'

export type ReminderInput = {
  title: string
  notes?: string
  type: ReminderType
  recurrence?: RecurrenceFrequency
  timezone: string
  dueAtMs: number
  enabled?: boolean
}

export type ReminderUpdateInput = Partial<{
  id: string
  title: string
  notes: string | null
  type: ReminderType
  recurrence: RecurrenceFrequency | undefined
  timezone: string
  dueAtMs: number
  enabled: boolean
  lastFiredAtMs: number | null
}>

export type ReminderStore = {
  listReminders(): Promise<Reminder[]>
  listDueReminders(nowMs: number): Promise<Reminder[]>
  createReminder(input: ReminderInput): Promise<Reminder>
  updateReminder(input: ReminderUpdateInput & { id: string }): Promise<Reminder>
  deleteReminder(id: string): Promise<void>
}

// In-memory store used for the initial scaffolding. This will be replaced by SQLite
// in the storage task.
export function createInMemoryReminderStore(): ReminderStore {
  const byId = new Map<string, Reminder>()

  const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`

  const validate = (input: ReminderInput) => {
    if (!input.title.trim()) throw new Error('Title is required')
    if (!input.timezone.trim()) throw new Error('Timezone is required')
    if (!Number.isFinite(input.dueAtMs)) throw new Error('dueAtMs is required')
    if (input.type === 'one_time') return
    if (!input.recurrence) throw new Error('recurrence is required for recurring reminders')
    // Validate timezone quickly (Luxon)
    const tz = input.timezone
    const test = DateTime.now().setZone(tz)
    if (!test.isValid) throw new Error('Invalid timezone')
  }

  return {
    async listReminders() {
      return Array.from(byId.values())
    },

    async listDueReminders(nowMs) {
      return Array.from(byId.values()).filter((r) => r.enabled && r.dueAtMs <= nowMs)
    },

    async createReminder(input) {
      validate(input)
      const id = createId()
      const nowMs = Date.now()
      const reminder: Reminder = {
        id,
        title: input.title.trim(),
        notes: input.notes?.trim() ? input.notes.trim() : undefined,
        type: input.type,
        recurrence: input.type === 'recurring' ? input.recurrence : undefined,
        timezone: input.timezone,
        dueAtMs: input.dueAtMs,
        enabled: input.enabled ?? true,
        createdAtMs: nowMs,
        updatedAtMs: nowMs,
        lastFiredAtMs: null,
      }
      byId.set(id, reminder)
      return reminder
    },

    async updateReminder(input) {
      const existing = byId.get(input.id)
      if (!existing) throw new Error('Reminder not found')

      const next: Reminder = {
        ...existing,
        title: input.title !== undefined ? input.title.trim() : existing.title,
        notes:
          input.notes !== undefined ? (input.notes?.trim() ? input.notes.trim() : undefined) : existing.notes,
        type: input.type !== undefined ? input.type : existing.type,
        recurrence: input.recurrence !== undefined ? input.recurrence : existing.recurrence,
        timezone: input.timezone !== undefined ? input.timezone : existing.timezone,
        dueAtMs: input.dueAtMs !== undefined ? input.dueAtMs : existing.dueAtMs,
        enabled: input.enabled !== undefined ? input.enabled : existing.enabled,
        lastFiredAtMs: input.lastFiredAtMs !== undefined ? input.lastFiredAtMs : existing.lastFiredAtMs,
        updatedAtMs: Date.now(),
      }

      // Normalize notes: null/empty string => undefined
      // (ensures renderer doesn't need to reason about null)

      // Normalize type/recurrence relationship
      if (next.type === 'one_time') next.recurrence = undefined

      byId.set(next.id, next)
      return next
    },

    async deleteReminder(id) {
      byId.delete(id)
    },
  }
}

