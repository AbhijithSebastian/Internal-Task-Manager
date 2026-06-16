import { api } from "@/services/api";
import type { Announcement } from "@/types";

export interface AnnouncementsResponse {
  items: Announcement[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export const announcementsService = {
  list(params?: Record<string, unknown>) {
    return api.get<AnnouncementsResponse>("/announcements", { params }).then((r) => r.data);
  },
  get(id: number) {
    return api.get<Announcement>(`/announcements/${id}`).then((r) => r.data);
  },
  create(data: Partial<Announcement>) {
    return api.post<Announcement>("/announcements", data).then((r) => r.data);
  },
  update(id: number, data: Partial<Announcement>) {
    return api.put<Announcement>(`/announcements/${id}`, data).then((r) => r.data);
  },
  delete(id: number) {
    return api.delete(`/announcements/${id}`);
  },
};
