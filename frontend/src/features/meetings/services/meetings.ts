import { api } from "@/services/api";
import type { Meeting } from "@/types";

export interface MeetingsResponse {
  items: Meeting[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export const meetingsService = {
  list(params?: Record<string, unknown>) {
    return api.get<MeetingsResponse>("/meetings", { params }).then((r) => r.data);
  },
  get(id: number) {
    return api.get<Meeting>(`/meetings/${id}`).then((r) => r.data);
  },
  create(data: Partial<Meeting>) {
    return api.post<Meeting>("/meetings", data).then((r) => r.data);
  },
  update(id: number, data: Partial<Meeting>) {
    return api.put<Meeting>(`/meetings/${id}`, data).then((r) => r.data);
  },
  delete(id: number) {
    return api.delete(`/meetings/${id}`);
  },
};
