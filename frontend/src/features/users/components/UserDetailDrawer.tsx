import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useAuth } from "@/store/auth";
import { openDrawer } from "@/hooks/useDrawer";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { Card } from "@/components/ui/Card";
import { formatDate, formatRelative } from "@/utils/formatters";
import { Mail, Shield, Calendar, Clock, CheckCircle2, XCircle, Briefcase, Building2, UserCircle, Activity } from "lucide-react";
import type { User, Project, Task, ActivityLog } from "@/types";

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

  const { data: userTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["user-tasks", userId],
    queryFn: () => api.get("/tasks", { params: { assignee_id: userId, per_page: 10 } }).then((r) => r.data?.items || r.data?.data || []),
    enabled: Boolean(userId),
  });

  const { data: userProjects, isLoading: projectsLoading } = useQuery({
    queryKey: ["user-projects", userId],
    queryFn: () => api.get("/projects", { params: { member_id: userId, per_page: 10 } }).then((r) => r.data?.items || r.data?.data || []),
    enabled: Boolean(userId),
  });

  const { data: userActivity, isLoading: activityLoading } = useQuery({
    queryKey: ["user-activity", userId],
    queryFn: () => api.get("/activity", { params: { causer_id: userId, per_page: 10 } }).then((r) => r.data?.items || r.data?.data || []),
    enabled: Boolean(userId),
  });

  const toggleMutation = useMutation({
    mutationFn: () => api.post(`/users/${userId}/toggle-active`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const u = user as User | undefined;
  const tasks = (Array.isArray(userTasks) ? userTasks : []) as Task[];
  const projects = (Array.isArray(userProjects) ? userProjects : []) as Project[];
  const activity = (Array.isArray(userActivity) ? userActivity : []) as ActivityLog[];

  return (
    <Drawer open={Boolean(userId)} onClose={onClose} title={u?.name || "User"}>
      {isLoading ? (
        <div className="space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <Skeleton variant="circle" className="h-16 w-16" />
            <div className="space-y-2">
              <Skeleton variant="text" className="h-5 w-40 mx-auto" />
              <Skeleton variant="text" className="h-3 w-28 mx-auto" />
            </div>
          </div>
          <Skeleton variant="rect" className="h-32 w-full" />
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
          <div className="flex flex-col items-center text-center">
            <Avatar name={u.name} size="xl" className="mb-3" />
            <h3 className="text-lg font-semibold text-primary">{u.name}</h3>
            <p className="text-sm text-tertiary">{u.job_title || "—"}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={u.is_active ? "success" : "neutral"} size="sm" dot>
                {u.is_active ? "Active" : "Inactive"}
              </Badge>
              {u.role_label && <Badge variant="info" size="sm">{u.role_label}</Badge>}
            </div>
          </div>

          <Card className="p-4">
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-tertiary shrink-0" />
                <span className="text-primary">{u.email}</span>
              </div>
              {u.phone && (
                <div className="flex items-center gap-2">
                  <span className="text-tertiary shrink-0">Phone:</span>
                  <span className="text-primary">{u.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <UserCircle className="h-4 w-4 text-tertiary shrink-0" />
                <span className="text-tertiary">Employee ID:</span>
                <span className="text-primary">—</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-tertiary shrink-0" />
                <span className="text-tertiary">Designation:</span>
                <span className="text-primary">{u.job_title || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-tertiary shrink-0" />
                <span className="text-tertiary">Department:</span>
                <span className="text-primary">—</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-tertiary shrink-0" />
                <span className="text-tertiary">Role:</span>
                <span className="text-primary">{u.role_label || u.role || "—"}</span>
              </div>
            </div>
          </Card>

          <div>
            <h4 className="text-xs font-semibold uppercase text-tertiary tracking-wide mb-3">Details</h4>
            <Card className="p-4">
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-tertiary">Reporting Manager</span>
                  <span className="text-primary">—</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-tertiary">Timezone</span>
                  <span className="text-primary">—</span>
                </div>
                {u.last_login_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-tertiary">Last Login</span>
                    <span className="text-primary flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatRelative(u.last_login_at)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-tertiary">Member Since</span>
                  <span className="text-primary flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(u.created_at)}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase text-tertiary tracking-wide mb-3">
              Projects {projects.length > 0 && `(${projects.length})`}
            </h4>
            {projectsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} variant="rect" className="h-10 w-full rounded-lg" />
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center bg-subtle rounded-lg">
                <Building2 className="h-8 w-8 text-tertiary mb-2" />
                <p className="text-xs text-secondary">No projects assigned</p>
              </div>
            ) : (
              <div className="space-y-2">
                {projects.slice(0, 10).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => openDrawer("project", p.id)}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-subtle hover:bg-hover cursor-pointer transition-colors"
                  >
                    <span className="text-sm text-primary truncate">{p.name}</span>
                    <Badge variant={p.status === "active" ? "success" : p.status === "on_hold" ? "warning" : "neutral"} size="sm">
                      {p.status_label || p.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase text-tertiary tracking-wide mb-3">
              Tasks {tasks.length > 0 && `(${tasks.length})`}
            </h4>
            {tasksLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} variant="rect" className="h-10 w-full rounded-lg" />
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center bg-subtle rounded-lg">
                <Activity className="h-8 w-8 text-tertiary mb-2" />
                <p className="text-xs text-secondary">No tasks assigned</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.slice(0, 10).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => openDrawer("task", t.id)}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-subtle hover:bg-hover cursor-pointer transition-colors"
                  >
                    <span className="text-sm text-primary truncate">{t.title}</span>
                    <Badge variant={t.status === "done" ? "success" : t.status === "blocked" ? "danger" : t.status === "in_progress" ? "warning" : "neutral"} size="sm">
                      {t.status_label || t.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase text-tertiary tracking-wide mb-3">Recent Activity</h4>
            {activityLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} variant="rect" className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : activity.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center bg-subtle rounded-lg">
                <Clock className="h-8 w-8 text-tertiary mb-2" />
                <p className="text-xs text-secondary">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activity.slice(0, 10).map((a) => (
                  <div key={a.id} className="p-2.5 rounded-lg bg-subtle">
                    <p className="text-sm text-primary">{a.description}</p>
                    <p className="text-xs text-tertiary mt-0.5">{formatRelative(a.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {hasPermission("user-edit") && (
            <div className="pt-2 border-t border-subtle">
              <Button
                size="sm"
                variant={u.is_active ? "danger" : "primary"}
                onClick={() => toggleMutation.mutate()}
                loading={toggleMutation.isPending}
              >
                {u.is_active ? (
                  <><XCircle className="h-3.5 w-3.5" /> Deactivate User</>
                ) : (
                  <><CheckCircle2 className="h-3.5 w-3.5" /> Activate User</>
                )}
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
