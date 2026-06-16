import { api } from "@/services/api";
import type { Task } from "@/types";

export interface TasksResponse {
  items: Task[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export const tasksService = {
  list(params?: Record<string, unknown>) {
    return api.get<TasksResponse>("/tasks", { params }).then((r) => r.data);
  },
  get(id: number) {
    return api.get<Task>(`/tasks/${id}`).then((r) => r.data);
  },
  create(data: Partial<Task>) {
    return api.post<Task>("/tasks", data).then((r) => r.data);
  },
  update(id: number, data: Partial<Task>) {
    return api.put<Task>(`/tasks/${id}`, data).then((r) => r.data);
  },
  delete(id: number) {
    return api.delete(`/tasks/${id}`);
  },
  updateStatus(id: number, status: string) {
    return api.patch(`/tasks/${id}/status`, { status }).then((r) => r.data);
  },
};
