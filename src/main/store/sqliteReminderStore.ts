import path from 'path'
import { DateTime } from 'luxon'
import Database from 'better-sqlite3'
import { app } from 'electron'
import type {
  Reminder,
  RecurrenceFrequency,
  ReminderType,
} from '../../shared/reminderTypes'
import type { ReminderInput, ReminderStore, ReminderUpdateInput } from './reminderStore'

const DB_FILENAME = 'reminders.sqlite'

function normalizeNotes(notes: string | undefined | null): string | null {
  if (notes === undefined || notes === null) return null
  const trimmed = notes.trim()
  return trimmed ? trimmed : null
}

function validateReminderInput(input: ReminderInput) {
  if (!input.title.trim()) throw new Error('Title is required')
  if (!input.timezone.trim()) throw new Error('Timezone is required')
  if (!Number.isFinite(input.dueAtMs)) throw new Error('dueAtMs is required')

  if (input.type !== 'one_time') {
    if (!input.recurrence) throw new Error('recurrence is required for recurring reminders')
  }

  const tz = input.timezone
  const test = DateTime.now().setZone(tz)
  if (!test.isValid) throw new Error('Invalid timezone')
}

function mapRow(row: any): Reminder {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes ?? undefined,
    type: row.type as ReminderType,
    recurrence: row.recurrence ?? undefined,
    timezone: row.timezone,
    dueAtMs: row.dueAtMs,
    enabled: !!row.enabled,
    createdAtMs: row.createdAtMs,
    updatedAtMs: row.updatedAtMs,
    lastFiredAtMs: row.lastFiredAtMs ?? null,
  }
}

export function createSqliteReminderStore(): ReminderStore {
  const dbPath = path.join(app.getPath('userData'), DB_FILENAME)
  const db = new Database(dbPath)

  db.pragma('journal_mode = WAL')

  db.exec(`
    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      notes TEXT,
      type TEXT NOT NULL CHECK (type IN ('one_time', 'recurring')),
      recurrence TEXT,
      timezone TEXT NOT NULL,
      dueAtMs INTEGER NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      createdAtMs INTEGER NOT NULL,
      updatedAtMs INTEGER NOT NULL,
      lastFiredAtMs INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_reminders_due ON reminders (enabled, dueAtMs);
  `)

  const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`

  const listRemindersStmt = db.prepare(
    `SELECT id, title, notes, type, recurrence, timezone, dueAtMs, enabled, createdAtMs, updatedAtMs, lastFiredAtMs
     FROM reminders
     ORDER BY dueAtMs ASC`
  )

  const listDueStmt = db.prepare(
    `SELECT id, title, notes, type, recurrence, timezone, dueAtMs, enabled, createdAtMs, updatedAtMs, lastFiredAtMs
     FROM reminders
     WHERE enabled = 1 AND dueAtMs <= ?
     ORDER BY dueAtMs ASC`
  )

  return {
    async listReminders() {
      return listRemindersStmt.all().map(mapRow)
    },

    async listDueReminders(nowMs: number) {
      return listDueStmt.all(nowMs).map(mapRow)
    },

    async createReminder(input: ReminderInput) {
      validateReminderInput(input)

      const id = createId()
      const nowMs = Date.now()
      const type: ReminderType = input.type
      const recurrence: RecurrenceFrequency | undefined = type === 'recurring' ? input.recurrence : undefined

      const insert = db.prepare(
        `INSERT INTO reminders (id, title, notes, type, recurrence, timezone, dueAtMs, enabled, createdAtMs, updatedAtMs, lastFiredAtMs)
         VALUES (@id, @title, @notes, @type, @recurrence, @timezone, @dueAtMs, @enabled, @createdAtMs, @updatedAtMs, @lastFiredAtMs)`
      )

      insert.run({
        id,
        title: input.title.trim(),
        notes: normalizeNotes(input.notes),
        type,
        recurrence: recurrence ?? null,
        timezone: input.timezone,
        dueAtMs: input.dueAtMs,
        enabled: (input.enabled ?? true) ? 1 : 0,
        createdAtMs: nowMs,
        updatedAtMs: nowMs,
        lastFiredAtMs: null,
      })

      const row = db.prepare('SELECT * FROM reminders WHERE id = ?').get(id) as any
      return mapRow(row)
    },

    async updateReminder(input: ReminderUpdateInput & { id: string }) {
      const existing = db.prepare('SELECT * FROM reminders WHERE id = ?').get(input.id) as any
      if (!existing) throw new Error('Reminder not found')

      const type: ReminderType = input.type !== undefined ? input.type : existing.type
      const recurrence: RecurrenceFrequency | undefined =
        type === 'recurring' ? (input.recurrence !== undefined ? input.recurrence : existing.recurrence) : undefined

      const next: Reminder = mapRow({
        ...existing,
        title: input.title !== undefined ? input.title.trim() : existing.title,
        notes: input.notes !== undefined ? normalizeNotes(input.notes) : existing.notes,
        type,
        recurrence: recurrence ?? null,
        timezone: input.timezone !== undefined ? input.timezone : existing.timezone,
        dueAtMs: input.dueAtMs !== undefined ? input.dueAtMs : existing.dueAtMs,
        enabled: input.enabled !== undefined ? (input.enabled ? 1 : 0) : existing.enabled,
        lastFiredAtMs: input.lastFiredAtMs !== undefined ? input.lastFiredAtMs : existing.lastFiredAtMs,
      })

      // Validate timezone if it was changed
      if (input.timezone !== undefined) {
        const tzTest = DateTime.now().setZone(next.timezone)
        if (!tzTest.isValid) throw new Error('Invalid timezone')
      }

      db.prepare(
        `UPDATE reminders
         SET title = @title,
             notes = @notes,
             type = @type,
             recurrence = @recurrence,
             timezone = @timezone,
             dueAtMs = @dueAtMs,
             enabled = @enabled,
             lastFiredAtMs = @lastFiredAtMs,
             updatedAtMs = @updatedAtMs
         WHERE id = @id`
      ).run({
        id: next.id,
        title: next.title,
        notes: next.notes ?? null,
        type: next.type,
        recurrence: next.type === 'recurring' ? next.recurrence ?? null : null,
        timezone: next.timezone,
        dueAtMs: next.dueAtMs,
        enabled: next.enabled ? 1 : 0,
        lastFiredAtMs: next.lastFiredAtMs ?? null,
        updatedAtMs: Date.now(),
      })

      const row = db.prepare('SELECT * FROM reminders WHERE id = ?').get(next.id) as any
      return mapRow(row)
    },

    async deleteReminder(id) {
      db.prepare('DELETE FROM reminders WHERE id = ?').run(id)
    },
  }
}

