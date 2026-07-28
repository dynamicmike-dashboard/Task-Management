# TASK: FULL SAVE FIX
"Initialize from SYSTEM_PROTOCOL.md. Read PROJECT_MANIFEST.md. The PATCH body must be wrapped in `{ record: { fields: ... } }`. Check `src/lib/teable.ts` patchRecord function. Ensure all PATCH calls use this format."

# TASK: CALENDAR INTERACTION
"Initialize from SYSTEM_PROTOCOL.md. Read PROJECT_MANIFEST.md. Calendar needs click-to-create: clicking a day number opens CreateTaskDialog with that date pre-set. Check `src/components/calendar-view.tsx`, `src/components/create-task-dialog.tsx`, `src/components/dashboard.tsx`."

# TASK: NEW FIELD
"Initialize from SYSTEM_PROTOCOL.md. Read PROJECT_MANIFEST.md. Add a new field to the Tasks table in Teable. Then update: FIELD_MAP in `src/lib/teable.ts`, `parseRecord`, `toTeableFields`, `TaskRecord` in `src/lib/types.ts`, and the side panel UI in `src/components/task-side-panel.tsx`. Deploy after."

# TASK: DEPLOY
"Initialize from SYSTEM_PROTOCOL.md. Read PROJECT_MANIFEST.md. Commit all changes with `git add -A && cmd.exe /c git commit -m "..." && cmd.exe /c git push`. Then deploy with `cmd.exe /c npx vercel --prod --yes`."

# TASK: ADD NEW CLIENT
"Initialize from SYSTEM_PROTOCOL.md. Read PROJECT_MANIFEST.md. Duplicate the master project for a new client. Create new Teable tables, set new env vars on Vercel, deploy to new subdomain."
