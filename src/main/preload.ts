import { contextBridge, ipcRenderer } from 'electron'
import type { Reminder } from '../shared/reminderTypes'

type CreateReminderInput = {
  title: string
  notes?: string
  type: Reminder['type']
  recurrence?: Reminder['recurrence']
  timezone: string
  dueAtMs: number
  enabled?: boolean
}

type UpdateReminderInput = {
  id: string
  title?: string
  notes?: string
  type?: Reminder['type']
  recurrence?: Reminder['recurrence']
  timezone?: string
  dueAtMs?: number
  enabled?: boolean
}

contextBridge.exposeInMainWorld('reminderApi', {
  getStatus: async () => {
    const app = await ipcRenderer.invoke('reminder:getStatus')
    return { ok: true as const, app }
  },

  listReminders: async () => {
    return (await ipcRenderer.invoke('reminder:listReminders')) as Reminder[]
  },

  createReminder: async (input: CreateReminderInput) => {
    return (await ipcRenderer.invoke('reminder:createReminder', input)) as Reminder
  },

  updateReminder: async (input: UpdateReminderInput) => {
    return (await ipcRenderer.invoke('reminder:updateReminder', input)) as Reminder
  },

  deleteReminder: async (id: string) => {
    await ipcRenderer.invoke('reminder:deleteReminder', id)
  },
})

