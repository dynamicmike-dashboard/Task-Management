"use server";

import {
  fetchAllTasks,
  updateTaskFields,
  createTask as teableCreateTask,
  deleteTask as teableDeleteTask,
} from "@/lib/teable";
import { TaskRecord } from "@/lib/types";

export async function getTasks(): Promise<{
  tasks: TaskRecord[];
  error?: string;
}> {
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
    return { ok: false, error: String(e) };
  }
}

export async function createTaskAction(
  fields: Record<string, unknown>
): Promise<{ ok: boolean; record?: TaskRecord; error?: string }> {
  try {
    const record = await teableCreateTask(fields);
    return { ok: true, record: record ?? undefined };
  } catch (e) {
    return { ok: false, error: String(e) };
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
