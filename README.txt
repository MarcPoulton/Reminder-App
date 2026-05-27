Key commands to run
From c:\Users\...\Documents\Coding Projects\Reminder App Electron:

1. Copy the address path of where you have downloaded the file.
2. Opem cmd and run the command "cd c:\...\Reminder-App-master"

In order run these commands:

Install dependencies:
	npm install

Build the exe:
	npm run build
(Don't need to run this as run make will do it all in one go)

Build + package for Windows (NSIS installer):
	npm run make

Extra commands if needed:

Start dev:
	npm run dev

Run tests:
	npm test

Notification smoke test (shows a test OS notification):
	npm run smoke:notify
