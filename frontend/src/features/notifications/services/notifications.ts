import { api } from "@/services/api";
import type { Notification } from "@/types";

export interface NotificationsResponse {
  items: Notification[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export const notificationsService = {
  list(params?: Record<string, unknown>) {
    return api.get<NotificationsResponse>("/notifications", { params }).then((r) => r.data);
  },
  markRead(id: number) {
    return api.post(`/notifications/${id}/read`).then((r) => r.data);
  },
  markAllRead() {
    return api.post("/notifications/read-all").then((r) => r.data);
  },
  unreadCount() {
    return api.get<{ count: number }>("/notifications/unread-count").then((r) => r.data);
  },
};
