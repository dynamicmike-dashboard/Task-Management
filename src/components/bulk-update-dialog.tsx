"use client";

import { useState } from "react";
import { CheckSquare, X } from "lucide-react";
import { TaskRecord, Progress } from "@/lib/types";
import { updateTask } from "@/app/actions/teable";

interface Props {
  selected: Set<string>;
  tasks: TaskRecord[];
  onDone: () => void;
  onClear: () => void;
}

export default function BulkUpdateDialog({ selected, tasks, onDone, onClear }: Props) {
  const [progress, setProgress] = useState<Progress | "">("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const count = selected.size;
  if (count === 0) return null;

  const handleApply = async () => {
    if (!progress) return;
    setSaving(true);
    let ok = 0;
    let err = 0;
    for (const id of selected) {
      const res = await updateTask(id, { progress });
      if (res.ok) ok++;
      else err++;
    }
    setSaving(false);
    setMessage(`${ok} updated${err > 0 ? `, ${err} failed` : ""}`);
    setTimeout(() => { setMessage(""); onDone(); }, 2000);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-slate-500">
        <CheckSquare size={14} className="inline mr-0.5" />
        {count} selected
      </span>
      <select
        value={progress}
        onChange={(e) => setProgress(e.target.value as Progress)}
        className="text-xs border border-slate-200 rounded px-1.5 py-1 bg-white"
      >
        <option value="">Set progress...</option>
        <option value="Not Started">Not Started</option>
        <option value="In Progress">In Progress</option>
        <option value="Completed">Completed</option>
      </select>
      <button
        onClick={handleApply}
        disabled={!progress || saving}
        className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? "Applying..." : "Apply"}
      </button>
      <button
        onClick={onClear}
        className="text-xs px-2 py-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-50"
      >
        <X size={12} className="inline mr-0.5" />
        Clear
      </button>
      {message && <span className="text-xs text-emerald-600">{message}</span>}
    </div>
  );
}
