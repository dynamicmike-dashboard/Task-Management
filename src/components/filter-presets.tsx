"use client";

import { useState, useEffect } from "react";
import { Bookmark, X } from "lucide-react";
import { FilterState } from "@/lib/types";

const STORAGE_KEY = "task-dashboard-presets";

interface Preset {
  id: string;
  name: string;
  filters: FilterState;
}

interface Props {
  filters: FilterState;
  onApply: (filters: FilterState) => void;
}

export default function FilterPresets({ filters, onApply }: Props) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPresets(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const save = () => {
    if (!name.trim()) return;
    const next: Preset = { id: Date.now().toString(), name: name.trim(), filters: { ...filters } };
    const updated = [...presets, next];
    setPresets(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setName("");
    setSaving(false);
  };

  const remove = (id: string) => {
    const updated = presets.filter((p) => p.id !== id);
    setPresets(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const hasActive = filters.progress.length > 0 || filters.assignee.length > 0 || filters.important !== null || filters.overdue !== null || filters.priority.length > 0 || filters.blocked !== null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {presets.map((p) => (
        <span key={p.id} className="inline-flex items-center gap-0.5 text-xs bg-slate-100 text-slate-600 rounded px-1.5 py-0.5 group">
          <button onClick={() => onApply(p.filters)} className="hover:text-blue-600">
            <Bookmark size={10} className="inline mr-0.5" />
            {p.name}
          </button>
          <button onClick={() => remove(p.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500">
            <X size={10} />
          </button>
        </span>
      ))}
      {hasActive && (
        <span className="relative inline-flex items-center">
          {saving ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setSaving(false); }}
              placeholder="Preset name..."
              className="w-24 text-[10px] border border-slate-200 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
              autoFocus
            />
          ) : (
            <button onClick={() => setSaving(true)} className="text-[10px] text-slate-400 hover:text-blue-600 flex items-center gap-0.5">
              <Bookmark size={10} />
              Save filters
            </button>
          )}
        </span>
      )}
    </div>
  );
}
