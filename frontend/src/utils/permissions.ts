import type { User } from "@/types";

export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false;
  if (user.is_super_admin) return true;
  return user.permissions?.includes(permission) ?? false;
}

export function hasAnyPermission(user: User | null, permissions: string[]): boolean {
  return permissions.some((p) => hasPermission(user, p));
}

export function hasRole(user: User | null, role: string): boolean {
  if (!user) return false;
  return user.role === role;
}
