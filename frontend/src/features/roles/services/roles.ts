import { api } from "@/services/api";
import type { Role, Permission } from "@/types";

export interface RolesResponse {
  items: Role[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export const rolesService = {
  list(params?: Record<string, unknown>) {
    return api.get<RolesResponse>("/roles", { params }).then((r) => r.data);
  },
  get(id: number) {
    return api.get<Role>(`/roles/${id}`).then((r) => r.data);
  },
  getPermissions(roleId: number) {
    return api.get<Permission[]>(`/roles/${roleId}/permissions`).then((r) => r.data);
  },
  updatePermissions(roleId: number, permissionNames: string[]) {
    return api.put(`/roles/${roleId}/permissions`, { permissions: permissionNames }).then((r) => r.data);
  },
};
