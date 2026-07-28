import { TaskRecord, ActivityRecord, DashboardSettings, TeableRecord, TeableField } from "./types";

const BASE = process.env.TEABLE_BASE_URL || "https://teable.maistermind.com";
const TOKEN = process.env.TEABLE_API_KEY || "";
const TABLE_ID = process.env.TEABLE_TABLE_ID || "tblwooXdxMZaIZzm29R";
const ACTIVITY_TABLE_ID = process.env.TEABLE_ACTIVITY_TABLE_ID || "tblORhI61zRvpqR6tWK";
const SETTINGS_TABLE_ID = process.env.TEABLE_SETTINGS_TABLE_ID || "tblDHCJx97iIaUGtQig";

const FIELD_MAP: Record<string, keyof TaskRecord> = {
  "Task Description": "taskDescription",
  "Task Summary": "taskSummary",
  "Assignee": "assignee",
  "Progress": "progress",
  "Start Date": "startDate",
  "Expected Completion Date": "expectedCompletionDate",
  "Actual Completion Date": "actualCompletionDate",
  "Important": "important",
  "Latest Progress Update": "latestProgressUpdate",
  "Notes": "notes",
  "Archived": "archived",
  "Priority": "priority",
  "Blocked": "blocked",
  "Blocked Reason": "blockedReason",
  "Percent Complete": "percentComplete",
  "Estimated Hours": "estimatedHours",
  "Actual Hours": "actualHours",
};

const FIELD_NAME_TO_ID: Record<string, Record<string, string>> = {};

async function loadFieldIds(tableId: string): Promise<Record<string, string>> {
  if (FIELD_NAME_TO_ID[tableId]) return FIELD_NAME_TO_ID[tableId];
  const res = await fetch(`${BASE}/api/table/${tableId}/field`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to load fields: ${res.status}`);
  const fields: TeableField[] = await res.json();
  const ids: Record<string, string> = {};
  for (const f of fields) {
    ids[f.name] = f.id;
  }
  FIELD_NAME_TO_ID[tableId] = ids;
  return ids;
}

function getNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

function getStr(v: unknown): string {
  return v != null ? String(v) : "";
}

function getDate(v: unknown): string | null {
  if (!v) return null;
  if (typeof v === "string") return v.split("T")[0];
  if (typeof v === "object" && v !== null) {
    const obj = v as Record<string, unknown>;
    const d = obj.start || obj.date || obj.value;
    if (d && typeof d === "string") {
      const cleaned = d.split("T")[0];
      if (cleaned.match(/^\d{4}-\d{2}-\d{2}$/)) return cleaned;
      return d;
    }
  }
  const s = String(v).split("T")[0];
  return s.match(/^\d{4}-\d{2}-\d{2}$/) ? s : String(v);
}

function getBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  if (typeof v === "string") return v === "true" || v === "1" || v === "yes";
  return false;
}

function parseRecord(r: TeableRecord): TaskRecord {
  const f = r.fields || {};
  return {
    id: r.id,
    taskDescription: getStr(f["Task Description"]),
    taskSummary: getStr(f["Task Summary"]),
    assignee: getStr(f["Assignee"]),
    progress: (["Completed", "In Progress", "Not Started"].includes(getStr(f["Progress"]))
      ? getStr(f["Progress"])
      : "Not Started") as TaskRecord["progress"],
    startDate: getDate(f["Start Date"]),
    expectedCompletionDate: getDate(f["Expected Completion Date"]),
    actualCompletionDate: getDate(f["Actual Completion Date"]),
    important: getBool(f["Important"]),
    latestProgressUpdate: getStr(f["Latest Progress Update"]),
    notes: getStr(f["Notes"]),
    archived: getBool(f["Archived"]),
    priority: (["Low", "Medium", "High", "Critical"].includes(getStr(f["Priority"]))
      ? getStr(f["Priority"])
      : "Medium") as TaskRecord["priority"],
    blocked: getBool(f["Blocked"]),
    blockedReason: getStr(f["Blocked Reason"]),
    percentComplete: Math.min(100, Math.max(0, getNum(f["Percent Complete"]))),
    estimatedHours: Math.max(0, getNum(f["Estimated Hours"])),
    actualHours: Math.max(0, getNum(f["Actual Hours"])),
  };
}

function toTeableFields(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(fields)) {
    const teableName = Object.keys(FIELD_MAP).find((k) => FIELD_MAP[k] === key);
    if (teableName) out[teableName] = val;
  }
  return out;
}

async function patchRecord(tableId: string, recordId: string, fields: Record<string, unknown>): Promise<void> {
  // Try with field names first
  let res = await fetch(`${BASE}/api/table/${tableId}/record/${recordId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
    cache: "no-store",
  });
  if (res.ok) return;
  // If names fail, try converting to field IDs
  const errText = await res.text().catch(() => "");
  try {
    const nameToId = await loadFieldIds(tableId);
    const idFields: Record<string, unknown> = {};
    for (const [name, val] of Object.entries(fields)) {
      const id = nameToId[name];
      if (id) idFields[id] = val;
    }
    if (Object.keys(idFields).length > 0) {
      res = await fetch(`${BASE}/api/table/${tableId}/record/${recordId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ fields: idFields }),
        cache: "no-store",
      });
      if (res.ok) return;
      const idErrText = await res.text().catch(() => "");
      throw new Error(`Teable PATCH error (names then IDs): ${errText} | ${idErrText}`);
    }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Teable PATCH error")) throw e;
  }
  throw new Error(`Teable PATCH error: ${errText}`);
}

async function createRecord(tableId: string, fields: Record<string, unknown>): Promise<TeableRecord> {
  const res = await fetch(`${BASE}/api/table/${tableId}/record`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ records: [{ fields }] }),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Teable POST error ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data.records?.[0] || data.record || data;
}

// --- Task API ---

export async function fetchAllTasks(): Promise<TaskRecord[]> {
  const url = `${BASE}/api/table/${TABLE_ID}/record?limit=500`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Teable fetch error ${res.status}: ${body}`);
  }
  const data = await res.json();
  const records: TeableRecord[] = data.records || [];
  return records.map(parseRecord);
}

export async function updateTaskFields(recordId: string, fields: Record<string, unknown>): Promise<void> {
  await patchRecord(TABLE_ID, recordId, toTeableFields(fields));
}

export async function createTask(fields: Record<string, unknown>): Promise<TaskRecord | null> {
  const teableFields = toTeableFields(fields);
  const rec = await createRecord(TABLE_ID, teableFields);
  if (!rec || !rec.id) return null;
  return parseRecord(rec);
}

export async function deleteTask(recordId: string): Promise<void> {
  await fetch(`${BASE}/api/table/${TABLE_ID}/record/${recordId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${TOKEN}` },
    cache: "no-store",
  });
}

