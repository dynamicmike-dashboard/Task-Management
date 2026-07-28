"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  DndContext, DragOverlay, closestCorners, PointerSensor, TouchSensor,
  useSensor, useSensors, type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, X, MoreHorizontal, GripVertical, Check, Trash2, Edit3 } from "lucide-react";
import { TaskRecord } from "@/lib/types";
import { updateTask, archiveTask, createTaskAction } from "@/app/actions/teable";
import { isOverdue } from "@/lib/filters";

const COLUMNS = [
  { key: "Not Started" as const, label: "Not Started", color: "border-t-slate-400" },
  { key: "In Progress" as const, label: "In Progress", color: "border-t-blue-500" },
  { key: "Completed" as const, label: "Completed", color: "border-t-emerald-500" },
];

const CARD_COLORS = [
  { id: "slate", bg: "bg-slate-50", border: "border-slate-200" },
  { id: "blue", bg: "bg-blue-50", border: "border-blue-200" },
  { id: "amber", bg: "bg-amber-50", border: "border-amber-200" },
  { id: "red", bg: "bg-red-50", border: "border-red-200" },
  { id: "emerald", bg: "bg-emerald-50", border: "border-emerald-200" },
  { id: "purple", bg: "bg-purple-50", border: "border-purple-200" },
];

const STORAGE_ORDER_KEY = "kanban-card-order";
const STORAGE_COLOR_KEY = "kanban-card-colors";
const STORAGE_LABELS_KEY = "kanban-labels";
const STORAGE_TASK_LABELS_KEY = "kanban-task-labels";

interface KanbanLabel {
  id: string;
  title: string;
  color: string;
}

