import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useAuth } from "@/store/auth";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { Card } from "@/components/ui/Card";
import { formatDate, formatRelative } from "@/utils/formatters";
import { Mail, Shield, Calendar, Clock, CheckCircle2, XCircle } from "lucide-react";
import type { User } from "@/types";

interface UserDetailDrawerProps {
  userId: number | null;
  onClose: () => void;
}

export function UserDetailDrawer({ userId, onClose }: UserDetailDrawerProps) {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => api.get(`/users/${userId}`).then((r) => r.data?.data || r.data),
    enabled: Boolean(userId),
  });

  const { data: userTasks } = useQuery({
    queryKey: ["user-tasks", userId],
    queryFn: () => api.get("/tasks", { params: { assignee_id: userId, per_page: 5 } }).then((r) => r.data?.items || r.data?.data || []),
    enabled: Boolean(userId),
  });

  const { data: userProjects } = useQuery({
    queryKey: ["user-projects", userId],
    queryFn: () => api.get("/projects", { params: { member_id: userId, per_page: 5 } }).then((r) => r.data?.items || r.data?.data || []),
    enabled: Boolean(userId),
  });

  const toggleMutation = useMutation({
    mutationFn: () => api.post(`/users/${userId}/toggle-active`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["user", userId] }); queryClient.invalidateQueries({ queryKey: ["users"] }); },
  });

  const u = user as User | undefined;
  const tasks = Array.isArray(userTasks) ? userTasks : [];
  const projects = Array.isArray(userProjects) ? userProjects : [];

  return (
    <Drawer open={Boolean(userId)} onClose={onClose} title={u?.name || "User"}>
      {isLoading ? (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton variant="circle" className="h-14 w-14" />
            <div className="space-y-2">
              <Skeleton variant="text" className="h-5 w-40" />
              <Skeleton variant="text" className="h-3 w-28" />
            </div>
          </div>
          <Skeleton variant="rect" className="h-32 w-full" />
          <Skeleton variant="rect" className="h-32 w-full" />
        </div>
      ) : !u ? (
        <div className="flex flex-col items-center py-12 text-center">
          <XCircle className="h-12 w-12 text-tertiary mb-3" />
          <p className="text-sm text-secondary">User not found</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar name={u.name} size="lg" />
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-primary truncate">{u.name}</h3>
              <p className="text-sm text-tertiary">{u.job_title || "—"}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={u.is_active ? "success" : "neutral"} size="sm" dot>
                  {u.is_active ? "Active" : "Inactive"}
                </Badge>
                {u.role_label && <Badge variant="info" size="sm">{u.role_label}</Badge>}
              </div>
            </div>
          </div>

          <Card>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-tertiary" />
                <span className="text-primary">{u.email}</span>
              </div>
              {u.phone && (
                <div className="flex items-center gap-2">
                  <span className="text-tertiary">Phone:</span>
                  <span className="text-primary">{u.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-tertiary" />
                <span className="text-primary">{u.role_label || u.role || "No role"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-tertiary" />
                <span className="text-primary">Joined {formatDate(u.created_at)}</span>
              </div>
              {u.last_login_at && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-tertiary" />
                  <span className="text-primary">Last login {formatRelative(u.last_login_at)}</span>
                </div>
              )}
            </div>
          </Card>

          {tasks.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase text-tertiary tracking-wide mb-3">Active Tasks ({tasks.length})</h4>
              <div className="space-y-2">
                {tasks.slice(0, 5).map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between p-2.5 rounded-lg bg-subtle">
                    <span className="text-sm text-primary truncate">{t.title}</span>
                    <Badge variant={t.status === "done" ? "success" : t.status === "blocked" ? "danger" : t.status === "in_progress" ? "warning" : "neutral"} size="sm">
                      {t.status_label || t.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {projects.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase text-tertiary tracking-wide mb-3">Projects ({projects.length})</h4>
              <div className="space-y-2">
                {projects.slice(0, 5).map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg bg-subtle">
                    <span className="text-sm text-primary truncate">{p.name}</span>
                    <Badge variant={p.status === "active" ? "success" : p.status === "on_hold" ? "warning" : "neutral"} size="sm">
                      {p.status_label || p.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasPermission("user-edit") && (
            <div className="pt-2 border-t border-subtle">
              <Button size="sm" variant={u.is_active ? "danger" : "primary"} onClick={() => toggleMutation.mutate()} loading={toggleMutation.isPending}>
                {u.is_active ? <><XCircle className="h-3.5 w-3.5" /> Deactivate User</> : <><CheckCircle2 className="h-3.5 w-3.5" /> Activate User</>}
              </Button>
            </div>
          )}

          <div className="space-y-1 text-xs text-tertiary">
            <p>User ID: #{u.id}</p>
            {u.updated_at && <p>Updated {formatRelative(u.updated_at)}</p>}
          </div>
        </div>
      )}
    </Drawer>
  );
}
