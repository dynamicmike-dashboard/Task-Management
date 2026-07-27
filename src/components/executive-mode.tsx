"use client";

import { TaskRecord } from "@/lib/types";
import { isOverdue } from "@/lib/filters";
import { computeRisk } from "@/lib/risk";
import { AlertTriangle, TrendingUp, User, Calendar } from "lucide-react";

interface Props {
  tasks: TaskRecord[];
  onSelect: (task: TaskRecord) => void;
}

export default function ExecutiveMode({ tasks, onSelect }: Props) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.progress === "Completed").length;
  const inProgress = tasks.filter((t) => t.progress === "In Progress").length;
  const overdue = tasks.filter((t) => isOverdue(t)).length;
  const important = tasks.filter((t) => t.important).length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const scored = tasks
    .filter((t) => t.progress !== "Completed")
    .map((t) => ({ task: t, risk: computeRisk(t) }))
    .sort((a, b) => b.risk.score - a.risk.score);
  const topRisks = scored.slice(0, 5);

  const assigneeLoad = [...new Set(tasks.map((t) => t.assignee).filter(Boolean))]
    .map((name) => ({
      name,
      open: tasks.filter((t) => t.assignee === name && t.progress !== "Completed").length,
      total: tasks.filter((t) => t.assignee === name).length,
    }))
    .sort((a, b) => b.open - a.open);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nearDeadlines = tasks
    .filter((t) => {
      if (t.progress === "Completed" || !t.expectedCompletionDate) return false;
      const due = new Date(t.expectedCompletionDate);
      due.setHours(0, 0, 0, 0);
      const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
      return diff >= 0 && diff <= 14;
    })
    .sort((a, b) => (a.expectedCompletionDate || "").localeCompare(b.expectedCompletionDate || ""));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-slate-600 border-b border-slate-200 pb-2">
        <TrendingUp size={16} />
        <span className="text-xs font-semibold uppercase tracking-wider">Executive Summary</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
          <div className="text-2xl font-bold text-slate-800">{completionRate}%</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Completion Rate ({completed}/{total})</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
          <div className="text-2xl font-bold text-amber-600">{inProgress}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Active Tasks</div>
        </div>
        <div className="rounded-lg border border-red-200 bg-white p-3 text-center">
          <div className="text-2xl font-bold text-red-600">{overdue}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Overdue</div>
        </div>
        <div className="rounded-lg border border-amber-200 bg-white p-3 text-center">
          <div className="text-2xl font-bold text-amber-600">{important}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Important</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
            <AlertTriangle size={12} />
            Top Risks
          </div>
          {topRisks.length === 0 ? (
            <p className="text-xs text-emerald-600 py-2 text-center">No active risks</p>
          ) : (
            <div className="space-y-1">
              {topRisks.map(({ task, risk }) => (
                <button key={task.id} onClick={() => onSelect(task)} className="w-full text-left flex items-center gap-2 p-1.5 rounded text-xs hover:bg-slate-50">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${risk.level === "Critical" ? "bg-red-500" : "bg-orange-400"}`} />
                  <span className="truncate flex-1 text-slate-700">{task.taskDescription}</span>
                  <span className="text-slate-400 shrink-0">{task.assignee}</span>
                  <span className={`text-[10px] font-medium px-1 py-0.5 rounded ${risk.level === "Critical" ? "text-red-600 bg-red-50" : "text-orange-600 bg-orange-50"}`}>
                    {risk.score}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
            <User size={12} />
            Workload Concentration
          </div>
          <div className="space-y-1.5">
            {assigneeLoad.slice(0, 8).map((a) => {
              const pct = a.total > 0 ? Math.round((a.open / a.total) * 100) : 0;
              return (
                <div key={a.name} className="flex items-center gap-2 text-xs">
                  <span className="text-slate-600 w-20 truncate">{a.name}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-slate-400 tabular-nums w-8 text-right">{a.open}/{a.total}</span>
                </div>
              );
            })}
            {assigneeLoad.length === 0 && <p className="text-xs text-slate-400 py-2 text-center">No assignee data</p>}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
          <Calendar size={12} />
          Near-Term Deadlines (next 14 days)
        </div>
        {nearDeadlines.length === 0 ? (
          <p className="text-xs text-slate-400 py-2 text-center">No deadlines in the next 14 days</p>
        ) : (
          <div className="space-y-1">
            {nearDeadlines.map((t) => {
              const due = t.expectedCompletionDate
                ? new Date(t.expectedCompletionDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                : "—";
              return (
                <button key={t.id} onClick={() => onSelect(t)} className="w-full text-left flex items-center gap-2 p-1.5 rounded text-xs hover:bg-slate-50">
                  <span className="truncate flex-1 text-slate-700">{t.taskDescription}</span>
                  <span className="text-slate-400">{t.assignee}</span>
                  <span className={`font-medium tabular-nums ${t.important ? "text-amber-600" : "text-slate-500"}`}>{due}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
