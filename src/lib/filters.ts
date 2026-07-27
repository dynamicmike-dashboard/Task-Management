import { TaskRecord, FilterState } from "./types";

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

export function isOverdue(record: TaskRecord): boolean {
  if (record.progress === "Completed") return false;
  if (!record.expectedCompletionDate) return false;
  const due = new Date(record.expectedCompletionDate);
  return !isNaN(due.getTime()) && due < TODAY;
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
  return true;
}
