"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { createTaskAction } from "@/app/actions/teable";
import { TaskRecord } from "@/lib/types";

interface Props {
  onCreated: (task: TaskRecord) => void;
}

export default function CreateTaskDialog({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    taskDescription: "",
    taskSummary: "",
    assignee: "",
    priority: "Medium" as TaskRecord["priority"],
    project: "",
    milestone: "",
    estimatedEffort: 0,
  });

  const handleSave = async () => {
    if (!form.taskDescription.trim()) return;
    setSaving(true);
    const res = await createTaskAction({
      taskDescription: form.taskDescription,
      taskSummary: form.taskSummary,
      assignee: form.assignee,
      priority: form.priority,
      project: form.project,
      milestone: form.milestone,
      estimatedEffort: form.estimatedEffort,
      progress: "Not Started",
    });
    setSaving(false);
    if (res.ok && res.record) {
      onCreated(res.record);
      setOpen(false);
      setForm({ taskDescription: "", taskSummary: "", assignee: "", priority: "Medium", project: "", milestone: "", estimatedEffort: 0 });
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
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
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <Input label="Task Description *" value={form.taskDescription} onChange={(v) => setForm({ ...form, taskDescription: v })} />
              <Input label="Task Summary" value={form.taskSummary} onChange={(v) => setForm({ ...form, taskSummary: v })} />
              <Input label="Assignee" value={form.assignee} onChange={(v) => setForm({ ...form, assignee: v })} />
              <div className="grid grid-cols-2 gap-3">
                <Select label="Priority" value={form.priority} options={["Critical", "High", "Medium", "Low"]} onChange={(v) => setForm({ ...form, priority: v as TaskRecord["priority"] })} />
                <Input label="Project" value={form.project} onChange={(v) => setForm({ ...form, project: v })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Milestone" value={form.milestone} onChange={(v) => setForm({ ...form, milestone: v })} />
                <Input label="Est. Effort (hrs)" type="number" value={String(form.estimatedEffort)} onChange={(v) => setForm({ ...form, estimatedEffort: parseFloat(v) || 0 })} />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-slate-100">
              <button onClick={() => setOpen(false)} className="text-xs px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</button>
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

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-500 mb-0.5 block">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
