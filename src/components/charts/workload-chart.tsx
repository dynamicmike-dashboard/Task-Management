"use client";

import { useMemo } from "react";
import { TaskRecord } from "@/lib/types";
import { isOverdue } from "@/lib/filters";

interface Props {
  tasks: TaskRecord[];
  onFilter?: (assignee: string) => void;
}

const AVATAR_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500",
  "bg-rose-500", "bg-cyan-500", "bg-orange-500", "bg-teal-500",
  "bg-pink-500", "bg-indigo-500",
];

export default function WorkloadChart({ tasks, onFilter }: Props) {
  const assignees = useMemo(() => {
    const map = new Map<string, TaskRecord[]>();
    for (const t of tasks) {
      if (!t.assignee) continue;
      const arr = map.get(t.assignee) || [];
      arr.push(t);
      map.set(t.assignee, arr);
    }
    return Array.from(map.entries())
      .map(([name, ts]) => {
        const completed = ts.filter((t) => t.progress === "Completed").length;
        const inProgress = ts.filter((t) => t.progress === "In Progress").length;
        const notStarted = ts.filter((t) => t.progress === "Not Started").length;
        const overdue = ts.filter((t) => isOverdue(t)).length;
        return { name, total: ts.length, completed, inProgress, notStarted, overdue };
      })
      .sort((a, b) => b.total - a.total);
  }, [tasks]);

  const totalAssignees = assignees.length;
  const totalTasks = assignees.reduce((s, a) => s + a.total, 0);
  const totalOverdue = assignees.reduce((s, a) => s + a.overdue, 0);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Assignee Workload
        </h3>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span>{totalAssignees} assignees</span>
          <span>{totalTasks} tasks</span>
          {totalOverdue > 0 && (
            <span className="text-red-500 font-medium">{totalOverdue} overdue</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {assignees.map((a, i) => {
          const pct = a.total > 0 ? Math.round((a.completed / a.total) * 100) : 0;
          const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
          return (
            <button
              key={a.name}
              onClick={() => onFilter?.(a.name)}
              className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-100 hover:border-slate-300 hover:shadow-sm transition-all text-left bg-white"
            >
              <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-white text-[11px] font-bold shrink-0`}>
                {a.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase() || a.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-800 truncate">{a.name}</span>
                  <span className="text-[10px] text-slate-400 tabular-nums">{a.total} tasks</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  {a.completed > 0 && (
                    <div className="h-full bg-emerald-500 float-left" style={{ width: `${(a.completed / a.total) * 100}%` }} />
                  )}
                  {a.inProgress > 0 && (
                    <div className="h-full bg-blue-500 float-left" style={{ width: `${(a.inProgress / a.total) * 100}%` }} />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-emerald-600 font-medium">{a.completed} done</span>
                  <span className="text-[10px] text-blue-600 font-medium">{a.inProgress} active</span>
                  <span className="text-[10px] text-slate-400">{a.notStarted} todo</span>
                  {a.overdue > 0 && (
                    <span className="text-[10px] text-red-500 font-medium ml-auto">{a.overdue} overdue</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
        {assignees.length === 0 && (
          <div className="col-span-2 py-8 text-center text-xs text-slate-400">
            No assignees found
          </div>
        )}
      </div>
    </div>
  );
}
