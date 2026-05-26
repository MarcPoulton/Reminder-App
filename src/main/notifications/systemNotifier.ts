import { DateTime } from 'luxon'
import { Notification } from 'electron'
import type { Reminder } from '../../shared/reminderTypes'
import type { ReminderNotifier } from '../scheduler'

export const systemNotifier: ReminderNotifier = {
  async notifyReminderFired(reminder: Reminder) {
    const dueText = DateTime.fromMillis(reminder.dueAtMs, { zone: reminder.timezone }).toLocaleString(
      DateTime.DATETIME_MED_WITH_WEEKDAY,
    )

    const bodyParts = [`Due: ${dueText}`]
    if (reminder.notes) bodyParts.push(reminder.notes)

    const title = reminder.title.trim() ? reminder.title : 'Reminder'
    new Notification({
      title,
      body: bodyParts.join('\n'),
    }).show()
  },
}

