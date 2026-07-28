"use client";

import { useMemo } from "react";
import { TaskRecord } from "@/lib/types";

interface Props {
  tasks: TaskRecord[];
  onSelect?: (task: TaskRecord) => void;
}

function parseDate(d: string | null): Date | null {
  if (!d) return null;
  const p = new Date(d);
  return isNaN(p.getTime()) ? null : p;
}

function fmt(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function getWeekStart(d: Date): Date {
  const s = new Date(d);
  s.setDate(s.getDate() - s.getDay());
  s.setHours(0, 0, 0, 0);
  return s;
}

export default function TimelineView({ tasks, onSelect }: Props) {
  const { overdue, thisWeek, nextWeek, future } = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const weekStart = getWeekStart(now);
    const nextWeekStart = new Date(weekStart);
    nextWeekStart.setDate(weekStart.getDate() + 7);
    const twoWeeksStart = new Date(weekStart);
    twoWeeksStart.setDate(weekStart.getDate() + 14);

    const groups: Record<string, TaskRecord[]> = {
      overdue: [], thisWeek: [], nextWeek: [], future: [],
    };
    for (const t of tasks) {
      const due = parseDate(t.expectedCompletionDate);
      if (!due) continue;
      if (due < now && t.progress !== "Completed") {
        groups.overdue.push(t);
      } else if (due >= now && due < nextWeekStart) {
        groups.thisWeek.push(t);
      } else if (due >= nextWeekStart && due < twoWeeksStart) {
        groups.nextWeek.push(t);
      } else {
        groups.future.push(t);
      }
    }
    const sort = (arr: TaskRecord[]) =>
      arr.sort((a, b) => ((a.expectedCompletionDate || "")).localeCompare(b.expectedCompletionDate || ""));
    return {
      overdue: sort(groups.overdue),
      thisWeek: sort(groups.thisWeek),
      nextWeek: sort(groups.nextWeek),
      future: sort(groups.future),
    };
  }, [tasks]);

  const sections: [string, TaskRecord[], string][] = [
    ["Overdue", overdue, "border-l-red-400 bg-red-50/50"],
    ["This Week", thisWeek, "border-l-amber-400 bg-amber-50/50"],
    ["Next Week", nextWeek, "border-l-blue-400 bg-blue-50/50"],
    ["Future", future, "border-l-slate-300"],
  ];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
        Planned Timeline
      </h3>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {sections.map(([label, items, borderColor]) => {
          if (items.length === 0) return null;
          return (
            <div key={label}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                  label === "Overdue" ? "text-red-600" :
                  label === "This Week" ? "text-amber-600" :
                  label === "Next Week" ? "text-blue-600" :
                  "text-slate-400"
                }`}>
                  {label}
                </span>
                <span className="text-[10px] text-slate-400">{items.length}</span>
              </div>
              <div className="space-y-1">
                {items.map((t) => {
                  const due = parseDate(t.expectedCompletionDate);
                  const start = parseDate(t.startDate);
                  return (
                    <div
                      key={t.id}
                      onClick={() => onSelect?.(t)}
                      className={`flex items-start gap-2.5 p-2 rounded-md border-l-2 cursor-pointer transition-colors hover:bg-white ${borderColor}`}
                    >
                      <div className={`w-2 h-2 rounded-full mt-0.5 shrink-0 ${
                        t.progress === "Completed" ? "bg-emerald-500" :
                        t.progress === "In Progress" ? "bg-blue-500" :
                        "bg-slate-300"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-slate-800 truncate">{t.taskDescription}</span>
                          <span className="text-[10px] text-slate-400 tabular-nums shrink-0">
                            {start ? fmt(start) : "—"} – {due ? fmt(due) : "—"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-500">{t.assignee}</span>
                          <span className={`text-[10px] px-1 py-0.5 rounded ${
                            t.progress === "Completed" ? "text-emerald-700 bg-emerald-50" :
                            t.progress === "In Progress" ? "text-blue-700 bg-blue-50" :
                            "text-slate-500 bg-slate-50"
                          }`}>
                            {t.progress}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {overdue.length === 0 && thisWeek.length === 0 && nextWeek.length === 0 && future.length === 0 && (
          <p className="text-xs text-slate-400 py-4 text-center">No scheduled tasks</p>
        )}
      </div>
    </div>
  );
}
