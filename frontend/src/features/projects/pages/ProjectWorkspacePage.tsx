import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useAuth } from "@/store/auth";
import { openDrawer } from "@/hooks/useDrawer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { Drawer } from "@/components/ui/Drawer";
import { FilterBar } from "@/components/ui/FilterBar";
import { Table, type TableColumn } from "@/components/ui/Table";
import {
  ArrowLeft, Edit3, Trash2, Plus, Users,
  CalendarDays, Link2, FileText, Activity, Settings,
  CheckCircle2, Upload, Download, X, Search,
  File as FileIcon, Image, FileSpreadsheet,
  FileArchive,
} from "lucide-react";
import { formatDate, formatDateTime, formatRelative, formatFileSize } from "@/utils/formatters";
import type { Project, Task, ProjectMember, Meeting, ActivityLog, Attachment, UserBrief } from "@/types";

const tabs = [
  { id: "overview", label: "Overview", icon: FileText },
  { id: "tasks", label: "Tasks", icon: CheckCircle2 },
  { id: "members", label: "Members", icon: Users },
  { id: "meetings", label: "Meetings", icon: CalendarDays },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "settings", label: "Settings", icon: Settings },
];

const statusTransitions: Record<string, string[]> = {
  active: ["on_hold", "completed"],
  on_hold: ["active", "completed"],
  completed: ["archived"],
  archived: ["active"],
};

function StatusBadge({ status }: { status: string }) {
  const m: Record<string, { variant: "success" | "warning" | "danger" | "neutral"; label: string }> = {
    active: { variant: "success", label: "Active" },
    on_hold: { variant: "warning", label: "On Hold" },
    completed: { variant: "neutral", label: "Completed" },
    archived: { variant: "neutral", label: "Archived" },
  };
  const c = m[status] || { variant: "neutral" as const, label: status };
  return <Badge variant={c.variant} dot>{c.label}</Badge>;
}

function PriorityBadge({ priority }: { priority: string }) {
  const m: Record<string, { variant: "success" | "warning" | "danger" | "neutral"; label: string }> = {
    low: { variant: "neutral", label: "Low" },
    medium: { variant: "warning", label: "Medium" },
    high: { variant: "danger", label: "High" },
    urgent: { variant: "danger", label: "Urgent" },
  };
  const c = m[priority] || { variant: "neutral" as const, label: priority };
  return <Badge variant={c.variant} size="sm">{c.label}</Badge>;
}

