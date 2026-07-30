"use client";

import { useState, useMemo } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Star, Trash2, Circle, Clock, CheckCircle2, AlertTriangle, Archive } from "lucide-react";
import { TaskRecord, Progress, FilterState, Priority, Project } from "@/lib/types";
import { isOverdue, matchesFilters } from "@/lib/filters";
import { computeRisk } from "@/lib/risk";
import { updateTask, archiveTask } from "@/app/actions/teable";

interface Props {
  tasks: TaskRecord[];
  filters: FilterState;
  onFilters: (filters: FilterState) => void;
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelect: (task: TaskRecord) => void;
  projects?: Project[];
}

function getFullPath(projectId: string, projects: Project[]): string {
  const parts: string[] = [];
  let id: string | null = projectId;
  while (id) {
    const p = projects.find((pr) => pr.id === id);
    if (!p) break;
    parts.unshift(p.name);
    id = p.parentId;
  }
  return parts.join(" > ");
}

type SortKey = keyof Pick<TaskRecord, "taskDescription" | "assignee" | "progress" | "expectedCompletionDate" | "startDate" | "project">;

const SORT_LABELS: Record<SortKey, string> = {
  taskDescription: "Task",
  assignee: "Assignee",
  progress: "Status",
  expectedCompletionDate: "Due",
  startDate: "Start",
  project: "Project",
};

const PROGRESS_ORDER: Record<Progress, number> = { Completed: 0, "In Progress": 1, "Not Started": 2 };

