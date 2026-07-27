"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TaskRecord } from "@/lib/types";
import { format, parseISO, startOfWeek } from "date-fns";

interface Props {
  tasks: TaskRecord[];
}

export default function TrendChart({ tasks }: Props) {
  const completed = tasks.filter((t) => t.progress === "Completed" && t.actualCompletionDate);

  const weeklyMap = new Map<string, number>();
  for (const t of completed) {
    const d = t.actualCompletionDate!;
    const parsed = parseISO(d);
    if (isNaN(parsed.getTime())) continue;
    const wk = startOfWeek(parsed, { weekStartsOn: 1 });
    const key = format(wk, "yyyy-MM-dd");
    weeklyMap.set(key, (weeklyMap.get(key) || 0) + 1);
  }

  const sorted = [...weeklyMap.entries()].sort(([a], [b]) => a.localeCompare(b));
  const data = sorted.map(([week, count]) => ({
    week: format(parseISO(week), "d MMM"),
    completions: count,
  }));

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
          Weekly Completions
        </h3>
        <p className="text-xs text-slate-400 py-6 text-center">No completion data yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
        Weekly Completions
      </h3>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
            <XAxis dataKey="week" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="completions" stroke="#059669" strokeWidth={2} dot={{ r: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
