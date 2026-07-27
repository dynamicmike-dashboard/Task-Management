"use client";

import { TaskRecord } from "@/lib/types";

interface Props {
  tasks: TaskRecord[];
}

export default function DeliveryHealth({ tasks }: Props) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.progress === "Completed");
  const open = tasks.filter((t) => t.progress !== "Completed");

  const completedWithDates = completed.filter((t) => t.expectedCompletionDate && t.actualCompletionDate);
  const onTime = completedWithDates.filter((t) => {
    const due = new Date(t.expectedCompletionDate!);
    const actual = new Date(t.actualCompletionDate!);
    return actual <= due;
  });
  const onTimeRate = completedWithDates.length > 0
    ? Math.round((onTime.length / completedWithDates.length) * 100)
    : null;

  const delays = completedWithDates
    .filter((t) => {
      const due = new Date(t.expectedCompletionDate!);
      const actual = new Date(t.actualCompletionDate!);
      return actual > due;
    })
    .map((t) => {
      const due = new Date(t.expectedCompletionDate!);
      const actual = new Date(t.actualCompletionDate!);
      return Math.round((actual.getTime() - due.getTime()) / 86400000);
    });
  const avgDelay = delays.length > 0
    ? Math.round(delays.reduce((a, b) => a + b, 0) / delays.length)
    : null;

  const cycleTimes = completed
    .filter((t) => t.startDate && t.actualCompletionDate)
    .map((t) => {
      const start = new Date(t.startDate!);
      const end = new Date(t.actualCompletionDate!);
      return Math.round((end.getTime() - start.getTime()) / 86400000);
    });
  const avgCycle = cycleTimes.length > 0
    ? Math.round(cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length)
    : null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueIn7 = open.filter((t) => {
    if (!t.expectedCompletionDate) return false;
    const due = new Date(t.expectedCompletionDate);
    due.setHours(0, 0, 0, 0);
    const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
    return diff >= 0 && diff <= 7;
  }).length;
  const dueIn30 = open.filter((t) => {
    if (!t.expectedCompletionDate) return false;
    const due = new Date(t.expectedCompletionDate);
    due.setHours(0, 0, 0, 0);
    const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
    return diff >= 0 && diff <= 30;
  }).length;

  const metrics = [
    { label: "On-Time Rate", value: onTimeRate !== null ? `${onTimeRate}%` : "—", desc: `${onTime.length}/${completedWithDates.length} completed tasks` },
    { label: "Avg Delay", value: avgDelay !== null ? `${avgDelay}d` : "—", desc: "Average days past due for late completions" },
    { label: "Avg Cycle", value: avgCycle !== null ? `${avgCycle}d` : "—", desc: "Average start-to-completion days" },
    { label: "Due in 7 Days", value: String(dueIn7), desc: "Open tasks due within a week" },
    { label: "Due in 30 Days", value: String(dueIn30), desc: "Open tasks due within a month" },
  ];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
        Delivery Health
      </h3>
      <div className="grid grid-cols-5 gap-2">
        {metrics.map((m) => (
          <div key={m.label} className="text-center" title={m.desc}>
            <div className="text-lg font-bold tabular-nums text-slate-800">{m.value}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
