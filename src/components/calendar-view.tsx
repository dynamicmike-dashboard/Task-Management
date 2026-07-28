"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Circle, Clock, CheckCircle2, AlertCircle, Plus } from "lucide-react";
import { TaskRecord } from "@/lib/types";

interface Props {
  tasks: TaskRecord[];
  onSelect: (task: TaskRecord) => void;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function CalendarView({ tasks, onSelect }: Props) {
  const [date, setDate] = useState(new Date());
  const year = date.getFullYear();
  const month = date.getMonth();

  const withDates = useMemo(
    () => tasks.filter((t) => t.expectedCompletionDate),
    [tasks]
  );

  const withoutDates = useMemo(
    () => tasks.filter((t) => !t.expectedCompletionDate),
    [tasks]
  );

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const prev = () => setDate(new Date(year, month - 1, 1));
  const next = () => setDate(new Date(year, month + 1, 1));

  const getTasksForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return withDates.filter((t) => t.expectedCompletionDate === dateStr);
  };

  const cells: { day: number; tasks: TaskRecord[] }[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, tasks: getTasksForDay(d) });
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <button onClick={prev} className="p-1 rounded hover:bg-slate-100 text-slate-500">
          <ChevronLeft size={16} />
        </button>
        <h3 className="text-sm font-semibold text-slate-700">
          {MONTHS[month]} {year}
        </h3>
        <button onClick={next} className="p-1 rounded hover:bg-slate-100 text-slate-500">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 text-[10px] font-medium text-slate-400 uppercase">
        {DAYS.map((d) => (
          <div key={d} className="px-2 py-1.5 text-center border-b border-slate-50">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[80px] p-1 border-b border-r border-slate-50 bg-slate-50/30" />
        ))}
        {cells.map(({ day, tasks: dayTasks }) => {
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday = dateStr === todayStr;
          return (
            <div key={day} className={`min-h-[80px] p-1 border-b border-r border-slate-50 ${isToday ? "bg-blue-50/50" : ""}`}>
              <div className={`text-[10px] font-medium mb-0.5 w-5 h-5 flex items-center justify-center rounded-full ${isToday ? "bg-blue-600 text-white" : "text-slate-500"}`}>
                {day}
              </div>
              <div className="space-y-0.5">
                {dayTasks.slice(0, 3).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onSelect(t)}
                    className={`w-full text-left flex items-center gap-1 px-1 py-0.5 rounded text-[9px] truncate transition-colors hover:bg-slate-100 ${
                      t.progress === "Completed" ? "text-emerald-700 bg-emerald-50/50" :
                      t.progress === "In Progress" ? "text-blue-700 bg-blue-50/50" :
                      "text-slate-600 bg-slate-50/50"
                    } ${t.blocked ? "border-l-2 border-red-300" : ""}`}
                  >
                    {t.progress === "Completed" ? <CheckCircle2 size={8} /> :
                     t.progress === "In Progress" ? <Clock size={8} /> :
                     <Circle size={8} />}
                    <span className="truncate">{t.taskDescription}</span>
                  </button>
                ))}
                {dayTasks.length > 3 && (
                  <span className="text-[9px] text-slate-400 pl-1">+{dayTasks.length - 3} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-4 py-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-2">
        <div className="flex items-center justify-between">
          <span>{withDates.length} tasks with dates &middot; {withoutDates.length} without</span>
        </div>
        {withoutDates.length > 0 && (
          <div>
            <details className="group">
              <summary className="text-[10px] font-medium text-slate-400 cursor-pointer hover:text-slate-600">
                Tasks without dates ({withoutDates.length})
              </summary>
              <div className="mt-1 space-y-0.5 max-h-24 overflow-y-auto">
                {withoutDates.slice(0, 10).map((t) => (
                  <button key={t.id} onClick={() => onSelect(t)} className="w-full text-left flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-slate-50 text-[10px]">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      t.progress === "Completed" ? "bg-emerald-400" :
                      t.progress === "In Progress" ? "bg-blue-400" :
                      "bg-slate-300"
                    }`} />
                    <span className="truncate text-slate-600">{t.taskDescription}</span>
                    <span className="text-slate-300 ml-auto">{t.assignee}</span>
                  </button>
                ))}
                {withoutDates.length > 10 && (
                  <span className="text-[9px] text-slate-400 pl-2">+{withoutDates.length - 10} more</span>
                )}
              </div>
            </details>
          </div>
        )}
        {tasks.length > 0 && withDates.length === 0 && (
          <div className="text-center py-4">
            <AlertCircle size={20} className="mx-auto text-slate-300 mb-1" />
            <p className="text-xs text-slate-400">No tasks have due dates set.</p>
            <p className="text-[10px] text-slate-300 mt-0.5">Open a task in the side panel and set an Expected Completion Date to see it here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
