"use client";

import { useState, useEffect } from "react";
import { X, Check, Loader2, Trash2, Archive, RotateCcw, History, Circle, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { TaskRecord, Progress, ActivityRecord } from "@/lib/types";
import { updateTask, deleteTaskAction, archiveTask, restoreTask, getTaskActivity } from "@/app/actions/teable";
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
  const [activity, setActivity] = useState<ActivityRecord[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [showActivity, setShowActivity] = useState(false);

  useEffect(() => { setLocalTask(task); }, [task]);

  useEffect(() => {
    if (task && showActivity) {
      setActivityLoading(true);
      getTaskActivity(task.id).then((res) => {
        setActivity(res.records);
        setActivityLoading(false);
      });
    }
  }, [task, showActivity]);

  if (!task) return null;

  const t = localTask ?? task;
  const dirty = Object.keys(form).length > 0;
  const risk = computeRisk(t);

  const handleChange = (field: string, value: unknown) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setFeedback("");
    const res = await updateTask(task.id, form);
    setSaving(false);
    if (res.ok) {
      setFeedback("Saved");
      setLocalTask((prev) => prev ? { ...prev, ...form } : prev);
      setForm({});
      setTimeout(() => { setFeedback(""); onUpdated(); }, 1500);
    } else {
      setFeedback(res.error || "Error saving");
    }
  };

  const handleCancel = () => {
    setForm({});
  };

  const handleArchive = async () => {
    if (!confirm(`Archive "${task.taskDescription}"?`)) return;
    setDeleting(true);
    await archiveTask(task.id);
    setDeleting(false);
    onClose();
    onUpdated();
  };

  const handleRestore = async () => {
    setDeleting(true);
    await restoreTask(task.id);
    setDeleting(false);
    onClose();
    onUpdated();
  };

  const handlePermanentDelete = async () => {
    if (!confirm(`Permanently delete "${task.taskDescription}"? This cannot be undone.`)) return;
    setDeleting(true);
    await deleteTaskAction(task.id);
    setDeleting(false);
    onClose();
    onUpdated();
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
          <div className="flex items-center gap-2 mt-0.5">
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={typeof currentValue === "number" ? currentValue : 0}
              onChange={(e) => handleChange(fieldName, parseInt(e.target.value) || 0)}
              className="flex-1 h-1.5"
            />
            <input
              type="number"
              value={typeof currentValue === "number" ? currentValue : 0}
              onChange={(e) => handleChange(fieldName, parseFloat(e.target.value) || 0)}
              className="w-14 text-xs border border-slate-200 rounded px-1 py-0.5 text-center"
              min={0}
              max={100}
            />
          </div>
        ) : (
          <textarea
            value={String(currentValue ?? "")}
            onChange={(e) => handleChange(fieldName, e.target.value)}
            rows={typeof value === "string" && value.length > 80 ? 3 : 2}
            className="w-full text-xs border-0 bg-transparent p-0 focus:outline-none focus:ring-0 mt-0.5 text-slate-800 resize-none"
          />
        )}
      </div>
    );
  };

  const PriorityIcon = ({ p }: { p: string }) => {
    switch (p) {
      case "Critical": return <AlertTriangle size={10} className="text-red-500" />;
      case "High": return <AlertTriangle size={10} className="text-orange-500" />;
      case "Medium": return <Clock size={10} className="text-amber-500" />;
      default: return <Circle size={10} className="text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-white shadow-xl border-l border-slate-200 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-800 truncate flex items-center gap-1.5">
          {t.archived && <Archive size={14} className="text-slate-400" />}
          {t.taskDescription}
        </h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-0.5">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {field("Task Description", t.taskDescription, "taskDescription")}
        {field("Task Summary", t.taskSummary, "taskSummary")}
        {field("Assignee", t.assignee, "assignee")}
        {field("Progress", t.progress, "progress", "select", ["Not Started", "In Progress", "Completed"])}

        <div className="px-4 py-2">
          <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Priority</label>
          <div className="mt-0.5 flex items-center gap-2">
            {(["Critical", "High", "Medium", "Low"] as const).map((p) => (
              <button
                key={p}
                onClick={() => handleChange("priority", p)}
                className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 transition-colors ${
                  (form.priority ?? t.priority) === p
                    ? p === "Critical" ? "bg-red-50 border-red-300 text-red-700"
                      : p === "High" ? "bg-orange-50 border-orange-300 text-orange-700"
                      : p === "Medium" ? "bg-amber-50 border-amber-300 text-amber-700"
                      : "bg-slate-50 border-slate-300 text-slate-600"
                    : "border-slate-200 text-slate-400 hover:border-slate-300"
                }`}
              >
                <PriorityIcon p={p} /> {p}
              </button>
            ))}
          </div>
        </div>

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

        <div className={`px-4 py-2 ${("blocked" in form || "blockedReason" in form) ? "bg-amber-50 -mx-1 px-5 rounded border border-amber-200" : ""}`}>
          <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Blocked</label>
          <div className="mt-0.5 space-y-1.5">
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={"blocked" in form ? form.blocked as boolean : t.blocked}
                onChange={(e) => handleChange("blocked", e.target.checked)}
                className="rounded"
              />
              Task is blocked
            </label>
            {(form.blocked ?? t.blocked) && (
              <textarea
                value={String("blockedReason" in form ? form.blockedReason ?? "" : t.blockedReason ?? "")}
                onChange={(e) => handleChange("blockedReason", e.target.value)}
                placeholder="Reason for blocker..."
                rows={2}
                className="w-full text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
              />
            )}
          </div>
        </div>

        <div className="px-4 py-2">
          <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Percent Complete</label>
          <div className="mt-1">
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={typeof form.percentComplete === "number" ? form.percentComplete : t.percentComplete}
              onChange={(e) => handleChange("percentComplete", parseInt(e.target.value) || 0)}
              className="w-full h-1.5"
            />
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-[10px] text-slate-400">0%</span>
              <span className="text-xs font-medium text-slate-700">{typeof form.percentComplete === "number" ? form.percentComplete : t.percentComplete}%</span>
              <span className="text-[10px] text-slate-400">100%</span>
            </div>
            <div className="mt-1 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${typeof form.percentComplete === "number" ? form.percentComplete : t.percentComplete}%` }}
              />
            </div>
          </div>
        </div>

        <div className="px-4 py-2">
          <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Estimated / Actual Hours</label>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="number"
              value={typeof form.estimatedHours === "number" ? form.estimatedHours : t.estimatedHours}
              onChange={(e) => handleChange("estimatedHours", parseFloat(e.target.value) || 0)}
              className="w-full text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
              placeholder="Est."
              min={0}
              step={0.5}
            />
            <span className="text-xs text-slate-400">/</span>
            <input
              type="number"
              value={typeof form.actualHours === "number" ? form.actualHours : t.actualHours}
              onChange={(e) => handleChange("actualHours", parseFloat(e.target.value) || 0)}
              className="w-full text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
              placeholder="Actual"
              min={0}
              step={0.5}
            />
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
            {t.blocked && <span className="text-red-500 text-[10px] font-medium">Blocked</span>}
          </div>
        </div>

        {/* Activity History */}
        <div className="px-4 py-2">
          <button
            onClick={() => setShowActivity(!showActivity)}
            className="flex items-center gap-1 text-[10px] font-medium text-slate-400 uppercase tracking-wider hover:text-slate-600"
          >
            <History size={12} />
            Activity History
            <span className="text-slate-300 ml-1">{showActivity ? "▲" : "▼"}</span>
          </button>
          {showActivity && (
            <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
              {activityLoading ? (
                <div className="flex items-center justify-center py-3">
                  <Loader2 size={12} className="animate-spin text-slate-400" />
                </div>
              ) : activity.length === 0 ? (
                <p className="text-[10px] text-slate-400 py-2 text-center">No activity recorded yet</p>
              ) : (
                activity.map((a) => (
                  <div key={a.id} className="flex items-start gap-2 text-[10px] py-1 border-b border-slate-50 last:border-0">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${
                      a.action === "created" ? "bg-emerald-400" :
                      a.action === "archived" ? "bg-slate-400" :
                      a.action === "restored" ? "bg-blue-400" :
                      a.action === "deleted" ? "bg-red-400" :
                      "bg-amber-400"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-slate-600 capitalize">{a.action}</span>
                      {a.field && <span className="text-slate-400"> {a.field}</span>}
                      {a.oldValue && <span className="text-slate-400">: "{a.oldValue}" → "{a.newValue}"</span>}
                      {a.newValue && !a.oldValue && <span className="text-slate-400">: "{a.newValue}"</span>}
                    </div>
                    <span className="text-slate-300 shrink-0">
                      {a.timestamp ? new Date(a.timestamp).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-slate-100 px-4 py-3 flex items-center justify-between gap-2">
        {t.archived ? (
          <button
            onClick={handleRestore}
            disabled={deleting}
            className="text-xs px-2 py-1.5 rounded-md text-blue-600 hover:bg-blue-50 flex items-center gap-1 disabled:opacity-50"
          >
            {deleting ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
            Restore
          </button>
        ) : (
          <button
            onClick={handleArchive}
            disabled={deleting}
            className="text-xs px-2 py-1.5 rounded-md text-slate-500 hover:bg-slate-50 flex items-center gap-1 disabled:opacity-50"
          >
            {deleting ? <Loader2 size={12} className="animate-spin" /> : <Archive size={12} />}
            Archive
          </button>
        )}
        <div className="flex items-center gap-2">
          <div className="text-xs">
            {feedback && (
              <span className={feedback === "Saved" ? "text-emerald-600" : "text-red-600"}>
                {feedback === "Saved" ? <Check size={14} className="inline mr-0.5" /> : null}
                {feedback}
              </span>
            )}
          </div>
          {!t.archived && (
            <>
              {dirty && (
                <button onClick={handleCancel} className="text-xs px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</button>
              )}
              <button
                onClick={handleSave}
                disabled={!dirty || saving}
                className="text-xs px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
              >
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                Save
              </button>
              <button
                onClick={handlePermanentDelete}
                disabled={deleting}
                className="text-xs px-2 py-1.5 rounded-md text-red-600 hover:bg-red-50 flex items-center gap-1 disabled:opacity-50"
                title="Permanently delete"
              >
                {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
