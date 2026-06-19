import { api } from "@/services/api";
import type { Role, Permission, User } from "@/types";

export interface RolesResponse {
  items: Role[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface PermissionGroup {
  group: string;
  permissions: Array<{ id: number; name: string; label: string }>;
}

export const rolesService = {
  list(params?: Record<string, unknown>) {
    return api.get<RolesResponse>("/roles", { params }).then((r) => r.data);
  },

  get(id: number) {
    return api.get(`/roles/${id}`).then((r) => (r.data?.data || r.data) as Role);
  },

  create(data: { name: string; guard_name?: string }) {
    return api.post("/roles", data).then((r) => (r.data?.data || r.data) as Role);
  },

  delete(id: number) {
    return api.delete(`/roles/${id}`);
  },

  getPermissions(roleId: number) {
    return api
      .get(`/roles/${roleId}/permissions`)
      .then((r) => {
        const data = r.data;
        return (Array.isArray(data)
          ? data
          : (data as any)?.data || (data as any)?.items || []) as Permission[];
      });
  },

  updatePermissions(roleId: number, permissionIds: number[]) {
    return api
      .put(`/roles/${roleId}/permissions`, { permission_ids: permissionIds })
      .then((r) => r.data);
  },

  getAllPermissions() {
    return api
      .get("/permissions")
      .then((r) => {
        const data = r.data;
        return (Array.isArray(data)
          ? data
          : (data as any)?.items || (data as any)?.data || []) as Permission[];
      });
  },

  getPermissionGroups() {
    return api
      .get("/permissions/groups")
      .then((r) => r.data as PermissionGroup[]);
  },

  getUsers(params?: Record<string, unknown>) {
    return api
      .get<{ items: User[]; total: number }>("/users", { params })
      .then((r) => r.data);
  },

  getUserPermissions(userId: number) {
    return api
      .get(`/permissions/users/${userId}`)
      .then((r) => (r.data?.data || r.data) as Permission[]);
  },

  updateUserPermissions(userId: number, permissionIds: number[]) {
    return api
      .put(`/permissions/users/${userId}`, { permission_ids: permissionIds })
      .then((r) => r.data);
  },

  updateUserRole(userId: number, roleId: number | null) {
    return api
      .put(`/permissions/users/${userId}/role`, { role_id: roleId })
      .then((r) => r.data);
  },
};
