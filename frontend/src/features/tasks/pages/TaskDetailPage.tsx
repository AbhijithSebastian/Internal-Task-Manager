import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksService } from "@/features/tasks/services/tasks";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoading } from "@/components/shared/LoadingSpinner";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useState } from "react";
import { Pencil, Trash2, ArrowLeft } from "lucide-react";
import { formatDate, formatDateTime } from "@/utils/formatters";
import { useAuth } from "@/store/auth";

const STATUS_TRANSITIONS: Record<string, string[]> = {
  backlog: ["todo"],
  todo: ["in_progress", "blocked"],
  in_progress: ["in_review", "blocked"],
  in_review: ["approved", "blocked"],
  approved: ["done"],
  done: [],
  blocked: ["todo", "in_progress", "cancelled"],
  cancelled: [],
};

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [showDelete, setShowDelete] = useState(false);

  const { data: task, isLoading } = useQuery({
    queryKey: ["task", id],
    queryFn: () => tasksService.get(Number(id)),
    enabled: Boolean(id),
  });

  const deleteMutation = useMutation({
    mutationFn: () => tasksService.delete(Number(id)),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["tasks"] }); navigate("/tasks"); },
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => tasksService.updateStatus(Number(id), status),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["task", id] }); queryClient.invalidateQueries({ queryKey: ["tasks"] }); },
  });

  if (isLoading) return <PageLoading />;
  if (!task) return <p>Task not found.</p>;

  const nextStatuses = STATUS_TRANSITIONS[task.status] || [];
  const canEdit = hasPermission("task-edit");
  const canDelete = hasPermission("task-delete");

  const dependencies = (task as any).dependencies || [];

  return (
    <div>
      <PageHeader
        title={task.title}
        actions={
          <div className="flex gap-2">
            <Link to="/tasks" className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            {canEdit && <Link to={`/tasks/${task.id}/edit`} className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"><Pencil className="h-4 w-4" /> Edit</Link>}
            {canDelete && <button onClick={() => setShowDelete(true)} className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /> Delete</button>}
          </div>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Details</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Description</dt><dd>{task.description || "No description"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Status</dt><dd><StatusBadge status={task.status} /></dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Priority</dt><dd><PriorityBadge priority={task.priority} /></dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Project</dt><dd>{(task as any).project?.name || "-"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Assignee</dt><dd>{(task as any).assignee?.name || "Unassigned"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Due Date</dt><dd>{task.due_date ? formatDate(task.due_date) : "-"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Created</dt><dd>{formatDateTime(task.created_at)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Updated</dt><dd>{formatDateTime(task.updated_at)}</dd></div>
            </dl>
          </div>
          {dependencies.length > 0 && (
            <div className="rounded-lg border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold">Dependencies</h2>
              <ul className="space-y-2">
                {dependencies.map((dep: any) => (
                  <li key={dep.id} className="text-sm">
                    <Link to={`/tasks/${dep.depends_on_id}`} className="text-primary hover:underline">
                      {dep.depends_on?.title || `Task #${dep.depends_on_id}`}
                    </Link>
                    <span className="text-muted-foreground"> — </span>
                    <StatusBadge status={dep.depends_on?.status || "backlog"} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="space-y-4">
          {nextStatuses.length > 0 && (
            <div className="rounded-lg border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold">Transitions</h2>
              <div className="flex flex-wrap gap-2">
                {nextStatuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => statusMutation.mutate(status)}
                    disabled={statusMutation.isPending}
                    className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                  >
                    Move to {status.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <ConfirmDialog
        open={showDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${task.title}"?`}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setShowDelete(false)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
