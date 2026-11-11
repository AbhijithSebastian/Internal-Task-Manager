import { api } from "@/services/api";
import type { Announcement, PaginatedResponse } from "@/types";

export const announcementsService = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Announcement>>("/announcements", { params }).then((r) => r.data),
  get: (id: number) =>
    api
      .get(`/announcements/${id}`)
      .then((r) => (r.data as Record<string, unknown>)?.data || r.data) as Promise<Announcement>,
  create: (data: Partial<Announcement>) =>
    api
      .post("/announcements", data)
      .then((r) => (r.data as Record<string, unknown>)?.data || r.data) as Promise<Announcement>,
  update: (id: number, data: Partial<Announcement>) =>
    api
      .put(`/announcements/${id}`, data)
      .then((r) => (r.data as Record<string, unknown>)?.data || r.data) as Promise<Announcement>,
  delete: (id: number) => api.delete(`/announcements/${id}`),
  changeStatus: (id: number, status: string) =>
    api.patch(`/announcements/${id}/status`, { status }),
};
