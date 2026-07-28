"use client";

import { useState, useEffect } from "react";
import { X, Check, Loader2, Settings } from "lucide-react";
import { DashboardSettings } from "@/lib/types";
import { getDashboardSettings, updateDashboardSettings } from "@/app/actions/teable";

export default function SettingsDialog() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<DashboardSettings | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getDashboardSettings().then((res) => {
      if (res.settings) {
        setSettings(res.settings);
        setForm({
          workspaceName: res.settings.workspaceName,
          clientName: res.settings.clientName,
          logoUrl: res.settings.logoUrl,
          accentColor: res.settings.accentColor,
        });
      }
      setLoading(false);
    });
  }, [open]);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    const res = await updateDashboardSettings(settings.id, form);
    setSaving(false);
    if (res.ok) {
      setFeedback("Saved");
      setTimeout(() => setFeedback(""), 2000);
    } else {
      setFeedback(res.error || "Error saving");
    }
  };

  const dirty = Object.keys(form).some((k) => form[k] !== (settings ? settings[k as keyof DashboardSettings] : ""));

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 flex items-center gap-1"
        title="Dashboard settings"
      >
        <Settings size={14} /> Settings
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/30">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-800">Dashboard Settings</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 p-0.5">
                <X size={16} />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={20} className="animate-spin text-slate-400" />
              </div>
            ) : !settings ? (
              <div className="py-8 text-center text-xs text-slate-400">No settings found</div>
            ) : (
              <div className="p-4 space-y-3">
                <Field label="Workspace Name" value={form.workspaceName} onChange={(v) => setForm((f) => ({ ...f, workspaceName: v }))} />
                <Field label="Client Name" value={form.clientName} onChange={(v) => setForm((f) => ({ ...f, clientName: v }))} />
                <Field label="Logo URL" value={form.logoUrl} onChange={(v) => setForm((f) => ({ ...f, logoUrl: v }))} />
                <div>
                  <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1">Accent Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.accentColor || "#2563eb"}
                      onChange={(e) => setForm((f) => ({ ...f, accentColor: e.target.value }))}
                      className="w-8 h-8 rounded cursor-pointer border border-slate-200"
                    />
                    <input
                      type="text"
                      value={form.accentColor || ""}
                      onChange={(e) => setForm((f) => ({ ...f, accentColor: e.target.value }))}
                      className="text-xs border border-slate-200 rounded px-2 py-1 flex-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-slate-100 px-4 py-3 flex items-center justify-between">
              <div className="text-xs">
                {feedback && (
                  <span className={feedback === "Saved" ? "text-emerald-600" : "text-red-600"}>
                    {feedback === "Saved" ? <Check size={14} className="inline mr-0.5" /> : null}
                    {feedback}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setOpen(false)} className="text-xs px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50">Close</button>
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
        </div>
      )}
    </>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
      />
    </div>
  );
}
