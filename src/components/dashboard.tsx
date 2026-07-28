"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { RefreshCw, Loader2, Eye, EyeOff, Columns3, LayoutDashboard, Clock, CalendarDays, Archive } from "lucide-react";
import { TaskRecord, FilterState } from "@/lib/types";
import { getTasks } from "@/app/actions/teable";
import { matchesFilters } from "@/lib/filters";
import KpiTiles from "@/components/kpi-tiles";
import StatusDistribution from "@/components/charts/status-distribution";
import WorkloadChart from "@/components/charts/workload-chart";
import TrendChart from "@/components/charts/trend-chart";
import TimelineView from "@/components/charts/timeline-view";
import DeliveryHealth from "@/components/delivery-health";
import AttentionQueue from "@/components/attention-queue";
import TaskTable from "@/components/task-table";
import TaskSidePanel from "@/components/task-side-panel";
import ExecutiveMode from "@/components/executive-mode";
import CreateTaskDialog from "@/components/create-task-dialog";
import BulkUpdateDialog from "@/components/bulk-update-dialog";
import FilterPresets from "@/components/filter-presets";
import KanbanBoard from "@/components/kanban-board";
import CalendarView from "@/components/calendar-view";
import ArchiveView from "@/components/archive-view";
import SettingsDialog from "@/components/settings-dialog";
import HelpManual from "@/components/help-manual";

interface Props {
  initialTasks: TaskRecord[];
}

