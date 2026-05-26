import { useEffect, useMemo, useState } from 'react'
import { DateTime } from 'luxon'
import type { Reminder, ReminderType, RecurrenceFrequency } from '../shared/reminderTypes'

type RecurrenceChoice = 'none' | RecurrenceFrequency

const formatDue = (dueAtMs: number, timezone: string) => {
  return DateTime.fromMillis(dueAtMs, { zone: timezone }).toLocaleString(
    DateTime.DATETIME_MED_WITH_WEEKDAY,
  )
}

export default function App() {
  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, [])

  const [ready, setReady] = useState(false)
  const [status, setStatus] = useState<string>('')
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [editing, setEditing] = useState<Reminder | null>(null)

  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [dueAtLocal, setDueAtLocal] = useState(() => {
    const dt = DateTime.local().plus({ minutes: 1 })
    return dt.toFormat("yyyy-LL-dd'T'HH:mm")
  })
  const [recurrenceChoice, setRecurrenceChoice] = useState<RecurrenceChoice>('none')
  const [enabled, setEnabled] = useState(true)

  const recurrence: RecurrenceFrequency | undefined =
    recurrenceChoice === 'none' ? undefined : recurrenceChoice
  const type: ReminderType = recurrence ? 'recurring' : 'one_time'

  const dueAtLocalForReminder = (rem: Reminder) => {
    return DateTime.fromMillis(rem.dueAtMs, { zone: rem.timezone }).toFormat("yyyy-LL-dd'T'HH:mm")
  }

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      if (!window.reminderApi) return false
      const st = await window.reminderApi.getStatus()
      setStatus(st.app)
      const list = await window.reminderApi.listReminders()
      setReminders(list.sort((a, b) => a.dueAtMs - b.dueAtMs))
      setReady(true)
      return true
    }

    ;(async () => {
      for (let i = 0; i < 50; i++) {
        if (cancelled) return
        try {
          const ok = await init()
          if (ok) return
        } catch (e) {
          console.error(e)
          setStatus('IPC error')
          return
        }
        await new Promise((r) => setTimeout(r, 100))
      }

      if (!cancelled) setStatus('IPC bridge not available')
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const refresh = async () => {
    if (!window.reminderApi) return
    const list = await window.reminderApi.listReminders()
    setReminders(list.sort((a, b) => a.dueAtMs - b.dueAtMs))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const api = window.reminderApi
    if (!api) return alert('IPC bridge not ready yet')

    const zone = editing ? editing.timezone : timezone
    const due = DateTime.fromISO(dueAtLocal, { zone })
    if (!due.isValid) return alert('Invalid date/time')

    const dueAtMs = due.toUTC().toMillis()
    if (!title.trim()) return alert('Please enter a title')

    const payload = {
      title: title.trim(),
      notes: notes.trim() ? notes.trim() : undefined,
      type,
      recurrence,
      timezone: zone,
      dueAtMs,
      enabled,
    }

    if (editing) {
      await api.updateReminder({ id: editing.id, ...payload })
    } else {
      await api.createReminder(payload)
    }

    // Reset form back to "create" mode.
    setEditing(null)
    setTitle('')
    setNotes('')
    setEnabled(true)
    setRecurrenceChoice('none')
    const dt = DateTime.local().plus({ minutes: 1 })
    setDueAtLocal(dt.toFormat("yyyy-LL-dd'T'HH:mm"))
    await refresh()
  }

  const handleDelete = async (id: string) => {
    if (!window.reminderApi) return
    await window.reminderApi.deleteReminder(id)
    await refresh()
  }

  const handleToggleEnabled = async (rem: Reminder) => {
    if (!window.reminderApi) return
    await window.reminderApi.updateReminder({ id: rem.id, enabled: !rem.enabled })
    await refresh()
  }

  const startEdit = (rem: Reminder) => {
    setEditing(rem)
    setTitle(rem.title)
    setNotes(rem.notes ?? '')
    setEnabled(rem.enabled)
    setRecurrenceChoice(rem.type === 'recurring' && rem.recurrence ? rem.recurrence : 'none')
    setDueAtLocal(dueAtLocalForReminder(rem))
  }

  const cancelEdit = () => {
    setEditing(null)
    setTitle('')
    setNotes('')
    setEnabled(true)
    setRecurrenceChoice('none')
    const dt = DateTime.local().plus({ minutes: 1 })
    setDueAtLocal(dt.toFormat("yyyy-LL-dd'T'HH:mm"))
  }

  if (!ready) {
    return (
      <div className="app">
        <h1>Reminder App</h1>
        <p>{status || 'Loading...'}</p>
      </div>
    )
  }

  return (
    <div className="app">
      <header>
        <h1>Reminder App</h1>
        <p className="muted">{status}</p>
      </header>

      <form className="card" onSubmit={handleCreate}>
        <h2>{editing ? 'Edit reminder' : 'Create reminder'}</h2>

        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Call mom" />
        </label>

        <label>
          Notes (optional)
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </label>

        <label>
          Due date/time
          <input
            type="datetime-local"
            value={dueAtLocal}
            onChange={(e) => setDueAtLocal(e.target.value)}
          />
        </label>

        <label>
          Recurrence
          <select value={recurrenceChoice} onChange={(e) => setRecurrenceChoice(e.target.value as RecurrenceChoice)}>
            <option value="none">None (one-time)</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </label>

        <label className="row">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          <span>Enabled</span>
        </label>

        <button type="submit" disabled={!title.trim()}>
          {editing ? 'Save changes' : 'Add reminder'}
        </button>

        {editing ? (
          <button type="button" className="danger" onClick={cancelEdit} style={{ marginTop: 8 }}>
            Cancel
          </button>
        ) : null}
      </form>

      <section className="card">
        <h2>Upcoming</h2>
        {reminders.length === 0 ? (
          <p className="muted">No reminders yet.</p>
        ) : (
          <ul className="list">
            {reminders.map((rem) => (
              <li key={rem.id} className="listItem">
                <div className="listMain">
                  <div className="listTitle">
                    {rem.title} {!rem.enabled ? <span className="pill muted">disabled</span> : null}
                  </div>
                  <div className="muted">
                    {formatDue(rem.dueAtMs, rem.timezone)} · {rem.type}
                    {rem.type === 'recurring' ? `/${rem.recurrence}` : ''}
                  </div>
                  {rem.notes ? <div className="notes">{rem.notes}</div> : null}
                </div>
                <div className="listActions">
                  <button type="button" onClick={() => startEdit(rem)}>
                    Edit
                  </button>
                  <button type="button" onClick={() => handleToggleEnabled(rem)}>
                    {rem.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button type="button" className="danger" onClick={() => handleDelete(rem.id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="muted">
        Timezone: {timezone}
      </footer>
    </div>
  )
}

