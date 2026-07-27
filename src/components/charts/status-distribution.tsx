"use client";

import { useCallback } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { TaskRecord } from "@/lib/types";

interface Props {
  tasks: TaskRecord[];
  onFilter?: (progress: string | null) => void;
}

const COLORS = { Completed: "#059669", "In Progress": "#2563eb", "Not Started": "#94a3b8" };
const ORDER = ["Completed", "In Progress", "Not Started"];

export default function StatusDistribution({ tasks, onFilter }: Props) {
  const counts = ORDER.map((p) => ({
    name: p,
    value: tasks.filter((t) => t.progress === p).length,
  }));

  const handleClick = useCallback(
    (data: { name?: string }) => {
      if (onFilter && data?.name) onFilter(data.name);
    },
    [onFilter]
  );

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
        Status Distribution
      </h3>
      <div className="flex items-center gap-2">
        <div className="w-28 h-28 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={counts}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={22}
                outerRadius={38}
                onClick={handleClick}
                style={{ cursor: "pointer" }}
              >
                {counts.map((e) => (
                  <Cell key={e.name} fill={COLORS[e.name as keyof typeof COLORS] || "#94a3b8"} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-1 text-xs">
          {counts.map((c) => (
            <button
              key={c.name}
              onClick={() => onFilter?.(c.name)}
              className="flex items-center gap-1.5 text-left hover:opacity-80"
            >
              <span
                className="inline-block w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[c.name as keyof typeof COLORS] || "#94a3b8" }}
              />
              <span className="text-slate-600">{c.name}</span>
              <span className="font-medium tabular-nums ml-auto">{c.value}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
