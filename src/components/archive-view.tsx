"use client";

import { useState } from "react";
import { Search, RotateCcw, Trash2, AlertTriangle, Archive } from "lucide-react";
import { TaskRecord } from "@/lib/types";
import { restoreTask, deleteTaskAction } from "@/app/actions/teable";

interface Props {
  tasks: TaskRecord[];
  onRefresh: () => void;
  onSelect: (task: TaskRecord) => void;
}

export default function ArchiveView({ tasks, onRefresh, onSelect }: Props) {
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const archived = tasks.filter(
    (t) => t.archived && (!search || t.taskDescription.toLowerCase().includes(search.toLowerCase()))
  );

  const handleRestore = async (id: string) => {
    setSaving(id);
    await restoreTask(id);
    setSaving(null);
    onRefresh();
  };

  const handlePermanentDelete = async (id: string) => {
    if (!confirm("Permanently delete this task? This cannot be undone.")) return;
    setSaving(id);
    await deleteTaskAction(id);
    setSaving(null);
    onRefresh();
  };

  const handleBulkRestore = async () => {
    for (const id of selected) {
      await restoreTask(id);
    }
    setSelected(new Set());
    onRefresh();
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Permanently delete ${selected.size} archived tasks? This cannot be undone.`)) return;
    for (const id of selected) {
      await deleteTaskAction(id);
    }
    setSelected(new Set());
    onRefresh();
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <div className="p-3 border-b border-slate-100">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Archive size={16} className="text-slate-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Archive</h3>
            <span className="text-[10px] text-slate-400">{archived.length} tasks</span>
          </div>
          <div className="flex items-center gap-2">
            {selected.size > 0 && (
              <>
                <button onClick={handleBulkRestore} className="text-xs px-2 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-1">
                  <RotateCcw size={12} /> Restore ({selected.size})
                </button>
                <button onClick={handleBulkDelete} className="text-xs px-2 py-1 rounded-md bg-red-50 text-red-700 hover:bg-red-100 flex items-center gap-1">
                  <Trash2 size={12} /> Delete ({selected.size})
                </button>
              </>
            )}
            <div className="relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search archive..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="text-xs border border-slate-200 rounded pl-6 pr-2 py-1 w-48 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
          </div>
        </div>
      </div>

      {archived.length === 0 ? (
        <div className="py-10 text-center">
          <Archive size={24} className="mx-auto text-slate-300 mb-2" />
          <p className="text-xs text-slate-400">No archived tasks</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
          {archived.map((task) => (
            <div key={task.id} className={`flex items-center gap-3 px-3 py-2 hover:bg-slate-50 transition-colors ${saving === task.id ? "opacity-50" : ""}`}>
              <input
                type="checkbox"
                checked={selected.has(task.id)}
                onChange={() => setSelected((s) => { const n = new Set(s); n.has(task.id) ? n.delete(task.id) : n.add(task.id); return n; })}
                className="rounded shrink-0"
              />
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSelect(task)}>
                <span className="text-xs text-slate-700 truncate block">{task.taskDescription}</span>
                <span className="text-[10px] text-slate-400">
                  {task.assignee || "Unassigned"} &middot; {task.progress}
                </span>
              </div>
              <button
                onClick={() => handleRestore(task.id)}
                disabled={saving === task.id}
                className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                title="Restore"
              >
                <RotateCcw size={14} />
              </button>
              <button
                onClick={() => handlePermanentDelete(task.id)}
                disabled={saving === task.id}
                className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                title="Permanently delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
