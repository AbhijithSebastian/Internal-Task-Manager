import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useAuth } from "@/store/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import {
  Search,
  Shield,
  Trash2,
  Plus,
  Save,
  Users,
  Check,
  UserPlus,

  AlertCircle,
  RotateCw,
  Copy,
  ToggleLeft,
  ToggleRight,
  X,
  ChevronDown,
  ChevronRight,
  Palette,
  Type,
  AlignLeft,
  Layers,
} from "lucide-react";
import type { Role, Permission, User } from "@/types";

interface PermissionGroup {
  group: string;
  permissions: Permission[];
}

export default function RoleListPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<"roles" | "users" | "overrides">("roles");
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [toggleIds, setToggleIds] = useState<Set<number>>(new Set());
  const [permSearch, setPermSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const [editForm, setEditForm] = useState({ name: "", description: "", color: "#6366f1", icon: "" });
  const [editDirty, setEditDirty] = useState(false);

  const [userSearch, setUserSearch] = useState("");
  const [assignRoleUserId, setAssignRoleUserId] = useState<number | null>(null);
  const [assignRoleId, setAssignRoleId] = useState<number | null>(null);
  const [newRoleName, setNewRoleName] = useState("");

  const [overrideSearch, setOverrideSearch] = useState("");
  const [selectedOverrideUserId, setSelectedOverrideUserId] = useState<number | null>(null);
  const [overridePerms, setOverridePerms] = useState<Set<string>>(new Set());
  const [overrideInherit, setOverrideInherit] = useState(true);

  const { data: rolesData, isLoading: rolesLoading, isError: rolesError, refetch: refetchRoles } = useQuery({
    queryKey: ["roles", "with-permissions"],
    queryFn: () => api.get("/roles", { params: { with: "permissions" } }).then((r) => r.data?.items || r.data?.data || r.data || []),
  });

  const { data: allPermissionsData, isLoading: permsLoading } = useQuery({
    queryKey: ["permissions"],
    queryFn: () => api.get("/permissions").then((r) => r.data?.groups || r.data?.items || r.data?.data || []),
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get("/users", { params: { per_page: 200 } }).then((r) => r.data?.items || r.data?.data || []),
  });

  const roles = (Array.isArray(rolesData) ? rolesData : []) as (Role & { permissions?: Permission[]; user_count?: number })[];
  const users = (Array.isArray(usersData) ? usersData : []) as User[];

  const permissionGroups = useMemo(() => {
    if (Array.isArray(allPermissionsData)) {
      return allPermissionsData as PermissionGroup[];
    }
    if (allPermissionsData && typeof allPermissionsData === "object" && "groups" in allPermissionsData) {
      return (allPermissionsData as { groups: PermissionGroup[] }).groups;
    }
    return [];
  }, [allPermissionsData]);

  const allPermissions = useMemo(() => {
    return permissionGroups.flatMap((g) => g.permissions);
  }, [permissionGroups]);

  const selectedRole = roles.find((r) => r.id === selectedRoleId) ?? null;

  const filteredPerms = useMemo(() => {
    if (!permSearch) return allPermissions;
    const q = permSearch.toLowerCase();
    return allPermissions.filter((p) =>
      p.name.toLowerCase().includes(q) || (p.label || "").toLowerCase().includes(q)
    );
  }, [allPermissions, permSearch]);

  const groupedPerms = useMemo(() => {
    if (permSearch) {
      return filteredPerms.reduce<Record<string, Permission[]>>((acc, p) => {
        const group = p.group || "Other";
        if (!acc[group]) acc[group] = [];
        acc[group].push(p);
        return acc;
      }, {});
    }
    return permissionGroups.reduce<Record<string, Permission[]>>((acc, g) => {
      acc[g.group] = g.permissions;
      return acc;
    }, {});
  }, [permissionGroups, filteredPerms, permSearch]);

  useEffect(() => {
    if (selectedRole) {
      setEditForm({
        name: selectedRole.name || "",
        description: selectedRole.description || "",
        color: selectedRole.color || "#6366f1",
        icon: selectedRole.icon || "",
      });
      setToggleIds(new Set((selectedRole.permissions || []).map((p) => p.id)));
      setEditDirty(false);
    }
  }, [selectedRole]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      api.put(`/roles/${id}`, data).then((r) => r.data?.data || r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setEditDirty(false);
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; color?: string; icon?: string }) =>
      api.post("/roles", data).then((r) => r.data?.data || r.data),
    onSuccess: (newRole) => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setShowCreateForm(false);
      setNewRoleName("");
      const id = newRole?.id || newRole?.data?.id;
      if (id) setSelectedRoleId(id);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/roles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      if (selectedRoleId === deleteId) setSelectedRoleId(null);
      setDeleteId(null);
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: number) => api.post(`/roles/${id}/duplicate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (id: number) => api.post(`/roles/${id}/toggle-active`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });

  const savePermsMutation = useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: number; permissionIds: number[] }) =>
      api.put(`/roles/${roleId}/permissions`, { permission_ids: permissionIds }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });

  const addUserRoleMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: number; roleId: number }) =>
      api.post(`/users/${userId}/roles`, { role_id: roleId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setAssignRoleUserId(null);
      setAssignRoleId(null);
    },
  });

  const removeUserRoleMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: number; roleId: number }) =>
      api.delete(`/users/${userId}/roles/${roleId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const { data: overrideUserData } = useQuery({
    queryKey: ["user-permissions", selectedOverrideUserId],
    queryFn: () => api.get(`/permissions/users/${selectedOverrideUserId}`).then((r) => r.data?.data || r.data),
    enabled: Boolean(selectedOverrideUserId) && mode === "overrides",
  });

  const overrideUser = useMemo(() => {
    if (!overrideUserData) return null;
    return overrideUserData as {
      permissions?: { id: number; name: string; group?: string; label?: string }[];
      effective_permissions?: string[];
      inherit_role_permissions: boolean;
    };
  }, [overrideUserData]);

  useEffect(() => {
    if (overrideUser) {
      setOverrideInherit(overrideUser.inherit_role_permissions);
      setOverridePerms(new Set((overrideUser.permissions || []).map((p) => p.name)));
    }
  }, [overrideUser]);

  const saveOverridePermsMutation = useMutation({
    mutationFn: ({ userId, permissionIds }: { userId: number; permissionIds: number[] }) =>
      api.put(`/permissions/users/${userId}`, { permission_ids: permissionIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-permissions", selectedOverrideUserId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const saveOverrideInheritMutation = useMutation({
    mutationFn: ({ userId, inherit }: { userId: number; inherit: boolean }) =>
      api.put(`/permissions/users/${userId}/inherit`, { inherit }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-permissions", selectedOverrideUserId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const handleSelectRole = useCallback((role: Role) => {
    setSelectedRoleId(role.id);
  }, []);

  const handleEditField = (field: string, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
    setEditDirty(true);
  };

  const handleSaveRole = () => {
    if (!selectedRole) return;
    updateMutation.mutate({
      id: selectedRole.id,
      data: { name: editForm.name, description: editForm.description, color: editForm.color, icon: editForm.icon },
    });
  };

  const handleTogglePerm = useCallback((permId: number) => {
    setToggleIds((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });
  }, []);

  const handleSavePerms = useCallback(() => {
    if (!selectedRole) return;
    savePermsMutation.mutate({
      roleId: selectedRole.id,
      permissionIds: Array.from(toggleIds),
    });
  }, [selectedRole, toggleIds, savePermsMutation]);

  const handleSelectAllGroup = (perms: Permission[]) => {
    const allSelected = perms.every((p) => toggleIds.has(p.id));
    setToggleIds((prev) => {
      const next = new Set(prev);
      perms.forEach((p) => {
        if (allSelected) next.delete(p.id);
        else next.add(p.id);
      });
      return next;
    });
  };

  const toggleGroupCollapse = (group: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  const handleCreateRole = () => {
    if (!newRoleName.trim()) return;
    createMutation.mutate({ name: newRoleName.trim() });
  };

  const handleAddRoleToUser = () => {
    if (!assignRoleUserId || !assignRoleId) return;
    addUserRoleMutation.mutate({ userId: assignRoleUserId, roleId: assignRoleId });
  };

  const handleToggleOverridePerm = (permName: string) => {
    setOverridePerms((prev) => {
      const next = new Set(prev);
      if (next.has(permName)) next.delete(permName);
      else next.add(permName);
      return next;
    });
  };

  const handleSaveOverride = () => {
    if (!selectedOverrideUserId) return;
    const permIds = allPermissions.filter((p) => overridePerms.has(p.name)).map((p) => p.id);
    saveOverridePermsMutation.mutate({ userId: selectedOverrideUserId, permissionIds: permIds });
  };

  const handleToggleInherit = () => {
    if (!selectedOverrideUserId) return;
    const next = !overrideInherit;
    setOverrideInherit(next);
    saveOverrideInheritMutation.mutate({ userId: selectedOverrideUserId, inherit: next });
  };

  const selectedRolePermCount = selectedRole?.permissions?.length || 0;
  const pendingCount = toggleIds.size;

  const filteredUsersForMode = useMemo(() => {
    if (!userSearch) return users;
    const q = userSearch.toLowerCase();
    return users.filter((u) =>
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  const overrideFilteredUsers = useMemo(() => {
    if (!overrideSearch) return users;
    const q = overrideSearch.toLowerCase();
    return users.filter((u) =>
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, overrideSearch]);

  const selectedOverrideUserObj = users.find((u) => u.id === selectedOverrideUserId);

  if (rolesError) {
    return (
      <div className="page-container py-6 space-y-5">
        <h1 className="text-xl font-bold text-primary">Roles & Permissions</h1>
        <Card>
          <div className="flex flex-col items-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-semantic-danger mb-3" />
            <h3 className="text-lg font-semibold text-primary">Failed to load roles</h3>
            <p className="text-sm text-secondary mt-1 mb-4">There was an error fetching roles. Please try again.</p>
            <Button onClick={() => refetchRoles()}>
              <RotateCw className="h-4 w-4" /> Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-container py-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary">Roles & Permissions</h1>
      </div>

      <div className="flex items-center gap-2 border-b border-subtle pb-3">
        {[
          { key: "roles", label: "Roles", icon: Shield },
          { key: "users", label: "Users & Roles", icon: Users },
          { key: "overrides", label: "Permission Overrides", icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => { setMode(tab.key as typeof mode); setSelectedRoleId(null); setSelectedOverrideUserId(null); }}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                mode === tab.key
                  ? "bg-primary text-inverse"
                  : "text-secondary hover:text-primary hover:bg-hover"
              )}
            >
              <Icon className="h-4 w-4 inline mr-1.5 -mt-0.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex gap-5">
        {/* Left sidebar */}
        <div className="w-72 shrink-0 space-y-3 overflow-y-auto max-h-[calc(100vh-12rem)]">
          {mode === "roles" && (
            <>
              {hasPermission("role-create") && (
                <Button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  size="sm"
                  variant={showCreateForm ? "secondary" : "primary"}
                  className="w-full"
                >
                  <Plus className="h-4 w-4" />
                  {showCreateForm ? "Cancel" : "Create Role"}
                </Button>
              )}

              {showCreateForm && (
                <Card className="p-3.5 space-y-2">
                  <Input
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    placeholder="Enter role name..."
                    onKeyDown={(e) => { if (e.key === "Enter") handleCreateRole(); }}
                  />
                  <Button size="sm" onClick={handleCreateRole} loading={createMutation.isPending} disabled={!newRoleName.trim()} className="w-full">
                    <Plus className="h-4 w-4" /> Create
                  </Button>
                </Card>
              )}

              {rolesLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} variant="rect" className="h-[72px] w-full rounded-lg" />
                ))
              ) : roles.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center bg-surface border border-default rounded-lg">
                  <Shield className="h-10 w-10 text-tertiary mb-2" />
                  <h3 className="text-sm font-semibold text-primary">No roles</h3>
                  <p className="text-xs text-secondary mt-1">Add a role to get started.</p>
                </div>
              ) : (
                roles.map((r) => {
                  const color = r.color || "#6366f1";
                  const isSelected = selectedRoleId === r.id;
                  return (
                    <Card
                      key={r.id}
                      variant="default"
                      className={cn(
                        "p-3 cursor-pointer transition-all",
                        isSelected ? "ring-2 ring-primary border-primary" : "hover:border-hover"
                      )}
                      onClick={() => handleSelectRole(r)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${color}20`, color }}
                          >
                            <Shield className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold text-primary truncate leading-tight">{r.name}</p>
                              {!r.is_active && <Badge variant="neutral" size="sm">Inactive</Badge>}
                              {r.is_system && <Badge variant="info" size="sm">System</Badge>}
                            </div>
                            <p className="text-[11px] text-tertiary leading-tight mt-0.5">
                              {(r.user_count ?? 0)} users · {(r.permissions || []).length} permissions
                            </p>
                          </div>
                        </div>
                      </div>
                      {!r.is_system && (
                        <div className="flex items-center gap-0.5 mt-2 pt-2 border-t border-subtle">
                          {hasPermission("role-edit") && (
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleActiveMutation.mutate(r.id); }}
                              className="p-1 rounded text-tertiary hover:text-primary hover:bg-hover transition-colors"
                              title={r.is_active ? "Deactivate" : "Activate"}
                            >
                              {r.is_active ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                            </button>
                          )}
                          {hasPermission("role-create") && (
                            <button
                              onClick={(e) => { e.stopPropagation(); duplicateMutation.mutate(r.id); }}
                              className="p-1 rounded text-tertiary hover:text-primary hover:bg-hover transition-colors"
                              title="Duplicate"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {hasPermission("role-delete") && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteId(r.id); }}
                              className="p-1 rounded text-tertiary hover:text-danger hover:bg-danger-soft transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })
              )}
            </>
          )}

          {mode === "users" && (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tertiary pointer-events-none" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search users..."
                  className="w-full h-9 pl-9 pr-3 rounded-md bg-surface border border-default text-sm text-primary placeholder:text-tertiary hover:border-hover focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary transition-colors duration-fast"
                />
              </div>
              {usersLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} variant="rect" className="h-[64px] w-full rounded-lg" />
                ))
              ) : filteredUsersForMode.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center bg-surface border border-default rounded-lg">
                  <Users className="h-10 w-10 text-tertiary mb-2" />
                  <h3 className="text-sm font-semibold text-primary">No users</h3>
                </div>
              ) : (
                filteredUsersForMode.map((u) => (
                  <Card
                    key={u.id}
                    variant="default"
                    className={cn(
                      "p-3 cursor-pointer transition-all",
                      assignRoleUserId === u.id ? "ring-2 ring-primary border-primary" : "hover:border-hover"
                    )}
                    onClick={() => setAssignRoleUserId(assignRoleUserId === u.id ? null : u.id)}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={u.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-primary truncate">{u.name}</p>
                        <div className="flex items-center gap-1 flex-wrap mt-0.5">
                          {(u.roles || []).length > 0 ? (
                            u.roles!.slice(0, 2).map((r) => (
                              <Badge key={r.id} variant="info" size="sm">{r.name}</Badge>
                            ))
                          ) : (
                            <span className="text-xs text-tertiary">No roles</span>
                          )}
                          {(u.roles || []).length > 2 && (
                            <span className="text-xs text-tertiary">+{u.roles!.length - 2}</span>
                          )}
                        </div>
                      </div>
                      <Badge variant={u.is_active ? "success" : "neutral"} size="sm" dot />
                    </div>
                    {assignRoleUserId === u.id && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-subtle">
                        <select
                          value={assignRoleId ?? ""}
                          onChange={(e) => setAssignRoleId(e.target.value ? Number(e.target.value) : null)}
                          className="flex-1 h-8 px-2 rounded-md bg-surface border border-default text-xs text-primary"
                        >
                          <option value="">Select role...</option>
                          {roles.map((r) => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                        <Button size="sm" onClick={handleAddRoleToUser} loading={addUserRoleMutation.isPending} disabled={!assignRoleId}>
                          <UserPlus className="h-3.5 w-3.5" /> Add
                        </Button>
                      </div>
                    )}
                    {(u.roles || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-subtle">
                        {u.roles!.map((r) => (
                          <span
                            key={r.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary-soft text-primary"
                          >
                            {r.name}
                            {hasPermission("user-edit") && (
                              <button
                                onClick={(e) => { e.stopPropagation(); removeUserRoleMutation.mutate({ userId: u.id, roleId: r.id }); }}
                                className="hover:text-danger"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </Card>
                ))
              )}
            </>
          )}

          {mode === "overrides" && (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tertiary pointer-events-none" />
                <input
                  type="text"
                  value={overrideSearch}
                  onChange={(e) => setOverrideSearch(e.target.value)}
                  placeholder="Search users..."
                  className="w-full h-9 pl-9 pr-3 rounded-md bg-surface border border-default text-sm text-primary placeholder:text-tertiary hover:border-hover focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary transition-colors duration-fast"
                />
              </div>
              {usersLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} variant="rect" className="h-[64px] w-full rounded-lg" />
                ))
              ) : overrideFilteredUsers.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center bg-surface border border-default rounded-lg">
                  <Users className="h-10 w-10 text-tertiary mb-2" />
                  <h3 className="text-sm font-semibold text-primary">No users</h3>
                </div>
              ) : (
                overrideFilteredUsers.map((u) => (
                  <Card
                    key={u.id}
                    variant="default"
                    className={cn(
                      "p-3 cursor-pointer transition-all",
                      selectedOverrideUserId === u.id ? "ring-2 ring-primary border-primary" : "hover:border-hover"
                    )}
                    onClick={() => setSelectedOverrideUserId(u.id)}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={u.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-primary truncate">{u.name}</p>
                        <p className="text-xs text-tertiary truncate">{u.email}</p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </>
          )}
        </div>

        {/* Right panel */}
        <div className="flex-1 min-w-0">
          {mode === "roles" && !selectedRole && (
            <div className="flex flex-col items-center py-20 text-center bg-surface border border-default rounded-lg">
              <Shield className="h-16 w-16 text-tertiary mb-4" />
              <h3 className="text-lg font-semibold text-primary">Select a role</h3>
              <p className="text-sm text-secondary mt-1">Choose a role from the left panel to manage its details and permissions.</p>
            </div>
          )}

          {mode === "roles" && selectedRole && (
            <div className="space-y-5">
              {/* Role details form */}
              <Card className="p-4">
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${editForm.color}20`, color: editForm.color }}
                  >
                    <Shield className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-primary">{editForm.name || selectedRole.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant={selectedRole.is_active ? "success" : "neutral"} size="sm" dot>
                        {selectedRole.is_active ? "Active" : "Inactive"}
                      </Badge>
                      {selectedRole.is_system && <Badge variant="info" size="sm">System</Badge>}
                      <span className="text-xs text-tertiary">{selectedRole.guard_name}</span>
                    </div>
                  </div>
                </div>

                {!selectedRole.is_system && hasPermission("role-edit") && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-primary">
                          <Type className="h-3 w-3 inline mr-1 -mt-0.5" /> Name
                        </label>
                        <Input
                          value={editForm.name}
                          onChange={(e) => handleEditField("name", e.target.value)}
                          placeholder="Role name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-primary">
                          <Palette className="h-3 w-3 inline mr-1 -mt-0.5" /> Color
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={editForm.color}
                            onChange={(e) => handleEditField("color", e.target.value)}
                            className="h-9 w-10 rounded-md border border-default bg-surface cursor-pointer"
                          />
                          <Input
                            value={editForm.color}
                            onChange={(e) => handleEditField("color", e.target.value)}
                            placeholder="#6366f1"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-primary">
                        <AlignLeft className="h-3 w-3 inline mr-1 -mt-0.5" /> Description
                      </label>
                      <input
                        type="text"
                        value={editForm.description}
                        onChange={(e) => handleEditField("description", e.target.value)}
                        placeholder="Role description..."
                        className="w-full h-9 px-3 rounded-md bg-surface border border-default text-sm text-primary placeholder:text-tertiary hover:border-hover focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary transition-colors duration-fast"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      {editDirty && <span className="text-xs text-tertiary">Unsaved changes</span>}
                      <Button
                        size="sm"
                        onClick={handleSaveRole}
                        loading={updateMutation.isPending}
                        disabled={!editDirty}
                      >
                        <Save className="h-4 w-4" /> Save Role
                      </Button>
                    </div>
                  </div>
                )}
              </Card>

              {/* Permission matrix */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tertiary pointer-events-none" />
                  <input
                    type="text"
                    value={permSearch}
                    onChange={(e) => setPermSearch(e.target.value)}
                    placeholder="Search permissions..."
                    className="w-full h-9 pl-9 pr-3 rounded-md bg-surface border border-default text-sm text-primary placeholder:text-tertiary hover:border-hover focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary transition-colors duration-fast"
                  />
                </div>
              </div>

              <Card className="space-y-0 p-0 overflow-hidden">
                {permsLoading ? (
                  <div className="p-5 space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton variant="text" className="h-4 w-24" />
                        <div className="flex gap-1.5">
                          {Array.from({ length: 4 }).map((_, j) => (
                            <Skeleton key={j} variant="rect" className="h-7 w-20 rounded-full" />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : Object.entries(groupedPerms).length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <Shield className="h-10 w-10 text-tertiary mb-2" />
                    <p className="text-sm text-secondary">No permissions found.</p>
                  </div>
                ) : (
                  <div>
                    {Object.entries(groupedPerms).map(([group, perms], idx) => {
                      const isCollapsed = collapsedGroups.has(group);
                      const groupSelected = perms.filter((p) => toggleIds.has(p.id)).length;
                      const groupTotal = perms.length;
                      return (
                        <div key={group} className={cn("border-b border-subtle last:border-0", idx > 0 && "border-t")}>
                          <button
                            onClick={() => toggleGroupCollapse(group)}
                            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-hover transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              {isCollapsed ? <ChevronRight className="h-4 w-4 text-tertiary" /> : <ChevronDown className="h-4 w-4 text-tertiary" />}
                              <span className="text-xs font-semibold uppercase text-tertiary tracking-wide">{group}</span>
                              <Badge variant="neutral" size="sm">{groupSelected}/{groupTotal}</Badge>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleSelectAllGroup(perms); }}
                              className="text-xs text-secondary hover:text-primary transition-colors"
                            >
                              {groupSelected === groupTotal ? "Deselect All" : "Select All"}
                            </button>
                          </button>
                          {!isCollapsed && (
                            <div className="px-4 pb-3">
                              <div className="flex flex-wrap gap-1.5">
                                {perms.map((p) => {
                                  const enabled = toggleIds.has(p.id);
                                  return (
                                    <button
                                      key={p.id}
                                      onClick={() => handleTogglePerm(p.id)}
                                      className={cn(
                                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                                        enabled
                                          ? "bg-primary-soft text-primary hover:bg-primary-soft/70"
                                          : "bg-subtle text-secondary hover:bg-hover hover:text-primary"
                                      )}
                                    >
                                      {enabled && <Check className="h-3 w-3" />}
                                      {p.label || p.name}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="flex items-center justify-between px-4 py-3 border-t border-subtle">
                  <p className="text-xs text-tertiary">{pendingCount} permission{pendingCount !== 1 ? "s" : ""} selected</p>
                  {hasPermission("role-edit") && (
                    <Button
                      size="sm"
                      onClick={handleSavePerms}
                      loading={savePermsMutation.isPending}
                      disabled={pendingCount === selectedRolePermCount}
                    >
                      <Save className="h-4 w-4" /> Save Permissions
                    </Button>
                  )}
                </div>
              </Card>

              {/* Users with this role */}
              <Card>
                <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-tertiary" />
                  Users with this role
                </h4>
                {usersLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <Skeleton key={i} variant="text" className="h-8 w-full" />
                    ))}
                  </div>
                ) : (() => {
                  const roleUsers = users.filter((u) => u.roles?.some((ur) => ur.id === selectedRole.id));
                  return roleUsers.length === 0 ? (
                    <p className="text-sm text-secondary">No users assigned to this role.</p>
                  ) : (
                    <div className="space-y-2">
                      {roleUsers.slice(0, 10).map((u) => (
                        <div key={u.id} className="flex items-center gap-2.5 py-1">
                          <Avatar name={u.name} size="sm" />
                          <div className="min-w-0">
                            <p className="text-sm text-primary truncate">{u.name}</p>
                            <p className="text-xs text-tertiary truncate">{u.email}</p>
                          </div>
                        </div>
                      ))}
                      {roleUsers.length > 10 && (
                        <p className="text-xs text-tertiary">+{roleUsers.length - 10} more</p>
                      )}
                    </div>
                  );
                })()}
              </Card>
            </div>
          )}

          {mode === "users" && (
            <div className="flex flex-col items-center py-16 text-center bg-surface border border-default rounded-lg">
              <Users className="h-16 w-16 text-tertiary mb-4" />
              <h3 className="text-lg font-semibold text-primary">Manage User Roles</h3>
              <p className="text-sm text-secondary mt-1 max-w-md">
                Click on a user from the left panel to assign or remove roles. Each user can have multiple roles.
              </p>
            </div>
          )}

          {mode === "overrides" && !selectedOverrideUserId && (
            <div className="flex flex-col items-center py-16 text-center bg-surface border border-default rounded-lg">
              <Layers className="h-16 w-16 text-tertiary mb-4" />
              <h3 className="text-lg font-semibold text-primary">Permission Overrides</h3>
              <p className="text-sm text-secondary mt-1 max-w-md">
                Select a user to manage their individual permission overrides. These override the permissions inherited from roles.
              </p>
            </div>
          )}

          {mode === "overrides" && selectedOverrideUserId && (
            <div className="space-y-5">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={selectedOverrideUserObj?.name || ""} size="md" />
                  <div>
                    <h3 className="text-base font-semibold text-primary">{selectedOverrideUserObj?.name}</h3>
                    <p className="text-sm text-tertiary">{selectedOverrideUserObj?.email}</p>
                  </div>
                </div>
                {overrideUser?.effective_permissions && (
                  <div className="mt-3 pt-3 border-t border-subtle">
                    <p className="text-xs font-medium text-tertiary uppercase tracking-wide mb-2">Effective Permissions</p>
                    <div className="flex flex-wrap gap-1">
                      {overrideUser.effective_permissions.slice(0, 15).map((p) => (
                        <Badge key={p} variant="info" size="sm">{p.split(".").pop() || p}</Badge>
                      ))}
                      {overrideUser.effective_permissions.length > 15 && (
                        <span className="text-xs text-tertiary">+{overrideUser.effective_permissions.length - 15} more</span>
                      )}
                    </div>
                  </div>
                )}
              </Card>

              <Card className="p-4 space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-primary">Inherit role permissions</p>
                    <p className="text-xs text-tertiary">When enabled, user inherits all permissions from their assigned roles</p>
                  </div>
                  <button
                    onClick={handleToggleInherit}
                    className={cn(
                      "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                      overrideInherit ? "bg-primary" : "bg-subtle"
                    )}
                  >
                    <span className={cn(
                      "inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform",
                      overrideInherit ? "translate-x-[18px]" : "translate-x-[3px]"
                    )} />
                  </button>
                </label>

                {!overrideInherit && (
                  <>
                    <div className="border-t border-subtle" />
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
                      <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Skeleton key={i} variant="text" className="h-5 w-full" />
                        ))}
                      </div>
                    ) : (
                      Object.entries(groupedPerms).map(([group, perms]) => {
                        if (perms.length === 0) return null;
                        return (
                          <div key={group}>
                            <p className="text-[10px] font-semibold uppercase text-tertiary tracking-wide mb-1.5">{group}</p>
                            <div className="flex flex-wrap gap-1">
                              {perms.map((p) => {
                                const enabled = overridePerms.has(p.name);
                                return (
                                  <button
                                    key={p.id}
                                    onClick={() => handleToggleOverridePerm(p.name)}
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
                        );
                      })
                    )}
                  </>
                )}

                {!overrideInherit && (
                  <div className="flex items-center justify-between pt-3 border-t border-subtle">
                    <p className="text-xs text-tertiary">{overridePerms.size} permission{overridePerms.size !== 1 ? "s" : ""} overridden</p>
                    <Button
                      size="sm"
                      onClick={handleSaveOverride}
                      loading={saveOverridePermsMutation.isPending}
                    >
                      <Save className="h-4 w-4" /> Save Overrides
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirm modal */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/30" onClick={() => setDeleteId(null)}>
          <Card className="w-80 mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-primary mb-2">Delete role?</h3>
            <p className="text-sm text-secondary mb-4">
              This action cannot be undone. Users assigned to this role may lose permissions.
            </p>
            <div className="flex items-center gap-2">
              <Button variant="danger" size="sm" onClick={() => deleteMutation.mutate(deleteId)} loading={deleteMutation.isPending}>
                Delete
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setDeleteId(null)}>
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