// --- Activity API ---

export async function logActivity(record: Omit<ActivityRecord, "id" | "timestamp">): Promise<void> {
  try {
    await createRecord(ACTIVITY_TABLE_ID, {
      "Task ID": record.taskId,
      Action: record.action,
      Field: record.field,
      "Old Value": record.oldValue,
      "New Value": record.newValue,
      Timestamp: new Date().toISOString(),
    });
  } catch {
    // Best-effort: never fail the primary operation for logging
  }
}

export async function getActivity(taskId: string): Promise<ActivityRecord[]> {
  const url = `${BASE}/api/table/${ACTIVITY_TABLE_ID}/record?limit=200&filterByFormula={Task ID}='${taskId}'&orderByTimestamp=desc`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}` },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.records || []).map((r: TeableRecord) => ({
    id: r.id,
    taskId: getStr(r.fields?.["Task ID"]),
    action: getStr(r.fields?.Action),
    field: getStr(r.fields?.Field),
    oldValue: getStr(r.fields?.["Old Value"]),
    newValue: getStr(r.fields?.["New Value"]),
    timestamp: getStr(r.fields?.Timestamp),
  }));
}

// --- Settings API ---

export async function getSettings(): Promise<DashboardSettings | null> {
  const url = `${BASE}/api/table/${SETTINGS_TABLE_ID}/record?limit=10`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json();
  const records: TeableRecord[] = data.records || [];
  if (records.length === 0) return null;
  const r = records[0];
  const f = r.fields || {};
  return {
    id: r.id,
    workspaceName: getStr(f["Workspace Name"]),
    clientName: getStr(f["Client Name"]),
    logoUrl: getStr(f["Logo URL"]),
    accentColor: getStr(f["Accent Color"]) || "#2563eb",
    isMaster: getBool(f["Is Master"]),
  };
}

const SETTINGS_FIELD_MAP: Record<string, string> = {
  workspaceName: "Workspace Name",
  clientName: "Client Name",
  logoUrl: "Logo URL",
  accentColor: "Accent Color",
};

export async function updateSettings(id: string, fields: Record<string, unknown>): Promise<void> {
  const teableFields: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(fields)) {
    const teableName = SETTINGS_FIELD_MAP[key];
    if (teableName) teableFields[teableName] = val;
  }
  await patchRecord(SETTINGS_TABLE_ID, id, teableFields);
}
