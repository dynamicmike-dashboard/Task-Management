"use client";

import { useState } from "react";
import { X, HelpCircle, Keyboard, LayoutDashboard, Columns3, CalendarDays, Archive, Sliders, Search, Filter, Star, Ban, Trash2, RotateCcw, History } from "lucide-react";

interface Section {
  id: string;
  icon: typeof HelpCircle;
  title: string;
  content: string[];
}

const SECTIONS: Section[] = [
  {
    id: "overview",
    icon: LayoutDashboard,
    title: "Overview",
    content: [
      "Task Operations Dashboard is a live operational command centre for managing tasks. It combines a dashboard view, Kanban board, calendar, and archive into one app.",
      "All data is stored in a Teable base and syncs automatically. Changes made in the app are written to Teable in real time.",
    ],
  },
  {
    id: "dashboard",
    icon: LayoutDashboard,
    title: "Dashboard View",
    content: [
      "The Dashboard tab shows KPI tiles (total, completed, in progress, not started, overdue, important, blocked tasks).",
      "Click any KPI tile to filter the task table below by that category. Click it again to clear the filter.",
      "The charts section shows status distribution, assignee workload, completion trends, and a planned timeline.",
      "The Attention Required section ranks non-completed tasks by risk score. Click any task to open its detail panel.",
    ],
  },
  {
    id: "kanban",
    icon: Columns3,
    title: "Kanban Board",
    content: [
      "The Board tab provides a mobile-friendly Kanban view with three columns: Not Started, In Progress, Completed.",
      "Drag and drop cards between columns to update task progress. On touch devices, tap a card then use the quick-move menu.",
      "Each card shows the task description, assignee, due date, labels, priority level, blocked status, and a % complete bar.",
      "Use the + button at the bottom of any column to create a new task directly on the board.",
      "Click the More menu (three dots) on a card to change its colour, move it between columns, or archive it.",
    ],
  },
  {
    id: "calendar",
    icon: CalendarDays,
    title: "Calendar View",
    content: [
      "The Calendar tab shows a monthly calendar with tasks placed on their due dates.",
      "Use the arrow buttons to navigate between months. Today is highlighted in blue.",
      "Click any task on the calendar to open its detail panel. Tasks show their progress status with colour coding.",
      "Tasks are grouped by due date. Only tasks with an Expected Completion Date appear on the calendar.",
    ],
  },
  {
    id: "archive",
    icon: Archive,
    title: "Archive",
    content: [
      "The Archive tab lists all archived (soft-deleted) tasks. Archiving removes a task from active views without permanently deleting it.",
      "Use the search box to find archived tasks. Select tasks with checkboxes for bulk restore or permanent deletion.",
      "Restore returns a task to its original state. Permanently delete removes it from Teable forever.",
      "You can also archive or restore tasks from their detail panel in any view.",
    ],
  },
  {
    id: "tasks",
    icon: HelpCircle,
    title: "Working with Tasks",
    content: [
      "Create: Click the + New Task button in the top toolbar. Fill in the task description and optional fields, then click Create.",
      "Edit: Click any task in the table, Kanban board, or calendar to open the side panel. Edit fields and click Save.",
      "Double-click a task description in the table to edit it inline without opening the side panel.",
      "Flag: Click the star icon on any task row or card to mark it as important. Important tasks show with an amber indicator.",
      "Block: In the side panel, check Blocked and add a reason. Blocked tasks show with a red indicator everywhere.",
      "Priority: Set a task priority (Low/Medium/High/Critical) using the buttons in the side panel. Priority factors into attention scoring.",
      "Progress: Use the progress slider in the side panel to set a % complete value. Progress bars appear on Kanban cards and in the table.",
      "Archive: Use the Archive button in the side panel footer or the Kanban card menu to soft-delete a task.",
    ],
  },
  {
    id: "filtering",
    icon: Filter,
    title: "Filtering & Searching",
    content: [
      "Use the search box in the task table header to search by task description, summary, or assignee.",
      "Dropdown filters allow filtering by progress status, assignee, priority level, blocked, important, or overdue.",
      "Saved Filters: Click 'Save filters' to store your current filter combination in the browser. Click a saved filter to reapply it.",
      "The Clear button resets all active filters.",
      "Filter chips (progress, assignee, priority) appear below the search bar and can be removed individually.",
    ],
  },
  {
    id: "labels",
    icon: Sliders,
    title: "Labels",
    content: [
      "Kanban cards support colour labels. Click the label area above the Kanban board to create, edit, or delete labels.",
      "Labels can be assigned to cards using the label picker. Each card shows its assigned labels as coloured badges.",
      "Labels are stored in your browser and are not synced to Teable.",
    ],
  },
  {
    id: "keyboard",
    icon: Keyboard,
    title: "Keyboard Shortcuts",
    content: [
      "Esc — Close side panel or cancel editing",
      "Enter — Confirm inline edit",
      "Double-click — Inline edit a task description in the table",
    ],
  },
  {
    id: "pwa",
    icon: HelpCircle,
    title: "PWA & Offline",
    content: [
      "This app is a Progressive Web App (PWA). You can install it on your device for a native-like experience.",
      "Desktop: Click the install icon in your browser's address bar. The app will open in its own window.",
      "Mobile (Android): Tap 'Add to Home Screen' in your browser menu.",
      "Mobile (iOS): Tap the Share button, then 'Add to Home Screen'. The app opens without browser chrome.",
      "The app caches static assets for quick loading. Cached tasks data is available for offline viewing.",
    ],
  },
];

export default function HelpManual() {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 flex items-center gap-1"
        title="Help & user manual"
      >
        <HelpCircle size={14} /> Help
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] bg-black/30 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl my-4 mx-2 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <HelpCircle size={16} className="text-blue-600" />
                <h2 className="text-sm font-semibold text-slate-800">User Manual</h2>
              </div>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 p-0.5">
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              <nav className="w-40 shrink-0 border-r border-slate-100 overflow-y-auto p-2 space-y-0.5 bg-slate-50/50">
                {SECTIONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={`w-full text-left flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs transition-colors ${
                      activeSection === s.id
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <s.icon size={12} />
                    {s.title}
                  </button>
                ))}
              </nav>

              <div className="flex-1 overflow-y-auto p-5">
                {SECTIONS.filter((s) => s.id === activeSection).map((s) => (
                  <div key={s.id}>
                    <div className="flex items-center gap-2 mb-3">
                      <s.icon size={18} className="text-blue-600" />
                      <h3 className="text-sm font-semibold text-slate-800">{s.title}</h3>
                    </div>
                    <div className="space-y-3">
                      {s.content.map((p, i) => (
                        <p key={i} className="text-xs text-slate-600 leading-relaxed">{p}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 px-5 py-2.5 text-[10px] text-slate-400 shrink-0">
              Task Operations Dashboard v2 &middot; Data powered by Teable
            </div>
          </div>
        </div>
      )}
    </>
  );
}
