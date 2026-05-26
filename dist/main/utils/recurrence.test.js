"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const luxon_1 = require("luxon");
const recurrence_1 = require("./recurrence");
(0, vitest_1.describe)('computeNextDueAtMs', () => {
    (0, vitest_1.it)('computes daily next occurrence', () => {
        const timezone = 'UTC';
        const due = luxon_1.DateTime.fromISO('2026-05-26T10:00:00Z', { zone: timezone });
        const next = (0, recurrence_1.computeNextDueAtMs)({ dueAtMs: due.toMillis(), timezone, recurrence: 'daily' });
        const expected = due.plus({ days: 1 }).toUTC().toMillis();
        (0, vitest_1.expect)(next).toBe(expected);
    });
    (0, vitest_1.it)('computes weekly next occurrence', () => {
        const timezone = 'UTC';
        const due = luxon_1.DateTime.fromISO('2026-05-26T10:00:00Z', { zone: timezone });
        const next = (0, recurrence_1.computeNextDueAtMs)({ dueAtMs: due.toMillis(), timezone, recurrence: 'weekly' });
        const expected = due.plus({ weeks: 1 }).toUTC().toMillis();
        (0, vitest_1.expect)(next).toBe(expected);
    });
    (0, vitest_1.it)('computes monthly next occurrence (end-of-month clamping)', () => {
        const timezone = 'UTC';
        const due = luxon_1.DateTime.fromISO('2026-01-31T10:00:00Z', { zone: timezone });
        const nextMs = (0, recurrence_1.computeNextDueAtMs)({ dueAtMs: due.toMillis(), timezone, recurrence: 'monthly' });
        const next = luxon_1.DateTime.fromMillis(nextMs, { zone: timezone });
        // 2026-02 has no 31st => should clamp to 2026-02-28.
        (0, vitest_1.expect)(next.toISO()).toBe('2026-02-28T10:00:00.000Z');
    });
});
//# sourceMappingURL=recurrence.test.js.map