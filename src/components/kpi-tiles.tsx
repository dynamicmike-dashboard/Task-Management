"use client";

import { useMemo } from "react";
import { ClipboardList, CheckCircle2, Clock, CircleDot, AlertTriangle, Star, Ban } from "lucide-react";
import { TaskRecord } from "@/lib/types";
import { isOverdue } from "@/lib/filters";

interface Props {
  tasks: TaskRecord[];
  activeFilter: string | null;
  onFilter: (key: string | null) => void;
}

interface KpiDef {
  key: string;
  label: string;
  icon: typeof ClipboardList;
  color: string;
  value: number;
  active?: boolean;
}

export default function KpiTiles({ tasks, activeFilter, onFilter }: Props) {
  const total = tasks.filter((t) => !t.archived).length;
  const completed = tasks.filter((t) => t.progress === "Completed" && !t.archived).length;
  const inProgress = tasks.filter((t) => t.progress === "In Progress" && !t.archived).length;
  const notStarted = tasks.filter((t) => t.progress === "Not Started" && !t.archived).length;
  const overdue = tasks.filter((t) => isOverdue(t) && !t.archived).length;
  const important = tasks.filter((t) => t.important && !t.archived).length;
  const blocked = tasks.filter((t) => t.blocked && !t.archived).length;

  const pct = (n: number) => total > 0 ? `${Math.round((n / total) * 100)}%` : "—";

  const kpis: KpiDef[] = [
    { key: "all", label: "Total Tasks", icon: ClipboardList, color: "text-slate-700 bg-slate-100", value: total },
    { key: "completed", label: "Completed", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50", value: completed },
    { key: "inProgress", label: "In Progress", icon: Clock, color: "text-blue-600 bg-blue-50", value: inProgress },
    { key: "notStarted", label: "Not Started", icon: CircleDot, color: "text-slate-500 bg-slate-100", value: notStarted },
    { key: "overdue", label: "Overdue", icon: AlertTriangle, color: "text-red-600 bg-red-50", value: overdue },
    { key: "important", label: "Important", icon: Star, color: "text-amber-600 bg-amber-50", value: important },
    { key: "blocked", label: "Blocked", icon: Ban, color: "text-orange-600 bg-orange-50", value: blocked },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
      {kpis.map((kpi) => {
        const isActive = activeFilter === kpi.key;
        return (
          <button
            key={kpi.key}
            onClick={() => onFilter(isActive ? null : kpi.key)}
            className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all text-left ${
              isActive
                ? "border-blue-300 bg-blue-50 ring-1 ring-blue-200"
                : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
            }`}
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${kpi.color}`}>
              <kpi.icon size={14} />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-800">{kpi.value}</div>
              <div className="text-[9px] text-slate-400 leading-tight">
                {kpi.label}{kpi.label === "Total Tasks" ? "" : ` (${pct(kpi.value)})`}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
