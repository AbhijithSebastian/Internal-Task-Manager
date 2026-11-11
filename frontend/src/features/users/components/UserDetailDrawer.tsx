import { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { useAuth } from "@/store/auth";
import { openDrawer } from "@/hooks/useDrawer";
import { Avatar, Badge, Button, Card, Drawer, Skeleton } from "@/design-system";
import { formatDate, formatRelative } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import { DEFAULT_ROLE_COLOR } from "@/design-system/tokens/palette";
import {
  Mail,
  Shield,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Briefcase,
  Building2,
  UserCircle,
  Activity,
  Edit3,
  Check,
  Save,
  Search,
  Users,
} from "lucide-react";
import type { User, Project, Task, ActivityLog, Permission, Role } from "@/types";

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
    queryFn: () =>
      api
        .get("/tasks", { params: { assignee_id: userId, per_page: 10 } })
        .then((r) => r.data?.items || r.data?.data || []),
    enabled: Boolean(userId),
  });

  const { data: userProjects, isLoading: projectsLoading } = useQuery({
    queryKey: ["user-projects", userId],
    queryFn: () =>
      api
        .get("/projects", { params: { member_id: userId, per_page: 10 } })
        .then((r) => r.data?.items || r.data?.data || []),
    enabled: Boolean(userId),
  });

  const { data: userActivity, isLoading: activityLoading } = useQuery({
    queryKey: ["user-activity", userId],
    queryFn: () =>
      api
        .get("/activity", { params: { causer_id: userId, per_page: 10 } })
        .then((r) => r.data?.items || r.data?.data || []),
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
      api.get("/permissions").then((r) => r.data?.groups || r.data?.items || r.data?.data || []),
    enabled: Boolean(userId),
  });

  const permissionGroups = useMemo(() => {
    if (Array.isArray(allPerms)) {
      if (allPerms.length > 0 && "group" in allPerms[0] && "permissions" in allPerms[0]) {
        return allPerms as { group: string; permissions: Permission[] }[];
      }
      if (allPerms.length > 0 && "name" in allPerms[0]) {
        const perms = allPerms as Permission[];
        const map: Record<string, Permission[]> = {};
        perms.forEach((p) => {
          const g = p.group || "Other";
          if (!map[g]) map[g] = [];
          map[g].push(p);
        });
        return Object.entries(map).map(([group, permissions]) => ({ group, permissions }));
      }
    }
    return [];
  }, [allPerms]);

  const allPermissions = useMemo(() => {
    return permissionGroups.flatMap((g) => g.permissions);
  }, [permissionGroups]);

  const u = user as
    | (User & {
        effective_permissions?: string[];
        roles?: Role[];
        inherit_role_permissions: boolean;
      })
    | undefined;

  useEffect(() => {
    if (u) {
      setInheritPerms(u.inherit_role_permissions);
      setCustomPerms(new Set(u.permissions || []));
    }
  }, [u]);

  const savePermsMutation = useMutation({
    mutationFn: ({ userId, permissionIds }: { userId: number; permissionIds: number[] }) =>
      api.put(`/permissions/users/${userId}`, { permission_ids: permissionIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const saveInheritMutation = useMutation({
    mutationFn: ({ userId, inherit }: { userId: number; inherit: boolean }) =>
      api.put(`/permissions/users/${userId}/inherit`, { inherit }),
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
    if (!userId) return;
    const permIds = allPermissions.filter((p) => customPerms.has(p.name)).map((p) => p.id);
    savePermsMutation.mutate({ userId, permissionIds: permIds });
  };

  const handleToggleInherit = () => {
    if (!userId) return;
    const next = !inheritPerms;
    setInheritPerms(next);
    saveInheritMutation.mutate({ userId, inherit: next });
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

  const filteredPerms = useMemo(() => {
    if (!permSearch) return permissionGroups;
    const q = permSearch.toLowerCase();
    return permissionGroups
      .map((g) => ({
        ...g,
        permissions: g.permissions.filter(
          (p) => p.name.toLowerCase().includes(q) || (p.label || "").toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.permissions.length > 0);
  }, [permissionGroups, permSearch]);

  const tasks = (Array.isArray(userTasks) ? userTasks : []) as Task[];
  const projects = (Array.isArray(userProjects) ? userProjects : []) as Project[];
  const activity = (Array.isArray(userActivity) ? userActivity : []) as ActivityLog[];

  const roleColors: Record<string, string> = {};
  (u?.roles || []).forEach((r) => {
    roleColors[r.name] = (r as Role & { color?: string }).color || DEFAULT_ROLE_COLOR;
  });

  return (
    <Drawer open={Boolean(userId)} onClose={onClose} title={u?.name || "User"}>
      {isLoading ? (
        <div className="space-y-6">
          <div className="flex flex-col items-center space-y-3 text-center">
            <Skeleton variant="circle" className="h-16 w-16" />
            <div className="space-y-2">
              <Skeleton variant="text" className="mx-auto h-5 w-40" />
              <Skeleton variant="text" className="mx-auto h-3 w-28" />
            </div>
          </div>
          <Skeleton variant="rect" className="h-32 w-full" />
          <Skeleton variant="rect" className="h-32 w-full" />
          <Skeleton variant="rect" className="h-32 w-full" />
        </div>
      ) : !u ? (
        <div className="flex flex-col items-center py-12 text-center">
          <XCircle className="mb-3 h-12 w-12 text-tertiary" />
          <p className="text-sm text-secondary">User not found</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col items-center text-center">
            <Avatar name={u.name} size="xl" className="mb-3" />
            <h3 className="text-lg font-semibold text-primary">{u.name}</h3>
            <p className="text-sm text-tertiary">{u.job_title || "—"}</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant={u.is_active ? "success" : "neutral"} size="sm" dot>
                {u.is_active ? "Active" : "Inactive"}
              </Badge>
              {u.role_label && (
                <Badge variant="info" size="sm">
                  {u.role_label}
                </Badge>
              )}
            </div>
          </div>

          {hasPermission("user-edit") && (
            <div className="flex justify-center">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  onClose();
                  navigate(`/work/users/${u.id}/edit`);
                }}
              >
                <Edit3 className="h-3.5 w-3.5" /> Edit Profile
              </Button>
            </div>
          )}

          <Card className="p-4">
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-tertiary" />
                <span className="text-primary">{u.email}</span>
              </div>
              {u.phone && (
                <div className="flex items-center gap-2">
                  <span className="shrink-0 text-tertiary">Phone:</span>
                  <span className="text-primary">{u.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <UserCircle className="h-4 w-4 shrink-0 text-tertiary" />
                <span className="text-tertiary">Employee ID:</span>
                <span className="text-primary">{u.employee_id || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 shrink-0 text-tertiary" />
                <span className="text-tertiary">Designation:</span>
                <span className="text-primary">{u.designation || u.job_title || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 shrink-0 text-tertiary" />
                <span className="text-tertiary">Department:</span>
                <span className="text-primary">{u.department || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 shrink-0 text-tertiary" />
                <span className="text-tertiary">Role:</span>
                <span className="text-primary">{u.role_label || u.role || "—"}</span>
              </div>
            </div>
          </Card>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-tertiary">
              Details
            </h4>
            <Card className="p-4">
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-tertiary">Reporting Manager</span>
                  <span className="text-primary">
                    {u.reporting_manager_id ? `#${u.reporting_manager_id}` : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-tertiary">Timezone</span>
                  <span className="text-primary">—</span>
                </div>
                {u.last_login_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-tertiary">Last Login</span>
                    <span className="flex items-center gap-1 text-primary">
                      <Clock className="h-3.5 w-3.5" />
                      {formatRelative(u.last_login_at)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-tertiary">Member Since</span>
                  <span className="flex items-center gap-1 text-primary">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(u.created_at)}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Roles section */}
          {u.roles && u.roles.length > 0 && (
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-tertiary">
                <Users className="-mt-0.5 mr-1 inline h-3.5 w-3.5" />
                Roles ({u.roles.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {u.roles.map((r) => {
                  const color = roleColors[r.name] || DEFAULT_ROLE_COLOR;
                  return (
                    <span
                      key={r.id}
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: `${color}20`,
                        color,
                      }}
                    >
                      <Shield className="h-3 w-3" />
                      {r.name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Effective Permissions */}
          {u.effective_permissions && u.effective_permissions.length > 0 && (
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-tertiary">
                <Shield className="-mt-0.5 mr-1 inline h-3.5 w-3.5" />
                Effective Permissions ({u.effective_permissions.length})
              </h4>
              <div className="flex flex-wrap gap-1">
                {u.effective_permissions.slice(0, 20).map((p) => (
                  <Badge key={p} variant="info" size="sm">
                    {p.split(".").pop() || p}
                  </Badge>
                ))}
                {u.effective_permissions.length > 20 && (
                  <span className="text-xs text-tertiary">
                    +{u.effective_permissions.length - 20} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Permission Overrides */}
          {hasPermission("permissions.manage") && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-tertiary">
                  <Shield className="-mt-0.5 mr-1 inline h-3.5 w-3.5" />
                  Permission Overrides
                </h4>
                {hasPermsChanged() && (
                  <Button size="sm" onClick={handleSavePerms} loading={savePermsMutation.isPending}>
                    <Save className="h-3.5 w-3.5" /> Save
                  </Button>
                )}
              </div>
              <Card className="space-y-3 p-4">
                <label className="flex cursor-pointer items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary">Inherit role permissions</p>
                    <p className="text-xs text-tertiary">
                      When enabled, user inherits all permissions from their roles
                    </p>
                  </div>
                  <button
                    onClick={handleToggleInherit}
                    className={cn(
                      "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                      inheritPerms ? "bg-primary" : "bg-subtle",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform",
                        inheritPerms ? "translate-x-[18px]" : "translate-x-[3px]",
                      )}
                    />
                  </button>
                </label>
                {!inheritPerms && (
                  <div className="space-y-3 border-t border-subtle pt-2">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-tertiary" />
                      <input
                        type="text"
                        value={permSearch}
                        onChange={(e) => setPermSearch(e.target.value)}
                        placeholder="Search permissions..."
                        className="border-default h-8 w-full rounded-md border bg-surface pl-8 pr-3 text-xs text-primary placeholder:text-tertiary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    {permsLoading ? (
                      <div className="space-y-1">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Skeleton key={i} variant="text" className="h-6 w-full" />
                        ))}
                      </div>
                    ) : (
                      filteredPerms.map(({ group, permissions }) => (
                        <div key={group}>
                          <p className="mb-1 text-2xs font-semibold uppercase tracking-wide text-tertiary">
                            {group}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {permissions.map((p) => {
                              const enabled = customPerms.has(p.name);
                              return (
                                <button
                                  key={p.id}
                                  onClick={() => handleTogglePerm(p.name)}
                                  className={cn(
                                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors",
                                    enabled
                                      ? "bg-primary-soft text-primary"
                                      : "bg-subtle text-secondary hover:bg-hover",
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
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-tertiary">
              Projects {projects.length > 0 && `(${projects.length})`}
            </h4>
            {projectsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} variant="rect" className="h-10 w-full rounded-lg" />
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="flex flex-col items-center rounded-lg bg-subtle py-6 text-center">
                <Building2 className="mb-2 h-8 w-8 text-tertiary" />
                <p className="text-xs text-secondary">No projects assigned</p>
              </div>
            ) : (
              <div className="space-y-2">
                {projects.slice(0, 10).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => openDrawer("project", p.id)}
                    className="flex cursor-pointer items-center justify-between rounded-lg bg-subtle p-2.5 transition-colors hover:bg-hover"
                  >
                    <span className="truncate text-sm text-primary">{p.name}</span>
                    <Badge
                      variant={
                        p.status === "active"
                          ? "success"
                          : p.status === "on_hold"
                            ? "warning"
                            : "neutral"
                      }
                      size="sm"
                    >
                      {p.status_label || p.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-tertiary">
              Tasks {tasks.length > 0 && `(${tasks.length})`}
            </h4>
            {tasksLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} variant="rect" className="h-10 w-full rounded-lg" />
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <div className="flex flex-col items-center rounded-lg bg-subtle py-6 text-center">
                <Activity className="mb-2 h-8 w-8 text-tertiary" />
                <p className="text-xs text-secondary">No tasks assigned</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.slice(0, 10).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => openDrawer("task", t.id)}
                    className="flex cursor-pointer items-center justify-between rounded-lg bg-subtle p-2.5 transition-colors hover:bg-hover"
                  >
                    <span className="truncate text-sm text-primary">{t.title}</span>
                    <Badge
                      variant={
                        t.status === "done"
                          ? "success"
                          : t.status === "blocked"
                            ? "danger"
                            : t.status === "in_progress"
                              ? "warning"
                              : "neutral"
                      }
                      size="sm"
                    >
                      {t.status_label || t.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-tertiary">
              Recent Activity
            </h4>
            {activityLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} variant="rect" className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : activity.length === 0 ? (
              <div className="flex flex-col items-center rounded-lg bg-subtle py-6 text-center">
                <Clock className="mb-2 h-8 w-8 text-tertiary" />
                <p className="text-xs text-secondary">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activity.slice(0, 10).map((a) => (
                  <div key={a.id} className="rounded-lg bg-subtle p-2.5">
                    <p className="text-sm text-primary">{a.description}</p>
                    <p className="mt-0.5 text-xs text-tertiary">{formatRelative(a.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {hasPermission("user-edit") && (
            <div className="border-t border-subtle pt-2">
              <Button
                size="sm"
                variant={u.is_active ? "danger" : "primary"}
                onClick={() => toggleMutation.mutate()}
                loading={toggleMutation.isPending}
              >
                {u.is_active ? (
                  <>
                    <XCircle className="h-3.5 w-3.5" /> Deactivate User
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Activate User
                  </>
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
