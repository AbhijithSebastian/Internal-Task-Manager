import { useState } from "react";
import { useParams } from "react-router-dom";
import { useProjectMembers, useAddProjectMember, useRemoveProjectMember, useUpdateProjectMember } from "@/features/projects/hooks/useProject";
import { Card } from "@/components/ui/Card";
import { Table, type TableColumn } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useAuth } from "@/store/auth";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Users, Plus, Search, CheckCircle2, X } from "lucide-react";
import { MemberDetailDrawer } from "@/features/projects/components/MemberDetailDrawer";
import type { ProjectMember, UserBrief } from "@/types";

export default function ProjectMembersPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("project-edit");
  const [showAddMember, setShowAddMember] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<UserBrief[]>([]);
  const [selectedRole, setSelectedRole] = useState("member");
  const [removeConfirm, setRemoveConfirm] = useState<{ show: boolean; member: ProjectMember | null }>({ show: false, member: null });
  const [roleChange, setRoleChange] = useState<{ userId: number; role: string } | null>(null);
  const [selectedMember, setSelectedMember] = useState<ProjectMember | null>(null);

  const { data: membersData, isLoading } = useProjectMembers(projectId);
  const addMemberMutation = useAddProjectMember();
  const removeMutation = useRemoveProjectMember();
  const updateRoleMutation = useUpdateProjectMember();

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["user-search", userSearch],
    queryFn: () => api.get("/users/search", { params: { q: userSearch } }).then((r) => r.data?.items || r.data?.data || r.data || []),
    enabled: showAddMember && userSearch.length >= 2,
  });

  const members = (membersData || []) as ProjectMember[];
  const searchUsers = (searchResults || []) as UserBrief[];
  const existingIds = new Set(members.map((m) => m.user_id));
  const filteredResults = searchUsers.filter((u) => !existingIds.has(u.id));

  const handleAddMembers = () => {
    if (selectedUsers.length === 0 || !projectId) return;
    selectedUsers.forEach((u) => {
      addMemberMutation.mutate({ id: projectId, user_id: u.id, role: selectedRole });
    });
    setSelectedUsers([]);
    setUserSearch("");
    setShowAddMember(false);
  };

  const toggleUser = (user: UserBrief) => {
    setSelectedUsers((prev) =>
      prev.some((u) => u.id === user.id) ? prev.filter((u) => u.id !== user.id) : [...prev, user]
    );
  };

  const columns: TableColumn<ProjectMember>[] = [
    { key: "name", label: "Name", render: (m) => (
      <button onClick={() => setSelectedMember(m)} className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity">
        <Avatar name={m.user?.name || "?"} size="sm" />
        <div className="min-w-0">
          <span className="text-sm text-primary">{m.user?.name || `User #${m.user_id}`}</span>
          {m.user?.email && <p className="text-xs text-tertiary truncate">{m.user.email}</p>}
        </div>
      </button>
    )},
    { key: "role", label: "Role", render: (m) => canEdit && projectId ? (
      <select
        value={roleChange?.userId === m.user_id ? roleChange.role : m.role}
        onChange={(e) => {
          const newRole = e.target.value;
          setRoleChange({ userId: m.user_id, role: newRole });
          updateRoleMutation.mutate({ id: projectId, userId: m.user_id, role: newRole });
        }}
        className="h-7 px-2 rounded text-xs bg-surface border border-default text-primary hover:border-hover focus:outline-none focus:ring-1 focus:ring-primary-ring"
        onClick={(e) => e.stopPropagation()}
      >
        <option value="member">Member</option>
        <option value="lead">Lead</option>
        <option value="manager">Manager</option>
      </select>
    ) : <span className="text-xs text-secondary">{m.role}</span> },
    { key: "actions", label: "", width: "80px", render: (m) => canEdit ? (
      <button onClick={(e) => { e.stopPropagation(); setRemoveConfirm({ show: true, member: m }); }} className="text-xs text-danger hover:underline">Remove</button>
    ) : null },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-primary">Members</h2>
          <p className="text-sm text-tertiary">{members.length} member{members.length !== 1 ? "s" : ""}</p>
        </div>
        {canEdit && <Button size="sm" onClick={() => setShowAddMember(!showAddMember)}><Plus className="h-3.5 w-3.5" /> Add Member</Button>}
      </div>

      {showAddMember && (
        <Card className="p-4 space-y-3">
          <p className="text-xs font-semibold text-primary">Add members to project</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-tertiary pointer-events-none" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search users by name or email..."
              className="w-full h-9 pl-9 pr-3 rounded-md bg-surface border border-default text-sm text-primary placeholder:text-tertiary hover:border-hover focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary"
            />
          </div>
          {userSearch.length >= 2 && (
            <div className="max-h-40 overflow-y-auto space-y-0.5 border border-default rounded-md">
              {searchLoading ? (
                <div className="p-3 text-xs text-tertiary text-center">Searching...</div>
              ) : filteredResults.length === 0 ? (
                <div className="p-3 text-xs text-tertiary text-center">No users found</div>
              ) : (
                filteredResults.map((u) => {
                  const isSelected = selectedUsers.some((su) => su.id === u.id);
                  return (
                    <button key={u.id} onClick={() => toggleUser(u)}
                      className={`flex items-center gap-2 w-full px-3 py-2 text-left text-sm transition-colors ${
                        isSelected ? "bg-primary-soft text-primary" : "text-secondary hover:bg-hover"
                      }`}
                    >
                      <Avatar name={u.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm">{u.name}</span>
                        {u.email && <p className="text-xs text-tertiary">{u.email}</p>}
                      </div>
                      {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                    </button>
                  );
                })
              )}
            </div>
          )}
          {selectedUsers.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-tertiary">{selectedUsers.length} selected</span>
              {selectedUsers.map((u) => (
                <span key={u.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-soft text-primary text-xs">
                  {u.name}
                  <button onClick={() => toggleUser(u)} className="hover:text-primary-hover"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="h-9 px-3 rounded-md bg-surface border border-default text-sm text-primary hover:border-hover focus:outline-none focus:ring-2 focus:ring-primary-ring"
            >
              <option value="member">Member</option>
              <option value="lead">Lead</option>
              <option value="manager">Manager</option>
            </select>
            <Button size="sm" onClick={handleAddMembers} loading={addMemberMutation.isPending} disabled={selectedUsers.length === 0}>
              Add to Project
            </Button>
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rect" className="h-10 w-full" />)}</div>
      ) : (
        <Table columns={columns} data={members} loading={false} keyExtractor={(m) => m.id}
          emptyState={
            <div className="flex flex-col items-center py-10 text-center">
              <Users className="h-8 w-8 text-tertiary mb-2" />
              <p className="text-sm text-tertiary">No members yet</p>
            </div>
          } />
      )}

      <ConfirmDialog
        open={removeConfirm.show}
        onCancel={() => setRemoveConfirm({ show: false, member: null })}
        onConfirm={() => { if (removeConfirm.member && projectId) removeMutation.mutate({ id: projectId, userId: removeConfirm.member.user_id }); }}
        title="Remove member"
        message={`Remove ${removeConfirm.member?.user?.name || `User #${removeConfirm.member?.user_id}`} from this project?`}
        confirmLabel="Remove"
        loading={removeMutation.isPending}
      />

      <MemberDetailDrawer member={selectedMember} onClose={() => setSelectedMember(null)} />
    </div>
  );
}