export default function TaskTable({ tasks, filters, onFilters, selected, onToggleSelect, onSelect, projects = [] }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("expectedCompletionDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

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
      } else if (sortKey === "expectedCompletionDate" || sortKey === "startDate") {
        cmp = (a[sortKey] || "").localeCompare(b[sortKey] || "");
      } else {
        cmp = String(a[sortKey] || "").localeCompare(String(b[sortKey] || ""));
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
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

  const handleArchive = async (task: TaskRecord) => {
    if (!confirm(`Archive "${task.taskDescription}"?`)) return;
    setSavingId(task.id);
    await archiveTask(task.id);
    setSavingId(null);
  };

  const handleInlineEdit = async (task: TaskRecord) => {
    if (!editValue.trim() || editValue === task.taskDescription) {
      setEditingId(null);
      return;
    }
    setSavingId(task.id);
    await updateTask(task.id, { taskDescription: editValue.trim() });
    setSavingId(null);
    setEditingId(null);
  };

  const StatusIcon = ({ progress }: { progress: Progress }) => {
    switch (progress) {
      case "Completed": return <CheckCircle2 size={10} className="text-emerald-500" />;
      case "In Progress": return <Clock size={10} className="text-blue-500" />;
      default: return <Circle size={10} className="text-slate-300" />;
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="p-3 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={filters.search}
              onChange={(e) => onFilters({ ...filters, search: e.target.value })}
              className="w-full text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-slate-50"
            />
          </div>
          <select
            value=""
            onChange={(e) => {
              const val = e.target.value;
              if (!val) return;
              onFilters({
                ...filters,
                progress: filters.progress.includes(val as Progress)
                  ? filters.progress
                  : [...filters.progress, val as Progress],
              });
              e.target.value = "";
            }}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
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
              onFilters({
                ...filters,
                assignee: filters.assignee.includes(val) ? filters.assignee : [...filters.assignee, val],
              });
              e.target.value = "";
            }}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
          >
            <option value="">Assignee...</option>
            {assignees.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer px-2 py-1 rounded hover:bg-slate-50">
            <input type="checkbox" checked={filters.important === true} onChange={(e) => onFilters({ ...filters, important: e.target.checked ? true : null })} className="rounded" />
            <Star size={11} className={filters.important === true ? "text-amber-500" : ""} />
            Important
          </label>
          <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer px-2 py-1 rounded hover:bg-slate-50">
            <input type="checkbox" checked={filters.overdue === true} onChange={(e) => onFilters({ ...filters, overdue: e.target.checked ? true : null })} className="rounded" />
            Overdue
          </label>
          <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer px-2 py-1 rounded hover:bg-slate-50">
            <input type="checkbox" checked={filters.blocked === true} onChange={(e) => onFilters({ ...filters, blocked: e.target.checked ? true : null })} className="rounded" />
            Blocked
          </label>
          <select
            value=""
            onChange={(e) => {
              const val = e.target.value as Priority;
              if (!val) return;
              onFilters({ ...filters, priority: filters.priority.includes(val) ? filters.priority : [...filters.priority, val] });
              e.target.value = "";
            }}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
          >
            <option value="">Priority...</option>
            {(["Critical", "High", "Medium", "Low"] as const).map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          {(filters.progress.length > 0 || filters.assignee.length > 0 || filters.important !== null || filters.overdue !== null || filters.search || filters.blocked !== null || filters.priority.length > 0) && (
            <button
              onClick={() => onFilters({ progress: [], assignee: [], important: null, overdue: null, search: "", blocked: null, priority: [] })}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear
            </button>
          )}
        </div>
        {filters.progress.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {filters.progress.map((p) => (
              <span key={p} className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 rounded-full px-2 py-0.5">
                {p}
                <button onClick={() => onFilters({ ...filters, progress: filters.progress.filter((x) => x !== p) })} className="hover:text-blue-900">&times;</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 sticky top-0 z-10">
              <th className="w-10 px-3 py-2 text-left">
                <input
                  type="checkbox"
                  checked={sorted.length > 0 && sorted.every((t) => selected.has(t.id))}
                  onChange={(e) => {
                    if (e.target.checked) sorted.forEach((t) => selected.add(t.id));
                    else sorted.forEach((t) => selected.delete(t.id));
                    onToggleSelect("__bulk__");
                  }}
                  className="rounded"
                />
              </th>
              <th className="px-2 py-2 text-left font-medium text-slate-400 cursor-pointer hover:text-slate-600 w-[35%]" onClick={() => toggleSort("taskDescription")}>
                <div className="flex items-center gap-1">
                  Task
                  {sortKey === "taskDescription" ? (
                    sortDir === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />
                  ) : <ArrowUpDown size={11} className="opacity-30" />}
                </div>
              </th>
              <th className="px-2 py-2 text-left font-medium text-slate-400 cursor-pointer hover:text-slate-600 w-[15%]" onClick={() => toggleSort("assignee")}>
                <div className="flex items-center gap-1">
                  Assignee
                  {sortKey === "assignee" ? (
                    sortDir === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />
                  ) : <ArrowUpDown size={11} className="opacity-30" />}
                </div>
              </th>
              <th className="px-2 py-2 text-left font-medium text-slate-400 cursor-pointer hover:text-slate-600 w-[13%]" onClick={() => toggleSort("project")}>
                <div className="flex items-center gap-1">
                  Project
                  {sortKey === "project" ? (
                    sortDir === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />
                  ) : <ArrowUpDown size={11} className="opacity-30" />}
                </div>
              </th>
              <th className="px-2 py-2 text-left font-medium text-slate-400 cursor-pointer hover:text-slate-600 w-[12%]" onClick={() => toggleSort("progress")}>
                <div className="flex items-center gap-1">
                  Status
                  {sortKey === "progress" ? (
                    sortDir === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />
                  ) : <ArrowUpDown size={11} className="opacity-30" />}
                </div>
              </th>
              <th className="px-2 py-2 text-left font-medium text-slate-400 cursor-pointer hover:text-slate-600 w-[12%]" onClick={() => toggleSort("expectedCompletionDate")}>
                <div className="flex items-center gap-1">
                  Due
                  {sortKey === "expectedCompletionDate" ? (
                    sortDir === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />
                  ) : <ArrowUpDown size={11} className="opacity-30" />}
                </div>
              </th>
              <th className="px-2 py-2 text-left font-medium text-slate-400 cursor-pointer hover:text-slate-600 w-[12%]" onClick={() => toggleSort("startDate")}>
                <div className="flex items-center gap-1">
                  Start
                  {sortKey === "startDate" ? (
                    sortDir === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />
                  ) : <ArrowUpDown size={11} className="opacity-30" />}
                </div>
              </th>
              <th className="px-2 py-2 text-right font-medium text-slate-400 w-[15%]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((task, idx) => {
              const risk = computeRisk(task);
              const overdue = isOverdue(task);
              const isEditing = editingId === task.id;
              return (
                <tr
                  key={task.id}
                  className={`border-b border-slate-50 group transition-colors ${
                    savingId === task.id ? "opacity-50 pointer-events-none" : "hover:bg-blue-50/40"
                  } ${idx % 2 === 1 ? "bg-slate-50/30" : ""}`}
                >
                  <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(task.id)}
                      onChange={() => onToggleSelect(task.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-2 py-2 max-w-[250px]" onClick={() => onSelect(task)}>
                    <div className="flex items-center gap-1">
                      {overdue && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" title="Overdue" />}
                      {task.important && <Star size={11} className="text-amber-500 shrink-0" />}
                      {task.blocked && <span title={`Blocked: ${task.blockedReason || ""}`}><AlertTriangle size={11} className="text-red-500 shrink-0" /></span>}
                      {!isEditing && (
                        <span className={`text-[10px] font-medium mr-0.5 ${
                          task.priority === "Critical" ? "text-red-600" :
                          task.priority === "High" ? "text-orange-600" :
                          task.priority === "Medium" ? "text-amber-600" :
                          "text-slate-400"
                        }`}>
                          {task.priority === "Critical" ? "CRT" :
                           task.priority === "High" ? "HI" :
                           task.priority === "Medium" ? "MED" :
                           "LOW"}
                        </span>
                      )}
                      {isEditing ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleInlineEdit(task)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleInlineEdit(task);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="text-xs border border-blue-300 rounded px-1 py-0.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-100"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span
                          className="truncate text-slate-800 cursor-pointer hover:text-blue-700"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setEditingId(task.id);
                            setEditValue(task.taskDescription);
                          }}
                          title="Double-click to edit"
                        >
                          {task.taskDescription}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-2 text-slate-600" onClick={() => onSelect(task)}>
                    {task.assignee || <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-2 py-2" onClick={() => onSelect(task)}>
                    {task.project && projects && projects.length > 0 ? (
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: projects.find((p) => p.id === task.project)?.color || "#94a3b8" }} />
                        <span className="text-[10px] text-slate-500 truncate max-w-[100px]">
                          {getFullPath(task.project, projects)}
                        </span>
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-2 py-2" onClick={() => onSelect(task)}>
                    <div className="flex items-center gap-1">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                        task.progress === "Completed" ? "text-emerald-700 bg-emerald-50" :
                        task.progress === "In Progress" ? "text-blue-700 bg-blue-50" :
                        "text-slate-500 bg-slate-100"
                      }`}>
                        <StatusIcon progress={task.progress} />
                        {task.progress}
                      </span>
                      {task.blocked && (
                        <span className="text-[9px] text-red-600 bg-red-50 rounded px-1 py-0.5 font-medium">BLOCKED</span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-2 text-slate-400 tabular-nums" onClick={() => onSelect(task)}>
                    {task.expectedCompletionDate
                      ? new Date(task.expectedCompletionDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                      : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-2 py-2 text-slate-400 tabular-nums" onClick={() => onSelect(task)}>
                    {task.startDate
                      ? new Date(task.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                      : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <select
                        value={task.progress}
                        onChange={(e) => handleQuickProgress(task, e.target.value as Progress)}
                        className="text-[10px] border border-slate-200 rounded-md px-1 py-1 bg-white hover:border-slate-300 cursor-pointer"
                      >
                        <option value="Not Started">Not Started</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                      <button
                        onClick={() => handleQuickImportant(task)}
                        className={`p-1 rounded-md transition-colors ${
                          task.important ? "text-amber-500 bg-amber-50" : "text-slate-300 opacity-0 group-hover:opacity-100 hover:text-amber-400 hover:bg-amber-50"
                        }`}
                        title={task.important ? "Unflag" : "Flag as important"}
                      >
                        <Star size={12} />
                      </button>
                      {task.percentComplete > 0 && (
                        <div className="w-8 h-1 bg-slate-100 rounded-full overflow-hidden shrink-0">
                          <div className="h-full bg-blue-400 rounded-full" style={{ width: `${task.percentComplete}%` }} />
                        </div>
                      )}
                      <button
                        onClick={() => handleArchive(task)}
                        className="p-1 rounded-md text-slate-300 opacity-0 group-hover:opacity-100 hover:text-slate-500 hover:bg-slate-100 transition-all"
                        title="Archive task"
                      >
                        <Archive size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center">
                  <div className="text-xs text-slate-400">
                    {tasks.length === 0 ? "No tasks yet. Create one to get started." : "No tasks match the current filters"}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-[10px] text-slate-400">
        <span>{sorted.length} of {tasks.length} tasks</span>
        <span className="flex items-center gap-3">
          <span>{tasks.filter((t) => t.progress === "Completed").length} completed</span>
          <span>{tasks.filter((t) => t.progress === "In Progress").length} in progress</span>
          <span>{tasks.filter((t) => t.progress === "Not Started").length} not started</span>
        </span>
      </div>
    </div>
  );
}
