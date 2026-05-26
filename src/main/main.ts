import path from 'path'
import { app, BrowserWindow, ipcMain } from 'electron'
import { createSqliteReminderStore } from './store/sqliteReminderStore'
import { startReminderScheduler } from './scheduler'
import { systemNotifier } from './notifications/systemNotifier'

const isDev = !app.isPackaged

const smokeNotify = process.argv.includes('--smoke-notify')

// Set Windows-specific notification settings
if (process.platform === 'win32') {
  // This is required for notifications to work on Windows
  app.setAppUserModelId('com.reminder.app')
}

async function createWindow() {
  // Use app.getAppPath() for correct path resolution in both dev and packaged builds
  const appPath = app.getAppPath()
  const preloadPath = path.join(appPath, 'dist/main/preload.js')

  const win = new BrowserWindow({
    width: 1000,
    height: 720,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    await win.loadURL('http://localhost:5173')
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    await win.loadFile(path.join(appPath, 'dist/renderer/index.html'))
  }

  return win
}

app.whenReady().then(() => {
  const reminderStore = createSqliteReminderStore()

  if (smokeNotify) {
    systemNotifier
      .notifyReminderFired({
        id: 'smoke',
        title: 'Reminder App',
        notes: 'Smoke notification test',
        type: 'one_time',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        dueAtMs: Date.now(),
        enabled: true,
        createdAtMs: Date.now(),
        updatedAtMs: Date.now(),
        lastFiredAtMs: null,
      })
      .catch((e) => {
        console.error('Smoke notification error:', e)
      })
      .finally(() => {
        setTimeout(() => {
          app.quit()
        }, 1500)
      })
    return
  }

  startReminderScheduler({
    store: reminderStore,
    notifier: systemNotifier,
    // Align scheduler to minute boundaries and run once per minute.
    intervalMs: 60_000,
    alignToMinute: true,
  })

  ipcMain.handle('reminder:getStatus', async () => {
    return `Reminder App (Electron + React) — ${isDev ? 'dev' : 'prod'}`
  })

  ipcMain.handle('reminder:listReminders', async () => {
    return reminderStore.listReminders()
  })

  ipcMain.handle('reminder:createReminder', async (_evt, input) => {
    return reminderStore.createReminder(input)
  })

  ipcMain.handle('reminder:updateReminder', async (_evt, input) => {
    return reminderStore.updateReminder(input)
  })

  ipcMain.handle('reminder:deleteReminder', async (_evt, id: string) => {
    return reminderStore.deleteReminder(id)
  })

  ipcMain.handle('reminder:notifyTest', async () => {
    await systemNotifier.notifyReminderFired({
      id: 'test',
      title: 'Reminder App',
      notes: 'Notification test',
      type: 'one_time',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      dueAtMs: Date.now(),
      enabled: true,
      createdAtMs: Date.now(),
      updatedAtMs: Date.now(),
      lastFiredAtMs: null,
    })
  })

  createWindow().catch((e) => {
    console.error('Failed to create window:', e)
  })
})

app.on('window-all-closed', () => {
  // Keep behavior simple for desktop reminder use.
  if (process.platform !== 'darwin') app.quit()
})

