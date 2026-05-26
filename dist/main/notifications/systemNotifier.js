"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemNotifier = void 0;
const luxon_1 = require("luxon");
const electron_1 = require("electron");
exports.systemNotifier = {
    async notifyReminderFired(reminder) {
        const dueText = luxon_1.DateTime.fromMillis(reminder.dueAtMs, { zone: reminder.timezone }).toLocaleString(luxon_1.DateTime.DATETIME_MED_WITH_WEEKDAY);
        const bodyParts = [`Due: ${dueText}`];
        if (reminder.notes)
            bodyParts.push(reminder.notes);
        const title = reminder.title.trim() ? reminder.title : 'Reminder';
        new electron_1.Notification({
            title,
            body: bodyParts.join('\n'),
        }).show();
    },
};
//# sourceMappingURL=systemNotifier.js.map