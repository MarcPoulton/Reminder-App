import { describe, expect, it } from 'vitest'
import { DateTime } from 'luxon'
import { computeNextDueAtMs } from './recurrence'

describe('computeNextDueAtMs', () => {
  it('computes daily next occurrence', () => {
    const timezone = 'UTC'
    const due = DateTime.fromISO('2026-05-26T10:00:00Z', { zone: timezone })
    const next = computeNextDueAtMs({ dueAtMs: due.toMillis(), timezone, recurrence: 'daily' })
    const expected = due.plus({ days: 1 }).toUTC().toMillis()
    expect(next).toBe(expected)
  })

  it('computes weekly next occurrence', () => {
    const timezone = 'UTC'
    const due = DateTime.fromISO('2026-05-26T10:00:00Z', { zone: timezone })
    const next = computeNextDueAtMs({ dueAtMs: due.toMillis(), timezone, recurrence: 'weekly' })
    const expected = due.plus({ weeks: 1 }).toUTC().toMillis()
    expect(next).toBe(expected)
  })

  it('computes monthly next occurrence (end-of-month clamping)', () => {
    const timezone = 'UTC'
    const due = DateTime.fromISO('2026-01-31T10:00:00Z', { zone: timezone })
    const nextMs = computeNextDueAtMs({ dueAtMs: due.toMillis(), timezone, recurrence: 'monthly' })

    const next = DateTime.fromMillis(nextMs, { zone: timezone })
    // 2026-02 has no 31st => should clamp to 2026-02-28.
    expect(next.toISO()).toBe('2026-02-28T10:00:00.000Z')
  })
})

