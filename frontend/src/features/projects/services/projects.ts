import { api } from "@/services/api";
import type { Project } from "@/types";

export const projectService = {
  getProjects: (params?: Record<string, unknown>) =>
    api.get("/projects", { params }).then((r) => r.data),

  getProject: (id: number | string) =>
    api.get(`/projects/${id}`).then((r) => r.data?.data || r.data),

  createProject: (data: Partial<Project>) =>
    api.post("/projects", data).then((r) => r.data),

  updateProject: (id: number | string, data: Partial<Project>) =>
    api.put(`/projects/${id}`, data).then((r) => r.data),

  deleteProject: (id: number | string) =>
    api.delete(`/projects/${id}`).then((r) => r.data),

  getProjectTasks: (id: number | string, params?: Record<string, unknown>) =>
    api.get(`/projects/${id}/tasks`, { params }).then((r) => r.data?.items || r.data?.data || []),

  getProjectMembers: (id: number | string) =>
    api.get(`/projects/${id}/members`).then((r) => r.data?.items || r.data?.data || r.data || []),

  addProjectMember: (id: number | string, data: { user_id: number; role: string }) =>
    api.post(`/projects/${id}/members`, data).then((r) => r.data),

  removeProjectMember: (id: number | string, userId: number) =>
    api.delete(`/projects/${id}/members/${userId}`).then((r) => r.data),

  updateProjectMember: (id: number | string, userId: number, data: { role: string }) =>
    api.put(`/projects/${id}/members/${userId}`, data).then((r) => r.data),

  getProjectMeetings: (id: number | string, params?: Record<string, unknown>) =>
    api.get(`/projects/${id}/meetings`, { params }).then((r) => r.data?.items || r.data?.data || []),

  getProjectActivity: (id: number | string) =>
    api.get(`/projects/${id}/activity`).then((r) => r.data?.items || r.data?.data || []),

  getRecentProjects: () =>
    api.get("/projects/recent").then((r) => r.data?.items || r.data?.data || r.data || []),
};
