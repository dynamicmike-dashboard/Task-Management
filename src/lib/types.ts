export type Progress = "Completed" | "In Progress" | "Not Started";
export type RiskLevel = "Critical" | "High" | "Medium" | "Low" | "None";
export type Priority = "Low" | "Medium" | "High" | "Critical";

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
  archived: boolean;
  priority: Priority;
  blocked: boolean;
  blockedReason: string;
  percentComplete: number;
  estimatedHours: number;
  actualHours: number;
}

export interface ActivityRecord {
  id: string;
  taskId: string;
  action: string;
  field: string;
  oldValue: string;
  newValue: string;
  timestamp: string;
}

export interface DashboardSettings {
  id: string;
  workspaceName: string;
  clientName: string;
  logoUrl: string;
  accentColor: string;
  isMaster: boolean;
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
  blocked: boolean | null;
  priority: Priority[];
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
