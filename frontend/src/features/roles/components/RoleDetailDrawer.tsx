import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Drawer } from "@/components/ui/Drawer";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import {
  Shield,
  Calendar,
  Users,
  Pencil,
  AlertCircle,
} from "lucide-react";
import { formatRelative } from "@/utils/formatters";
import type { Role, Permission, User } from "@/types";

interface RoleDetailDrawerProps {
  roleId: number | null;
  onClose: () => void;
}

export function RoleDetailDrawer({ roleId, onClose }: RoleDetailDrawerProps) {
  const navigate = useNavigate();

  const { data: role, isLoading: roleLoading, isError: roleError } = useQuery({
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

  const r = role as
    | (Role & { permissions?: Permission[] })
    | undefined;
  const perms = r?.permissions || [];
  const users = (Array.isArray(usersData) ? usersData : []) as User[];

  const usersWithRole = useMemo(() => {
    if (!r) return [];
    return users.filter(
      (u) =>
        u.roles?.some((ur) => ur.id === r.id) || u.role === r.name
    );
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

  return (
    <Drawer
      open={Boolean(roleId)}
      onClose={onClose}
      title={r?.name || "Role"}
    >
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
          <AlertCircle className="h-12 w-12 text-semantic-danger mb-3" />
          <p className="text-sm text-secondary">Failed to load role</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary">
                {r.name}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="neutral" size="sm">
                  {r.guard_name}
                </Badge>
                <span className="text-xs text-tertiary">
                  {perms.length} permission
                  {perms.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>

          <Card className="p-3.5 space-y-2">
            <p className="text-xs text-tertiary flex items-center gap-1.5">
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
              <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-tertiary" />
                Users
              </h4>
              <div className="space-y-2">
                {usersWithRole.slice(0, 10).map((u) => (
                  <div key={u.id} className="flex items-center gap-2.5">
                    <Avatar name={u.name} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm text-primary truncate">
                        {u.name}
                      </p>
                      <p className="text-xs text-tertiary truncate">
                        {u.email}
                      </p>
                    </div>
                  </div>
                ))}
                {usersWithRole.length > 10 && (
                  <p className="text-xs text-tertiary">
                    +{usersWithRole.length - 10} more
                  </p>
                )}
              </div>
            </Card>
          )}

          {Object.entries(groupedPerms).length > 0 ? (
            Object.entries(groupedPerms).map(([group, groupPerms]) => (
              <div key={group}>
                <h4 className="text-xs font-semibold uppercase text-tertiary tracking-wide mb-2">
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
            <Pencil className="h-4 w-4" /> Edit Permissions
          </Button>
        </div>
      )}
    </Drawer>
  );
}
