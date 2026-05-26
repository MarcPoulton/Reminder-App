"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startReminderScheduler = startReminderScheduler;
const recurrence_1 = require("./utils/recurrence");
function startReminderScheduler(params) {
    const { store, notifier, intervalMs = 30_000, alignToMinute = false } = params;
    let running = false;
    const advanceOnce = async () => {
        if (running)
            return;
        running = true;
        try {
            const nowMs = Date.now();
            const due = await store.listDueReminders(nowMs);
            for (const reminder of due) {
                // One-time: disable after firing.
                if (reminder.type === 'one_time') {
                    await store.updateReminder({ id: reminder.id, enabled: false, lastFiredAtMs: nowMs });
                    await notifier.notifyReminderFired(reminder);
                    continue;
                }
                // Recurring: advance dueAtMs to the next occurrence after firing.
                if (!reminder.recurrence)
                    continue; // Data should be consistent; skip defensively.
                const maxAdvances = 24;
                let nextDueAtMs = (0, recurrence_1.computeNextDueAtMs)({
                    dueAtMs: reminder.dueAtMs,
                    timezone: reminder.timezone,
                    recurrence: reminder.recurrence,
                });
                let advances = 0;
                while (nextDueAtMs <= nowMs && advances < maxAdvances) {
                    nextDueAtMs = (0, recurrence_1.computeNextDueAtMs)({
                        dueAtMs: nextDueAtMs,
                        timezone: reminder.timezone,
                        recurrence: reminder.recurrence,
                    });
                    advances++;
                }
                await store.updateReminder({
                    id: reminder.id,
                    enabled: true,
                    dueAtMs: nextDueAtMs,
                    lastFiredAtMs: nowMs,
                });
                await notifier.notifyReminderFired(reminder);
            }
        }
        catch (e) {
            console.error('Scheduler error:', e);
        }
        finally {
            running = false;
        }
    };
    // Catch up immediately on app start.
    void advanceOnce();
    if (alignToMinute) {
        // Align to the next minute boundary, then run at the provided interval.
        const alignInterval = intervalMs;
        const now = Date.now();
        const nextMinute = Math.ceil(now / 60_000) * 60_000;
        const delay = Math.max(0, nextMinute - now);
        setTimeout(() => {
            void advanceOnce();
            setInterval(() => void advanceOnce(), alignInterval);
        }, delay);
    }
    else {
        setInterval(() => void advanceOnce(), intervalMs);
    }
}
//# sourceMappingURL=scheduler.js.map