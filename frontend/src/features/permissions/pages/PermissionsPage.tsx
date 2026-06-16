import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoading } from "@/components/shared/LoadingSpinner";

interface PermissionGroup {
  group: string;
  permissions: Array<{ id: number; name: string; label: string }>;
}

export default function PermissionsPage() {
  const { data, isLoading } = useQuery<PermissionGroup[]>({
    queryKey: ["permission-groups"],
    queryFn: () => api.get("/permissions/groups").then((r) => r.data),
  });

  if (isLoading) return <PageLoading />;

  return (
    <div>
      <PageHeader title="Permissions" description="View all available permissions organized by module." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((group) => (
          <div key={group.group} className="rounded-lg border bg-card p-4">
            <h3 className="mb-2 text-sm font-semibold capitalize">{group.group}</h3>
            <ul className="space-y-1">
              {group.permissions.map((perm) => (
                <li key={perm.id} className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted">
                  {perm.label || perm.name}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
