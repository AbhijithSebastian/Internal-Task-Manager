import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Drawer } from "@/components/ui/Drawer";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Card } from "@/components/ui/Card";
import { Shield, Calendar } from "lucide-react";
import { formatRelative } from "@/utils/formatters";
import type { Role, Permission } from "@/types";

interface RoleDetailDrawerProps {
  roleId: number | null;
  onClose: () => void;
}

export function RoleDetailDrawer({ roleId, onClose }: RoleDetailDrawerProps) {
  const { data: role, isLoading } = useQuery({
    queryKey: ["role", roleId],
    queryFn: () => api.get(`/roles/${roleId}`, { params: { with: "permissions" } }).then((r) => r.data?.data || r.data),
    enabled: Boolean(roleId),
  });

  const r = role as (Role & { permissions?: Permission[] }) | undefined;
  const perms = r?.permissions || [];

  const groupedPerms = perms.reduce<Record<string, Permission[]>>((acc, p) => {
    const group = p.group || "Other";
    if (!acc[group]) acc[group] = [];
    acc[group].push(p);
    return acc;
  }, {});

  return (
    <Drawer open={Boolean(roleId)} onClose={onClose} title={r?.name || "Role"}>
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton variant="rect" className="h-6 w-48" />
          <Skeleton variant="rect" className="h-8 w-32" />
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rect" className="h-20 w-full" />)}
        </div>
      ) : !r ? (
        <div className="flex flex-col items-center py-12 text-center">
          <Shield className="h-12 w-12 text-tertiary mb-3" />
          <p className="text-sm text-secondary">Role not found</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary">{r.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="neutral" size="sm">{r.guard_name}</Badge>
                <span className="text-xs text-tertiary">{perms.length} permission{perms.length !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>

          <Card>
            <p className="text-xs text-tertiary flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Created {formatRelative(r.created_at)}
            </p>
          </Card>

          {Object.entries(groupedPerms).length > 0 ? (
            Object.entries(groupedPerms).map(([group, groupPerms]) => (
              <div key={group}>
                <h4 className="text-xs font-semibold uppercase text-tertiary tracking-wide mb-2">{group}</h4>
                <div className="flex flex-wrap gap-1.5">
                  {groupPerms.map((p) => (
                    <Badge key={p.id} variant="info" size="sm">{p.label || p.name}</Badge>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-secondary">No permissions assigned.</p>
          )}
        </div>
      )}
    </Drawer>
  );
}
