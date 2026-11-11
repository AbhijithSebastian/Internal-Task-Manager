import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { queryKeys } from "@/services/queryKeys";
import { Button } from "@/design-system";
import { TaskStatusBadge } from "@/features/tasks/components/TaskStatusBadge";
import { Link2, Plus, X } from "lucide-react";
import { UserSearchPopover } from "./UserSearchPopover";
import type { Task, TaskBrief } from "@/types";

interface Props {
  taskId: number;
  task: Task;
}

export function DependenciesSection({ taskId, task }: Props) {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);

  const createMutation = useMutation({
    mutationFn: (depId: number) =>
      api.post(`/tasks/${taskId}/dependencies`, { dependency_id: depId }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) });
      setShowAdd(false);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (depId: number) => api.delete(`/tasks/${taskId}/dependencies/${depId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) }),
  });

  const blockedBy = (task.dependencies ?? []) as TaskBrief[];
  const blocks = (task.dependents ?? []) as TaskBrief[];

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-primary">
        <Link2 className="h-4 w-4" /> Dependencies
      </h3>
      <div className="space-y-3">
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-tertiary">
            Blocked By
          </p>
          {blockedBy.length === 0 ? (
            <p className="text-sm text-tertiary">No dependencies</p>
          ) : (
            <ul className="space-y-1">
              {blockedBy.map((dep) => (
                <li
                  key={dep.id}
                  className="group flex items-center justify-between rounded-md px-2 py-1 text-sm transition-colors hover:bg-hover"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <TaskStatusBadge status={dep.status} />
                    <span className="truncate text-primary">{dep.title}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMutation.mutate(dep.id)}
                    className="shrink-0 text-tertiary opacity-0 transition-all hover:text-semantic-danger group-hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-tertiary">Blocks</p>
          {blocks.length === 0 ? (
            <p className="text-sm text-tertiary">No dependents</p>
          ) : (
            <ul className="space-y-1">
              {blocks.map((dep) => (
                <li
                  key={dep.id}
                  className="flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors hover:bg-hover"
                >
                  <TaskStatusBadge status={dep.status} />
                  <span className="truncate text-primary">{dep.title}</span>
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
          className="flex items-center gap-1.5 text-sm text-secondary transition-colors hover:text-primary"
        >
          <Plus className="h-3.5 w-3.5" /> Add dependency
        </button>
      )}
    </div>
  );
}
