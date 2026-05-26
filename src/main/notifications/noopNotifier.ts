import type { Reminder } from '../../shared/reminderTypes'
import type { ReminderNotifier } from '../scheduler'

export const noopNotifier: ReminderNotifier = {
  async notifyReminderFired(_reminder: Reminder) {
    // Intentionally no-op for task 3.
  },
}