interface Props {
  tasks: TaskRecord[];
  onSelect: (task: TaskRecord) => void;
  onRefresh: () => void;
}

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function SortableCard({
  task, color, labels, onSelect, onDelete, onColorChange, onQuickMove,
}: {
  task: TaskRecord; color: string; labels: KanbanLabel[];
  onSelect: () => void; onDelete: () => void;
  onColorChange: (color: string) => void; onQuickMove: (progress: TaskRecord["progress"]) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const [menuOpen, setMenuOpen] = useState(false);
  const overdue = isOverdue(task);
  const taskLabels = loadJson<string[]>(STORAGE_TASK_LABELS_KEY, []);
  const assignedLabels = labels.filter((l) => taskLabels.includes(l.id));

  return (
    <div
      ref={setNodeRef} style={style}
      className={`rounded-md border-l-2 ${task.blocked ? "border-l-red-500" : overdue ? "border-l-red-400" : task.important ? "border-l-amber-400" : "border-l-slate-300"} border ${color} bg-white shadow-sm text-xs ${
        isDragging ? "opacity-50 z-50 shadow-lg rotate-2" : ""
      }`}
    >
      <div className="flex items-start gap-1 p-2">
        <button {...attributes} {...listeners} className="text-slate-300 hover:text-slate-500 mt-0.5 cursor-grab active:cursor-grabbing touch-none" title="Drag to reorder">
          <GripVertical size={12} />
        </button>
        <div className="flex-1 min-w-0" onClick={onSelect}>
          <div className="flex items-center gap-1">
            {task.priority === "Critical" && <span className="text-[9px] font-bold text-red-600">CRT</span>}
            {task.priority === "High" && <span className="text-[9px] font-medium text-orange-600">HI</span>}
            {task.blocked && <span className="text-[9px] font-medium text-red-500">BLOCKED</span>}
          </div>
          <div className="font-medium text-slate-800 truncate">{task.taskDescription}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {task.assignee && <span>{task.assignee}</span>}
            {task.expectedCompletionDate && (
              <span> &middot; Due {new Date(task.expectedCompletionDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
            )}
          </div>
          {task.percentComplete > 0 && (
            <div className="mt-1 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-blue-400" style={{ width: `${task.percentComplete}%` }} />
            </div>
          )}
          {task.latestProgressUpdate && (
            <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{task.latestProgressUpdate}</div>
          )}
          {assignedLabels.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {assignedLabels.map((l) => (
                <span key={l.id} className="text-[9px] px-1 py-0.5 rounded" style={{ backgroundColor: l.color + "30", color: l.color }}>{l.title}</span>
              ))}
            </div>
          )}
        </div>
        <div className="relative shrink-0">
          <button onClick={() => setMenuOpen(!menuOpen)} className="text-slate-300 hover:text-slate-500 p-0.5"><MoreHorizontal size={12} /></button>
          {menuOpen && (
            <div className="absolute right-0 top-5 z-30 bg-white border border-slate-200 rounded-md shadow-lg w-40 text-xs" onClick={() => setMenuOpen(false)}>
              <div className="p-1 border-b border-slate-100">
                <span className="text-[10px] text-slate-400 px-1">Move to</span>
                {COLUMNS.filter((c) => c.key !== task.progress).map((c) => (
                  <button key={c.key} onClick={() => onQuickMove(c.key)} className="w-full text-left px-2 py-1 hover:bg-slate-50 rounded text-slate-700">{c.label}</button>
                ))}
              </div>
              <div className="p-1">
                <span className="text-[10px] text-slate-400 px-1">Color</span>
                <div className="flex gap-0.5 px-1 py-1 flex-wrap">
                  {CARD_COLORS.map((c) => (
                    <button key={c.id} onClick={() => onColorChange(c.id)} className={`w-4 h-4 rounded-full ${c.bg} border ${c.border} hover:scale-110`} title={c.id} />
                  ))}
                </div>
              </div>
              <div className="border-t border-slate-100 p-1">
                <button onClick={onDelete} className="w-full flex items-center gap-1 px-2 py-1 hover:bg-slate-50 rounded text-slate-600"><Trash2 size={10} /> Archive</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function KanbanBoard({ tasks, onSelect, onRefresh }: Props) {
  const [localTasks, setLocalTasks] = useState<TaskRecord[]>(tasks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ taskDescription: "", assignee: "" });
  const [saving, setSaving] = useState(false);
  const [newColumn, setNewColumn] = useState<TaskRecord["progress"]>("Not Started");

  const displayTasks = localTasks.length > 0 || tasks.length > 0 ? (localTasks.length > 0 ? localTasks : tasks) : tasks;

  useEffect(() => { setLocalTasks(tasks); }, [tasks]);

  const [cardOrder, setCardOrder] = useState<Record<string, string[]>>(() =>
    loadJson(STORAGE_ORDER_KEY, {})
  );
  const [cardColors, setCardColors] = useState<Record<string, string>>(() =>
    loadJson(STORAGE_COLOR_KEY, {})
  );
  const [labels, setLabels] = useState<KanbanLabel[]>(() =>
    loadJson(STORAGE_LABELS_KEY, [])
  );

  useEffect(() => { localStorage.setItem(STORAGE_ORDER_KEY, JSON.stringify(cardOrder)); }, [cardOrder]);
  useEffect(() => { localStorage.setItem(STORAGE_COLOR_KEY, JSON.stringify(cardColors)); }, [cardColors]);
  useEffect(() => { localStorage.setItem(STORAGE_LABELS_KEY, JSON.stringify(labels)); }, [labels]);

  const grouped = useMemo(() => {
    const g: Record<string, TaskRecord[]> = {};
    for (const c of COLUMNS) {
      const colTasks = displayTasks.filter((t) => t.progress === c.key);
      const order = cardOrder[c.key] || [];
      const ordered = [...colTasks].sort((a, b) => {
        const ai = order.indexOf(a.id);
        const bi = order.indexOf(b.id);
        if (ai >= 0 && bi >= 0) return ai - bi;
        if (ai >= 0) return -1;
        if (bi >= 0) return 1;
        return 0;
      });
      g[c.key] = ordered;
    }
    return g;
  }, [displayTasks, cardOrder]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  );

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    setActiveId(null);
    const activeTask = displayTasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    const overId = over.id as string;
    let targetCol: TaskRecord["progress"] = activeTask.progress;
    let targetIdx = -1;

    for (const c of COLUMNS) {
      const items = grouped[c.key];
      if (overId === c.key) {
        targetCol = c.key;
        targetIdx = items.length;
        break;
      }
      const idx = items.findIndex((t) => t.id === overId);
      if (idx >= 0) {
        targetCol = c.key;
        targetIdx = idx;
        break;
      }
    }

    if (targetCol === activeTask.progress && overId === active.id) return;

    if (targetCol !== activeTask.progress) {
      updateTask(activeTask.id, { progress: targetCol }).catch(() => {});
      setLocalTasks((prev) =>
        prev.map((t) =>
          t.id === activeTask.id ? { ...t, progress: targetCol } : t
        )
      );
    }

    setCardOrder((prev) => {
      const sourceOrder = (prev[activeTask.progress] || []).filter((id) => id !== active.id);
      const targetArr = (prev[targetCol] || grouped[targetCol].map((t) => t.id)).filter((id) => id !== active.id);
      targetArr.splice(Math.min(targetIdx, targetArr.length), 0, active.id as string);
      return { ...prev, [activeTask.progress]: sourceOrder, [targetCol]: targetArr };
    });
  }, [displayTasks, grouped]);

  const handleQuickMove = async (task: TaskRecord, progress: TaskRecord["progress"]) => {
    updateTask(task.id, { progress }).catch(() => {});
    setLocalTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, progress } : t)));
    onRefresh();
  };

  const handleColorChange = (taskId: string, colorId: string) => {
    setCardColors((o) => ({ ...o, [taskId]: colorId }));
  };

  const handleArchive = async (task: TaskRecord) => {
    if (!confirm(`Archive "${task.taskDescription}"?`)) return;
    await archiveTask(task.id);
    setLocalTasks((prev) => prev.filter((t) => t.id !== task.id));
    onRefresh();
  };

  const handleCreate = async () => {
    if (!form.taskDescription.trim()) return;
    setSaving(true);
    const res = await createTaskAction({
      taskDescription: form.taskDescription,
      assignee: form.assignee,
      progress: newColumn,
    });
    setSaving(false);
    if (res.ok && res.record) {
      setLocalTasks((prev) => [...prev, res.record!]);
      setForm({ taskDescription: "", assignee: "" });
      setShowNew(false);
      onRefresh();
    }
  };

  const activeTask = activeId ? displayTasks.find((t) => t.id === activeId) : null;

  return (
    <div className="space-y-2">
      {/* Labels bar */}
      <LabelBar labels={labels} onChange={setLabels} tasks={tasks} />

      {/* New task button */}
      <div className="flex items-center gap-2 pb-1 overflow-x-auto">
        {COLUMNS.map((c) => (
          <button key={c.key} onClick={() => { setNewColumn(c.key); setShowNew(true); }} className="flex items-center gap-0.5 text-xs text-slate-500 hover:text-blue-600 px-2 py-1 rounded hover:bg-blue-50 shrink-0">
            <Plus size={12} /> Add to {c.label}
          </button>
        ))}
      </div>

      {/* New task form */}
      {showNew && (
        <div className="flex items-center gap-2 p-2 bg-white rounded border border-slate-200 text-xs">
          <input value={form.taskDescription} onChange={(e) => setForm({ ...form, taskDescription: e.target.value })} placeholder="Task description..." className="flex-1 border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400" autoFocus />
          <input value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} placeholder="Assignee" className="w-28 border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400" />
          <button onClick={handleCreate} disabled={saving || !form.taskDescription.trim()} className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">{saving ? "..." : <Check size={12} />}</button>
          <button onClick={() => setShowNew(false)} className="px-2 py-1 text-slate-400 hover:text-slate-600"><X size={12} /></button>
        </div>
      )}

      {/* Kanban columns */}
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={(e: DragStartEvent) => setActiveId(e.active.id as string)} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory -mx-2 px-2" style={{ WebkitOverflowScrolling: "touch" }}>
          {COLUMNS.map((col) => {
            const items = grouped[col.key];
            return (
              <div key={col.key} className="flex flex-col min-w-[82vw] sm:min-w-[280px] w-[82vw] sm:w-[280px] snap-center">
                <div className={`flex items-center justify-between px-2 py-1.5 mb-1.5 rounded-t border-t-2 ${col.color} bg-white border-x border-slate-200`}>
                  <span className="text-xs font-semibold text-slate-600">{col.label}</span>
                  <span className="text-[10px] text-slate-400 bg-slate-100 rounded-full px-1.5 py-0.5">{items.length}</span>
                </div>
                <SortableContext items={items.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  <div className="flex-1 space-y-1.5 min-h-[40vh] max-h-[60vh] overflow-y-auto px-0.5">
                    {items.map((task) => {
                      const colorId = cardColors[task.id] || "slate";
                      const colorDef = CARD_COLORS.find((c) => c.id === colorId) || CARD_COLORS[0];
                      return (
                        <SortableCard
                          key={task.id} task={task}
                          color={`${colorDef.bg} ${colorDef.border}`}
                          labels={labels}
                          onSelect={() => onSelect(task)}
                          onDelete={() => handleArchive(task)}
                          onColorChange={(c) => handleColorChange(task.id, c)}
                          onQuickMove={(p) => handleQuickMove(task, p)}
                        />
                      );
                    })}
                    {items.length === 0 && (
                      <div className="text-[10px] text-slate-300 text-center py-6 border-2 border-dashed border-slate-100 rounded-lg">
                        Drop tasks here
                      </div>
                    )}
                  </div>
                </SortableContext>
              </div>
            );
          })}
        </div>
        <DragOverlay>
          {activeTask ? (
            <div className="rounded-md bg-white shadow-xl border border-slate-300 p-2 text-xs max-w-[260px]">
              <div className="font-medium text-slate-800">{activeTask.taskDescription}</div>
              {activeTask.assignee && <div className="text-slate-400 text-[10px]">{activeTask.assignee}</div>}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function LabelBar({ labels, onChange, tasks }: { labels: KanbanLabel[]; onChange: (l: KanbanLabel[]) => void; tasks: TaskRecord[] }) {
  const [showManager, setShowManager] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editColor, setEditColor] = useState("#3b82f6");
  const [filterLabel, setFilterLabel] = useState<string | null>(null);
  const taskLabels = loadJson<string[]>(STORAGE_TASK_LABELS_KEY, []);

  const handleSaveLabel = () => {
    if (!editTitle.trim()) return;
    if (editId) {
      onChange(labels.map((l) => l.id === editId ? { ...l, title: editTitle.trim(), color: editColor } : l));
    } else {
      onChange([...labels, { id: Date.now().toString(), title: editTitle.trim(), color: editColor }]);
    }
    setEditId(null); setEditTitle(""); setEditColor("#3b82f6");
  };

  const handleDeleteLabel = (id: string) => {
    if (!confirm("Delete this label? It will be removed from all tasks.")) return;
    onChange(labels.filter((l) => l.id !== id));
    const stored = loadJson<string[]>(STORAGE_TASK_LABELS_KEY, []);
    localStorage.setItem(STORAGE_TASK_LABELS_KEY, JSON.stringify(stored.filter((tid) => tid !== id)));
  };

  return (
    <div className="text-xs">
      <div className="flex items-center gap-1.5 flex-wrap">
        <button onClick={() => { setEditId(null); setEditTitle(""); setEditColor("#3b82f6"); setShowManager(!showManager); }} className="text-slate-500 hover:text-blue-600 flex items-center gap-0.5">
          <Edit3 size={10} /> Labels
        </button>
        {labels.map((l) => (
          <button
            key={l.id}
            onClick={() => setFilterLabel(filterLabel === l.id ? null : l.id)}
            className={`text-[10px] px-1.5 py-0.5 rounded border ${filterLabel === l.id ? "ring-1 ring-blue-400" : ""}`}
            style={{ backgroundColor: l.color + "20", borderColor: l.color + "40", color: l.color }}
          >
            {l.title} {filterLabel === l.id && <X size={8} className="inline ml-0.5" onClick={(e) => { e.stopPropagation(); setFilterLabel(null); }} />}
          </button>
        ))}
      </div>

      {showManager && (
        <div className="mt-2 p-2 bg-white border border-slate-200 rounded space-y-2">
          <div className="flex items-center gap-2">
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Label name..." className="flex-1 border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400" />
            <input type="color" value={editColor} onChange={(e) => setEditColor(e.target.value)} className="w-6 h-6 p-0 border-0 cursor-pointer" />
            <button onClick={handleSaveLabel} className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-[10px]">{editId ? "Update" : "Add"}</button>
          </div>
          {labels.length > 0 && (
            <div className="space-y-0.5 max-h-32 overflow-y-auto">
              {labels.map((l) => (
                <div key={l.id} className="flex items-center gap-2 text-[10px]">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                  <span className="flex-1 text-slate-600">{l.title}</span>
                  <button onClick={() => { setEditId(l.id); setEditTitle(l.title); setEditColor(l.color); }} className="text-slate-400 hover:text-blue-600"><Edit3 size={8} /></button>
                  <button onClick={() => handleDeleteLabel(l.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={8} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
