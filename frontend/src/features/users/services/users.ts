import { api } from "@/services/api";
import type { User } from "@/types";

export interface UsersResponse {
  items: User[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export const usersService = {
  list(params?: Record<string, unknown>) {
    return api.get<UsersResponse>("/users", { params }).then((r) => r.data);
  },
  get(id: number) {
    return api.get<User>(`/users/${id}`).then((r) => r.data);
  },
  create(data: Partial<User> & { password: string; role_id?: number }) {
    return api.post<User>("/users", data).then((r) => r.data);
  },
  update(id: number, data: Partial<User> & { password?: string; role_id?: number }) {
    return api.put<User>(`/users/${id}`, data).then((r) => r.data);
  },
  delete(id: number) {
    return api.delete(`/users/${id}`);
  },
  toggleActive(id: number) {
    return api.post(`/users/${id}/toggle-active`);
  },
};
