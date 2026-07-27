"use client";

import { useState } from "react";
import { X, Check, Loader2 } from "lucide-react";
import { TaskRecord, Progress } from "@/lib/types";
import { updateTask } from "@/app/actions/teable";
import { computeRisk, riskColor } from "@/lib/risk";
import { isOverdue } from "@/lib/filters";

interface Props {
  task: TaskRecord | null;
  onClose: () => void;
  onUpdated: () => void;
}

export default function TaskSidePanel({ task, onClose, onUpdated }: Props) {
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [form, setForm] = useState<Record<string, unknown>>({});

  if (!task) return null;

  const dirty = Object.keys(form).length > 0;
  const risk = computeRisk(task);

  const handleChange = (field: string, value: unknown) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await updateTask(task.id, form);
    setSaving(false);
    if (res.ok) {
      setFeedback("Saved");
      setForm({});
      setTimeout(() => { setFeedback(""); onUpdated(); }, 1500);
    } else {
      setFeedback("Error saving");
    }
  };

  const handleCancel = () => {
    setForm({});
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
        <h2 className="text-sm font-semibold text-slate-800 truncate">{task.taskDescription}</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-0.5">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {field("Task Description", task.taskDescription, "taskDescription")}
        {field("Task Summary", task.taskSummary, "taskSummary")}
        {field("Assignee", task.assignee, "assignee")}
        {field("Progress", task.progress, "progress", "select", ["Not Started", "In Progress", "Completed"])}
        {field("Priority", task.priority, "priority", "select", ["Critical", "High", "Medium", "Low"])}
        {field("Project", task.project, "project")}
        {field("Milestone", task.milestone, "milestone")}
        {field("Estimated Effort (hrs)", task.estimatedEffort, "estimatedEffort", "number")}

        <div className={`px-4 py-2 ${"important" in form ? "bg-amber-50 -mx-1 px-5 rounded border border-amber-200" : ""}`}>
          <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Important</label>
          <div className="mt-0.5">
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={"important" in form ? form.important as boolean : task.important}
                onChange={(e) => handleChange("important", e.target.checked)}
                className="rounded"
              />
              Flagged as important
            </label>
          </div>
        </div>

        <div className={`px-4 py-2 ${"blocked" in form ? "bg-amber-50 -mx-1 px-5 rounded border border-amber-200" : ""}`}>
          <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Blocked</label>
          <div className="mt-0.5">
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={"blocked" in form ? form.blocked as boolean : task.blocked}
                onChange={(e) => handleChange("blocked", e.target.checked)}
                className="rounded"
              />
              Task is blocked
            </label>
          </div>
        </div>

        {"blocked" in form && form.blocked ? (
          field("Blocked Reason", task.blockedReason, "blockedReason")
        ) : !("blocked" in form) && task.blocked ? (
          field("Blocked Reason", task.blockedReason, "blockedReason")
        ) : null}

        {field("Start Date", task.startDate || "", "startDate", "date")}
        {field("Expected Completion Date", task.expectedCompletionDate || "", "expectedCompletionDate", "date")}
        {field("Actual Completion Date", task.actualCompletionDate || "", "actualCompletionDate", "date")}
        {field("Latest Progress Update", task.latestProgressUpdate, "latestProgressUpdate")}
        {field("Notes", task.notes, "notes")}

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
            {task.progress === "Completed" ? (
              <span className="text-emerald-600">&check; Completed {task.actualCompletionDate ? `on ${new Date(task.actualCompletionDate).toLocaleDateString()}` : ""}</span>
            ) : isOverdue(task) ? (
              <span className="text-red-600">Overdue (due {task.expectedCompletionDate ? new Date(task.expectedCompletionDate).toLocaleDateString() : "—"})</span>
            ) : (
              <span className="text-slate-400">{task.progress}</span>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 px-4 py-3 flex items-center justify-between gap-2">
        <div className="text-xs">
          {feedback && (
            <span className={feedback === "Saved" ? "text-emerald-600" : "text-red-600"}>
              {feedback === "Saved" ? <Check size={14} className="inline mr-0.5" /> : null}
              {feedback}
            </span>
          )}
        </div>
        <div className="flex gap-2">
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
