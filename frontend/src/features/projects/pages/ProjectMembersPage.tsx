import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  useProjectMembers,
  useAddProjectMember,
  useRemoveProjectMember,
  useUpdateProjectMember,
} from "@/features/projects/hooks/useProject";
import { Avatar, Button, Card, Skeleton, Table, type TableColumn } from "@/design-system";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EnterpriseEmptyState } from "@/components/shared/EnterpriseEmptyState";
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
  const [removeConfirm, setRemoveConfirm] = useState<{
    show: boolean;
    member: ProjectMember | null;
  }>({ show: false, member: null });
  const [roleChange, setRoleChange] = useState<{ userId: number; role: string } | null>(null);
  const [selectedMember, setSelectedMember] = useState<ProjectMember | null>(null);

  const { data: membersData, isLoading } = useProjectMembers(projectId);
  const addMemberMutation = useAddProjectMember();
  const removeMutation = useRemoveProjectMember();
  const updateRoleMutation = useUpdateProjectMember();

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["user-search", userSearch],
    queryFn: () =>
      api
        .get("/users/search", { params: { q: userSearch } })
        .then((r) => r.data?.items || r.data?.data || r.data || []),
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
      prev.some((u) => u.id === user.id) ? prev.filter((u) => u.id !== user.id) : [...prev, user],
    );
  };

  const columns: TableColumn<ProjectMember>[] = [
    {
      key: "name",
      label: "Name",
      render: (m) => (
        <button
          onClick={() => setSelectedMember(m)}
          className="flex items-center gap-2 text-left transition-opacity hover:opacity-80"
        >
          <Avatar name={m.user?.name || "?"} size="sm" />
          <div className="min-w-0">
            <span className="text-sm text-primary">{m.user?.name || `User #${m.user_id}`}</span>
            {m.user?.email && <p className="truncate text-xs text-tertiary">{m.user.email}</p>}
          </div>
        </button>
      ),
    },
    {
      key: "role",
      label: "Role",
      render: (m) =>
        canEdit && projectId ? (
          <select
            value={roleChange?.userId === m.user_id ? roleChange.role : m.role}
            onChange={(e) => {
              const newRole = e.target.value;
              setRoleChange({ userId: m.user_id, role: newRole });
              updateRoleMutation.mutate({ id: projectId, userId: m.user_id, role: newRole });
            }}
            className="border-default focus:ring-primary-ring h-7 rounded border bg-surface px-2 text-xs text-primary hover:border-hover focus:outline-none focus:ring-1"
            onClick={(e) => e.stopPropagation()}
          >
            <option value="member">Member</option>
            <option value="lead">Lead</option>
            <option value="manager">Manager</option>
          </select>
        ) : (
          <span className="text-xs text-secondary">{m.role}</span>
        ),
    },
    {
      key: "actions",
      label: "",
      width: "80px",
      render: (m) =>
        canEdit ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setRemoveConfirm({ show: true, member: m });
            }}
            className="text-xs text-danger hover:underline"
          >
            Remove
          </button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-primary">Members</h2>
          <p className="text-sm text-tertiary">
            {members.length} member{members.length !== 1 ? "s" : ""}
          </p>
        </div>
        {canEdit && (
          <Button size="sm" onClick={() => setShowAddMember(!showAddMember)}>
            <Plus className="h-3.5 w-3.5" /> Add Member
          </Button>
        )}
      </div>

      {showAddMember && (
        <Card className="space-y-3 p-4">
          <p className="text-xs font-semibold text-primary">Add members to project</p>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-tertiary" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search users by name or email..."
              className="border-default focus:ring-primary-ring h-9 w-full rounded-md border bg-surface pl-9 pr-3 text-sm text-primary placeholder:text-tertiary hover:border-hover focus:border-primary focus:outline-none focus:ring-2"
            />
          </div>
          {userSearch.length >= 2 && (
            <div className="border-default max-h-40 space-y-0.5 overflow-y-auto rounded-md border">
              {searchLoading ? (
                <div className="p-3 text-center text-xs text-tertiary">Searching...</div>
              ) : filteredResults.length === 0 ? (
                <div className="p-3 text-center text-xs text-tertiary">No users found</div>
              ) : (
                filteredResults.map((u) => {
                  const isSelected = selectedUsers.some((su) => su.id === u.id);
                  return (
                    <button
                      key={u.id}
                      onClick={() => toggleUser(u)}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                        isSelected
                          ? "bg-primary-soft text-primary"
                          : "text-secondary hover:bg-hover"
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
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-tertiary">{selectedUsers.length} selected</span>
              {selectedUsers.map((u) => (
                <span
                  key={u.id}
                  className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-xs text-primary"
                >
                  {u.name}
                  <button onClick={() => toggleUser(u)} className="hover:text-primary-hover">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="border-default focus:ring-primary-ring h-9 rounded-md border bg-surface px-3 text-sm text-primary hover:border-hover focus:outline-none focus:ring-2"
            >
              <option value="member">Member</option>
              <option value="lead">Lead</option>
              <option value="manager">Manager</option>
            </select>
            <Button
              size="sm"
              onClick={handleAddMembers}
              loading={addMemberMutation.isPending}
              disabled={selectedUsers.length === 0}
            >
              Add to Project
            </Button>
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="rect" className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <Table
          columns={columns}
          data={members}
          loading={false}
          keyExtractor={(m) => m.id}
          emptyState={
            <EnterpriseEmptyState
              icon={<Users className="h-10 w-10" />}
              title="No members yet"
              description="Invite team members to collaborate on this project."
              primaryAction={{ label: "Invite Members", onClick: () => setShowAddMember(true) }}
            />
          }
        />
      )}

      <ConfirmDialog
        open={removeConfirm.show}
        onCancel={() => setRemoveConfirm({ show: false, member: null })}
        onConfirm={() => {
          if (removeConfirm.member && projectId)
            removeMutation.mutate({ id: projectId, userId: removeConfirm.member.user_id });
        }}
        title="Remove member"
        message={`Remove ${removeConfirm.member?.user?.name || `User #${removeConfirm.member?.user_id}`} from this project?`}
        confirmLabel="Remove"
        loading={removeMutation.isPending}
      />

      <MemberDetailDrawer member={selectedMember} onClose={() => setSelectedMember(null)} />
    </div>
  );
}
