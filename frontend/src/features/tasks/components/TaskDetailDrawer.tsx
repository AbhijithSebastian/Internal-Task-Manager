import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useAuth } from "@/store/auth";
import { openDrawer } from "@/hooks/useDrawer";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { TaskStatusBadge, TaskPriorityBadge } from "@/features/tasks/components/TaskStatusBadge";
import { formatDate, formatRelative, formatDateTime } from "@/utils/formatters";
import type { Comment, ActivityLog, UserBrief, TaskBrief, Task } from "@/types";
import {
  Calendar, Clock, FolderKanban, ListChecks, MessageSquare, Activity as ActivityIcon,
  Paperclip, Link2, Plus, Trash2, Send,
  CheckCircle2, Circle, X, AlertCircle, ExternalLink,
  UserPlus, CheckCircle as CheckIcon, ThumbsDown, Lock, Unlock,
  Save, Reply, Edit3, Search,
} from "lucide-react";
import { AttachmentsSection } from "@/components/shared/AttachmentsSection";

const STATUS_OPTIONS = [
  { value: "backlog", label: "Backlog" },
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review", label: "In Review" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
  { value: "blocked", label: "Blocked" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

interface TaskDetailDrawerProps {
  taskId: number | null;
  onClose: () => void;
}

type TabKey = "details" | "subtasks" | "comments" | "activity" | "attachments" | "dependencies";

const TABS: { key: TabKey; label: string; icon: typeof ListChecks }[] = [
  { key: "details", label: "Details", icon: ListChecks },
  { key: "subtasks", label: "Subtasks", icon: ListChecks },
  { key: "comments", label: "Comments", icon: MessageSquare },
  { key: "activity", label: "Activity", icon: ActivityIcon },
  { key: "attachments", label: "Files", icon: Paperclip },
  { key: "dependencies", label: "Deps", icon: Link2 },
];

function UserSearchPopover({
  onSelect,
  excludeIds = [],
  placeholder = "Search users...",
}: {
  onSelect: (user: UserBrief) => void;
  excludeIds?: number[];
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: results, isLoading } = useQuery({
    queryKey: ["users-search", query],
    queryFn: () =>
      api.get("/users/search", { params: { q: query } }).then((r) => r.data?.data || r.data || []),
    enabled: query.length >= 1,
  });

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered: UserBrief[] = (results || []).filter(
    (u: UserBrief) => !excludeIds.includes(u.id)
  );

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-tertiary" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full h-8 pl-8 pr-3 rounded-md bg-surface border border-default text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary"
        />
      </div>
      {open && query.length >= 1 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-dropdown bg-surface border border-default rounded-lg shadow-elevated max-h-48 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 text-sm text-tertiary text-center">Searching...</div>
          ) : filtered.length === 0 ? (
            <div className="p-3 text-sm text-tertiary text-center">No users found</div>
          ) : (
            filtered.map((user) => (
              <button
                key={user.id}
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-hover transition-colors"
                onClick={() => {
                  onSelect(user);
                  setQuery("");
                  setOpen(false);
                }}
              >
                <Avatar name={user.name} size="sm" />
                <span className="truncate">{user.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function AssigneeSelector({
  assignees,
  taskId,
}: {
  assignees: UserBrief[];
  taskId: number;
}) {
  const queryClient = useQueryClient();
  const [showSearch, setShowSearch] = useState(false);

  const addMutation = useMutation({
    mutationFn: (userId: number) =>
      api.post(`/tasks/${taskId}/assign`, { user_id: userId }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      setShowSearch(false);
    },
  });

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-tertiary">Assignees</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {assignees.length === 0 && (
          <span className="text-sm text-tertiary">Unassigned</span>
        )}
        {assignees.map((a) => (
          <div key={a.id} className="relative group">
            <Avatar name={a.name} size="sm" />
            <span className="sr-only">{a.name}</span>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setShowSearch(!showSearch)}
          className="h-6 w-6 rounded-full border border-dashed border-default flex items-center justify-center text-tertiary hover:text-primary hover:border-hover transition-colors"
        >
          <UserPlus className="h-3.5 w-3.5" />
        </button>
      </div>
      {showSearch && (
        <UserSearchPopover
          excludeIds={assignees.map((a) => a.id)}
          placeholder="Search assignees..."
          onSelect={(user) => addMutation.mutate(user.id)}
        />
      )}
    </div>
  );
}

function SubtasksSection({ taskId, subtasks }: { taskId: number; subtasks?: Task[] }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const addMutation = useMutation({
    mutationFn: (t: string) =>
      api.post(`/tasks/${taskId}/subtasks`, { title: t }).then((r) => r.data),
    onSuccess: () => {
      setTitle("");
      setShowAdd(false);
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, currentStatus }: { id: number; currentStatus: string }) =>
      api.patch(`/tasks/${id}/status`, {
        status: currentStatus === "done" ? "todo" : "done",
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["task", taskId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/tasks/${taskId}/subtasks/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["task", taskId] }),
  });

  const doneCount = subtasks?.filter((s) => s.status === "done").length ?? 0;
  const totalCount = subtasks?.length ?? 0;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
        <ListChecks className="h-4 w-4" />
        Subtasks
      </h3>
      {totalCount > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-tertiary">
            <span>{doneCount} of {totalCount} done</span>
            <span>{totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0}%</span>
          </div>
          <div className="h-1.5 w-full bg-subtle rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-slow"
              style={{ width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}
      <ul className="space-y-0.5">
        {(!subtasks || subtasks.length === 0) && (
          <li className="text-sm text-tertiary py-3 text-center">No subtasks yet</li>
        )}
        {subtasks?.map((sub) => (
          <li key={sub.id} className="flex items-center gap-2 py-1.5 group">
            <button
              type="button"
              onClick={() =>
                toggleMutation.mutate({ id: sub.id, currentStatus: sub.status })
              }
              className="shrink-0 text-secondary hover:text-primary transition-colors"
            >
              {sub.status === "done" ? (
                <CheckCircle2 className="h-4 w-4 text-semantic-success" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
            </button>
            <span
              className={`text-sm flex-1 min-w-0 truncate ${
                sub.status === "done"
                  ? "text-tertiary line-through"
                  : "text-primary"
              }`}
            >
              {sub.title}
            </span>
            {sub.assignees?.[0] && (
              <Avatar name={sub.assignees[0].name} size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
            <button
              type="button"
              onClick={() => deleteMutation.mutate(sub.id)}
              className="opacity-0 group-hover:opacity-100 text-tertiary hover:text-semantic-danger transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
      {showAdd ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Subtask title..."
            className="flex-1 h-8 px-3 rounded-md bg-surface border border-default text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary"
            onKeyDown={(e) => {
              if (e.key === "Enter" && title.trim()) addMutation.mutate(title.trim());
              if (e.key === "Escape") { setShowAdd(false); setTitle(""); }
            }}
            autoFocus
          />
          <Button size="sm" onClick={() => title.trim() && addMutation.mutate(title.trim())} loading={addMutation.isPending}>
            Add
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setShowAdd(false); setTitle(""); }}>
            Cancel
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 text-sm text-secondary hover:text-primary transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add subtask
        </button>
      )}
    </div>
  );
}

function CommentsSection({ taskId, projectId }: { taskId: number; projectId: number }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editBody, setEditBody] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyBody, setReplyBody] = useState("");

  const { data: comments, isLoading } = useQuery({
    queryKey: ["comments", taskId],
    queryFn: () =>
      api.get("/comments", { params: { task_id: taskId } }).then((r) => r.data?.data || r.data || []),
    enabled: Boolean(taskId),
  });

  const addMutation = useMutation({
    mutationFn: (text: string) =>
      api.post("/comments", { task_id: taskId, project_id: projectId, body: text }).then((r) => r.data),
    onSuccess: () => {
      setBody("");
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({ parentId, text }: { parentId: number; text: string }) =>
      api
        .post("/comments", {
          task_id: taskId,
          project_id: projectId,
          body: text,
          parent_id: parentId,
        })
        .then((r) => r.data),
    onSuccess: () => {
      setReplyBody("");
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, text }: { id: number; text: string }) =>
      api.put(`/comments/${id}`, { body: text }).then((r) => r.data),
    onSuccess: () => {
      setEditingId(null);
      setEditBody("");
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/comments/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["comments", taskId] }),
  });

  const isOwn = (c: Comment) => c.author?.id === user?.id;

  function renderComment(c: Comment, depth = 0) {
    const isEditing = editingId === c.id;
    const isReplying = replyingTo === c.id;

    return (
      <div key={c.id} className={`${depth > 0 ? "ml-8 pl-4 border-l-2 border-subtle" : ""}`}>
        <div className="flex items-start gap-2.5 py-2">
          <Avatar name={c.author?.name || "Unknown"} size="sm" className="mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-medium text-primary">{c.author?.name || "Unknown"}</span>
              <span className="text-xs text-tertiary">{formatRelative(c.created_at)}</span>
              {isOwn(c) && (
                <div className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(c.id);
                      setEditBody(c.body);
                    }}
                    className="p-0.5 text-tertiary hover:text-primary transition-colors"
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Delete this comment?")) deleteMutation.mutate(c.id);
                    }}
                    className="p-0.5 text-tertiary hover:text-semantic-danger transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
            {isEditing ? (
              <div className="space-y-1.5">
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={2}
                  className="w-full rounded-md bg-surface border border-default px-2.5 py-1.5 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary resize-none"
                  autoFocus
                />
                <div className="flex items-center gap-1.5">
                  <Button size="sm" onClick={() => editMutation.mutate({ id: c.id, text: editBody })} loading={editMutation.isPending}>
                    <Save className="h-3 w-3" />
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditingId(null); setEditBody(""); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="group">
                <p className="text-sm text-secondary whitespace-pre-wrap">{c.body}</p>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setReplyingTo(isReplying ? null : c.id)}
                    className="flex items-center gap-1 text-xs text-tertiary hover:text-primary transition-colors"
                  >
                    <Reply className="h-3 w-3" />
                    Reply
                  </button>
                </div>
              </div>
            )}
            {isReplying && (
              <div className="mt-2 space-y-1.5">
                <textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Write a reply..."
                  rows={2}
                  className="w-full rounded-md bg-surface border border-default px-2.5 py-1.5 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary resize-none"
                  autoFocus
                />
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    onClick={() => replyBody.trim() && replyMutation.mutate({ parentId: c.id, text: replyBody.trim() })}
                    loading={replyMutation.isPending}
                    disabled={!replyBody.trim()}
                  >
                    <Send className="h-3 w-3" />
                    Reply
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setReplyingTo(null); setReplyBody(""); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        {c.replies?.map((r) => renderComment(r, depth + 1))}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Comments
        </h3>
        <Skeleton variant="rect" className="h-20 w-full" />
        <Skeleton variant="rect" className="h-16 w-full" />
        <Skeleton variant="rect" className="h-16 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        Comments ({(comments as Comment[])?.length ?? 0})
      </h3>
      <div className="flex items-start gap-2.5">
        <Avatar name={user?.name || "You"} size="sm" className="mt-1" />
        <div className="flex-1 space-y-1.5">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add a comment..."
            rows={2}
            className="w-full rounded-md bg-surface border border-default px-2.5 py-1.5 text-sm text-primary placeholder:text-tertiary hover:border-hover focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary transition-colors resize-none"
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && body.trim()) {
                e.preventDefault();
                addMutation.mutate(body.trim());
              }
            }}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-tertiary">Ctrl+Enter to send</span>
            <Button
              size="sm"
              onClick={() => body.trim() && addMutation.mutate(body.trim())}
              loading={addMutation.isPending}
              disabled={!body.trim()}
            >
              <Send className="h-3.5 w-3.5" />
              Send
            </Button>
          </div>
        </div>
      </div>
      <div className="divide-y divide-subtle">
        {(!comments || (comments as Comment[]).length === 0) ? (
          <p className="text-sm text-tertiary text-center py-6">No comments yet</p>
        ) : (
          (comments as Comment[]).map((c) => renderComment(c))
        )}
      </div>
    </div>
  );
}

function ActivitySection({ taskId }: { taskId: number }) {
  const { data: activity, isLoading } = useQuery({
    queryKey: ["activity", taskId],
    queryFn: () =>
      api
        .get("/activity", { params: { subject_type: "task", subject_id: taskId } })
        .then((r) => r.data?.data || r.data || []),
    enabled: Boolean(taskId),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
          <ActivityIcon className="h-4 w-4" />
          Activity
        </h3>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="rect" className="h-12 w-full" />
        ))}
      </div>
    );
  }

  const entries = (activity as ActivityLog[]) ?? [];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
        <ActivityIcon className="h-4 w-4" />
        Activity
      </h3>
      {entries.length === 0 ? (
        <p className="text-sm text-tertiary text-center py-6">No activity recorded</p>
      ) : (
        <div className="space-y-0">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-start gap-2.5 py-2 border-b border-subtle last:border-0">
              <div className="h-2 w-2 rounded-full bg-primary-soft mt-1.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-secondary">{entry.description}</p>
                <p className="text-xs text-tertiary mt-0.5">{formatRelative(entry.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function DependenciesSection({ taskId, task }: { taskId: number; task: Task }) {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);

  const createMutation = useMutation({
    mutationFn: (depId: number) =>
      api.post(`/tasks/${taskId}/dependencies`, { dependency_id: depId }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      setShowAdd(false);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (depId: number) => api.delete(`/tasks/${taskId}/dependencies/${depId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["task", taskId] }),
  });

  const blockedBy = (task.dependencies ?? []) as TaskBrief[];
  const blocks = (task.dependents ?? []) as TaskBrief[];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
        <Link2 className="h-4 w-4" />
        Dependencies
      </h3>
      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-tertiary mb-1.5">Blocked By</p>
          {blockedBy.length === 0 ? (
            <p className="text-sm text-tertiary">No dependencies</p>
          ) : (
            <ul className="space-y-1">
              {blockedBy.map((dep) => (
                <li key={dep.id} className="flex items-center justify-between text-sm py-1 px-2 rounded-md hover:bg-hover group transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <TaskStatusBadge status={dep.status} />
                    <span className="text-primary truncate">{dep.title}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMutation.mutate(dep.id)}
                    className="opacity-0 group-hover:opacity-100 text-tertiary hover:text-semantic-danger transition-all shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-tertiary mb-1.5">Blocks</p>
          {blocks.length === 0 ? (
            <p className="text-sm text-tertiary">No dependents</p>
          ) : (
            <ul className="space-y-1">
              {blocks.map((dep) => (
                <li key={dep.id} className="flex items-center gap-2 text-sm py-1 px-2 rounded-md hover:bg-hover transition-colors">
                  <TaskStatusBadge status={dep.status} />
                  <span className="text-primary truncate">{dep.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {showAdd ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-tertiary">Add dependency</p>
          <UserSearchPopover
            placeholder="Search task by ID or title..."
            onSelect={(user) => createMutation.mutate(user.id)}
          />
          <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 text-sm text-secondary hover:text-primary transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add dependency
        </button>
      )}
    </div>
  );
}

function DetailsSection({
  task,
  taskId,
}: {
  task: Task;
  taskId: number;
}) {
  const queryClient = useQueryClient();
  const isOverdue =
    task.due_date && new Date(task.due_date) < new Date() && task.status !== "done" && task.status !== "cancelled";

  const [localStatus, setLocalStatus] = useState(task.status);
  const [localPriority, setLocalPriority] = useState(task.priority);

  useEffect(() => {
    setLocalStatus(task.status);
    setLocalPriority(task.priority);
  }, [task.status, task.priority]);

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.put(`/tasks/${taskId}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const statusChangeMutation = useMutation({
    mutationFn: (status: string) =>
      api.patch(`/tasks/${taskId}/status`, { status }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const submitForReviewMutation = useMutation({
    mutationFn: () => api.post(`/tasks/${taskId}/submit-for-review`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: () => api.post(`/tasks/${taskId}/approve`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) =>
      api.post(`/tasks/${taskId}/reject`, { rejection_reason: reason }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const blockMutation = useMutation({
    mutationFn: (reason: string) =>
      api.post(`/tasks/${taskId}/block`, { blocked_reason: reason }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const unblockMutation = useMutation({
    mutationFn: () => api.post(`/tasks/${taskId}/unblock`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showBlockInput, setShowBlockInput] = useState(false);
  const [blockReason, setBlockReason] = useState("");

  const canApprove = task.status === "in_review";
  const canSubmitForReview = task.status === "in_progress" || task.status === "todo";
  const isBlocked = task.status === "blocked";

  return (
    <div className="space-y-4">
      <AssigneeSelector assignees={task.assignees ?? (task.assignee ? [task.assignee] : [])} taskId={taskId} />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-wide text-tertiary">Status</label>
          <select
            value={localStatus}
            onChange={(e) => {
              const s = e.target.value;
              setLocalStatus(s);
              statusChangeMutation.mutate(s);
            }}
            className="w-full h-9 px-3 pr-8 rounded-md bg-surface border border-default text-sm text-primary transition-colors appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-wide text-tertiary">Priority</label>
          <select
            value={localPriority}
            onChange={(e) => {
              const p = e.target.value;
              setLocalPriority(p);
              updateMutation.mutate({ priority: p });
            }}
            className="w-full h-9 px-3 pr-8 rounded-md bg-surface border border-default text-sm text-primary transition-colors appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary"
          >
            {PRIORITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {task.due_date && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-tertiary">Due Date</p>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-secondary shrink-0" />
              <span
                className={`text-sm ${
                  isOverdue ? "text-semantic-danger font-medium" : "text-primary"
                }`}
              >
                {formatDate(task.due_date)}
                {isOverdue && " (Overdue)"}
              </span>
            </div>
          </div>
        )}
        {task.estimated_hours != null && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-tertiary">Est. Hours</p>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-secondary shrink-0" />
              <span className="text-sm text-primary">{task.estimated_hours}h</span>
            </div>
          </div>
        )}
      </div>

      {task.project_name && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-tertiary">Project</p>
          <button
            type="button"
            onClick={() => openDrawer("project", task.project_id)}
            className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <FolderKanban className="h-4 w-4 text-secondary shrink-0" />
            <span className="underline decoration-dotted underline-offset-2">{task.project_name}</span>
            <ExternalLink className="h-3 w-3 text-tertiary" />
          </button>
        </div>
      )}

      {task.description && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-tertiary">Description</p>
          <p className="text-sm text-secondary whitespace-pre-wrap bg-subtle rounded-lg p-3">{task.description}</p>
        </div>
      )}

      {task.blocked_reason && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-semantic-danger-soft border border-semantic-danger/20">
          <AlertCircle className="h-4 w-4 text-semantic-danger mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-semantic-danger">Blocked</p>
            <p className="text-sm text-secondary mt-0.5">{task.blocked_reason}</p>
          </div>
        </div>
      )}

      {task.rejection_reason && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-semantic-warning-soft border border-semantic-warning/20">
          <ThumbsDown className="h-4 w-4 text-semantic-warning mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-semantic-warning">Rejected</p>
            <p className="text-sm text-secondary mt-0.5">{task.rejection_reason}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-subtle">
        {canSubmitForReview && (
          <Button
            size="sm"
            variant="secondary"
            loading={submitForReviewMutation.isPending}
            onClick={() => submitForReviewMutation.mutate()}
          >
            <CheckIcon className="h-3.5 w-3.5" />
            Submit for Review
          </Button>
        )}
        {canApprove && (
          <Button
            size="sm"
            loading={approveMutation.isPending}
            onClick={() => approveMutation.mutate()}
          >
            <CheckIcon className="h-3.5 w-3.5" />
            Approve
          </Button>
        )}
        {canApprove && (
          <>
            {showRejectInput ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Rejection reason..."
                  className="h-8 w-40 px-2 rounded-md bg-surface border border-default text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && rejectReason.trim()) {
                      rejectMutation.mutate(rejectReason.trim());
                      setShowRejectInput(false);
                      setRejectReason("");
                    }
                    if (e.key === "Escape") {
                      setShowRejectInput(false);
                      setRejectReason("");
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setShowRejectInput(false); setRejectReason(""); }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowRejectInput(true)}
              >
                <ThumbsDown className="h-3.5 w-3.5" />
                Reject
              </Button>
            )}
          </>
        )}
        {isBlocked ? (
          <>
            <Button
              size="sm"
              variant="secondary"
              loading={unblockMutation.isPending}
              onClick={() => unblockMutation.mutate()}
            >
              <Unlock className="h-3.5 w-3.5" />
              Unblock
            </Button>
          </>
        ) : (
          <>
            {showBlockInput ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Block reason..."
                  className="h-8 w-40 px-2 rounded-md bg-surface border border-default text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && blockReason.trim()) {
                      blockMutation.mutate(blockReason.trim());
                      setShowBlockInput(false);
                      setBlockReason("");
                    }
                    if (e.key === "Escape") {
                      setShowBlockInput(false);
                      setBlockReason("");
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setShowBlockInput(false); setBlockReason(""); }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowBlockInput(true)}
              >
                <Lock className="h-3.5 w-3.5" />
                Block
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function TaskDetailDrawer({ taskId, onClose }: TaskDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("details");

  const { data: task, isLoading, error } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () =>
      api.get(`/tasks/${taskId}`).then((r) => r.data?.data || r.data),
    enabled: Boolean(taskId),
  });

  const t = task as Task | undefined;

  useEffect(() => {
    if (taskId) setActiveTab("details");
  }, [taskId]);

  return (
    <Drawer
      open={Boolean(taskId)}
      onClose={onClose}
      title={t?.title || "Task"}
      className="max-w-2xl"
    >
      {isLoading ? (
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <Skeleton variant="rect" className="h-5 w-20" />
            <Skeleton variant="rect" className="h-5 w-16" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rect" className="h-10 w-full" />
          ))}
        </div>
      ) : error || !t ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-tertiary mb-3" />
          <p className="text-sm text-tertiary">Task not found</p>
          <Button size="sm" variant="ghost" onClick={onClose} className="mt-4">
            Close
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <TaskStatusBadge status={t.status} />
            <TaskPriorityBadge priority={t.priority} />
          </div>

          <div className="flex gap-1 border-b border-subtle overflow-x-auto -mx-6 px-6">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors shrink-0 ${
                    activeTab === tab.key
                      ? "border-primary text-primary"
                      : "border-transparent text-tertiary hover:text-secondary hover:border-subtle"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === "details" && <DetailsSection task={t} taskId={t.id} />}
          {activeTab === "subtasks" && <SubtasksSection taskId={t.id} subtasks={t.subtasks} />}
          {activeTab === "comments" && <CommentsSection taskId={t.id} projectId={t.project_id} />}
          {activeTab === "activity" && <ActivitySection taskId={t.id} />}
          {activeTab === "attachments" && <AttachmentsSection modelType="task" modelId={t.id} />}
          {activeTab === "dependencies" && <DependenciesSection taskId={t.id} task={t} />}

          <div className="pt-3 border-t border-subtle space-y-1 text-xs text-tertiary">
            <p>
              Created {formatDateTime(t.created_at)}
              {t.author && ` by ${t.author.name}`}
            </p>
            {t.updated_at && <p>Updated {formatRelative(t.updated_at)}</p>}
          </div>
        </div>
      )}
    </Drawer>
  );
}
