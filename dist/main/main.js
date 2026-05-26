"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
const sqliteReminderStore_1 = require("./store/sqliteReminderStore");
const scheduler_1 = require("./scheduler");
const systemNotifier_1 = require("./notifications/systemNotifier");
const isDev = !electron_1.app.isPackaged;
const smokeNotify = process.argv.includes('--smoke-notify');
// Set Windows-specific notification settings
if (process.platform === 'win32') {
    // This is required for notifications to work on Windows
    electron_1.app.setAppUserModelId('com.reminder.app');
}
async function createWindow() {
    // Use app.getAppPath() for correct path resolution in both dev and packaged builds
    const appPath = electron_1.app.getAppPath();
    const preloadPath = path_1.default.join(appPath, 'dist/main/preload.js');
    const win = new electron_1.BrowserWindow({
        width: 1000,
        height: 720,
        webPreferences: {
            preload: preloadPath,
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    if (isDev) {
        await win.loadURL('http://localhost:5173');
        win.webContents.openDevTools({ mode: 'detach' });
    }
    else {
        await win.loadFile(path_1.default.join(appPath, 'dist/renderer/index.html'));
    }
    return win;
}
electron_1.app.whenReady().then(() => {
    const reminderStore = (0, sqliteReminderStore_1.createSqliteReminderStore)();
    if (smokeNotify) {
        systemNotifier_1.systemNotifier
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
            console.error('Smoke notification error:', e);
        })
            .finally(() => {
            setTimeout(() => {
                electron_1.app.quit();
            }, 1500);
        });
        return;
    }
    (0, scheduler_1.startReminderScheduler)({
        store: reminderStore,
        notifier: systemNotifier_1.systemNotifier,
        // Align scheduler to minute boundaries and run once per minute.
        intervalMs: 60_000,
        alignToMinute: true,
    });
    electron_1.ipcMain.handle('reminder:getStatus', async () => {
        return `Reminder App (Electron + React) — ${isDev ? 'dev' : 'prod'}`;
    });
    electron_1.ipcMain.handle('reminder:listReminders', async () => {
        return reminderStore.listReminders();
    });
    electron_1.ipcMain.handle('reminder:createReminder', async (_evt, input) => {
        return reminderStore.createReminder(input);
    });
    electron_1.ipcMain.handle('reminder:updateReminder', async (_evt, input) => {
        return reminderStore.updateReminder(input);
    });
    electron_1.ipcMain.handle('reminder:deleteReminder', async (_evt, id) => {
        return reminderStore.deleteReminder(id);
    });
    electron_1.ipcMain.handle('reminder:notifyTest', async () => {
        await systemNotifier_1.systemNotifier.notifyReminderFired({
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
        });
    });
    createWindow().catch((e) => {
        console.error('Failed to create window:', e);
    });
});
electron_1.app.on('window-all-closed', () => {
    // Keep behavior simple for desktop reminder use.
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
//# sourceMappingURL=main.js.map