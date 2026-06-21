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
} from "lucide-react";
import type { Role, Permission, User } from "@/types";

export default function RoleListPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<"roles" | "users">("roles");
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [toggleIds, setToggleIds] = useState<Set<number>>(new Set());
  const [userPermNames, setUserPermNames] = useState<Set<string>>(new Set());
  const [userInheritPerms, setUserInheritPerms] = useState(true);
  const [permSearch, setPermSearch] = useState("");
  const [permGroup, setPermGroup] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [assignUserIds, setAssignUserIds] = useState<Set<number>>(new Set());

  const {
    data: rolesData,
    isLoading: rolesLoading,
    isError: rolesError,
    refetch: refetchRoles,
  } = useQuery({
    queryKey: ["roles", "with-permissions"],
    queryFn: () =>
      api
        .get("/roles", { params: { with: "permissions" } })
        .then((r) => r.data?.items || r.data?.data || []),
  });

  const {
    data: allPermissionsData,
    isLoading: permsLoading,
  } = useQuery({
    queryKey: ["permissions"],
    queryFn: () =>
      api
        .get("/permissions")
        .then((r) => r.data?.items || r.data?.data || []),
  });

  const {
    data: usersData,
    isLoading: usersLoading,
  } = useQuery({
    queryKey: ["users"],
    queryFn: () =>
      api
        .get("/users", { params: { per_page: 200 } })
        .then((r) => r.data?.items || r.data?.data || []),
  });

  const roles = (Array.isArray(rolesData)
    ? rolesData
    : []) as (Role & { permissions?: Permission[] })[];
  const permissions = (Array.isArray(allPermissionsData)
    ? allPermissionsData
    : []) as Permission[];
  const users = (Array.isArray(usersData) ? usersData : []) as User[];

  const selectedRole = roles.find((r) => r.id === selectedRoleId) ?? null;

  const groups = useMemo(() => {
    const g = new Set<string>();
    permissions.forEach((p) => {
      if (p.group) g.add(p.group);
    });
    return Array.from(g).sort();
  }, [permissions]);

  const filteredPerms = useMemo(() => {
    return permissions.filter((p) => {
      if (
        permSearch &&
        !p.name.toLowerCase().includes(permSearch.toLowerCase()) &&
        !p.label?.toLowerCase().includes(permSearch.toLowerCase())
      )
        return false;
      if (permGroup && p.group !== permGroup) return false;
      return true;
    });
  }, [permissions, permSearch, permGroup]);

  const groupedPerms = useMemo(() => {
    return filteredPerms.reduce<Record<string, Permission[]>>((acc, p) => {
      const group = p.group || "Other";
      if (!acc[group]) acc[group] = [];
      acc[group].push(p);
      return acc;
    }, {});
  }, [filteredPerms]);

  const usersWithRole = useMemo(() => {
    if (!selectedRole) return [];
    return users.filter(
      (u) =>
        u.roles?.some((r) => r.id === selectedRole.id) ||
        u.role === selectedRole.name
    );
  }, [users, selectedRole]);

  const availableUsers = useMemo(() => {
    if (!selectedRole) return [];
    return users.filter(
      (u) =>
        !u.roles?.some((r) => r.id === selectedRole.id) &&
        u.role !== selectedRole.name
    );
  }, [users, selectedRole]);

  const addMutation = useMutation({
    mutationFn: (name: string) => api.post("/roles", { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setShowAddForm(false);
      setNewRoleName("");
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

  const savePermsMutation = useMutation({
    mutationFn: ({
      roleId,
      permissionIds,
    }: {
      roleId: number;
      permissionIds: number[];
    }) =>
      api
        .put(`/roles/${roleId}/permissions`, { permission_ids: permissionIds })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });

  const assignRoleMutation = useMutation({
    mutationFn: ({
      userId,
      roleName,
    }: {
      userId: number;
      roleName: string;
    }) =>
      api
        .put(`/permissions/users/${userId}/role`, { role: roleName })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const selectedUser = users.find((u) => u.id === selectedUserId) ?? null;

  useEffect(() => {
    if (selectedUser) {
      setUserInheritPerms(selectedUser.inherit_role_permissions);
      setUserPermNames(new Set(selectedUser.permissions || []));
    }
  }, [selectedUser]);

  const saveUserPermsMutation = useMutation({
    mutationFn: (data: { inherit_role_permissions: boolean; permissions: string[] }) =>
      api.put(`/users/${selectedUserId}`, data).then((r) => r.data?.data || r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const handleToggleUserPerm = (permName: string) => {
    setUserPermNames((prev) => {
      const next = new Set(prev);
      if (next.has(permName)) next.delete(permName);
      else next.add(permName);
      return next;
    });
  };

  const handleSaveUserPerms = () => {
    if (!selectedUser) return;
    saveUserPermsMutation.mutate({
      inherit_role_permissions: userInheritPerms,
      permissions: Array.from(userPermNames),
    });
  };

  const userPermsChanged = () => {
    if (!selectedUser) return false;
    if (userInheritPerms !== selectedUser.inherit_role_permissions) return true;
    const old = new Set(selectedUser.permissions || []);
    if (old.size !== userPermNames.size) return true;
    for (const p of old) if (!userPermNames.has(p)) return true;
    return false;
  };

  const handleModeSwitch = (newMode: "roles" | "users") => {
    setMode(newMode);
    if (newMode === "roles") { setSelectedUserId(null); setPermSearch(""); }
    if (newMode === "users") { setSelectedRoleId(null); setPermSearch(""); }
  };

  const handleSelectRole = useCallback(
    (role: Role & { permissions?: Permission[] }) => {
      setSelectedRoleId(role.id);
      const perms = role.permissions || [];
      setToggleIds(new Set(perms.map((p) => p.id)));
      setAssignUserIds(new Set());
    },
    []
  );

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

  const handleAddRole = useCallback(() => {
    if (!newRoleName.trim()) return;
    addMutation.mutate(newRoleName.trim());
  }, [newRoleName, addMutation]);

  const handleAssignSelected = useCallback(() => {
    if (!selectedRole || assignUserIds.size === 0) return;
    Promise.all(
      Array.from(assignUserIds).map((userId) =>
        api.put(`/permissions/users/${userId}/role`, {
          role: selectedRole.name,
        })
      )
    ).then(() => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setAssignUserIds(new Set());
    });
  }, [selectedRole, assignUserIds, queryClient]);

  const handleToggleAssignUser = useCallback((userId: number) => {
    setAssignUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }, []);

  const pendingCount = Array.from(toggleIds).length;
  const selectedRolePermCount = selectedRole?.permissions?.length || 0;
  const hasChanges = pendingCount !== selectedRolePermCount;

  if (rolesError) {
    return (
      <div className="page-container py-6 space-y-5">
        <h1 className="text-xl font-bold text-primary">Roles & Permissions</h1>
        <Card>
          <div className="flex flex-col items-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-semantic-danger mb-3" />
            <h3 className="text-lg font-semibold text-primary">
              Failed to load roles
            </h3>
            <p className="text-sm text-secondary mt-1 mb-4">
              There was an error fetching roles. Please try again.
            </p>
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
        {hasPermission("role-create") && (
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            size="sm"
            variant={showAddForm ? "secondary" : "primary"}
          >
            <Plus className="h-4 w-4" />
            {showAddForm ? "Cancel" : "Add Role"}
          </Button>
        )}
      </div>

      {showAddForm && (
        <Card className="p-3.5">
          <div className="flex items-center gap-3">
            <Input
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              placeholder="Enter role name..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddRole();
              }}
            />
            <Button
              size="sm"
              onClick={handleAddRole}
              loading={addMutation.isPending}
              disabled={!newRoleName.trim()}
            >
              <Plus className="h-4 w-4" /> Create
            </Button>
          </div>
        </Card>
      )}

      <div className="flex items-center gap-2 border-b border-subtle pb-3">
        <button
          onClick={() => handleModeSwitch("roles")}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-md transition-colors",
            mode === "roles" ? "bg-primary text-inverse" : "text-secondary hover:text-primary hover:bg-hover"
          )}
        >
          <Shield className="h-4 w-4 inline mr-1.5 -mt-0.5" /> Roles
        </button>
        <button
          onClick={() => handleModeSwitch("users")}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-md transition-colors",
            mode === "users" ? "bg-primary text-inverse" : "text-secondary hover:text-primary hover:bg-hover"
          )}
        >
          <Users className="h-4 w-4 inline mr-1.5 -mt-0.5" /> Users
        </button>
      </div>

      <div className="flex gap-5">
        <div className="w-72 shrink-0 space-y-3 overflow-y-auto max-h-[calc(100vh-12rem)]">
          {mode === "roles" ? (
            rolesLoading ? (
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
                const perms = r.permissions || [];
                const userCount = users.filter((u) => u.roles?.some((ur) => ur.id === r.id) || u.role === r.name).length;
                return (
                  <Card
                    key={r.id}
                    variant="default"
                    className={`p-3 cursor-pointer transition-all ${selectedRoleId === r.id ? "ring-2 ring-primary border-primary" : "hover:border-hover"}`}
                    onClick={() => handleSelectRole(r)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-9 w-9 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
                          <Shield className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-primary truncate leading-tight">{r.name}</p>
                          <p className="text-[11px] text-tertiary leading-tight mt-0.5">
                            {userCount} user{userCount !== 1 ? "s" : " "} · {perms.length} permission{perms.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Badge variant="neutral" size="sm">{r.guard_name}</Badge>
                        {hasPermission("role-delete") && (
                          <button onClick={(e) => { e.stopPropagation(); setDeleteId(r.id); }} className="p-1 rounded text-tertiary hover:text-danger hover:bg-danger-soft transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })
            )
          ) : usersLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} variant="rect" className="h-[64px] w-full rounded-lg" />
            ))
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center bg-surface border border-default rounded-lg">
              <Users className="h-10 w-10 text-tertiary mb-2" />
              <h3 className="text-sm font-semibold text-primary">No users</h3>
              <p className="text-xs text-secondary mt-1">Invite users to get started.</p>
            </div>
          ) : (
            users.map((u) => (
              <Card
                key={u.id}
                variant="default"
                className={`p-3 cursor-pointer transition-all ${selectedUserId === u.id ? "ring-2 ring-primary border-primary" : "hover:border-hover"}`}
                onClick={() => setSelectedUserId(u.id)}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar name={u.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-primary truncate leading-tight">{u.name}</p>
                    <p className="text-[11px] text-tertiary leading-tight mt-0.5 truncate">{u.email}</p>
                  </div>
                  <Badge variant={u.is_active ? "success" : "neutral"} size="sm">{u.is_active ? "Active" : "Inactive"}</Badge>
                </div>
              </Card>
            ))
          )}
        </div>

        <div className="flex-1 min-w-0">
          {mode === "users" ? (
            !selectedUser ? (
              <div className="flex flex-col items-center py-20 text-center bg-surface border border-default rounded-lg">
                <Users className="h-16 w-16 text-tertiary mb-4" />
                <h3 className="text-lg font-semibold text-primary">Select a user</h3>
                <p className="text-sm text-secondary mt-1">Choose a user from the left panel to manage their permissions.</p>
              </div>
            ) : (
              <div className="space-y-5">
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar name={selectedUser.name} size="md" />
                      <div>
                        <h3 className="text-base font-semibold text-primary">{selectedUser.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant={selectedUser.is_active ? "success" : "neutral"} size="sm" dot>
                            {selectedUser.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <span className="text-xs text-tertiary">{selectedUser.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                <div className="flex items-center gap-2">
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

                <Card className="space-y-4">
                  <label className="flex items-center justify-between cursor-pointer px-1">
                    <div>
                      <p className="text-sm font-medium text-primary">Inherit role permissions</p>
                      <p className="text-xs text-tertiary">When enabled, user inherits all permissions from their assigned role</p>
                    </div>
                    <button
                      onClick={() => setUserInheritPerms(!userInheritPerms)}
                      className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors", userInheritPerms ? "bg-primary" : "bg-subtle")}
                    >
                      <span className={cn("inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform", userInheritPerms ? "translate-x-[18px]" : "translate-x-[3px]")} />
                    </button>
                  </label>

                  {!userInheritPerms && (
                    <>
                      <div className="border-t border-subtle pt-3" />
                      {permsLoading ? (
                        <div className="space-y-3">
                          <Skeleton variant="text" className="h-4 w-24" />
                          <div className="flex gap-1.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Skeleton key={i} variant="rect" className="h-7 w-20 rounded-full" />
                            ))}
                          </div>
                        </div>
                      ) : Object.entries(groupedPerms).length === 0 ? (
                        <p className="text-sm text-secondary text-center py-4">No permissions match your search.</p>
                      ) : (
                        Object.entries(groupedPerms).map(([group, perms]) => (
                          <div key={group}>
                            <h4 className="text-xs font-semibold uppercase text-tertiary tracking-wide mb-2">{group}</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {perms.map((p) => {
                                const enabled = userPermNames.has(p.name);
                                return (
                                  <button
                                    key={p.id}
                                    onClick={() => handleToggleUserPerm(p.name)}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                                      enabled ? "bg-primary-soft text-primary hover:bg-primary-soft/70" : "bg-subtle text-secondary hover:bg-hover hover:text-primary"
                                    }`}
                                  >
                                    {enabled && <Check className="h-3 w-3" />}
                                    {p.label || p.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))
                      )}
                    </>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-subtle">
                    <p className="text-xs text-tertiary">
                      {userPermNames.size} permission{userPermNames.size !== 1 ? "s" : ""} selected
                    </p>
                    <Button size="sm" onClick={handleSaveUserPerms} loading={saveUserPermsMutation.isPending} disabled={!userPermsChanged()}>
                      <Save className="h-4 w-4" /> Save Changes
                    </Button>
                  </div>
                </Card>
              </div>
            )
          ) : !selectedRole ? (
            <div className="flex flex-col items-center py-20 text-center bg-surface border border-default rounded-lg">
              <Shield className="h-16 w-16 text-tertiary mb-4" />
              <h3 className="text-lg font-semibold text-primary">Select a role</h3>
              <p className="text-sm text-secondary mt-1">Choose a role from the left panel to manage its permissions.</p>
            </div>
          ) : (
            <div className="space-y-5">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-primary">
                        {selectedRole.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="neutral" size="sm">
                          {selectedRole.guard_name}
                        </Badge>
                        <span className="text-xs text-tertiary">
                          {selectedRolePermCount} permission
                          {selectedRolePermCount !== 1 ? "s" : ""} ·{" "}
                          {usersWithRole.length} user
                          {usersWithRole.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

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
                <select
                  value={permGroup}
                  onChange={(e) => setPermGroup(e.target.value)}
                  className="h-9 px-3 rounded-md bg-surface border border-default text-sm text-primary hover:border-hover focus:outline-none"
                >
                  <option value="">All Groups</option>
                  {groups.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <Card className="space-y-4">
                {permsLoading ? (
                  <div className="space-y-3">
                    <Skeleton variant="text" className="h-4 w-24" />
                    <div className="flex gap-1.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton
                          key={i}
                          variant="rect"
                          className="h-7 w-20 rounded-full"
                        />
                      ))}
                    </div>
                  </div>
                ) : Object.entries(groupedPerms).length === 0 ? (
                  <p className="text-sm text-secondary text-center py-4">
                    No permissions match your search.
                  </p>
                ) : (
                  Object.entries(groupedPerms).map(([group, perms]) => (
                    <div key={group}>
                      <h4 className="text-xs font-semibold uppercase text-tertiary tracking-wide mb-2">
                        {group}
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {perms.map((p) => {
                          const enabled = toggleIds.has(p.id);
                          return (
                            <button
                              key={p.id}
                              onClick={() => handleTogglePerm(p.id)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                                enabled
                                  ? "bg-primary-soft text-primary hover:bg-primary-soft/70"
                                  : "bg-subtle text-secondary hover:bg-hover hover:text-primary"
                              }`}
                            >
                              {enabled && <Check className="h-3 w-3" />}
                              {p.label || p.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
                <div className="flex items-center justify-between pt-3 border-t border-subtle">
                  <p className="text-xs text-tertiary">
                    {pendingCount} permission
                    {pendingCount !== 1 ? "s" : ""} selected
                  </p>
                  <Button
                    size="sm"
                    onClick={handleSavePerms}
                    loading={savePermsMutation.isPending}
                    disabled={!hasChanges}
                  >
                    <Save className="h-4 w-4" /> Save Changes
                  </Button>
                </div>
              </Card>

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
                ) : usersWithRole.length === 0 ? (
                  <p className="text-sm text-secondary">
                    No users assigned to this role.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {usersWithRole.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center gap-2.5 py-1"
                      >
                        <Avatar name={u.name} size="sm" />
                        <div className="min-w-0">
                          <p className="text-sm text-primary truncate">
                            {u.name}
                          </p>
                          <p className="text-xs text-tertiary truncate">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {hasPermission("user-edit") && availableUsers.length > 0 && (
                <Card>
                  <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-tertiary" />
                    Assign users to role
                  </h4>
                  <div className="max-h-48 overflow-y-auto space-y-1 mb-3">
                    {availableUsers.map((u) => (
                      <label
                        key={u.id}
                        className="flex items-center gap-2.5 py-1.5 px-1 rounded hover:bg-hover cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={assignUserIds.has(u.id)}
                          onChange={() => handleToggleAssignUser(u.id)}
                          className="rounded border-default text-primary focus:ring-primary h-4 w-4"
                        />
                        <Avatar name={u.name} size="sm" />
                        <div className="min-w-0">
                          <p className="text-sm text-primary truncate">
                            {u.name}
                          </p>
                          <p className="text-xs text-tertiary truncate">
                            {u.email}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    onClick={handleAssignSelected}
                    loading={assignRoleMutation.isPending}
                    disabled={assignUserIds.size === 0}
                  >
                    <UserPlus className="h-4 w-4" /> Assign Selected (
                    {assignUserIds.size})
                  </Button>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      {deleteId !== null && (
        <div
          className="fixed inset-0 z-modal flex items-center justify-center bg-black/30"
          onClick={() => setDeleteId(null)}
        >
          <Card
            className="w-80 mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-primary mb-2">
              Delete role?
            </h3>
            <p className="text-sm text-secondary mb-4">
              This action cannot be undone. Users assigned to this role may lose
              permissions.
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="danger"
                size="sm"
                onClick={() => deleteMutation.mutate(deleteId)}
                loading={deleteMutation.isPending}
              >
                Delete
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeleteId(null)}
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
