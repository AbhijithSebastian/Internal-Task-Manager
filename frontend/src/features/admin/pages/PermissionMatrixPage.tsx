import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Search, ToggleLeft } from "lucide-react";
import type { Permission } from "@/types";

export default function PermissionMatrixPage() {
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["roles", "with-permissions"],
    queryFn: () => api.get("/roles", { params: { with: "permissions" } }).then((r) => r.data?.items || r.data?.data || []),
  });

  const roles: Array<{ id: number; name: string; permissions?: Permission[]; permission_ids?: number[] }> = Array.isArray(data) ? data : [];

  const { data: allPermsData } = useQuery({
    queryKey: ["permissions"],
    queryFn: () => api.get("/permissions").then((r) => r.data?.items || r.data?.data || []),
  });

  const allPermissions: Permission[] = Array.isArray(allPermsData) ? allPermsData : [];

  const groups = useMemo(() => {
    const g = new Set<string>();
    allPermissions.forEach((p) => { if (p.group) g.add(p.group); });
    return Array.from(g).sort();
  }, [allPermissions]);

  const filteredPerms = useMemo(() => {
    return allPermissions.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.label?.toLowerCase().includes(search.toLowerCase())) return false;
      if (selectedGroup && p.group !== selectedGroup) return false;
      return true;
    });
  }, [allPermissions, search, selectedGroup]);

  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: ({ roleId, permId }: { roleId: number; permId: number }) =>
      api.post(`/roles/${roleId}/permissions/toggle`, { permission_id: permId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roles"] }),
  });

  return (
    <div className="page-container py-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-primary">Permission Matrix</h1>
      </div>

      {isLoading ? (
        <Skeleton variant="rect" className="h-96 w-full rounded-lg" />
      ) : (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tertiary" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search permissions..."
                className="w-full h-9 pl-9 pr-3 rounded-md bg-surface border border-default text-sm text-primary placeholder:text-tertiary hover:border-hover focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary transition-colors" />
            </div>
            <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}
              className="h-9 px-3 rounded-md bg-surface border border-default text-sm text-primary hover:border-hover focus:outline-none">
              <option value="">All Groups</option>
              {groups.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div className="overflow-x-auto bg-surface border border-default rounded-lg">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-subtle bg-subtle">
                  <th className="text-left px-4 py-3 text-xs font-medium text-tertiary uppercase tracking-wide sticky left-0 bg-subtle">Permission</th>
                  {roles.map((r) => (
                    <th key={r.id} className="px-3 py-3 text-xs font-medium text-tertiary uppercase tracking-wide text-center min-w-[100px]">{r.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPerms.length === 0 ? (
                  <tr>
                    <td colSpan={roles.length + 1} className="px-4 py-12 text-center text-sm text-secondary">No permissions match your search.</td>
                  </tr>
                ) : (
                  filteredPerms.map((perm) => {
                    const groupChanged = filteredPerms.indexOf(perm) === 0 || filteredPerms[filteredPerms.indexOf(perm) - 1]?.group !== perm.group;
                    return (
                      <tr key={perm.id} className="border-b border-subtle last:border-0 hover:bg-hover transition-colors">
                        <td className="px-4 py-2.5 sticky left-0 bg-surface">
                          <div className="flex items-center gap-2">
                            {groupChanged && perm.group && (
                              <Badge variant="neutral" size="sm">{perm.group}</Badge>
                            )}
                            <span className="text-sm text-primary">{perm.label || perm.name}</span>
                          </div>
                        </td>
                        {roles.map((r) => {
                          const hasPerm = r.permissions?.some((p) => p.id === perm.id) || r.permission_ids?.includes(perm.id) || false;
                          return (
                            <td key={r.id} className="px-3 py-2.5 text-center">
                              <button
                                onClick={() => toggleMutation.mutate({ roleId: r.id, permId: perm.id })}
                                className={`p-1.5 rounded transition-colors ${
                                  hasPerm ? "text-primary bg-primary-soft hover:bg-primary-soft/70" : "text-tertiary hover:text-secondary hover:bg-hover"
                                }`}
                              >
                                <ToggleLeft className={`h-4 w-4 ${hasPerm ? "rotate-0" : "rotate-180 opacity-50"}`} />
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-tertiary">{filteredPerms.length} permission{filteredPerms.length !== 1 ? "s" : ""} · {roles.length} role{roles.length !== 1 ? "s" : ""}</p>
        </>
      )}
    </div>
  );
}
