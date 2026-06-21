import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
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
import { cn } from "@/lib/utils";
import { Mail, Shield, Calendar, Clock, CheckCircle2, XCircle, Briefcase, Building2, UserCircle, Activity, Edit3, Check, Save, Search } from "lucide-react";
import type { User, Project, Task, ActivityLog, Permission } from "@/types";

interface UserDetailDrawerProps {
  userId: number | null;
  onClose: () => void;
}

export function UserDetailDrawer({ userId, onClose }: UserDetailDrawerProps) {
  const navigate = useNavigate();
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

  const [customPerms, setCustomPerms] = useState<Set<string>>(new Set());
  const [inheritPerms, setInheritPerms] = useState(true);
  const [permSearch, setPermSearch] = useState("");

  const { data: allPerms, isLoading: permsLoading } = useQuery({
    queryKey: ["permissions"],
    queryFn: () =>
      api.get("/permissions").then((r) => r.data?.items || r.data?.data || []),
    enabled: Boolean(userId),
  });

  const permissions = (Array.isArray(allPerms) ? allPerms : []) as Permission[];

  const u = user as User | undefined;

  useEffect(() => {
    if (u) {
      setInheritPerms(u.inherit_role_permissions);
      setCustomPerms(new Set(u.permissions || []));
    }
  }, [u]);

  const savePermsMutation = useMutation({
    mutationFn: (data: { inherit_role_permissions: boolean; permissions: string[] }) =>
      api.put(`/users/${userId}`, data).then((r) => r.data?.data || r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const handleTogglePerm = (permName: string) => {
    setCustomPerms((prev) => {
      const next = new Set(prev);
      if (next.has(permName)) next.delete(permName);
      else next.add(permName);
      return next;
    });
  };

  const handleSavePerms = () => {
    savePermsMutation.mutate({
      inherit_role_permissions: inheritPerms,
      permissions: Array.from(customPerms),
    });
  };

  const hasPermsChanged = () => {
    if (!u) return false;
    if (inheritPerms !== u.inherit_role_permissions) return true;
    const oldPerms = new Set(u.permissions || []);
    if (oldPerms.size !== customPerms.size) return true;
    for (const p of oldPerms) {
      if (!customPerms.has(p)) return true;
    }
    return false;
  };

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

          {hasPermission("user-edit") && (
            <div className="flex justify-center">
              <Button size="sm" variant="secondary" onClick={() => { onClose(); navigate(`/work/users/${u.id}/edit`); }}>
                <Edit3 className="h-3.5 w-3.5" /> Edit Profile
              </Button>
            </div>
          )}

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
                <span className="text-primary">{u.employee_id || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-tertiary shrink-0" />
                <span className="text-tertiary">Designation:</span>
                <span className="text-primary">{u.designation || u.job_title || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-tertiary shrink-0" />
                <span className="text-tertiary">Department:</span>
                <span className="text-primary">{u.department || "—"}</span>
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
                  <span className="text-primary">{u.reporting_manager_id ? `#${u.reporting_manager_id}` : "—"}</span>
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

          {hasPermission("user-edit") && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold uppercase text-tertiary tracking-wide">
                  <Shield className="h-3.5 w-3.5 inline mr-1 -mt-0.5" />
                  Permissions
                </h4>
                {hasPermsChanged() && (
                  <Button size="sm" onClick={handleSavePerms} loading={savePermsMutation.isPending}>
                    <Save className="h-3.5 w-3.5" /> Save
                  </Button>
                )}
              </div>
              <Card className="p-4 space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-primary">Inherit role permissions</p>
                    <p className="text-xs text-tertiary">When enabled, user inherits all permissions from their role</p>
                  </div>
                  <button
                    onClick={() => setInheritPerms(!inheritPerms)}
                    className={cn(
                      "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                      inheritPerms ? "bg-primary" : "bg-subtle"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform",
                        inheritPerms ? "translate-x-[18px]" : "translate-x-[3px]"
                      )}
                    />
                  </button>
                </label>
                {!inheritPerms && (
                  <div className="space-y-3 pt-2 border-t border-subtle">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-tertiary pointer-events-none" />
                      <input
                        type="text"
                        value={permSearch}
                        onChange={(e) => setPermSearch(e.target.value)}
                        placeholder="Search permissions..."
                        className="w-full h-8 pl-8 pr-3 rounded-md bg-surface border border-default text-xs text-primary placeholder:text-tertiary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    {permsLoading ? (
                      <div className="space-y-1">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Skeleton key={i} variant="text" className="h-6 w-full" />
                        ))}
                      </div>
                    ) : (
                      Object.entries(
                        permissions
                          .filter((p) => {
                            if (!permSearch) return true;
                            const q = permSearch.toLowerCase();
                            return (
                              p.name.toLowerCase().includes(q) ||
                              (p.label || "").toLowerCase().includes(q) ||
                              (p.group || "").toLowerCase().includes(q)
                            );
                          })
                          .reduce<Record<string, Permission[]>>((acc, p) => {
                            const g = p.group || "Other";
                            if (!acc[g]) acc[g] = [];
                            acc[g].push(p);
                            return acc;
                          }, {})
                      ).map(([group, perms]) => (
                        <div key={group}>
                          <p className="text-[10px] font-semibold uppercase text-tertiary tracking-wide mb-1">{group}</p>
                          <div className="flex flex-wrap gap-1">
                            {perms.map((p) => {
                              const enabled = customPerms.has(p.name);
                              return (
                                <button
                                  key={p.id}
                                  onClick={() => handleTogglePerm(p.name)}
                                  className={cn(
                                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors",
                                    enabled
                                      ? "bg-primary-soft text-primary"
                                      : "bg-subtle text-secondary hover:bg-hover"
                                  )}
                                >
                                  {enabled && <Check className="h-2.5 w-2.5" />}
                                  {p.label || p.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </Card>
            </div>
          )}

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
