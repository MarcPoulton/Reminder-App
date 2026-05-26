---
name: desktop reminder app
overview: Build an Electron + React desktop reminder app focused on one-time and recurring reminders with local persistence and system notifications.
todos:
  - id: scaffold-electron-react
    content: Set up Electron + React desktop project with secure IPC bridge
    status: completed
  - id: implement-storage
    content: Create SQLite schema and reminder CRUD/query layer
    status: completed
  - id: build-scheduler
    content: Implement due-reminder polling and recurring next-occurrence logic
    status: completed
  - id: wire-notifications
    content: Dispatch OS system notifications from Electron main process
    status: completed
  - id: build-ui
    content: Implement reminder management UI for one-time and recurring reminders
    status: completed
  - id: test-and-package
    content: Add recurrence tests, run Windows notification smoke tests, and package app
    status: completed
isProject: false
---

# Build Custom Desktop Reminder App

## Goal
Create a desktop reminder application using Electron + React with:
- One-time reminders
- Recurring reminders (daily/weekly/monthly)
- System notifications only (no email in v1)

## Architecture
- **UI layer (React):** reminder list, create/edit form, upcoming reminders view.
- **Desktop shell (Electron main process):** scheduler loop, notification dispatch, app lifecycle.
- **Data layer (local storage):** SQLite database for reminders and recurrence metadata.

```mermaid
flowchart LR
  user[User] --> ui[ReactUI]
  ui --> ipc[IPCBridge]
  ipc --> main[ElectronMain]
  main --> scheduler[ReminderScheduler]
  scheduler --> notify[SystemNotifier]
  main --> db[SQLiteStore]
  ui --> dbRead[ReadModelViaIPC]
  dbRead --> db
```

## Implementation Plan
1. **Project scaffolding**
   - Initialize Electron + React app (Electron Forge/Vite setup).
   - Configure secure IPC (`contextBridge`) and app packaging baseline.

2. **Data model and persistence**
   - Define `reminders` schema: id, title, notes, dueAt, timezone, type(one-time/recurring), recurrenceRule, enabled, createdAt, updatedAt.
   - Add SQLite access layer with CRUD operations and query for due reminders.

3. **Reminder scheduler engine**
   - Implement background scheduler in Electron main process.
   - Poll every fixed interval (e.g., 30s) and compute next fire time per reminder.
   - For recurring reminders, compute and persist next occurrence after firing.

4. **Notification integration**
   - Use Electron/OS system notification API.
   - Handle app-start catch-up logic for reminders missed while app was closed.

5. **UI workflows**
   - Build views for create/edit/delete reminders and toggling enabled status.
   - Add recurrence controls (none/daily/weekly/monthly).
   - Show next trigger time and status in reminder list.

6. **Validation and reliability**
   - Validate date/time inputs and recurrence rules.
   - Add guardrails for duplicate firing and timezone edge cases.

7. **Testing and packaging**
   - Add unit tests for recurrence calculation and due-reminder selection.
   - Smoke test notifications on Windows.
   - Produce first distributable desktop build.

## v1 Constraints
- Local-only data (no account sync).
- System notifications only.
- Single-user desktop context.

## Acceptance Criteria
- User can create one-time and recurring reminders.
- Reminder fires as an OS notification at expected time.
- Recurring reminders continue generating the next occurrence correctly.
- Reminder data persists across app restarts.