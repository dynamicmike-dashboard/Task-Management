"use client";

import { useState, useCallback, useMemo } from "react";
import { RefreshCw, Loader2, Eye, EyeOff } from "lucide-react";
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

interface Props {
  initialTasks: TaskRecord[];
}

export default function Dashboard({ initialTasks }: Props) {
  const [tasks, setTasks] = useState<TaskRecord[]>(initialTasks);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [execMode, setExecMode] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    progress: [], assignee: [], important: null, overdue: null, search: "",
  });

  const [activeKpi, setActiveKpi] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sidePanelTask, setSidePanelTask] = useState<TaskRecord | null>(null);

  const filtered = useMemo(
    () => tasks.filter((t) => matchesFilters(t, filters)),
    [tasks, filters]
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await getTasks();
    if (res.error) setError(res.error);
    else setTasks(res.tasks);
    setLoading(false);
  }, []);

  const handleKpiFilter = useCallback(
    (key: string | null) => {
      setActiveKpi(key);
      if (!key) {
        setFilters({ progress: [], assignee: [], important: null, overdue: null, search: "" });
        return;
      }
      const f: FilterState = { progress: [], assignee: [], important: null, overdue: null, search: "" };
      switch (key) {
        case "completed": f.progress = ["Completed"]; break;
        case "inProgress": f.progress = ["In Progress"]; break;
        case "notStarted": f.progress = ["Not Started"]; break;
        case "overdue": f.overdue = true; break;
        case "important": f.important = true; break;
        default: break;
      }
      setFilters(f);
    },
    []
  );

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
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-base font-semibold text-slate-800">Task Operations</h1>
          <p className="text-[10px] text-slate-400">{tasks.length} tasks &middot; Last updated just now</p>
        </div>
        <div className="flex items-center gap-2">
          <FilterPresets filters={filters} onApply={(f) => setFilters(f)} />
          <button
            onClick={() => setExecMode(!execMode)}
            title={execMode ? "Standard view" : "Executive view"}
            className="text-xs px-2 py-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 flex items-center gap-1"
          >
            {execMode ? <EyeOff size={14} /> : <Eye size={14} />}
            {execMode ? "Standard" : "Executive"}
          </button>
          <CreateTaskDialog onCreated={handleCreated} />
          <button
            onClick={refresh}
            disabled={loading}
            title="Refresh data"
            className="text-xs px-2 py-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          </button>
        </div>
      </div>

      {execMode ? (
        <ExecutiveMode tasks={tasks} onSelect={setSidePanelTask} />
      ) : (
        <>
          {/* KPI Tiles */}
          <KpiTiles tasks={tasks} activeFilter={activeKpi} onFilter={handleKpiFilter} />

          {/* Delivery Health */}
          <DeliveryHealth tasks={tasks} />

          {/* Charts Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatusDistribution tasks={tasks} onFilter={handleChartFilter} />
            <WorkloadChart tasks={tasks} onFilter={handleChartFilter} />
            <TrendChart tasks={tasks} />
            <TimelineView tasks={tasks} />
          </div>

          {/* Attention Queue */}
          <AttentionQueue tasks={tasks} onSelect={setSidePanelTask} />
        </>
      )}

      {/* Bulk Update */}
      <BulkUpdateDialog
        selected={selected}
        tasks={tasks}
        onDone={refresh}
        onClear={() => setSelected(new Set())}
      />

      {/* Task Table */}
      <TaskTable
        tasks={tasks}
        filters={filters}
        onFilters={setFilters}
        selected={selected}
        onToggleSelect={toggleSelect}
        onSelect={setSidePanelTask}
      />

      {/* Side Panel */}
      <TaskSidePanel task={sidePanelTask} onClose={() => setSidePanelTask(null)} onUpdated={handleUpdated} />
    </div>
  );
}
