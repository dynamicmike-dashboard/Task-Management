"use client";

import {
  ClipboardList, CheckCircle2, Clock, CircleDot, AlertTriangle, Star,
} from "lucide-react";
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
  icon: React.ReactNode;
  color: string;
  value: number;
  pct?: string;
  desc: string;
}

export default function KpiTiles({ tasks, activeFilter, onFilter }: Props) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.progress === "Completed").length;
  const inProgress = tasks.filter((t) => t.progress === "In Progress").length;
  const notStarted = tasks.filter((t) => t.progress === "Not Started").length;
  const overdue = tasks.filter((t) => isOverdue(t)).length;
  const important = tasks.filter((t) => t.important).length;

  const pct = (n: number) => (total > 0 ? `${Math.round((n / total) * 100)}%` : "0%");

  const kpis: KpiDef[] = [
    { key: "all", label: "Total Tasks", icon: <ClipboardList size={16} />, color: "text-slate-700 border-slate-200", value: total, pct: "", desc: "All tasks in the register" },
    { key: "completed", label: "Completed", icon: <CheckCircle2 size={16} />, color: "text-emerald-600 border-emerald-200", value: completed, pct: pct(completed), desc: "Tasks marked completed" },
    { key: "inProgress", label: "In Progress", icon: <Clock size={16} />, color: "text-blue-600 border-blue-200", value: inProgress, pct: pct(inProgress), desc: "Tasks actively being worked" },
    { key: "notStarted", label: "Not Started", icon: <CircleDot size={16} />, color: "text-slate-400 border-slate-200", value: notStarted, pct: pct(notStarted), desc: "Tasks not yet begun" },
    { key: "overdue", label: "Overdue", icon: <AlertTriangle size={16} />, color: "text-red-600 border-red-200", value: overdue, pct: "-", desc: "Open tasks past expected completion" },
    { key: "important", label: "Important", icon: <Star size={16} />, color: "text-amber-600 border-amber-200", value: important, pct: pct(important), desc: "Flagged as important" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
      {kpis.map((kpi) => {
        const isActive = activeFilter === kpi.key;
        return (
          <button
            key={kpi.key}
            onClick={() => onFilter(isActive ? null : kpi.key)}
            title={kpi.desc}
            className={`flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left transition-all ${
              isActive ? "ring-2 ring-blue-500 shadow-sm bg-blue-50" : "bg-white hover:bg-slate-50"
            } ${kpi.color}`}
          >
            <div className="flex items-center gap-1.5 text-xs font-medium opacity-70">
              {kpi.icon}
              <span>{kpi.label}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold tabular-nums">{kpi.value}</span>
              {kpi.pct && <span className="text-xs opacity-60">{kpi.pct}</span>}
            </div>
          </button>
        );
      })}
    </div>
  );
}
