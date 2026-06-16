import { api } from "@/services/api";
import type { Project } from "@/types";

export interface ProjectsResponse {
  items: Project[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export const projectsService = {
  list(params?: Record<string, unknown>) {
    return api.get<ProjectsResponse>("/projects", { params }).then((r) => r.data);
  },
  get(id: number) {
    return api.get<Project>(`/projects/${id}`).then((r) => r.data);
  },
  create(data: Partial<Project>) {
    return api.post<Project>("/projects", data).then((r) => r.data);
  },
  update(id: number, data: Partial<Project>) {
    return api.put<Project>(`/projects/${id}`, data).then((r) => r.data);
  },
  delete(id: number) {
    return api.delete(`/projects/${id}`);
  },
};
