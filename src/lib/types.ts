export type Progress = "Completed" | "In Progress" | "Not Started";
export type RiskLevel = "Critical" | "High" | "Medium" | "Low" | "None";

export interface TaskRecord {
  id: string;
  taskDescription: string;
  taskSummary: string;
  assignee: string;
  progress: Progress;
  startDate: string | null;
  expectedCompletionDate: string | null;
  actualCompletionDate: string | null;
  important: boolean;
  latestProgressUpdate: string;
  notes: string;
}

export interface RiskScore {
  level: RiskLevel;
  score: number;
  factors: string[];
}

export interface FilterState {
  progress: Progress[];
  assignee: string[];
  important: boolean | null;
  overdue: boolean | null;
  search: string;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: FilterState;
}

export interface TeableField {
  id: string;
  name: string;
  type: string;
  cellValueType: string;
}

export interface TeableRecord {
  id: string;
  fields: Record<string, unknown>;
  [key: string]: unknown;
}
