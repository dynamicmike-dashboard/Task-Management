"use server";

import {
  fetchAllTasks,
  updateTaskFields,
  createTask as teableCreateTask,
  deleteTask as teableDeleteTask,
  logActivity,
  getActivity,
  getSettings,
  updateSettings as teableUpdateSettings,
  getProjectsConfig as teableGetProjects,
  saveProjectsConfig as teableSaveProjects,
} from "@/lib/teable";
import { TaskRecord, DashboardSettings, Project } from "@/lib/types";

export async function getTasks(): Promise<{ tasks: TaskRecord[]; error?: string }> {
  try {
    const tasks = await fetchAllTasks();
    return { tasks };
  } catch (e) {
    return { tasks: [], error: String(e) };
  }
}

export async function updateTask(
  recordId: string,
  fields: Record<string, unknown>
): Promise<{ ok: boolean; error?: string }> {
  try {
    await updateTaskFields(recordId, fields);
    return { ok: true };
  } catch (e) {
    const msg = String(e);
    console.error("updateTask error:", msg, "fields:", JSON.stringify(fields));
    return { ok: false, error: msg };
  }
}

export async function createTaskAction(
  fields: Record<string, unknown>
): Promise<{ ok: boolean; record?: TaskRecord; error?: string }> {
  try {
    const record = await teableCreateTask(fields);
    if (!record) return { ok: false, error: "Task was created but the response could not be parsed." };
    return { ok: true, record };
  } catch (e) {
    const msg = String(e);
    console.error("createTaskAction error:", msg);
    return { ok: false, error: msg };
  }
}

export async function deleteTaskAction(
  recordId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await teableDeleteTask(recordId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function archiveTask(
  recordId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await updateTaskFields(recordId, { archived: true, progress: "Not Started" });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function restoreTask(
  recordId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await updateTaskFields(recordId, { archived: false });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function getTaskActivity(
  taskId: string
): Promise<{ records: Awaited<ReturnType<typeof getActivity>>; error?: string }> {
  try {
    const records = await getActivity(taskId);
    return { records };
  } catch (e) {
    return { records: [], error: String(e) };
  }
}

export async function getDashboardSettings(): Promise<{ settings: DashboardSettings | null; error?: string }> {
  try {
    const settings = await getSettings();
    return { settings };
  } catch (e) {
    return { settings: null, error: String(e) };
  }
}

export async function updateDashboardSettings(
  id: string,
  fields: Record<string, unknown>
): Promise<{ ok: boolean; error?: string }> {
  try {
    await teableUpdateSettings(id, fields);
    return { ok: true };
  } catch (e) {
    const msg = String(e);
    console.error("updateDashboardSettings error:", msg, "fields:", JSON.stringify(fields));
    return { ok: false, error: msg };
  }
}

export async function getProjects(): Promise<{ projects: Project[]; error?: string }> {
  try {
    const projects = await teableGetProjects();
    return { projects };
  } catch (e) {
    return { projects: [], error: String(e) };
  }
}

export async function saveProjects(
  projects: Project[]
): Promise<{ ok: boolean; error?: string }> {
  try {
    const settings = await getSettings();
    if (!settings) return { ok: false, error: "No settings record found" };
    await teableSaveProjects(settings.id, projects);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
