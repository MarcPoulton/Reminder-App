"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('reminderApi', {
    getStatus: async () => {
        const app = await electron_1.ipcRenderer.invoke('reminder:getStatus');
        return { ok: true, app };
    },
    listReminders: async () => {
        return (await electron_1.ipcRenderer.invoke('reminder:listReminders'));
    },
    createReminder: async (input) => {
        return (await electron_1.ipcRenderer.invoke('reminder:createReminder', input));
    },
    updateReminder: async (input) => {
        return (await electron_1.ipcRenderer.invoke('reminder:updateReminder', input));
    },
    deleteReminder: async (id) => {
        await electron_1.ipcRenderer.invoke('reminder:deleteReminder', id);
    },
});
//# sourceMappingURL=preload.js.map