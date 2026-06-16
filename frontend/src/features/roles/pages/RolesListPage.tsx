import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { rolesService } from "@/features/roles/services/roles";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Shield } from "lucide-react";
import type { Role } from "@/types";

export default function RolesListPage() {
  const [expandedRole, setExpandedRole] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: () => rolesService.list(),
  });

  const { data: rolePermissions } = useQuery({
    queryKey: ["role-permissions", expandedRole],
    queryFn: () => rolesService.getPermissions(expandedRole!),
    enabled: expandedRole !== null,
  });

  const columns: Column<Role>[] = [
    { key: "name", label: "Role", render: (r) => (
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium capitalize">{r.name}</span>
      </div>
    )},
    { key: "guard_name", label: "Guard" },
    { key: "permissions_count", label: "Permissions",
      render: (r) => `${(r as any).permissions_count || 0} permissions`,
    },
  ];

  return (
    <div>
      <PageHeader title="Roles" description="Manage roles and their permissions." />
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        loading={isLoading}
        keyExtractor={(r) => r.id}
        emptyMessage="No roles found."
      />
      {data?.items?.map((role) => (
        <div key={role.id} className="mt-4">
          <button
            className="text-sm text-primary hover:underline"
            onClick={() => setExpandedRole(expandedRole === role.id ? null : role.id)}
          >
            {expandedRole === role.id ? "Hide" : "Show"} permissions for {role.name}
          </button>
          {expandedRole === role.id && rolePermissions && (
            <div className="mt-2 rounded-lg border bg-card p-4">
              <div className="flex flex-wrap gap-2">
                {rolePermissions.map((perm) => (
                  <span key={perm.id} className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                    {perm.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
