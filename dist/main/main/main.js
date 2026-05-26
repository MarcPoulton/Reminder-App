"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
const reminderStore_1 = require("./store/reminderStore");
const isDev = !electron_1.app.isPackaged;
async function createWindow() {
    const preloadPath = path_1.default.join(__dirname, 'preload.js');
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
        win.loadFile(path_1.default.join(__dirname, '../renderer/index.html'));
    }
    return win;
}
electron_1.app.whenReady().then(() => {
    const reminderStore = (0, reminderStore_1.createInMemoryReminderStore)();
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
    // Basic notification test (not the full scheduler yet).
    electron_1.ipcMain.handle('reminder:notifyTest', async () => {
        new electron_1.Notification({ title: 'Reminder App', body: 'Notification test' }).show();
    });
    createWindow().catch((e) => {
        console.error(e);
    });
});
electron_1.app.on('window-all-closed', () => {
    // Keep behavior simple for desktop reminder use.
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
//# sourceMappingURL=main.js.map