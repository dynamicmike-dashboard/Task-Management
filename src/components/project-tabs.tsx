"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Plus, X, Edit3, Trash2, ChevronRight, MoreHorizontal, Check } from "lucide-react";
import { Project, TaskRecord } from "@/lib/types";
import { getProjects, saveProjects } from "@/app/actions/teable";

const PROJECTS_KEY = "task-projects";

interface Props {
  tasks: TaskRecord[];
  selectedProject: string | null;
  onSelectProject: (projectId: string | null) => void;
  onProjectsChange: (projects: Project[]) => void;
}

function loadProjects(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export default function ProjectTabs({ tasks, selectedProject, onSelectProject, onProjectsChange }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [managerOpen, setManagerOpen] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  useEffect(() => { setProjects(loadProjects()); }, []);
  useEffect(() => { onProjectsChange(projects); }, [projects]);
  useEffect(() => { saveProjectsLocal(projects); }, [projects]);

  const getChildren = (parentId: string) =>
    projects.filter((p) => p.parentId === parentId).sort((a, b) => a.sortOrder - b.sortOrder);

  const getAncestors = (id: string | null): Project[] => {
    if (!id) return [];
    const p = projects.find((pr) => pr.id === id);
    if (!p) return [];
    return [...getAncestors(p.parentId), p];
  };

  const getDescendantIds = (parentId: string): string[] => {
    const ids: string[] = [parentId];
    for (const child of getChildren(parentId)) ids.push(...getDescendantIds(child.id));
    return ids;
  };

  const taskCount = (projectId: string) => {
    const ids = getDescendantIds(projectId);
    return tasks.filter((t) => t.project && ids.includes(t.project)).length;
  };

  const selected = projects.find((p) => p.id === selectedProject);
  const ancestors = getAncestors(selectedProject);
  const activeChildren = selected ? getChildren(selected.id) : [];

  // --- CRUD ---
  const addProject = (parentId: string | null) => {
    const name = prompt("Project name:");
    if (!name?.trim()) return;
    setProjects((prev) => [...prev, {
      id: "proj_" + Date.now(), name: name.trim(), color: "#3b82f6",
      parentId, sortOrder: prev.filter((p) => p.parentId === parentId).length,
    }]);
  };

  const deleteProject = (id: string) => {
    const p = projects.find((pr) => pr.id === id);
    if (!p) return;
    const children = getDescendantIds(id).filter((d) => d !== id);
    const msg = children.length > 0
      ? `Delete "${p.name}" and ${children.length} sub-project(s)?`
      : `Delete "${p.name}"?`;
    if (!confirm(msg)) return;
    const remove = new Set([id, ...children]);
    setProjects((prev) => prev.filter((pr) => !remove.has(pr.id)));
    if (selectedProject && remove.has(selectedProject)) onSelectProject(null);
  };

  const renameProject = (id: string) => {
    if (!renameVal.trim()) return;
    setProjects((prev) => prev.map((p) => p.id === id ? { ...p, name: renameVal.trim() } : p));
    setRenameId(null);
  };

  const changeColor = (id: string) => {
    const p = projects.find((pr) => pr.id === id);
    if (!p) return;
    const color = prompt("Hex color (e.g. #ff0000):", p.color);
    if (!color?.trim()) return;
    setProjects((prev) => prev.map((pr) => pr.id === id ? { ...pr, color: color.trim() } : pr));
  };

  const handleSync = async () => {
    setSyncing(true); setSyncMsg("");
    const res = await saveProjects(projects);
    setSyncMsg(res.ok ? "Saved to DB" : "Failed: " + res.error);
    setSyncing(false);
    setTimeout(() => setSyncMsg(""), 3000);
  };

  const handleLoad = async () => {
    setSyncing(true); setSyncMsg("");
    const res = await getProjects();
    if (res.projects.length > 0) {
      setProjects(res.projects);
      setSyncMsg("Loaded from DB");
    } else setSyncMsg("No projects in DB");
    setSyncing(false);
    setTimeout(() => setSyncMsg(""), 3000);
  };

  const tabColor = (id: string) => projects.find((p) => p.id === id)?.color || "#94a3b8";

  if (projects.length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <button onClick={() => addProject(null)} className="flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50 hover:text-blue-600">
          <Plus size={12} /> Create your first project
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Row 1: Top-level tabs */}
      <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
        <button
          onClick={() => onSelectProject(null)}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-t-lg text-xs font-medium transition-all shrink-0 ${
            selectedProject === null
              ? "bg-white text-slate-800 shadow-sm border border-b-0 border-slate-200"
              : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          }`}
        >
          All Tasks
          <span className="text-[10px] text-slate-400 ml-0.5">({tasks.length})</span>
        </button>
        {projects.filter((p) => !p.parentId).sort((a, b) => a.sortOrder - b.sortOrder).map((p) => (
          <Tab key={p.id} project={p} selected={selectedProject === p.id}
            onClick={() => onSelectProject(p.id)}
            color={p.color} taskCount={taskCount(p.id)}
            hasChildren={getChildren(p.id).length > 0}
          />
        ))}
        <button onClick={() => addProject(null)} className="flex items-center gap-0.5 px-2 py-1.5 text-xs text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded shrink-0" title="Add top-level project">
          <Plus size={12} /> Tab
        </button>
      </div>

      {/* Row 2: Breadcrumb + sub-tabs */}
      {selectedProject && (
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-0.5">
          {/* Breadcrumb to parent */}
          {ancestors.length > 1 && ancestors.slice(0, -1).map((a) => (
            <button key={a.id} onClick={() => onSelectProject(a.id)}
              className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-blue-600 shrink-0"
            >
              <ChevronRight size={10} className="text-slate-300 -ml-0.5" />
              {a.name}
            </button>
          ))}
          {/* Active project label */}
          {selected && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-slate-600 shrink-0 mr-1">
              <ChevronRight size={10} className="text-slate-300 -ml-0.5" />
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: selected.color }} />
              {selected.name}
            </span>
          )}
          {/* Sub-project tabs */}
          {activeChildren.length > 0 && (
            <div className="flex items-center gap-0.5 ml-0.5 pl-1 border-l border-slate-200">
              {activeChildren.map((child) => (
                <Tab key={child.id} project={child} selected={selectedProject === child.id}
                  onClick={() => onSelectProject(child.id)}
                  color={child.color} taskCount={taskCount(child.id)}
                  hasChildren={getChildren(child.id).length > 0} small
                />
              ))}
              <button onClick={() => addProject(selectedProject!)}
                className="flex items-center gap-0.5 px-1.5 py-1 text-[10px] text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded shrink-0"
                title="Add sub-project"
              >
                <Plus size={10} />
              </button>
            </div>
          )}
          {/* Quick action buttons */}
          <div className="ml-auto flex items-center gap-0.5 shrink-0">
            {!activeChildren.length && (
              <button onClick={() => addProject(selectedProject!)}
                className="text-[10px] px-1.5 py-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded flex items-center gap-0.5"
              >
                <Plus size={10} /> Sub
              </button>
            )}
            <TabMenu projectId={selectedProject!} projects={projects}
              onRename={(id) => { setRenameId(id); setRenameVal(projects.find((p) => p.id === id)?.name || ""); }}
              onChangeColor={changeColor} onDelete={deleteProject} onAddSub={addProject}
            />
          </div>
        </div>
      )}

      {/* Inline rename */}
      {renameId && (
        <div className="flex items-center gap-1.5 p-1.5 bg-white border border-slate-200 rounded text-xs">
          <input value={renameVal} onChange={(e) => setRenameVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") renameProject(renameId); if (e.key === "Escape") setRenameId(null); }}
            className="flex-1 border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400" autoFocus
          />
          <button onClick={() => renameProject(renameId)} className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"><Check size={12} /></button>
          <button onClick={() => setRenameId(null)} className="px-2 py-1 text-slate-400 hover:text-slate-600"><X size={12} /></button>
        </div>
      )}

      {/* Manager toggle */}
      {managerOpen && (
        <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2 shadow-sm text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-700">All Projects</h3>
            <div className="flex items-center gap-1">
              <button onClick={handleLoad} disabled={syncing} className="text-[10px] px-1.5 py-0.5 text-slate-500 hover:text-blue-600 rounded">Load DB</button>
              <button onClick={handleSync} disabled={syncing} className="text-[10px] px-1.5 py-0.5 text-emerald-600 hover:bg-emerald-50 rounded">{syncing ? "..." : "Save DB"}</button>
              {syncMsg && <span className="text-[10px] text-slate-400">{syncMsg}</span>}
              <button onClick={() => setManagerOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
            </div>
          </div>
          {projects.sort((a, b) => a.sortOrder - b.sortOrder).map((p) => (
            <div key={p.id} className="flex items-center gap-1.5 py-0.5 group">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
              <span className="text-slate-600 text-[10px]">{getAncestors(p.id).map((a) => a.name).join(" > ")}</span>
              <span className="text-[10px] text-slate-400 ml-auto">{taskCount(p.id)} tasks</span>
              <button onClick={() => { setRenameId(p.id); setRenameVal(p.name); }} className="text-slate-300 hover:text-blue-600 opacity-0 group-hover:opacity-100"><Edit3 size={10} /></button>
              <button onClick={() => deleteProject(p.id)} className="text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100"><Trash2 size={10} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Manager toggle button */}
      <div className="flex items-center gap-1">
        {projects.length > 0 && (
          <button onClick={() => setManagerOpen(!managerOpen)}
            className="text-[10px] text-slate-400 hover:text-slate-600 px-1 py-0.5 rounded"
          >
            {managerOpen ? "Close manager" : "Project manager..."}
          </button>
        )}
      </div>
    </div>
  );
}

function saveProjectsLocal(projects: Project[]) {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

// Simple tab pill
function Tab({ project, selected, onClick, color, taskCount, hasChildren, small }: {
  project: Project; selected: boolean; onClick: () => void; color: string;
  taskCount: number; hasChildren: boolean; small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 rounded-t-lg font-medium transition-all shrink-0 whitespace-nowrap ${
        small ? "text-[10px] px-1.5 py-1" : "text-xs px-2.5 py-1.5"
      } ${
        selected
          ? "bg-white text-slate-800 shadow-sm border border-b-0 border-slate-200"
          : "text-slate-400 hover:text-slate-600 hover:bg-slate-100 border border-b-0 border-transparent"
      }`}
      style={selected ? { borderTopColor: color, borderTopWidth: "2px" } : {}}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="truncate max-w-[80px]">{project.name}</span>
      <span className="text-[10px] text-slate-400 ml-0.5">({taskCount})</span>
      {hasChildren && <ChevronRight size={10} className="text-slate-300 ml-0.5" />}
    </button>
  );
}

