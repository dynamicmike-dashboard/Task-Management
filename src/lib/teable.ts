import { TaskRecord, TeableRecord, TeableField } from "./types";

const BASE = process.env.TEABLE_BASE_URL || "https://teable.maistermind.com";
const TOKEN = process.env.TEABLE_API_KEY || "";
const TABLE_ID = process.env.TEABLE_TABLE_ID || "tblwooXdxMZaIZzm29R";

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
};

const FIELD_IDS_CACHE = { ids: {} as Record<string, string>, loaded: false };

async function loadFieldIds(): Promise<Record<string, string>> {
  if (FIELD_IDS_CACHE.loaded) return FIELD_IDS_CACHE.ids;
  const res = await fetch(`${BASE}/api/table/${TABLE_ID}/field`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to load fields: ${res.status}`);
  const fields: TeableField[] = await res.json();
  const ids: Record<string, string> = {};
  for (const f of fields) {
    if (f.name in FIELD_MAP) {
      ids[f.name] = f.id;
    }
  }
  FIELD_IDS_CACHE.ids = ids;
  FIELD_IDS_CACHE.loaded = true;
  return ids;
}

function parseRecord(r: TeableRecord): TaskRecord {
  const f = r.fields || {};
  const getStr = (name: string): string => {
    const v = f[name];
    return v != null ? String(v) : "";
  };
  const getDate = (name: string): string | null => {
    const v = f[name];
    if (!v) return null;
    if (typeof v === "string") return v;

    if (typeof v === "object" && v !== null) {
      const obj = v as Record<string, unknown>;
      const d = obj.start || obj.date || obj.value;
      if (d && typeof d === "string") {
        const cleaned = d.split("T")[0].split(" ")[0];
        if (cleaned.match(/^\d{4}-\d{2}-\d{2}$/)) return cleaned;
        return d;
      }
    }
    const s = String(v);
    const cleaned = s.split("T")[0].split(" ")[0];
    if (cleaned.match(/^\d{4}-\d{2}-\d{2}$/)) return cleaned;
    return s;
  };
  const getBool = (name: string): boolean => {
    const v = f[name];
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v === 1;
    if (typeof v === "string") return v === "true" || v === "1" || v === "yes";
    return false;
  };

  return {
    id: r.id,
    taskDescription: getStr("Task Description"),
    taskSummary: getStr("Task Summary"),
    assignee: getStr("Assignee"),
    progress: (["Completed", "In Progress", "Not Started"].includes(getStr("Progress"))
      ? getStr("Progress")
      : "Not Started") as TaskRecord["progress"],
    startDate: getDate("Start Date"),
    expectedCompletionDate: getDate("Expected Completion Date"),
    actualCompletionDate: getDate("Actual Completion Date"),
    important: getBool("Important"),
    latestProgressUpdate: getStr("Latest Progress Update"),
    notes: getStr("Notes"),
  };
}

export async function fetchAllTasks(): Promise<TaskRecord[]> {
  const url = `${BASE}/api/table/${TABLE_ID}/record?limit=200`;
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

export async function updateTaskField(
  recordId: string,
  fieldName: string,
  value: unknown
): Promise<void> {
  const fieldIds = await loadFieldIds();
  const teableFieldName = Object.keys(FIELD_MAP).find(
    (k) => FIELD_MAP[k] === fieldName
  );
  if (!teableFieldName) throw new Error(`Unknown field: ${fieldName}`);
  const fieldId = fieldIds[teableFieldName];
  if (!fieldId) throw new Error(`No field ID for ${teableFieldName}`);

  await fetch(`${BASE}/api/table/${TABLE_ID}/record/${recordId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: { [teableFieldName]: value },
    }),
    cache: "no-store",
  });
}

export async function updateTaskFields(
  recordId: string,
  fields: Record<string, unknown>
): Promise<void> {
  const fieldIds = await loadFieldIds();
  const teableFields: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(fields)) {
    const teableFieldName = Object.keys(FIELD_MAP).find(
      (k) => FIELD_MAP[k] === key
    );
    if (teableFieldName) {
      teableFields[teableFieldName] = val;
    }
  }

  await fetch(`${BASE}/api/table/${TABLE_ID}/record/${recordId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields: teableFields }),
    cache: "no-store",
  });
}

export async function createTask(
  fields: Record<string, unknown>
): Promise<TaskRecord | null> {
  const fieldIds = await loadFieldIds();
  const teableFields: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(fields)) {
    const teableFieldName = Object.keys(FIELD_MAP).find(
      (k) => FIELD_MAP[k] === key
    );
    if (teableFieldName) {
      teableFields[teableFieldName] = val;
    }
  }

  const res = await fetch(`${BASE}/api/table/${TABLE_ID}/record`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ records: [{ fields: teableFields }] }),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Teable create error ${res.status}: ${body}`);
  }
  const data = await res.json();
  const newRec = data.records?.[0] || data.record || data;
  if (!newRec || !newRec.id) return null;
  return parseRecord(newRec);
}

export async function deleteTask(recordId: string): Promise<void> {
  await fetch(`${BASE}/api/table/${TABLE_ID}/record/${recordId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${TOKEN}` },
    cache: "no-store",
  });
}
