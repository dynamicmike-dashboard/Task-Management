"use client";

import { useMemo } from "react";
import { AlertTriangle, Star, Clock, AlertCircle } from "lucide-react";
import { TaskRecord } from "@/lib/types";
import { computeRisk, riskColor } from "@/lib/risk";

interface Props {
  tasks: TaskRecord[];
  onSelect: (task: TaskRecord) => void;
}

export default function AttentionQueue({ tasks, onSelect }: Props) {
  const scored = useMemo(
    () =>
      tasks
        .filter((t) => t.progress !== "Completed")
        .map((t) => ({ task: t, risk: computeRisk(t) }))
        .filter(({ risk }) => risk.level === "Critical" || risk.level === "High")
        .sort((a, b) => b.risk.score - a.risk.score),
    [tasks]
  );

  const critical = scored.filter((s) => s.risk.level === "Critical");
  const high = scored.filter((s) => s.risk.level === "High");

  const sections: [string, typeof scored, string, typeof AlertCircle][] = [
    ["Critical", critical, "text-red-600", AlertCircle],
    ["High", high, "text-orange-600", AlertTriangle],
  ];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Attention Required
        </h3>
        <div className="flex items-center gap-3 text-[11px]">
          {critical.length > 0 && (
            <span className="text-red-600 font-medium">{critical.length} critical</span>
          )}
          {high.length > 0 && (
            <span className="text-orange-600 font-medium">{high.length} high</span>
          )}
        </div>
      </div>

      {scored.length === 0 && (
        <div className="py-6 text-center">
          <AlertCircle size={24} className="mx-auto text-emerald-400 mb-1" />
          <p className="text-xs text-emerald-600 font-medium">All clear</p>
          <p className="text-[10px] text-slate-400 mt-0.5">No critical or high-risk tasks</p>
        </div>
      )}

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {sections.map(([label, items, textColor]) => {
          if (items.length === 0) return null;
          return (
            <div key={label}>
              <div className="flex items-center gap-1.5 mb-1">
                <Clock size={10} className={textColor} />
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${textColor}`}>
                  {label}
                </span>
                <span className="text-[10px] text-slate-400">{items.length}</span>
              </div>
              <div className="space-y-1">
                {items.map(({ task, risk }) => {
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
                      className={`w-full text-left flex items-start gap-2.5 p-2 rounded-lg border transition-colors hover:bg-slate-50 ${
                        label === "Critical"
                          ? "border-red-100 hover:border-red-200"
                          : "border-orange-100 hover:border-orange-200"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        label === "Critical" ? "bg-red-50 text-red-500" : "bg-orange-50 text-orange-500"
                      }`}>
                        {task.important ? <Star size={10} /> : <AlertTriangle size={10} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-slate-800 truncate">{task.taskDescription}</span>
                          <span className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${riskColor(risk.level)}`}>
                            {risk.score}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[10px] text-slate-500">{task.assignee}</span>
                          <span className="text-[10px] text-slate-400">&middot;</span>
                          <span className="text-[10px] text-slate-500">Due {due}</span>
                          <span className={`text-[10px] px-1 py-0.5 rounded ${
                            task.progress === "In Progress" ? "text-blue-700 bg-blue-50" : "text-slate-500 bg-slate-50"
                          }`}>
                            {task.progress}
                          </span>
                        </div>
                        {task.latestProgressUpdate && (
                          <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                            {task.latestProgressUpdate}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