// Dropdown menu for a project tab
function TabMenu({ projectId, projects, onRename, onChangeColor, onDelete, onAddSub }: {
  projectId: string; projects: Project[];
  onRename: (id: string) => void; onChangeColor: (id: string) => void;
  onDelete: (id: string) => void; onAddSub: (parentId: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className="text-slate-300 hover:text-slate-600 p-0.5 rounded hover:bg-slate-100" title="Project actions"
      >
        <MoreHorizontal size={12} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-0.5 bg-white border border-slate-200 rounded-lg shadow-lg p-0.5 min-w-[130px] text-xs" onClick={() => setOpen(false)}>
          <button onClick={() => onAddSub(projectId)} className="w-full flex items-center gap-1.5 px-2 py-1.5 hover:bg-slate-50 rounded text-slate-600">
            <Plus size={10} /> Add sub-project
          </button>
          <button onClick={() => onRename(projectId)} className="w-full flex items-center gap-1.5 px-2 py-1.5 hover:bg-slate-50 rounded text-slate-600">
            <Edit3 size={10} /> Rename
          </button>
          <button onClick={() => onChangeColor(projectId)} className="w-full flex items-center gap-1.5 px-2 py-1.5 hover:bg-slate-50 rounded text-slate-600">
            <div className="w-2.5 h-2.5 rounded-full border border-slate-300" style={{ backgroundColor: projects.find((p) => p.id === projectId)?.color }} />
            Color
          </button>
          <button onClick={() => onDelete(projectId)} className="w-full flex items-center gap-1.5 px-2 py-1.5 hover:bg-red-50 rounded text-red-600">
            <Trash2 size={10} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
