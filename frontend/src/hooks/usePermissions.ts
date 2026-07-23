import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { queryKeys } from "@/services/queryKeys";
import type { Permission } from "@/types";

interface PermissionGroup {
  group: string;
  permissions: Permission[];
}

export function usePermissions() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.admin.permissions,
    queryFn: () => api.get("/permissions").then((r) => r.data?.groups || r.data?.items || r.data?.data || []),
    staleTime: 5 * 60 * 1000,
  });

  const permissionGroups = useMemo(() => {
    if (Array.isArray(data)) {
      if (data.length > 0 && "group" in data[0] && "permissions" in data[0]) {
        return data as PermissionGroup[];
      }
      if (data.length > 0 && "name" in data[0]) {
        const perms = data as Permission[];
        const map: Record<string, Permission[]> = {};
        perms.forEach((p) => {
          const g = p.group || "Other";
          if (!map[g]) map[g] = [];
          map[g].push(p);
        });
        return Object.entries(map).map(([group, permissions]) => ({ group, permissions }));
      }
    }
    if (data && typeof data === "object" && "groups" in data) {
      return (data as { groups: PermissionGroup[] }).groups;
    }
    return [];
  }, [data]);

  const allPermissions = useMemo(() => {
    return permissionGroups.flatMap((g) => g.permissions);
  }, [permissionGroups]);

  return { permissionGroups, allPermissions, isLoading };
}
