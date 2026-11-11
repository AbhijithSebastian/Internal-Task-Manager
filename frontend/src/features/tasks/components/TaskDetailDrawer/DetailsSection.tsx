import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { invalidateTask } from "@/services/queryKeys";
import { Button } from "@/design-system";
import { STATUS_OPTIONS, PRIORITY_OPTIONS } from "./constants";
import { AssigneeSelector } from "./AssigneeSelector";
import {
  Calendar,
  Clock,
  FolderKanban,
  ExternalLink,
  AlertCircle,
  ThumbsDown,
  CheckIcon,
  Lock,
  Unlock,
} from "lucide-react";
import { formatDate } from "@/utils/formatters";
import { openDrawer } from "@/hooks/useDrawer";
import type { Task } from "@/types";

interface Props {
  task: Task;
  taskId: number;
}

export function DetailsSection({ task, taskId }: Props) {
  const queryClient = useQueryClient();
  const isOverdue =
    task.due_date &&
    new Date(task.due_date) < new Date() &&
    task.status !== "done" &&
    task.status !== "cancelled";

  const [localStatus, setLocalStatus] = useState(task.status);
  const [localPriority, setLocalPriority] = useState(task.priority);

  useEffect(() => {
    setLocalStatus(task.status);
    setLocalPriority(task.priority);
  }, [task.status, task.priority]);

  const invalidate = () => {
    invalidateTask(queryClient, taskId);
  };

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.put(`/tasks/${taskId}`, data).then((r) => r.data),
    onSuccess: invalidate,
  });
  const statusChangeMutation = useMutation({
    mutationFn: (s: string) =>
      api.patch(`/tasks/${taskId}/status`, { status: s }).then((r) => r.data),
    onSuccess: invalidate,
  });
  const submitForReviewMutation = useMutation({
    mutationFn: () => api.post(`/tasks/${taskId}/submit-for-review`).then((r) => r.data),
    onSuccess: invalidate,
  });
  const approveMutation = useMutation({
    mutationFn: () => api.post(`/tasks/${taskId}/approve`).then((r) => r.data),
    onSuccess: invalidate,
  });
  const rejectMutation = useMutation({
    mutationFn: (reason: string) =>
      api.post(`/tasks/${taskId}/reject`, { rejection_reason: reason }).then((r) => r.data),
    onSuccess: invalidate,
  });
  const blockMutation = useMutation({
    mutationFn: (reason: string) =>
      api.post(`/tasks/${taskId}/block`, { blocked_reason: reason }).then((r) => r.data),
    onSuccess: invalidate,
  });
  const unblockMutation = useMutation({
    mutationFn: () => api.post(`/tasks/${taskId}/unblock`).then((r) => r.data),
    onSuccess: invalidate,
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
      <AssigneeSelector
        assignees={task.assignees ?? (task.assignee ? [task.assignee] : [])}
        taskId={taskId}
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-grey-500">
            Status
          </label>
          <select
            value={localStatus}
            onChange={(e) => {
              const s = e.target.value;
              setLocalStatus(s);
              statusChangeMutation.mutate(s);
            }}
            className="h-9.5 w-full cursor-pointer appearance-none rounded-lg border border-border-default bg-surface px-3 pr-8 text-sm text-grey-900 transition-colors hover:border-grey-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-grey-500">
            Priority
          </label>
          <select
            value={localPriority}
            onChange={(e) => {
              const p = e.target.value;
              setLocalPriority(p);
              updateMutation.mutate({ priority: p });
            }}
            className="h-9.5 w-full cursor-pointer appearance-none rounded-lg border border-border-default bg-surface px-3 pr-8 text-sm text-grey-900 transition-colors hover:border-grey-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
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
              <Calendar className="h-4 w-4 shrink-0 text-secondary" />
              <span
                className={`text-sm ${isOverdue ? "font-medium text-semantic-danger" : "text-primary"}`}
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
              <Clock className="h-4 w-4 shrink-0 text-secondary" />
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
            className="hover:text-primary/80 flex items-center gap-1.5 text-sm text-primary transition-colors"
          >
            <FolderKanban className="h-4 w-4 shrink-0 text-secondary" />
            <span className="underline decoration-dotted underline-offset-2">
              {task.project_name}
            </span>
            <ExternalLink className="h-3 w-3 text-tertiary" />
          </button>
        </div>
      )}

      {task.description && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-tertiary">Description</p>
          <p className="whitespace-pre-wrap rounded-lg bg-subtle p-3 text-sm text-secondary">
            {task.description}
          </p>
        </div>
      )}

      {task.blocked_reason && (
        <div className="flex items-start gap-2.5 rounded-lg border border-danger/20 bg-danger-soft p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
          <div>
            <p className="text-sm font-medium text-danger">Blocked</p>
            <p className="mt-0.5 text-sm text-grey-700">{task.blocked_reason}</p>
          </div>
        </div>
      )}
      {task.rejection_reason && (
        <div className="flex items-start gap-2.5 rounded-lg border border-warning/20 bg-warning-soft p-3">
          <ThumbsDown className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <div>
            <p className="text-sm font-medium text-warning">Rejected</p>
            <p className="mt-0.5 text-sm text-grey-700">{task.rejection_reason}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-border-default pt-3">
        {canSubmitForReview && (
          <Button
            size="sm"
            variant="secondary"
            loading={submitForReviewMutation.isPending}
            onClick={() => submitForReviewMutation.mutate()}
          >
            <CheckIcon className="h-3.5 w-3.5" /> Submit for Review
          </Button>
        )}
        {canApprove && (
          <Button
            size="sm"
            loading={approveMutation.isPending}
            onClick={() => approveMutation.mutate()}
          >
            <CheckIcon className="h-3.5 w-3.5" /> Approve
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
                  className="border-default focus:ring-primary-ring h-8 w-40 rounded-md border bg-surface px-2 text-sm text-primary placeholder:text-tertiary focus:border-primary focus:outline-none focus:ring-2"
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
                  onClick={() => {
                    setShowRejectInput(false);
                    setRejectReason("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setShowRejectInput(true)}>
                <ThumbsDown className="h-3.5 w-3.5" /> Reject
              </Button>
            )}
          </>
        )}
        {isBlocked ? (
          <Button
            size="sm"
            variant="secondary"
            loading={unblockMutation.isPending}
            onClick={() => unblockMutation.mutate()}
          >
            <Unlock className="h-3.5 w-3.5" /> Unblock
          </Button>
        ) : (
          <>
            {showBlockInput ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Block reason..."
                  className="border-default focus:ring-primary-ring h-8 w-40 rounded-md border bg-surface px-2 text-sm text-primary placeholder:text-tertiary focus:border-primary focus:outline-none focus:ring-2"
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
                  onClick={() => {
                    setShowBlockInput(false);
                    setBlockReason("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setShowBlockInput(true)}>
                <Lock className="h-3.5 w-3.5" /> Block
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
