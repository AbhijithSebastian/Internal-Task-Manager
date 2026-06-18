import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useAuth } from "@/store/auth";
import { openDrawer } from "@/hooks/useDrawer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Plus, Shield, Trash2 } from "lucide-react";
import type { Role } from "@/types";

export default function RoleListPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: () => api.get("/roles").then((r) => r.data?.items || r.data?.data || []),
  });

  const roles: Role[] = Array.isArray(data) ? data : [];

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/roles/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["roles"] }); setDeleteId(null); },
  });

  return (
    <div className="page-container py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary">Roles</h1>
        </div>
        {hasPermission("role-create") && (
          <Button onClick={() => openDrawer("role-new", 0)}><Plus className="h-4 w-4" /> New Role</Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rect" className="h-20 w-full rounded-lg" />)}</div>
      ) : roles.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center bg-surface border border-default rounded-lg">
          <Shield className="h-12 w-12 text-tertiary mb-3" />
          <h3 className="text-lg font-semibold text-primary">No roles defined</h3>
          <p className="text-sm text-secondary mt-1">Create roles to control access.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {roles.map((r) => (
            <Card key={r.id} variant="interactive" onClick={() => openDrawer("role", r.id)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary">{r.name}</p>
                    <p className="text-xs text-tertiary">{r.permissions?.length || 0} permissions</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="neutral" size="sm">{r.guard_name}</Badge>
                  {hasPermission("role-delete") && (
                    <button onClick={(e) => { e.stopPropagation(); setDeleteId(r.id); }}
                      className="p-1.5 rounded text-tertiary hover:text-danger hover:bg-danger-soft transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/30" onClick={() => setDeleteId(null)}>
          <Card className="w-80 mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-primary mb-2">Delete role?</h3>
            <p className="text-sm text-secondary mb-4">This action cannot be undone.</p>
            <div className="flex items-center gap-2">
              <Button variant="danger" size="sm" onClick={() => deleteMutation.mutate(deleteId)} loading={deleteMutation.isPending}>Delete</Button>
              <Button variant="secondary" size="sm" onClick={() => setDeleteId(null)}>Cancel</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
