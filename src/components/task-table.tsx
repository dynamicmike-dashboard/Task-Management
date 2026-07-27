"use client";

import { useState, useMemo } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react";
import { TaskRecord, Progress, FilterState } from "@/lib/types";
import { isOverdue, matchesFilters } from "@/lib/filters";
import { computeRisk, riskColor } from "@/lib/risk";
import { updateTask } from "@/app/actions/teable";

interface Props {
  tasks: TaskRecord[];
  filters: FilterState;
  onFilters: (filters: FilterState) => void;
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelect: (task: TaskRecord) => void;
}

type SortKey = keyof Pick<TaskRecord, "taskDescription" | "assignee" | "progress" | "priority" | "expectedCompletionDate" | "startDate">;

const SORT_LABELS: Record<SortKey, string> = {
  taskDescription: "Task",
  assignee: "Assignee",
  progress: "Status",
  priority: "Priority",
  expectedCompletionDate: "Due",
  startDate: "Start",
};

const PROGRESS_ORDER: Record<Progress, number> = { "Completed": 0, "In Progress": 1, "Not Started": 2 };

export default function TaskTable({ tasks, filters, onFilters, selected, onToggleSelect, onSelect }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("expectedCompletionDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [savingId, setSavingId] = useState<string | null>(null);

  const assignees = useMemo(() => [...new Set(tasks.map((t) => t.assignee).filter(Boolean))].sort(), [tasks]);

  const filtered = useMemo(
    () => tasks.filter((t) => matchesFilters(t, filters)),
    [tasks, filters]
  );

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "progress") {
        cmp = PROGRESS_ORDER[a.progress] - PROGRESS_ORDER[b.progress];
      } else if (sortKey === "priority") {
        const order = { Critical: 0, High: 1, Medium: 2, Low: 3 };
        cmp = (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
      } else if (sortKey === "expectedCompletionDate" || sortKey === "startDate") {
        const da = a[sortKey] || "";
        const db = b[sortKey] || "";
        cmp = da.localeCompare(db);
      } else {
        cmp = String(a[sortKey] || "").localeCompare(String(b[sortKey] || ""));
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handleQuickProgress = async (task: TaskRecord, val: Progress) => {
    setSavingId(task.id);
    await updateTask(task.id, { progress: val });
    setSavingId(null);
  };

  const handleQuickImportant = async (task: TaskRecord) => {
    setSavingId(task.id);
    await updateTask(task.id, { important: !task.important });
    setSavingId(null);
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <div className="p-2 border-b border-slate-100">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[120px] max-w-xs">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={filters.search}
              onChange={(e) => onFilters({ ...filters, search: e.target.value })}
              className="w-full text-xs border border-slate-200 rounded pl-6 pr-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <select
            value=""
            onChange={(e) => {
              const val = e.target.value;
              if (!val) return;
              onFilters({ ...filters, progress: filters.progress.includes(val as Progress) ? filters.progress : [...filters.progress, val as Progress] });
              e.target.value = "";
            }}
            className="text-xs border border-slate-200 rounded px-1.5 py-1 bg-white"
          >
            <option value="">Progress...</option>
            {(["Completed", "In Progress", "Not Started"] as const).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select
            value=""
            onChange={(e) => {
              const val = e.target.value;
              if (!val) return;
              onFilters({ ...filters, assignee: filters.assignee.includes(val) ? filters.assignee : [...filters.assignee, val] });
              e.target.value = "";
            }}
            className="text-xs border border-slate-200 rounded px-1.5 py-1 bg-white"
          >
            <option value="">Assignee...</option>
            {assignees.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <label className="flex items-center gap-1 text-xs text-slate-500 cursor-pointer">
            <input type="checkbox" checked={filters.important === true} onChange={(e) => onFilters({ ...filters, important: e.target.checked ? true : null })} className="rounded" />
            Important
          </label>
          <label className="flex items-center gap-1 text-xs text-slate-500 cursor-pointer">
            <input type="checkbox" checked={filters.overdue === true} onChange={(e) => onFilters({ ...filters, overdue: e.target.checked ? true : null })} className="rounded" />
            Overdue
          </label>
          {(filters.progress.length > 0 || filters.assignee.length > 0 || filters.important !== null || filters.overdue !== null || filters.search || filters.priority.length > 0) && (
            <button
              onClick={() => onFilters({ progress: [], assignee: [], important: null, overdue: null, priority: [], blocked: null, search: "" })}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Clear filters
            </button>
          )}
        </div>
        {filters.progress.length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {filters.progress.map((p) => (
              <span key={p} className="inline-flex items-center gap-0.5 text-[10px] bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">
                {p}
                <button onClick={() => onFilters({ ...filters, progress: filters.progress.filter((x) => x !== p) })} className="hover:text-red-500">&times;</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="w-8 px-2 py-1.5 text-left">
                <input type="checkbox" onChange={(e) => {
                  if (e.target.checked) {
                    sorted.forEach((t) => selected.add(t.id));
                    onToggleSelect("__bulk__");
                  } else {
                    sorted.forEach((t) => selected.delete(t.id));
                    onToggleSelect("__bulk__");
                  }
                }} className="rounded" />
              </th>
              {(Object.entries(SORT_LABELS) as [SortKey, string][]).map(([key, label]) => (
                <th key={key} className="px-2 py-1.5 text-left font-medium text-slate-400 cursor-pointer hover:text-slate-600 whitespace-nowrap" onClick={() => toggleSort(key)}>
                  <div className="flex items-center gap-0.5">
                    {label}
                    {sortKey === key ? (
                      sortDir === "asc" ? <ArrowUp size={10} /> : <ArrowDown size={10} />
                    ) : (
                      <ArrowUpDown size={10} className="opacity-30" />
                    )}
                  </div>
                </th>
              ))}
              <th className="px-2 py-1.5">Quick</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((task) => {
              const risk = computeRisk(task);
              const overdue = isOverdue(task);
              return (
                <tr
                  key={task.id}
                  className={`border-b border-slate-50 hover:bg-slate-50 cursor-pointer ${savingId === task.id ? "opacity-60" : ""}`}
                >
                  <td className="px-2 py-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(task.id)}
                      onChange={() => onToggleSelect(task.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-2 py-1 font-medium text-slate-800 max-w-[200px] truncate" onClick={() => onSelect(task)}>
                    <div className="flex items-center gap-1">
                      {overdue && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" title="Overdue" />}
                      {task.important && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" title="Important" />}
                      {task.blocked && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" title="Blocked" />}
                      <span className="truncate">{task.taskDescription}</span>
                    </div>
                  </td>
                  <td className="px-2 py-1 text-slate-500" onClick={() => onSelect(task)}>{task.assignee}</td>
                  <td className="px-2 py-1" onClick={() => onSelect(task)}>
                    <span className={`inline-block text-[10px] font-medium px-1 py-0.5 rounded ${
                      task.progress === "Completed" ? "text-emerald-700 bg-emerald-50" :
                      task.progress === "In Progress" ? "text-blue-700 bg-blue-50" :
                      "text-slate-500 bg-slate-50"
                    }`}>
                      {task.progress}
                    </span>
                  </td>
                  <td className="px-2 py-1" onClick={() => onSelect(task)}>
                    <span className={`text-[10px] font-medium ${
                      task.priority === "Critical" ? "text-red-600" :
                      task.priority === "High" ? "text-orange-600" :
                      task.priority === "Medium" ? "text-amber-600" : "text-slate-400"
                    }`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-2 py-1 text-slate-400 tabular-nums" onClick={() => onSelect(task)}>
                    {task.expectedCompletionDate
                      ? new Date(task.expectedCompletionDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                      : "—"}
                  </td>
                  <td className="px-2 py-1 text-slate-400 tabular-nums" onClick={() => onSelect(task)}>
                    {task.startDate
                      ? new Date(task.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                      : "—"}
                  </td>
                  <td className="px-2 py-1" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <select
                        value={task.progress}
                        onChange={(e) => handleQuickProgress(task, e.target.value as Progress)}
                        className="text-[10px] border border-slate-200 rounded px-1 py-0.5 bg-white w-20"
                      >
                        <option value="Not Started">Not Started</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                      <button
                        onClick={() => handleQuickImportant(task)}
                        title={task.important ? "Unmark important" : "Mark important"}
                        className={`p-0.5 rounded ${task.important ? "text-amber-500" : "text-slate-300 hover:text-amber-400"}`}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill={task.important ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-xs text-slate-400">
                  No tasks match the current filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="px-2 py-1 border-t border-slate-100 text-[10px] text-slate-400">
        {sorted.length} of {tasks.length} tasks
      </div>
    </div>
  );
}
