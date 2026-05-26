"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeNextDueAtMs = computeNextDueAtMs;
const luxon_1 = require("luxon");
function computeNextDueAtMs(params) {
    const { dueAtMs, timezone, recurrence } = params;
    const dt = luxon_1.DateTime.fromMillis(dueAtMs, { zone: timezone });
    if (!dt.isValid)
        throw new Error('Invalid dueAtMs/timezone');
    switch (recurrence) {
        case 'daily':
            return dt.plus({ days: 1 }).toUTC().toMillis();
        case 'weekly':
            return dt.plus({ weeks: 1 }).toUTC().toMillis();
        case 'monthly':
            return dt.plus({ months: 1 }).toUTC().toMillis();
        default:
            // Exhaustiveness for future changes.
            throw new Error(`Unsupported recurrence: ${recurrence}`);
    }
}
//# sourceMappingURL=recurrence.js.map