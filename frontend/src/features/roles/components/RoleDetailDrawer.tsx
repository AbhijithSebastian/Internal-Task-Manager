import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Avatar, Badge, Button, Card, Drawer, Skeleton } from "@/design-system";
import { Shield, Calendar, Users, Pencil, AlertCircle } from "lucide-react";
import { formatRelative } from "@/utils/formatters";
import { DEFAULT_ROLE_COLOR } from "@/design-system/tokens/palette";
import type { Role, Permission, User } from "@/types";

interface RoleDetailDrawerProps {
  roleId: number | null;
  onClose: () => void;
}

export function RoleDetailDrawer({ roleId, onClose }: RoleDetailDrawerProps) {
  const navigate = useNavigate();

  const {
    data: role,
    isLoading: roleLoading,
    isError: roleError,
  } = useQuery({
    queryKey: ["role", roleId],
    queryFn: () =>
      api
        .get(`/roles/${roleId}`, { params: { with: "permissions" } })
        .then((r) => r.data?.data || r.data),
    enabled: Boolean(roleId),
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () =>
      api
        .get("/users", { params: { per_page: 100 } })
        .then((r) => r.data?.items || r.data?.data || []),
    enabled: Boolean(roleId),
  });

  const r = role as (Role & { permissions?: Permission[] }) | undefined;
  const perms = r?.permissions || [];
  const users = (Array.isArray(usersData) ? usersData : []) as User[];

  const usersWithRole = useMemo(() => {
    if (!r) return [];
    return users.filter((u) => u.roles?.some((ur) => ur.id === r.id) || u.role === r.name);
  }, [users, r]);

  const groupedPerms = useMemo(() => {
    return perms.reduce<Record<string, Permission[]>>((acc, p) => {
      const group = p.group || "Other";
      if (!acc[group]) acc[group] = [];
      acc[group].push(p);
      return acc;
    }, {});
  }, [perms]);

  const handleEdit = () => {
    onClose();
    navigate("/work/admin/roles");
  };

  const color = r?.color || DEFAULT_ROLE_COLOR;

  return (
    <Drawer open={Boolean(roleId)} onClose={onClose} title={r?.name || "Role"}>
      {roleLoading ? (
        <div className="space-y-4">
          <Skeleton variant="rect" className="h-6 w-48" />
          <Skeleton variant="rect" className="h-8 w-32" />
          <Skeleton variant="rect" className="h-6 w-36" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rect" className="h-16 w-full" />
          ))}
        </div>
      ) : roleError || !r ? (
        <div className="flex flex-col items-center py-12 text-center">
          <AlertCircle className="mb-3 h-12 w-12 text-semantic-danger" />
          <p className="text-sm text-secondary">Failed to load role</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${color}20`, color }}
            >
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-primary">{r.name}</h3>
                {r.is_system && (
                  <Badge variant="info" size="sm">
                    System
                  </Badge>
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-2">
                <Badge variant={r.is_active ? "success" : "neutral"} size="sm" dot>
                  {r.is_active ? "Active" : "Inactive"}
                </Badge>
                <Badge variant="neutral" size="sm">
                  {r.guard_name}
                </Badge>
                <span className="text-xs text-tertiary">
                  {perms.length} permission{perms.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>

          {r.description && (
            <p className="rounded-lg bg-subtle px-3 py-2 text-sm text-secondary">{r.description}</p>
          )}

          <Card className="space-y-2 p-3.5">
            <p className="flex items-center gap-1.5 text-xs text-tertiary">
              <Calendar className="h-3.5 w-3.5" />
              Created {formatRelative(r.created_at)}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-tertiary">
              <Users className="h-3.5 w-3.5" />
              {usersLoading
                ? "Loading..."
                : `${usersWithRole.length} user${
                    usersWithRole.length !== 1 ? "s" : ""
                  } with this role`}
            </div>
          </Card>

          {usersWithRole.length > 0 && (
            <Card>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
                <Users className="h-4 w-4 text-tertiary" />
                Users
              </h4>
              <div className="space-y-2">
                {usersWithRole.slice(0, 10).map((u) => (
                  <div key={u.id} className="flex items-center gap-2.5">
                    <Avatar name={u.name} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm text-primary">{u.name}</p>
                      <p className="truncate text-xs text-tertiary">{u.email}</p>
                    </div>
                  </div>
                ))}
                {usersWithRole.length > 10 && (
                  <p className="text-xs text-tertiary">+{usersWithRole.length - 10} more</p>
                )}
              </div>
            </Card>
          )}

          {Object.entries(groupedPerms).length > 0 ? (
            Object.entries(groupedPerms).map(([group, groupPerms]) => (
              <div key={group}>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-tertiary">
                  {group}
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {groupPerms.map((p) => (
                    <Badge key={p.id} variant="info" size="sm">
                      {p.label || p.name}
                    </Badge>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-secondary">No permissions assigned.</p>
          )}

          <Button onClick={handleEdit} className="w-full">
            <Pencil className="h-4 w-4" /> Manage Role
          </Button>
        </div>
      )}
    </Drawer>
  );
}
