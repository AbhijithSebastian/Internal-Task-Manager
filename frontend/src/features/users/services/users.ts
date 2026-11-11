import { api } from "@/services/api";
import type { User } from "@/types";

export const usersService = {
  list: (params?: Record<string, unknown>) => api.get("/users", { params }).then((r) => r.data),
  get: (id: number) => api.get(`/users/${id}`).then((r) => r.data?.data || r.data),
  create: (data: Partial<User>) => api.post("/users", data).then((r) => r.data?.data || r.data),
  update: (id: number, data: Partial<User>) =>
    api.put(`/users/${id}`, data).then((r) => r.data?.data || r.data),
  delete: (id: number) => api.delete(`/users/${id}`),
  toggleActive: (id: number) => api.post(`/users/${id}/toggle-active`),
  search: (q: string) =>
    api.get("/users/search", { params: { q } }).then((r) => r.data?.items || r.data?.data || []),
};
