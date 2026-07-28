"use client";

import { useState, useEffect } from "react";
import { X, Check, Loader2, Trash2 } from "lucide-react";
import { TaskRecord, Progress } from "@/lib/types";
import { updateTask, deleteTaskAction } from "@/app/actions/teable";
import { computeRisk, riskColor } from "@/lib/risk";
import { isOverdue } from "@/lib/filters";

interface Props {
  task: TaskRecord | null;
  onClose: () => void;
  onUpdated: () => void;
}

export default function TaskSidePanel({ task, onClose, onUpdated }: Props) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [localTask, setLocalTask] = useState(task);

  useEffect(() => { setLocalTask(task); }, [task]);

  if (!task) return null;

  const t = localTask ?? task;
  const dirty = Object.keys(form).length > 0;
  const risk = computeRisk(t);

  const handleChange = (field: string, value: unknown) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await updateTask(task.id, form);
    setSaving(false);
    if (res.ok) {
      setFeedback("Saved");
      setLocalTask((prev) => prev ? { ...prev, ...form } : prev);
      setForm({});
      setTimeout(() => { setFeedback(""); onUpdated(); }, 1500);
    } else {
      setFeedback("Error saving");
    }
  };

  const handleCancel = () => {
    setForm({});
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${task.taskDescription}"? This cannot be undone.`)) return;
    setDeleting(true);
    const res = await deleteTaskAction(task.id);
    if (res.ok) {
      onClose();
      onUpdated();
    } else {
      setFeedback("Error deleting");
      setDeleting(false);
    }
  };

  const field = (label: string, value: string | number | boolean | null, fieldName: string, type: "text" | "date" | "select" | "number" = "text", options?: string[]) => {
    const isDirty = fieldName in form;
    const currentValue = fieldName in form ? form[fieldName] : value;

    return (
      <div className={`px-4 py-2 ${isDirty ? "bg-amber-50 -mx-1 px-5 rounded border border-amber-200" : ""}`}>
        <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{label}</label>
        {type === "select" && options ? (
          <select
            value={String(currentValue ?? "")}
            onChange={(e) => handleChange(fieldName, e.target.value)}
            className="w-full text-xs border-0 bg-transparent p-0 focus:outline-none focus:ring-0 mt-0.5 text-slate-800"
          >
            {options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : type === "date" ? (
          <input
            type="date"
            value={String(currentValue ?? "")}
            onChange={(e) => handleChange(fieldName, e.target.value || null)}
            className="w-full text-xs border-0 bg-transparent p-0 focus:outline-none focus:ring-0 mt-0.5 text-slate-800"
          />
        ) : type === "number" ? (
          <input
            type="number"
            value={String(currentValue ?? 0)}
            onChange={(e) => handleChange(fieldName, parseFloat(e.target.value) || 0)}
            className="w-full text-xs border-0 bg-transparent p-0 focus:outline-none focus:ring-0 mt-0.5 text-slate-800"
          />
        ) : (
          type === "text" && typeof value === "string" ? (
            <textarea
              value={String(currentValue ?? "")}
              onChange={(e) => handleChange(fieldName, e.target.value)}
              rows={2}
              className="w-full text-xs border-0 bg-transparent p-0 focus:outline-none focus:ring-0 mt-0.5 text-slate-800 resize-none"
            />
          ) : (
            <input
              type="text"
              value={String(currentValue ?? "")}
              onChange={(e) => handleChange(fieldName, e.target.value)}
              className="w-full text-xs border-0 bg-transparent p-0 focus:outline-none focus:ring-0 mt-0.5 text-slate-800"
            />
          )
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-white shadow-xl border-l border-slate-200 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-800 truncate">{t.taskDescription}</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-0.5">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {field("Task Description", t.taskDescription, "taskDescription")}
        {field("Task Summary", t.taskSummary, "taskSummary")}
        {field("Assignee", t.assignee, "assignee")}
        {field("Progress", t.progress, "progress", "select", ["Not Started", "In Progress", "Completed"])}

        <div className={`px-4 py-2 ${"important" in form ? "bg-amber-50 -mx-1 px-5 rounded border border-amber-200" : ""}`}>
          <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Important</label>
          <div className="mt-0.5">
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={"important" in form ? form.important as boolean : t.important}
                onChange={(e) => handleChange("important", e.target.checked)}
                className="rounded"
              />
              Flagged as important
            </label>
          </div>
        </div>

        {field("Start Date", t.startDate || "", "startDate", "date")}
        {field("Expected Completion Date", t.expectedCompletionDate || "", "expectedCompletionDate", "date")}
        {field("Actual Completion Date", t.actualCompletionDate || "", "actualCompletionDate", "date")}
        {field("Latest Progress Update", t.latestProgressUpdate, "latestProgressUpdate")}
        {field("Notes", t.notes, "notes")}

        <div className="px-4 py-2">
          <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Risk Assessment</label>
          <div className="mt-1 space-y-0.5">
            <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded border ${riskColor(risk.level)}`}>
              {risk.level} ({risk.score})
            </span>
            {risk.factors.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {risk.factors.map((f, i) => (
                  <span key={i} className="text-[10px] text-slate-500 bg-slate-50 rounded px-1 py-0.5">{f}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-4 py-2">
          <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Status</label>
          <div className="mt-0.5 flex items-center gap-2 text-xs">
            {t.progress === "Completed" ? (
              <span className="text-emerald-600">&check; Completed {t.actualCompletionDate ? `on ${new Date(t.actualCompletionDate).toLocaleDateString()}` : ""}</span>
            ) : isOverdue(t) ? (
              <span className="text-red-600">Overdue (due {t.expectedCompletionDate ? new Date(t.expectedCompletionDate).toLocaleDateString() : "—"})</span>
            ) : (
              <span className="text-slate-400">{t.progress}</span>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 px-4 py-3 flex items-center justify-between gap-2">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs px-2 py-1.5 rounded-md text-red-600 hover:bg-red-50 flex items-center gap-1 disabled:opacity-50"
        >
          {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
          Delete
        </button>
        <div className="flex items-center gap-2">
          <div className="text-xs">
            {feedback && (
              <span className={feedback === "Saved" ? "text-emerald-600" : "text-red-600"}>
                {feedback === "Saved" ? <Check size={14} className="inline mr-0.5" /> : null}
                {feedback}
              </span>
            )}
          </div>
          {dirty && (
            <button
              onClick={handleCancel}
              className="text-xs px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="text-xs px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
