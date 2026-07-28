# PROJECT MANIFEST

## STATUS
- Current Goal: Production-ready Task Operations PWA (Dashboard, Kanban, Calendar, Archive) powered by Teable
- Last Session Date: 28 Jul 2026

## SYSTEM STATE

### Project Root
`F:\Mike d drive\Mike Webs\mAIstermind.com\projects\Task Management 27jul26\task-management-github`

### Live URL
`https://tasks.maistermind.com` (Vercel, aliased to custom domain)

### Git Remote
`https://github.com/dynamicmike-dashboard/Task-Management.git` (branch `main`)

### Environment (set on Vercel, not in local .env)
- `TEABLE_BASE_URL` = `https://teable.maistermind.com`
- `TEABLE_API_KEY` = (encrypted on Vercel)
- `TEABLE_TABLE_ID` = `tblwooXdxMZaIZzm29R` (tasks)
- `TEABLE_ACTIVITY_TABLE_ID` = `tblORhI61zRvpqR6tWK` (activity log)
- `TEABLE_SETTINGS_TABLE_ID` = `tblDHCJx97iIaUGtQig` (settings)

### Deploy
- `cmd.exe /c git push` (use CMD to bypass PowerShell credential issue)
- `cmd.exe /c npx vercel --prod --yes` to deploy manually

## Teable Schema

### Tasks Table (tblwooXdxMZaIZzm29R) — 17 fields
| Teable Field Name | CamelCase Key | Type |
|---|---|---|
| Task Description | taskDescription | text |
| Task Summary | taskSummary | text |
| Assignee | assignee | text |
| Progress | progress | select: Not Started / In Progress / Completed |
| Start Date | startDate | date |
| Expected Completion Date | expectedCompletionDate | date |
| Actual Completion Date | actualCompletionDate | date |
| Important | important | checkbox |
| Latest Progress Update | latestProgressUpdate | text |
| Notes | notes | text |
| Archived | archived | checkbox |
| Priority | priority | select: Low / Medium / High / Critical |
| Blocked | blocked | checkbox |
| Blocked Reason | blockedReason | text |
| Percent Complete | percentComplete | number |
| Estimated Hours | estimatedHours | number |
| Actual Hours | actualHours | number |

### Activity Table (tblORhI61zRvpqR6tWK)
| Field | Type |
|---|---|
| Task ID | text |
| Action | text (created/updated/archived/restored/deleted) |
| Field | text |
| Old Value | text |
| New Value | text |
| Timestamp | datetime |

### Settings Table (tblDHCJx97iIaUGtQig)
| Field | Type |
|---|---|
| Workspace Name | text |
| Client Name | text |
| Logo URL | text |
| Accent Color | text |
| Is Master | checkbox |

## PATCH API Note
Teable PATCH body must be: `{ "record": { "fields": { "Field Name": value } } }`
NOT `{ "fields": { ... } }` — that returns 400 validation error.

## FUNCTIONAL STATUS
- ✅ Saves (create, edit, archive, restore) — working after PATCH body fix
- ✅ Calendar — click day numbers to create tasks with pre-set dates; "Add task without date" button
- ✅ Mobile nav tabs — scrollable row below header
- ✅ 7 KPI tiles (total, completed, in progress, not started, overdue, important, blocked)
- ✅ Filter bar (priority, blocked, overdue, search, progress, assignee)
- ✅ Saved views (localStorage) + CSV export
- ✅ Kanban board (3-column drag-drop, priority/blocked/%complete indicators)
- ✅ Task side panel (all 17 fields, activity history, risk assessment, save feedback)
- ✅ Settings dialog (workspace/client name, logo URL, accent color)
- ✅ PWA: manifest.json, service worker v2, SVG icon, help manual
- ✅ Auto-refresh every 60s, "Updated at HH:MM" header

## KEY FILES
- `src/lib/teable.ts` — FIELD_MAP, all API functions, parseRecord, patchRecord with ID fallback
- `src/lib/types.ts` — all TypeScript types
- `src/lib/risk.ts` — computeRisk scoring
- `src/lib/filters.ts` — isOverdue, matchesFilters
- `src/app/actions/teable.ts` — server actions
- `src/components/dashboard.tsx` — main orchestrator
- `src/components/task-side-panel.tsx` — full task editor
- `src/components/task-table.tsx` — inline-edit table
- `src/components/kanban-board.tsx` — drag-drop board
- `src/components/calendar-view.tsx` — monthly calendar
- `src/components/archive-view.tsx` — soft-delete management
- `src/components/create-task-dialog.tsx` — new task form (accepts initialDate)
- `src/components/settings-dialog.tsx` — workspace settings
- `src/components/help-manual.tsx` — 11-section user guide
- `src/components/attention-queue.tsx` — grouped risk queue
- `src/components/kpi-tiles.tsx` — 7 metric tiles
- `src/app/layout.tsx` — PWA meta, service worker registration
- `public/manifest.json` — PWA manifest
- `public/sw.js` — service worker v2
- `public/icons/icon.svg` — app icon

## NEXT / PENDING
- [ ] Client duplication workflow: create fresh copy of master for client deployments
- [ ] Any Teable field schema changes should update FIELD_MAP in `src/lib/teable.ts`
- [ ] Verify DNS for `tasks.maistermind.com` fully propagated
