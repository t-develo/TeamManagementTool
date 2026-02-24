import { post, put, del } from "./client";
import type { Task, TaskCreate, TaskUpdate, TaskReorderItem, TaskAssignRequest } from "../types/task";

export const createTask = (projectId: string, data: TaskCreate) =>
  post<Task>(`/projects/${projectId}/tasks`, data);

export const updateTask = (projectId: string, taskId: string, data: TaskUpdate) =>
  put<Task>(`/projects/${projectId}/tasks/${taskId}`, data);

export const deleteTask = (projectId: string, taskId: string) =>
  del<void>(`/projects/${projectId}/tasks/${taskId}`);

export const reorderTasks = (projectId: string, items: TaskReorderItem[]) =>
  put<void>(`/projects/${projectId}/tasks/reorder`, { task_orders: items });

export const assignTask = (projectId: string, taskId: string, data: TaskAssignRequest) =>
  put<Task>(`/projects/${projectId}/tasks/${taskId}/assign`, data);
