"use client";

import { AlertTriangle, Star } from "lucide-react";
import { TaskRecord } from "@/lib/types";
import { isOverdue } from "@/lib/filters";
import { computeRisk, riskColor } from "@/lib/risk";

interface Props {
  tasks: TaskRecord[];
  onSelect: (task: TaskRecord) => void;
}

export default function AttentionQueue({ tasks, onSelect }: Props) {
  const scored = tasks
    .filter((t) => t.progress !== "Completed")
    .map((t) => ({ task: t, risk: computeRisk(t) }))
    .filter(({ risk }) => risk.level === "Critical" || risk.level === "High")
    .sort((a, b) => b.risk.score - a.risk.score);

  if (scored.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
          Attention Required
        </h3>
        <p className="text-xs text-emerald-600 py-3 text-center">No critical or high-risk tasks</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
        Attention Required ({scored.length})
      </h3>
      <div className="space-y-1 max-h-80 overflow-y-auto">
        {scored.map(({ task, risk }) => {
          const due = task.expectedCompletionDate
            ? new Date(task.expectedCompletionDate).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })
            : "—";
          return (
            <button
              key={task.id}
              onClick={() => onSelect(task)}
              className={`w-full text-left flex items-start gap-2 p-1.5 rounded text-xs border-l-2 transition-colors hover:bg-slate-50 ${
                risk.level === "Critical" ? "border-l-red-400" : "border-l-orange-400"
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {task.important ? (
                  <Star size={12} className="text-amber-500" />
                ) : (
                  <AlertTriangle size={12} className="text-orange-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-800 truncate">{task.taskDescription}</div>
                <div className="text-slate-400 mt-0.5">
                  {task.assignee} &middot; Due {due} &middot; {task.progress}
                </div>
                {task.latestProgressUpdate && (
                  <div className="text-slate-500 mt-0.5 line-clamp-1">{task.latestProgressUpdate}</div>
                )}
              </div>
              <span className={`shrink-0 text-[10px] font-medium px-1 py-0.5 rounded border ${riskColor(risk.level).split(" ").slice(1, 4).join(" ")}`}>
                {risk.level}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
