import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksService } from "@/features/tasks/services/tasks";
import { useAuth } from "@/store/auth";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { TaskStatusBadge, TaskPriorityBadge } from "@/features/tasks/components/TaskStatusBadge";
import { Comments } from "@/features/tasks/components/Comments";
import { Subtasks } from "@/features/tasks/components/Subtasks";
import { formatDate, formatDateTime } from "@/utils/formatters";
import {
  Calendar, FolderKanban, Clock, Link2,
  ExternalLink, Trash2, AlertCircle,
} from "lucide-react";

interface TaskDetailDrawerProps {
  taskId: number | null;
  onClose: () => void;
}

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

export function TaskDetailDrawer({ taskId, onClose }: TaskDetailDrawerProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();

  const { data: task, isLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => tasksService.get(Number(taskId)),
    enabled: Boolean(taskId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => tasksService.delete(Number(taskId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      onClose();
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => tasksService.updateStatus(Number(taskId), status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const nextStatuses = task ? STATUS_TRANSITIONS[task.status] || [] : [];
  const canEdit = hasPermission("task-edit");
  const canDelete = hasPermission("task-delete");
  const isOverdue = task?.due_date && new Date(task.due_date) < new Date() && task.status !== "done";

  return (
    <Drawer open={Boolean(taskId)} onClose={onClose} title={task?.title || "Task"}>
      {isLoading ? (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Skeleton variant="circle" className="h-10 w-10" />
            <div className="space-y-2 flex-1">
              <Skeleton variant="text" className="h-5 w-2/3" />
              <Skeleton variant="text" className="h-3 w-1/3" />
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton variant="rect" className="h-4 w-full" />
            <Skeleton variant="rect" className="h-4 w-5/6" />
            <Skeleton variant="rect" className="h-4 w-4/6" />
          </div>
          <Skeleton variant="rect" className="h-32 w-full" />
          <Skeleton variant="rect" className="h-32 w-full" />
        </div>
      ) : task ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TaskStatusBadge status={task.status} />
              <TaskPriorityBadge priority={task.priority} />
            </div>
            <div className="flex items-center gap-1">
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/work/tasks/${task.id}/edit`)}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {task.assignee && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-wide text-tertiary">Assignee</p>
                <div className="flex items-center gap-2">
                  <Avatar name={task.assignee.name} size="sm" />
                  <span className="text-sm text-primary">{task.assignee.name}</span>
                </div>
              </div>
            )}
            {task.due_date && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-wide text-tertiary">Due Date</p>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-secondary" />
                  <span className={`text-sm ${isOverdue ? "text-semantic-danger font-medium" : "text-primary"}`}>
                    {formatDate(task.due_date)}
                    {isOverdue && " (Overdue)"}
                  </span>
                </div>
              </div>
            )}
            {task.project_name && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-wide text-tertiary">Project</p>
                <div className="flex items-center gap-1.5">
                  <FolderKanban className="h-4 w-4 text-secondary" />
                  <span className="text-sm text-primary">{task.project_name}</span>
                </div>
              </div>
            )}
            {task.estimated_hours && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-wide text-tertiary">Est. Hours</p>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-secondary" />
                  <span className="text-sm text-primary">{task.estimated_hours}h</span>
                </div>
              </div>
            )}
          </div>

          {task.description && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-tertiary">Description</p>
              <p className="text-sm text-secondary whitespace-pre-wrap bg-subtle rounded-lg p-3">
                {task.description}
              </p>
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

          {nextStatuses.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-tertiary">Status Transition</p>
              <div className="flex flex-wrap gap-2">
                {nextStatuses.map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant="secondary"
                    loading={statusMutation.isPending}
                    onClick={() => statusMutation.mutate(s)}
                  >
                    {s === "done" ? "Mark Complete" : `Move to ${s.replace("_", " ")}`}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <hr className="border-subtle" />

          <Subtasks taskId={task.id} subtasks={task.subtasks} />

          <hr className="border-subtle" />

          <Comments taskId={task.id} comments={task.comments} />

          {task.dependencies && task.dependencies.length > 0 && (
            <>
              <hr className="border-subtle" />
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-tertiary flex items-center gap-1.5">
                  <Link2 className="h-3.5 w-3.5" />
                  Dependencies
                </p>
                <div className="space-y-1">
                  {task.dependencies.map((dep) => (
                    <div key={dep.id} className="flex items-center justify-between text-sm">
                      <span className="text-primary truncate">{dep.title}</span>
                      <TaskStatusBadge status={dep.status} />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="space-y-1 pt-2">
            <p className="text-xs text-tertiary">
              Created {task.created_at ? formatDateTime(task.created_at) : ""}
              {task.author && ` by ${task.author.name}`}
            </p>
            {task.updated_at && (
              <p className="text-xs text-tertiary">Updated {formatDateTime(task.updated_at)}</p>
            )}
          </div>

          {canDelete && (
            <div className="pt-2">
              <Button
                variant="danger"
                size="sm"
                loading={deleteMutation.isPending}
                onClick={() => {
                  if (window.confirm(`Delete "${task.title}"? This cannot be undone.`)) {
                    deleteMutation.mutate();
                  }
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Task
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-tertiary mb-3" />
          <p className="text-sm text-tertiary">Task not found</p>
        </div>
      )}
    </Drawer>
  );
}
