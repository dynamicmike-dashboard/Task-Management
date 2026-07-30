"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, X, Edit3, Trash2, ChevronRight, FolderDown, GripVertical } from "lucide-react";
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

function saveProjectsLocal(projects: Project[]) {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export default function ProjectTabs({ tasks, selectedProject, onSelectProject, onProjectsChange }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showManager, setShowManager] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#3b82f6");
  const [editParentId, setEditParentId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  useEffect(() => {
    setProjects(loadProjects());
  }, []);

  useEffect(() => {
    onProjectsChange(projects);
  }, [projects]);

  const rootProjects = useMemo(() =>
    projects.filter((p) => !p.parentId).sort((a, b) => a.sortOrder - b.sortOrder),
    [projects]
  );

  const getChildren = (parentId: string) =>
    projects.filter((p) => p.parentId === parentId).sort((a, b) => a.sortOrder - b.sortOrder);

  const getFullPath = (projectId: string): string => {
    const parts: string[] = [];
    let id: string | null = projectId;
    while (id) {
      const p = projects.find((pr) => pr.id === id);
      if (!p) break;
      parts.unshift(p.name);
      id = p.parentId;
    }
    return parts.join(" > ");
  };

  const getProjectColor = (projectId: string): string => {
    const p = projects.find((pr) => pr.id === projectId);
    return p?.color || "#94a3b8";
  };

  const getDescendantIds = (parentId: string): string[] => {
    const ids: string[] = [parentId];
    for (const child of getChildren(parentId)) {
      ids.push(...getDescendantIds(child.id));
    }
    return ids;
  };

  const taskCount = (projectId: string) => {
    const descendantIds = getDescendantIds(projectId);
    return tasks.filter((t) => descendantIds.includes(t.project || "none")).length;
  };

  const handleEditStart = (p?: Project) => {
    if (p) {
      setEditId(p.id);
      setEditName(p.name);
      setEditColor(p.color);
      setEditParentId(p.parentId);
    } else {
      setEditId(null);
      setEditName("");
      setEditColor("#3b82f6");
      setEditParentId(null);
    }
  };

  const handleSave = () => {
    if (!editName.trim()) return;
    if (editId) {
      setProjects(projects.map((p) =>
        p.id === editId ? { ...p, name: editName.trim(), color: editColor, parentId: editParentId } : p
      ));
    } else {
      const newP: Project = {
        id: "proj_" + Date.now(),
        name: editName.trim(),
        color: editColor,
        parentId: editParentId,
        sortOrder: projects.filter((p) => p.parentId === editParentId).length,
      };
      setProjects([...projects, newP]);
    }
    setEditId(null);
    setEditName("");
    setEditColor("#3b82f6");
    setEditParentId(null);
  };

  const handleDelete = (id: string) => {
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    const childCount = getChildren(id).length;
    const msg = childCount > 0
      ? `Delete "${project.name}" and its ${childCount} sub-project(s)?`
      : `Delete "${project.name}"?`;
    if (!confirm(msg)) return;
    const idsToRemove = new Set([id, ...getDescendantIds(id).filter((did) => did !== id)]);
    setProjects(projects.filter((p) => !idsToRemove.has(p.id)));
    if (selectedProject && idsToRemove.has(selectedProject)) {
      onSelectProject(null);
    }
  };

  const moveUp = (id: string) => {
    setProjects((prev) => {
      const p = prev.find((pr) => pr.id === id);
      if (!p) return prev;
      const siblings = prev.filter((pr) => pr.parentId === p.parentId).sort((a, b) => a.sortOrder - b.sortOrder);
      const idx = siblings.findIndex((s) => s.id === id);
      if (idx <= 0) return prev;
      const newOrder = [...siblings];
      [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
      return prev.map((pr) => {
        const ni = newOrder.findIndex((n) => n.id === pr.id);
        return ni >= 0 ? { ...pr, sortOrder: ni } : pr;
      });
    });
  };

  const moveDown = (id: string) => {
    setProjects((prev) => {
      const p = prev.find((pr) => pr.id === id);
      if (!p) return prev;
      const siblings = prev.filter((pr) => pr.parentId === p.parentId).sort((a, b) => a.sortOrder - b.sortOrder);
      const idx = siblings.findIndex((s) => s.id === id);
      if (idx < 0 || idx >= siblings.length - 1) return prev;
      const newOrder = [...siblings];
      [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
      return prev.map((pr) => {
        const ni = newOrder.findIndex((n) => n.id === pr.id);
        return ni >= 0 ? { ...pr, sortOrder: ni } : pr;
      });
    });
  };

  const handleSyncToDb = async () => {
    setSyncing(true);
    setSyncMsg("");
    const res = await saveProjects(projects);
    if (res.ok) {
      setSyncMsg("Saved to database");
    } else {
      setSyncMsg("Sync failed: " + res.error);
    }
    setSyncing(false);
    setTimeout(() => setSyncMsg(""), 3000);
  };

  const handleLoadFromDb = async () => {
    setSyncing(true);
    setSyncMsg("");
    const res = await getProjects();
    if (res.projects.length > 0) {
      setProjects(res.projects);
      saveProjectsLocal(res.projects);
      setSyncMsg("Loaded from database");
    } else {
      setSyncMsg("No projects found in database");
    }
    setSyncing(false);
    setTimeout(() => setSyncMsg(""), 3000);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-0.5">
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
        {rootProjects.map((project) => (
          <TabButton
            key={project.id}
            project={project}
            isSelected={selectedProject === project.id}
            onClick={() => onSelectProject(project.id)}
            taskCount={taskCount(project.id)}
            childProjects={getChildren(project.id)}
            getChildren={getChildren}
            getProjectColor={getProjectColor}
            taskCountFn={taskCount}
            onSelectProject={onSelectProject}
          />
        ))}
        <button
          onClick={() => { handleEditStart(); setShowManager(true); }}
          className="flex items-center gap-0.5 px-2 py-1.5 text-xs text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded shrink-0"
          title="Manage projects"
        >
          <Plus size={12} /> Tab
        </button>
        <button
          onClick={() => setShowManager(!showManager)}
          className="flex items-center gap-0.5 px-2 py-1.5 text-xs text-slate-400 hover:text-slate-600 rounded shrink-0"
          title="Project settings"
        >
          <Edit3 size={11} />
        </button>
      </div>

      {/* Manager dialog */}
      {showManager && (
        <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-700">Manage Projects</h3>
            <div className="flex items-center gap-1">
              <button onClick={handleLoadFromDb} disabled={syncing} className="text-[10px] px-1.5 py-0.5 text-slate-500 hover:text-blue-600 rounded">
                Load from DB
              </button>
              <button onClick={handleSyncToDb} disabled={syncing} className="text-[10px] px-1.5 py-0.5 text-emerald-600 hover:bg-emerald-50 rounded">
                {syncing ? "..." : "Save to DB"}
              </button>
              {syncMsg && <span className="text-[10px] text-slate-400">{syncMsg}</span>}
              <button onClick={() => setShowManager(false)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
            </div>
          </div>

          {/* Add / Edit form */}
          <div className="flex items-center gap-2 flex-wrap">
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Project name..."
              className="flex-1 min-w-[120px] text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <input
              type="color"
              value={editColor}
              onChange={(e) => setEditColor(e.target.value)}
              className="w-7 h-7 p-0.5 border border-slate-200 rounded cursor-pointer"
            />
            <select
              value={editParentId ?? ""}
              onChange={(e) => setEditParentId(e.target.value || null)}
              className="text-xs border border-slate-200 rounded px-2 py-1.5 bg-white"
            >
              <option value="">Top level (no parent)</option>
              {projects.filter((p) => p.id !== editId).map((p) => (
                <option key={p.id} value={p.id}>{getFullPath(p.id)}</option>
              ))}
            </select>
            <button onClick={handleSave} className="text-xs px-2.5 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700">
              {editId ? "Update" : "Add"}
            </button>
            {editId && (
              <button onClick={() => handleEditStart()} className="text-xs px-2 py-1.5 text-slate-500 hover:text-slate-700 rounded border border-slate-200">
                Cancel
              </button>
            )}
          </div>

          {/* Project list */}
          {projects.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-0.5">
              {projects.sort((a, b) => a.sortOrder - b.sortOrder).map((p) => (
                <div key={p.id} className="flex items-center gap-1.5 text-xs py-1 px-1 rounded hover:bg-slate-50 group">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="text-slate-600 text-[10px]">{getFullPath(p.id)}</span>
                  <span className="text-[10px] text-slate-400 ml-auto">{taskCount(p.id)} tasks</span>
                  <button onClick={() => moveUp(p.id)} className="text-slate-300 hover:text-slate-600 opacity-0 group-hover:opacity-100" title="Move up">
                    <ChevronRight size={10} className="rotate-[-90deg]" />
                  </button>
                  <button onClick={() => moveDown(p.id)} className="text-slate-300 hover:text-slate-600 opacity-0 group-hover:opacity-100" title="Move down">
                    <ChevronRight size={10} className="rotate-90" />
                  </button>
                  <button onClick={() => { handleEditStart(p); }} className="text-slate-300 hover:text-blue-600 opacity-0 group-hover:opacity-100">
                    <Edit3 size={10} />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100">
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TabButton({
  project, isSelected, onClick, taskCount, childProjects, getChildren, getProjectColor, taskCountFn, onSelectProject,
}: {
  project: Project; isSelected: boolean; onClick: () => void; taskCount: number;
  childProjects: Project[]; getChildren: (id: string) => Project[];
  getProjectColor: (id: string) => string; taskCountFn: (id: string) => number;
  onSelectProject: (id: string | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative shrink-0">
      <button
        onClick={onClick}
        onContextMenu={(e) => { e.preventDefault(); setExpanded(!expanded); }}
        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-t-lg text-xs font-medium transition-all border border-b-0 ${
          isSelected
            ? "bg-white text-slate-800 shadow-sm border-slate-200"
            : "text-slate-500 hover:text-slate-700 hover:bg-slate-100 border-transparent"
        }`}
        style={isSelected ? { borderTopColor: project.color, borderTopWidth: "2px" } : {}}
      >
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
        <span className="truncate max-w-[100px]">{project.name}</span>
        <span className="text-[10px] text-slate-400 ml-0.5">({taskCount})</span>
        {childProjects.length > 0 && (
          <ChevronRight size={10} className={`text-slate-300 transition-transform ${expanded ? "rotate-90" : ""}`} />
        )}
      </button>
      {expanded && childProjects.length > 0 && (
        <div className="absolute top-full left-0 z-50 mt-0.5 bg-white border border-slate-200 rounded-lg shadow-lg p-1 min-w-[180px]">
          {childProjects.map((child) => (
            <div key={child.id}>
              <button
                onClick={() => { onSelectProject(child.id); setExpanded(false); }}
                className="flex items-center gap-1.5 w-full text-left px-2 py-1.5 text-xs rounded hover:bg-slate-50 text-slate-600"
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: child.color }} />
                <span className="flex-1 truncate">{child.name}</span>
                <span className="text-[10px] text-slate-400">{taskCountFn(child.id)}</span>
                {getChildren(child.id).length > 0 && <ChevronRight size={10} className="text-slate-300" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
