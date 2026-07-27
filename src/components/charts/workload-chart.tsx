"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TaskRecord } from "@/lib/types";

interface Props {
  tasks: TaskRecord[];
  onFilter?: (assignee: string) => void;
}

const PROGRESS_COLORS: Record<string, string> = {
  Completed: "#059669",
  "In Progress": "#2563eb",
  "Not Started": "#94a3b8",
};

export default function WorkloadChart({ tasks, onFilter }: Props) {
  const assignees = [...new Set(tasks.map((t) => t.assignee).filter(Boolean))].sort();

  const data = assignees.map((name) => {
    const t = tasks.filter((r) => r.assignee === name);
    return {
      name,
      Completed: t.filter((r) => r.progress === "Completed").length,
      "In Progress": t.filter((r) => r.progress === "In Progress").length,
      "Not Started": t.filter((r) => r.progress === "Not Started").length,
    };
  });

  const handleBarClick = (data: { name?: string }) => {
    if (onFilter && data?.name) onFilter(data.name);
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
        Assignee Workload
      </h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip />
            <Legend iconSize={8} wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
            {(["Completed", "In Progress", "Not Started"] as const).map((p) => (
              <Bar
                key={p}
                dataKey={p}
                stackId="a"
                fill={PROGRESS_COLORS[p]}
                onClick={handleBarClick}
                style={{ cursor: "pointer" }}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
