import { TaskRecord, FilterState } from "./types";

const OVERDUE_FIELD = "expectedCompletionDate";
const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

function dateValue(record: TaskRecord, field: string): Date | null {
  const v = (record as unknown as Record<string, unknown>)[field];
  if (!v || typeof v !== "string") return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

export function isOverdue(record: TaskRecord): boolean {
  if (record.progress === "Completed") return false;
  const due = dateValue(record, OVERDUE_FIELD);
  return due !== null && due < TODAY;
}

export function matchesFilters(record: TaskRecord, filters: FilterState): boolean {
  if (filters.search) {
    const q = filters.search.toLowerCase();
    const desc = record.taskDescription?.toLowerCase() || "";
    const summary = record.taskSummary?.toLowerCase() || "";
    const assignee = record.assignee?.toLowerCase() || "";
    if (!desc.includes(q) && !summary.includes(q) && !assignee.includes(q)) return false;
  }
  if (filters.progress.length > 0 && !filters.progress.includes(record.progress)) return false;
  if (filters.assignee.length > 0 && !filters.assignee.includes(record.assignee)) return false;
  if (filters.important !== null && record.important !== filters.important) return false;
  if (filters.overdue !== null && isOverdue(record) !== filters.overdue) return false;
  if (filters.priority.length > 0 && !filters.priority.includes(record.priority)) return false;
  if (filters.blocked !== null && record.blocked !== filters.blocked) return false;
  return true;
}