export default function ProjectWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t && tabs.some((tab) => tab.id === t)) setActiveTab(t);
  }, [searchParams]);

  const switchTab = (tabId: string) => { setActiveTab(tabId); setSearchParams({ tab: tabId }); };

  const { data: project, isLoading, isError } = useQuery({
    queryKey: ["project", id],
    queryFn: () => api.get(`/projects/${id}`).then((r) => r.data?.data || r.data),
    enabled: !!id,
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ["project-tasks", id],
    queryFn: () => api.get(`/projects/${id}/tasks`, { params: { per_page: 50 } }).then((r) => r.data?.items || r.data?.data || []),
    enabled: !!id && activeTab === "tasks",
  });

  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ["project-members", id],
    queryFn: () => api.get(`/projects/${id}/members`).then((r) => r.data?.items || r.data?.data || r.data || []),
    enabled: !!id && activeTab === "members",
  });

  const { data: meetingsData } = useQuery({
    queryKey: ["project-meetings", id],
    queryFn: () => api.get(`/projects/${id}/meetings`, { params: { per_page: 20 } }).then((r) => r.data?.items || r.data?.data || []),
    enabled: !!id && activeTab === "meetings",
  });

  const { data: activityData } = useQuery({
    queryKey: ["project-activity", id],
    queryFn: () => api.get(`/projects/${id}/activity`).then((r) => r.data?.items || r.data?.data || []),
    enabled: !!id && activeTab === "activity",
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.put(`/projects/${id}`, { status }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["project", id] }); queryClient.invalidateQueries({ queryKey: ["projects"] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/projects/${id}`),
    onSuccess: () => navigate("/work/projects"),
  });

  const p = project as Project | undefined;

  if (isLoading) {
    return (
      <div className="page-container py-6 space-y-5">
        <div className="flex items-center gap-3"><Skeleton variant="rect" className="h-7 w-7 rounded" /><Skeleton variant="text" className="h-6 w-48" /></div>
        <Skeleton variant="rect" className="h-9 w-full max-w-md rounded" />
        <Skeleton variant="rect" className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (isError || !p) return (
    <div className="page-container py-16 text-center">
      <p className="text-sm text-secondary">Project not found</p>
      <Button size="sm" className="mt-3" onClick={() => navigate("/work/projects")}>Back to Projects</Button>
    </div>
  );

  const canEdit = hasPermission("project-edit");
  const canDelete = hasPermission("project-delete");
  const next = statusTransitions[p.status] || [];

  return (
    <div className="page-container py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <button onClick={() => navigate("/work/projects")} className="p-1 rounded-md text-tertiary hover:text-primary hover:bg-hover shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-primary truncate">{p.name}</h1>
              <StatusBadge status={p.status} />
              <PriorityBadge priority={p.priority} />
            </div>
            <p className="text-xs text-tertiary mt-0.5">Created {formatRelative(p.created_at)}{p.author ? ` by ${p.author.name}` : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {next.map((s) => (
            <Button key={s} size="sm" variant="secondary" onClick={() => statusMutation.mutate(s)} loading={statusMutation.isPending}>
              {s === "completed" ? "Mark Complete" : s === "archived" ? "Archive" : `Move to ${s.replace("_", " ")}`}
            </Button>
          ))}
          {canEdit && <Button size="sm" variant="secondary" onClick={() => navigate(`/work/projects/${id}/edit`)}><Edit3 className="h-3.5 w-3.5" /></Button>}
          {canDelete && <Button size="sm" variant="danger" onClick={() => setDeleteConfirm(true)}><Trash2 className="h-3.5 w-3.5" /></Button>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 border-b border-subtle overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => switchTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors duration-fast ${
                activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-tertiary hover:text-secondary hover:border-hover"
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && <OverviewTab project={p} />}
      {activeTab === "tasks" && <TasksTab projectId={p.id} tasksData={tasksData} loading={tasksLoading} />}
      {activeTab === "members" && <MembersTab projectId={p.id} membersData={membersData || []} loading={membersLoading} />}
      {activeTab === "meetings" && <MeetingsTab projectId={p.id} meetingsData={meetingsData || []} />}
      {activeTab === "activity" && <ActivityTab activityData={activityData || []} />}
      {activeTab === "settings" && <SettingsTab project={p} />}

      <Drawer open={deleteConfirm} onClose={() => setDeleteConfirm(false)} title="Delete project">
        <div className="space-y-4">
          <p className="text-sm text-secondary">Delete <strong className="text-primary">{p.name}</strong>? This cannot be undone.</p>
          <div className="flex items-center gap-2">
            <Button variant="danger" size="sm" onClick={() => deleteMutation.mutate()} loading={deleteMutation.isPending}>Delete</Button>
            <Button variant="secondary" size="sm" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}

/* ---------- Overview Tab ---------- */
function OverviewTab({ project }: { project: Project }) {
  const p = project;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-5">
        <Card>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary mb-2">Description</h3>
          {p.description ? (
            <p className="text-sm text-secondary leading-relaxed whitespace-pre-wrap">{p.description}</p>
          ) : (
            <p className="text-sm text-tertiary italic">No description provided.</p>
          )}
        </Card>
        <Card>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary mb-2">Links</h3>
          <div className="space-y-1.5">
            {p.figma_url && <a href={p.figma_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-link hover:underline"><Link2 className="h-3.5 w-3.5" /> Figma</a>}
            {p.github_url && <a href={p.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-link hover:underline"><Link2 className="h-3.5 w-3.5" /> GitHub</a>}
            {p.docs_url && <a href={p.docs_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-link hover:underline"><Link2 className="h-3.5 w-3.5" /> Docs</a>}
            {!p.figma_url && !p.github_url && !p.docs_url && <p className="text-sm text-tertiary italic">No links configured.</p>}
          </div>
        </Card>
        <ResourcesSection projectId={p.id} />
      </div>
      <div className="space-y-3">
        <Card>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary mb-3">Details</h3>
          <div className="space-y-2.5 text-sm">
            <Row label="Status" value={<StatusBadge status={p.status} />} />
            <Row label="Priority" value={<PriorityBadge priority={p.priority} />} />
            <Row label="Start" value={p.start_date ? formatDate(p.start_date) : "—"} />
            <Row label="Deadline" value={p.deadline ? formatDate(p.deadline) : "—"} />
            <Row label="Members" value={String(p.members_count || p.member_count || 0)} />
          </div>
        </Card>
        {(p.project_manager || p.team_lead) && (
          <Card>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary mb-3">Team</h3>
            <div className="space-y-2.5">
              {p.project_manager && (
                <div className="flex items-center gap-2">
                  <Avatar name={p.project_manager.name} size="sm" />
                  <div><p className="text-sm text-primary">{p.project_manager.name}</p><p className="text-xs text-tertiary">Project Manager</p></div>
                </div>
              )}
              {p.team_lead && (
                <div className="flex items-center gap-2">
                  <Avatar name={p.team_lead.name} size="sm" />
                  <div><p className="text-sm text-primary">{p.team_lead.name}</p><p className="text-xs text-tertiary">Team Lead</p></div>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ---------- Resources Section ---------- */
function ResourcesSection({ projectId }: { projectId: number }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: attachmentsData, isLoading: attachmentsLoading } = useQuery({
    queryKey: ["project-attachments", projectId],
    queryFn: () => api.get("/attachments", { params: { model_type: "project", model_id: projectId } }).then((r) => r.data?.items || r.data?.data || r.data || []),
    enabled: !!projectId,
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: (attachmentId: number) => api.delete(`/attachments/${attachmentId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["project-attachments", projectId] }),
  });

  const attachments = (attachmentsData || []) as Attachment[];

  const handleUpload = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", files[0]);
      formData.append("model_type", "project");
      formData.append("model_id", String(projectId));
      formData.append("collection_name", "files");
      await api.post("/attachments/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      queryClient.invalidateQueries({ queryKey: ["project-attachments", projectId] });
    } catch {
      // error handled silently
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  }, [projectId]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return <FileIcon className="h-5 w-5 text-tertiary" />;
    if (mimeType.startsWith("image/")) return <Image className="h-5 w-5 text-semantic-info" />;
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType.includes("csv")) return <FileSpreadsheet className="h-5 w-5 text-semantic-success" />;
    if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("tar") || mimeType.includes("7z")) return <FileArchive className="h-5 w-5 text-semantic-warning" />;
    if (mimeType.includes("pdf")) return <FileText className="h-5 w-5 text-semantic-danger" />;
    return <FileIcon className="h-5 w-5 text-tertiary" />;
  };

  return (
    <Card>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary mb-3">Resources</h3>

      {/* Upload area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed cursor-pointer transition-colors duration-fast ${
          dragOver ? "border-primary bg-primary-soft" : "border-default hover:border-hover bg-subtle/30"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
          disabled={uploading}
        />
        {uploading ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="text-sm text-secondary">Uploading...</span>
          </div>
        ) : (
          <>
            <Upload className="h-6 w-6 text-tertiary mb-2" />
            <p className="text-sm text-secondary">Drop files here or click to upload</p>
            <p className="text-xs text-tertiary mt-1">PDF, DOCX, XLSX, PPTX, images, ZIP, and more</p>
          </>
        )}
      </div>

      {/* File list */}
      {attachmentsLoading ? (
        <div className="space-y-2 mt-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} variant="rect" className="h-12 w-full" />)}</div>
      ) : attachments.length === 0 ? (
        <p className="text-sm text-tertiary italic mt-3">No files uploaded yet.</p>
      ) : (
        <div className="space-y-1.5 mt-3">
          {attachments.map((file) => (
            <div key={file.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-default bg-surface hover:bg-hover transition-colors duration-fast group">
              {getFileIcon(file.mime_type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-primary truncate">{file.name || file.file_name}</p>
                <p className="text-xs text-tertiary">{formatFileSize(file.size)} &middot; {formatRelative(file.created_at)}</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-fast">
                <button onClick={() => window.open(file.url, "_blank")} className="p-1.5 rounded text-tertiary hover:text-primary hover:bg-hover" title="Download">
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => deleteAttachmentMutation.mutate(file.id)} className="p-1.5 rounded text-tertiary hover:text-danger hover:bg-hover" title="Delete">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-tertiary text-xs">{label}</span>
      <span className="text-primary text-sm">{value}</span>
    </div>
  );
}

/* ---------- Tasks Tab ---------- */
function TasksTab({ projectId, tasksData, loading }: { projectId: number; tasksData?: Task[]; loading: boolean }) {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const tasks = (tasksData || []).filter((t) => {
    if (statusFilter && t.status !== statusFilter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const columns: TableColumn<Task>[] = [
    { key: "title", label: "Task", render: (t) => <span className="text-sm text-primary">{t.title}</span> },
    { key: "status", label: "Status", render: (t) => (
      <Badge variant={t.status === "done" ? "success" : t.status === "blocked" ? "danger" : t.status === "in_progress" ? "warning" : "neutral"} size="sm">{t.status_label || t.status}</Badge>
    )},
    { key: "priority", label: "Priority", render: (t) => (
      <PriorityBadge priority={t.priority} />
    )},
    { key: "assignee", label: "Assignee", render: (t) => t.assignee ? (
      <div className="flex items-center gap-1.5"><Avatar name={t.assignee.name} size="sm" /><span className="text-xs text-secondary">{t.assignee.name}</span></div>
    ) : <span className="text-xs text-tertiary">—</span>},
    { key: "due_date", label: "Due", render: (t) => <span className="text-xs text-secondary">{t.due_date ? formatDate(t.due_date) : "—"}</span> },
  ];

  return (
    <div className="space-y-3">
      <FilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Search tasks..."
        filters={[{ key: "status", label: "All Statuses", value: statusFilter, onChange: setStatusFilter, options: [
          { value: "todo", label: "To Do" }, { value: "in_progress", label: "In Progress" },
          { value: "in_review", label: "In Review" }, { value: "done", label: "Done" }, { value: "blocked", label: "Blocked" },
        ]}]}
      />
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rect" className="h-10 w-full" />)}</div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center bg-surface border border-default rounded-lg">
          <CheckCircle2 className="h-8 w-8 text-tertiary mb-2" />
          <p className="text-sm text-tertiary">No tasks yet</p>
          <Button size="sm" variant="secondary" className="mt-3" onClick={() => navigate(`/work/tasks/new?project_id=${projectId}`)}>Add Task</Button>
        </div>
      ) : (
        <Table columns={columns} data={tasks} loading={false} keyExtractor={(t) => t.id}
          onRowClick={(t) => openDrawer("task", t.id)} />
      )}
      <div className="flex justify-end">
        <Button size="sm" variant="secondary" onClick={() => navigate(`/work/tasks/new?project_id=${projectId}`)}>
          <Plus className="h-3.5 w-3.5" /> Add Task
        </Button>
      </div>
    </div>
  );
}

/* ---------- Members Tab ---------- */
function MembersTab({ projectId, membersData, loading }: { projectId: number; membersData: ProjectMember[]; loading: boolean }) {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("project-edit");
  const queryClient = useQueryClient();
  const [showAddMember, setShowAddMember] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<UserBrief[]>([]);
  const [selectedRole, setSelectedRole] = useState("member");
  const [removeConfirm, setRemoveConfirm] = useState<{ show: boolean; member: ProjectMember | null }>({ show: false, member: null });
  const [roleChange, setRoleChange] = useState<{ userId: number; role: string } | null>(null);

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["user-search", userSearch],
    queryFn: () => api.get("/users/search", { params: { q: userSearch } }).then((r) => r.data?.items || r.data?.data || r.data || []),
    enabled: showAddMember && userSearch.length >= 2,
  });

  const addMemberMutation = useMutation({
    mutationFn: (data: { user_id: number; role: string }) => api.post(`/projects/${projectId}/members`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-members", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: number) => api.delete(`/projects/${projectId}/members/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-members", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) => api.put(`/projects/${projectId}/members/${userId}`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-members", projectId] });
      setRoleChange(null);
    },
  });

  const handleAddMembers = () => {
    if (selectedUsers.length === 0) return;
    selectedUsers.forEach((u) => {
      addMemberMutation.mutate({ user_id: u.id, role: selectedRole });
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

  const searchUsers = (searchResults || []) as UserBrief[];
  const existingIds = new Set(membersData.map((m) => m.user_id));
  const filteredResults = searchUsers.filter((u) => !existingIds.has(u.id));

  const columns: TableColumn<ProjectMember>[] = [
    { key: "name", label: "Name", render: (m) => (
      <div className="flex items-center gap-2">
        <Avatar name={m.user?.name || "?"} size="sm" />
        <div className="min-w-0">
          <span className="text-sm text-primary">{m.user?.name || `User #${m.user_id}`}</span>
          {m.user?.email && <p className="text-xs text-tertiary truncate">{m.user.email}</p>}
        </div>
      </div>
    )},
    { key: "role", label: "Role", render: (m) => canEdit ? (
      <select
        value={roleChange?.userId === m.user_id ? roleChange.role : m.role}
        onChange={(e) => {
          const newRole = e.target.value;
          setRoleChange({ userId: m.user_id, role: newRole });
          updateRoleMutation.mutate({ userId: m.user_id, role: newRole });
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
        <p className="text-xs text-tertiary">{membersData.length} member{membersData.length !== 1 ? "s" : ""}</p>
        {canEdit && <Button size="sm" variant="secondary" onClick={() => setShowAddMember(!showAddMember)}><Plus className="h-3.5 w-3.5" /> Add Member</Button>}
      </div>

      {/* Add member panel */}
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

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rect" className="h-10 w-full" />)}</div>
      ) : (
        <Table columns={columns} data={membersData} loading={false} keyExtractor={(m) => m.id}
          emptyState={
            <div className="flex flex-col items-center py-10 text-center">
              <Users className="h-8 w-8 text-tertiary mb-2" />
              <p className="text-sm text-tertiary">No members yet</p>
            </div>
          } />
      )}

      {/* Remove confirmation */}
      <Drawer open={removeConfirm.show} onClose={() => setRemoveConfirm({ show: false, member: null })} title="Remove member">
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            Remove <strong className="text-primary">{removeConfirm.member?.user?.name || `User #${removeConfirm.member?.user_id}`}</strong> from this project?
          </p>
          <div className="flex items-center gap-2">
            <Button variant="danger" size="sm" onClick={() => { if (removeConfirm.member) removeMutation.mutate(removeConfirm.member.user_id); }} loading={removeMutation.isPending}>Remove</Button>
            <Button variant="secondary" size="sm" onClick={() => setRemoveConfirm({ show: false, member: null })}>Cancel</Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}

/* ---------- Meetings Tab ---------- */
function MeetingsTab({ projectId, meetingsData }: { projectId: number; meetingsData: Meeting[] }) {
  const navigate = useNavigate();
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-tertiary">{meetingsData.length} meeting{meetingsData.length !== 1 ? "s" : ""}</p>
        <Button size="sm" variant="secondary" onClick={() => navigate(`/work/meetings/new?project_id=${projectId}`)}>
          <Plus className="h-3.5 w-3.5" /> Log Meeting
        </Button>
      </div>
      {meetingsData.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center bg-surface border border-default rounded-lg">
          <CalendarDays className="h-8 w-8 text-tertiary mb-2" />
          <p className="text-sm text-tertiary">No meetings logged</p>
          <Button size="sm" variant="secondary" className="mt-3" onClick={() => navigate(`/work/meetings/new?project_id=${projectId}`)}>Log Meeting</Button>
        </div>
      ) : (
        <div className="space-y-1.5">
          {meetingsData.map((m) => (
            <Card key={m.id} variant="interactive" onClick={() => openDrawer("meeting", m.id)} className="p-3">
              <div className="flex items-center justify-between">
                <div className="min-w-0 mr-3">
                  <p className="text-sm font-medium text-primary truncate">{m.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-tertiary">{formatDateTime(m.meeting_date)}</p>
                    {m.summary && <span className="text-xs text-tertiary">&middot;</span>}
                    {m.summary && <p className="text-xs text-tertiary truncate">{m.summary}</p>}
                  </div>
                </div>
                {m.organizer && <Avatar name={m.organizer.name} size="sm" />}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Activity Tab ---------- */
function ActivityTab({ activityData }: { activityData: ActivityLog[] }) {
  return (
    <div className="space-y-1.5">
      {activityData.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center bg-surface border border-default rounded-lg">
          <Activity className="h-8 w-8 text-tertiary mb-2" />
          <p className="text-sm text-tertiary">No activity yet</p>
        </div>
      ) : (
        activityData.map((a) => (
          <Card key={a.id} className="p-3">
            <div className="flex items-start gap-2.5">
              <div className="h-2 w-2 rounded-full bg-primary-soft mt-1.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-primary">{a.description}</p>
                <p className="text-xs text-tertiary mt-0.5">{formatRelative(a.created_at)}</p>
                {a.causer_id && a.properties && (
                  <p className="text-xs text-tertiary mt-0.5">by {String(a.properties.causer_name || "Unknown")}</p>
                )}
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

/* ---------- Settings Tab ---------- */
function SettingsTab({ project }: { project: Project }) {
  return (
    <Card>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary mb-3">Project Settings</h3>
      <div className="text-sm space-y-3">
        <Row label="ID" value={<span className="font-mono">#{project.id}</span>} />
        <Row label="Created" value={formatDateTime(project.created_at)} />
        <Row label="Updated" value={formatDateTime(project.updated_at)} />
        <Row label="Author" value={project.author?.name || "—"} />
      </div>
      <p className="text-xs text-tertiary mt-4">Use the Edit button in the header to modify project details.</p>
    </Card>
  );
}
