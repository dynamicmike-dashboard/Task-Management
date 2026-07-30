"use client";

import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { createTaskAction } from "@/app/actions/teable";
import { TaskRecord, Project } from "@/lib/types";

interface Props {
  onCreated: (task: TaskRecord) => void;
  initialDate?: string | null;
  onOpenChange?: (open: boolean) => void;
  projects?: Project[];
  selectedProject?: string | null;
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

export default function CreateTaskDialog({ onCreated, initialDate, onOpenChange, projects = [], selectedProject }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    taskDescription: "",
    taskSummary: "",
    assignee: "",
    expectedCompletionDate: "",
    project: "",
  });

  const handleSave = async () => {
    if (!form.taskDescription.trim()) return;
    setError("");
    setSaving(true);
    const fields: Record<string, unknown> = {
      taskDescription: form.taskDescription,
      taskSummary: form.taskSummary,
      assignee: form.assignee,
      progress: "Not Started",
    };
    if (form.expectedCompletionDate) {
      fields.expectedCompletionDate = form.expectedCompletionDate;
    }
    if (form.project) {
      fields.project = form.project;
    }
    const res = await createTaskAction(fields);
    setSaving(false);
    if (res.ok && res.record) {
      onCreated(res.record);
      setOpen(false);
      setError("");
      setForm({ taskDescription: "", taskSummary: "", assignee: "", expectedCompletionDate: "", project: "" });
      onOpenChange?.(false);
    } else {
      setError(res.error || "Failed to create task. Check console for details.");
    }
  };

  useEffect(() => {
    if (initialDate) {
      setForm((f) => ({ ...f, expectedCompletionDate: initialDate }));
      setOpenWrapped(true);
    }
  }, [initialDate]);

  const setOpenWrapped = (v: boolean) => {
    setOpen(v);
    onOpenChange?.(v);
  };

  const handleOpen = () => {
    setError("");
    const prefill: Record<string, string> = {};
    if (initialDate) prefill.expectedCompletionDate = initialDate;
    if (selectedProject) prefill.project = selectedProject;
    setForm((f) => ({ ...f, ...prefill }));
    setOpenWrapped(true);
  };

  const handleClose = () => setOpenWrapped(false);

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1.5 rounded-md transition-colors"
      >
        <Plus size={14} />
        New Task
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/30">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-lg mx-2">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-800">Create Task</h2>
              <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {error && <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">{error}</p>}
              <Input label="Task Description *" value={form.taskDescription} onChange={(v) => setForm({ ...form, taskDescription: v })} />
              <Input label="Task Summary" value={form.taskSummary} onChange={(v) => setForm({ ...form, taskSummary: v })} />
              <Input label="Assignee" value={form.assignee} onChange={(v) => setForm({ ...form, assignee: v })} />
              <Input label="Due Date" value={form.expectedCompletionDate} onChange={(v) => setForm({ ...form, expectedCompletionDate: v })} type="date" />
              {projects.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-0.5 block">Project</label>
                  <select
                    value={form.project}
                    onChange={(e) => setForm({ ...form, project: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                  >
                    <option value="">No project</option>
                    {projects.sort((a, b) => a.sortOrder - b.sortOrder).map((p) => (
                      <option key={p.id} value={p.id}>
                        {getFullPath(p.id, projects)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-slate-100">
              <button onClick={handleClose} className="text-xs px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.taskDescription.trim()} className="text-xs px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                {saving ? "Saving..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-500 mb-0.5 block">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400" />
    </div>
  );
}
