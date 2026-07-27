"use client";

import { TaskRecord } from "@/lib/types";
import { format, parseISO, isBefore } from "date-fns";

interface Props {
  tasks: TaskRecord[];
}

export default function TimelineView({ tasks }: Props) {
  const withDates = tasks
    .filter((t) => t.startDate || t.expectedCompletionDate)
    .sort((a, b) => {
      const da = a.startDate || a.expectedCompletionDate || "";
      const db = b.startDate || b.expectedCompletionDate || "";
      return da.localeCompare(db);
    });

  if (withDates.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
          Planned Timeline
        </h3>
        <p className="text-xs text-slate-400 py-4 text-center">No scheduled tasks</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
        Planned Timeline
      </h3>
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {withDates.map((t) => {
          const start = t.startDate ? parseISO(t.startDate) : null;
          const due = t.expectedCompletionDate ? parseISO(t.expectedCompletionDate) : null;
          const overdue = due && !isNaN(due.getTime()) && isBefore(due, new Date()) && t.progress !== "Completed";

          return (
            <div key={t.id} className="flex items-center gap-2 text-xs py-1 border-b border-slate-100 last:border-0">
              <div className="w-1 h-1 rounded-full shrink-0 bg-slate-300" />
              <span className="truncate flex-1 text-slate-700">{t.taskDescription}</span>
              <span className="text-slate-400 tabular-nums shrink-0">
                {start ? format(start, "d MMM") : "—"} – {due ? format(due, "d MMM") : "—"}
              </span>
              {overdue && <span className="text-red-500 text-[10px] font-medium shrink-0">OVERDUE</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