export default function Dashboard({ initialTasks }: Props) {
  const [tasks, setTasks] = useState<TaskRecord[]>(initialTasks);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [execMode, setExecMode] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const [filters, setFilters] = useState<FilterState>({
    progress: [], assignee: [], important: null, overdue: null, search: "", blocked: null, priority: [],
  });

  const [view, setView] = useState<"dashboard" | "kanban" | "calendar" | "archive">("dashboard");
  const [activeKpi, setActiveKpi] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sidePanelTask, setSidePanelTask] = useState<TaskRecord | null>(null);

  const active = tasks.filter((t) => !t.archived);
  const archived = tasks.filter((t) => t.archived);

  const filtered = useMemo(
    () => tasks.filter((t) => matchesFilters(t, filters) && !t.archived),
    [tasks, filters]
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await getTasks();
    if (res.error) setError(res.error);
    else {
      setTasks(res.tasks);
      setLastUpdated(new Date());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setInterval(refresh, 60000);
    return () => clearInterval(timer);
  }, [refresh]);

  const handleKpiFilter = useCallback((key: string | null) => {
    setActiveKpi(key);
    if (!key) {
      setFilters({ progress: [], assignee: [], important: null, overdue: null, search: "", blocked: null, priority: [] });
      return;
    }
    const f: FilterState = { progress: [], assignee: [], important: null, overdue: null, search: "", blocked: null, priority: [] };
    switch (key) {
      case "completed": f.progress = ["Completed"]; break;
      case "inProgress": f.progress = ["In Progress"]; break;
      case "notStarted": f.progress = ["Not Started"]; break;
      case "overdue": f.overdue = true; break;
      case "important": f.important = true; break;
      case "blocked": f.blocked = true; break;
      default: break;
    }
    setFilters(f);
  }, []);

  const handleChartFilter = useCallback((value: string | null) => {
    if (!value) return;
    setFilters((f) => ({
      ...f,
      progress: ["Completed", "In Progress", "Not Started"].includes(value)
        ? (f.progress.includes(value as TaskRecord["progress"]) ? f.progress : [value as TaskRecord["progress"]])
        : f.progress,
      assignee: f.assignee.includes(value) ? f.assignee : [...f.assignee, value],
    }));
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleCreated = useCallback((task: TaskRecord) => {
    setTasks((prev) => [task, ...prev]);
  }, []);

  const handleUpdated = useCallback(() => {
    refresh();
  }, [refresh]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-sm text-red-600 mb-2">Failed to load tasks</p>
          <p className="text-xs text-slate-400 mb-3">{error}</p>
          <button onClick={refresh} className="text-xs px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            {view === "kanban" ? "Kanban Board" :
             view === "calendar" ? "Calendar" :
             view === "archive" ? "Archive" :
             "Dashboard"}
            <span className="text-[10px] font-normal text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
              {view === "archive" ? `${archived.length} archived` : `${active.length} tasks`}
            </span>
          </h1>
          <p className="text-[10px] text-slate-400 flex items-center gap-1">
            <Clock size={10} />
            Updated {lastUpdated.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex bg-slate-100 rounded-lg p-0.5 text-xs overflow-x-auto scrollbar-none snap-x snap-mandatory -mx-2 px-2 sm:mx-0 sm:px-0">
            <button onClick={() => setView("dashboard")} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-all snap-start shrink-0 ${view === "dashboard" ? "bg-white text-slate-800 shadow-sm font-medium" : "text-slate-500 hover:text-slate-700"}`}>
              <LayoutDashboard size={14} /> Dash
            </button>
            <button onClick={() => setView("kanban")} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-all snap-start shrink-0 ${view === "kanban" ? "bg-white text-slate-800 shadow-sm font-medium" : "text-slate-500 hover:text-slate-700"}`}>
              <Columns3 size={14} /> Board
            </button>
            <button onClick={() => setView("calendar")} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-all snap-start shrink-0 ${view === "calendar" ? "bg-white text-slate-800 shadow-sm font-medium" : "text-slate-500 hover:text-slate-700"}`}>
              <CalendarDays size={14} /> Calendar
            </button>
            <button onClick={() => setView("archive")} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-all snap-start shrink-0 ${view === "archive" ? "bg-white text-slate-800 shadow-sm font-medium" : "text-slate-500 hover:text-slate-700"}`}>
              <Archive size={14} /> Archive
            </button>
          </div>
          {view === "dashboard" && (
            <>
              <FilterPresets filters={filters} onApply={(f) => setFilters(f)} />
              <button
                onClick={() => setExecMode(!execMode)}
                title={execMode ? "Standard view" : "Executive view"}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 flex items-center gap-1"
              >
                {execMode ? <EyeOff size={14} /> : <Eye size={14} />}
                {execMode ? "Standard" : "Executive"}
              </button>
            </>
          )}
          <SettingsDialog />
          <HelpManual />
          <CreateTaskDialog onCreated={handleCreated} />
          {view === "archive" && (
            <button onClick={refresh} disabled={loading} title="Refresh" className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 flex items-center gap-1">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            </button>
          )}
        </div>
      </div>

      {view === "kanban" ? (
        <KanbanBoard tasks={active} onSelect={setSidePanelTask} onRefresh={refresh} />
      ) : view === "calendar" ? (
        <CalendarView tasks={active} onSelect={setSidePanelTask} />
      ) : view === "archive" ? (
        <ArchiveView tasks={tasks} onRefresh={refresh} onSelect={setSidePanelTask} />
      ) : execMode ? (
        <ExecutiveMode tasks={active} onSelect={setSidePanelTask} />
      ) : (
        <>
          <KpiTiles tasks={active} activeFilter={activeKpi} onFilter={handleKpiFilter} />
          <DeliveryHealth tasks={active} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <WorkloadChart tasks={active} onFilter={handleChartFilter} />
            <TimelineView tasks={active} onSelect={setSidePanelTask} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <StatusDistribution tasks={active} onFilter={handleChartFilter} />
            <TrendChart tasks={active} />
            <AttentionQueue tasks={active} onSelect={setSidePanelTask} />
          </div>
        </>
      )}

      {view === "dashboard" && (
        <>
          <BulkUpdateDialog
            selected={selected}
            tasks={active}
            onDone={refresh}
            onClear={() => setSelected(new Set())}
          />
          <TaskTable
            tasks={active}
            filters={filters}
            onFilters={setFilters}
            selected={selected}
            onToggleSelect={toggleSelect}
            onSelect={setSidePanelTask}
          />
        </>
      )}

      <TaskSidePanel task={sidePanelTask} onClose={() => setSidePanelTask(null)} onUpdated={handleUpdated} />
    </div>
  );
}
