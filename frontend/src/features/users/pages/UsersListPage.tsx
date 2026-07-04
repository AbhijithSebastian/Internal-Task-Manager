import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersService } from "@/features/users/services/users";
import { useAuth } from "@/store/auth";
import { openDrawer } from "@/hooks/useDrawer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { FilterBar, type ViewMode } from "@/components/ui/FilterBar";
import { SkeletonKpiRow, SkeletonCard } from "@/components/ui/Skeleton";
import { Plus, Users, UserCheck, UserX, Shield } from "lucide-react";
import { formatRelative } from "@/utils/formatters";
import type { User } from "@/types";

export default function UsersListPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [view, setView] = useState<ViewMode>("list");

  const { data, isLoading } = useQuery({
    queryKey: ["users", page, search, status],
    queryFn: () => usersService.list({ page, search, status, per_page: 20 }),
  });

  const users: User[] = Array.isArray(data?.items) ? data.items : [];
  const total = data?.total || users.length;

  const toggleMutation = useMutation({
    mutationFn: (userId: number) => usersService.toggleActive(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  const activeUsers = users.filter((u) => u.is_active).length;

  return (
    <div className="page-container py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary">Users</h1>
        </div>
        {hasPermission("user-create") && (
          <Button onClick={() => navigate("/work/users/invite")}>
            <Plus className="h-4 w-4" /> Invite User
          </Button>
        )}
      </div>

      {isLoading ? (
        <SkeletonKpiRow cards={3} />
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-tertiary">
              <Users className="h-3.5 w-3.5" /> Total
            </div>
            <p className="text-xl font-bold text-primary">{total}</p>
          </Card>
          <Card className="p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-tertiary">
              <UserCheck className="h-3.5 w-3.5" /> Active
            </div>
            <p className="text-xl font-bold text-primary">{activeUsers}</p>
          </Card>
          <Card className="p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-tertiary">
              <UserX className="h-3.5 w-3.5" /> Inactive
            </div>
            <p className="text-xl font-bold text-primary">{total - activeUsers}</p>
          </Card>
        </div>
      )}

      <FilterBar
        search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} searchPlaceholder="Search users..."
        filters={[
          { key: "status", label: "All Statuses", value: status, onChange: (v) => { setStatus(v); setPage(1); }, options: [
            { value: "active", label: "Active" }, { value: "inactive", label: "Inactive" },
          ]},
        ]}
        view={view} availableViews={["list", "grid"]} onViewChange={setView}
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : view === "grid" ? (
        users.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center bg-surface border border-default rounded-lg">
            <Users className="h-12 w-12 text-tertiary mb-3" />
            <h3 className="text-lg font-semibold text-primary">No users</h3>
            <p className="text-sm text-secondary mt-1">Invite your first user.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {users.map((u) => (
              <Card key={u.id} variant="interactive" onClick={() => openDrawer("user", u.id)}>
                <div className="flex items-center gap-3">
                  <Avatar name={u.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-primary truncate">{u.name}</p>
                    <p className="text-xs text-tertiary truncate">{u.job_title || "—"}</p>
                  </div>
                  <Badge variant={u.is_active ? "success" : "neutral"} size="sm" dot>{u.is_active ? "Active" : "Inactive"}</Badge>
                </div>
                <p className="text-xs text-tertiary mt-2">{u.email}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-subtle">
                  <div className="flex items-center gap-1 text-xs text-tertiary">
                    <Shield className="h-3 w-3" />{u.role_label || u.role || "No role"}
                  </div>
                  <span className="text-xs text-tertiary">Joined {formatRelative(u.created_at)}</span>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center bg-surface border border-default rounded-lg">
          <Users className="h-12 w-12 text-tertiary mb-3" />
          <h3 className="text-lg font-semibold text-primary">No users</h3>
          <p className="text-sm text-secondary mt-1">Invite your first user.</p>
        </div>
      ) : (
        <div className="bg-surface border border-default rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-subtle bg-subtle">
                <th className="text-left px-4 py-3 text-xs font-medium text-tertiary uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-tertiary uppercase tracking-wide">Job Title</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-tertiary uppercase tracking-wide">Department</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-tertiary uppercase tracking-wide">Role</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-tertiary uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-tertiary uppercase tracking-wide">Joined</th>
                {hasPermission("user-edit") && <th className="w-20 px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-subtle last:border-0 hover:bg-hover cursor-pointer transition-colors" onClick={() => openDrawer("user", u.id)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={u.name} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-primary">{u.name}</p>
                        <p className="text-xs text-tertiary">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-secondary">{u.job_title || "—"}</td>
                  <td className="px-4 py-3 text-sm text-secondary">—</td>
                  <td className="px-4 py-3 text-sm text-secondary">{u.role_label || u.role || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={u.is_active ? "success" : "neutral"} size="sm" dot>{u.is_active ? "Active" : "Inactive"}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-tertiary">{formatRelative(u.created_at)}</td>
                  {hasPermission("user-edit") && (
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleMutation.mutate(u.id); }}
                        className="text-xs text-secondary hover:text-primary transition-colors"
                      >
                        {u.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
