import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { queryKeys } from "@/services/queryKeys";
import { Button } from "@/components/ui/Button";
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
    mutationFn: (depId: number) => api.post(`/tasks/${taskId}/dependencies`, { dependency_id: depId }).then((r) => r.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) }); setShowAdd(false); },
  });

  const removeMutation = useMutation({
    mutationFn: (depId: number) => api.delete(`/tasks/${taskId}/dependencies/${depId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) }),
  });

  const blockedBy = (task.dependencies ?? []) as TaskBrief[];
  const blocks = (task.dependents ?? []) as TaskBrief[];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-primary flex items-center gap-2"><Link2 className="h-4 w-4" /> Dependencies</h3>
      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-tertiary mb-1.5">Blocked By</p>
          {blockedBy.length === 0 ? <p className="text-sm text-tertiary">No dependencies</p> : (
            <ul className="space-y-1">
              {blockedBy.map((dep) => (
                <li key={dep.id} className="flex items-center justify-between text-sm py-1 px-2 rounded-md hover:bg-hover group transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <TaskStatusBadge status={dep.status} />
                    <span className="text-primary truncate">{dep.title}</span>
                  </div>
                  <button type="button" onClick={() => removeMutation.mutate(dep.id)} className="opacity-0 group-hover:opacity-100 text-tertiary hover:text-semantic-danger transition-all shrink-0"><X className="h-3.5 w-3.5" /></button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-tertiary mb-1.5">Blocks</p>
          {blocks.length === 0 ? <p className="text-sm text-tertiary">No dependents</p> : (
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
          <UserSearchPopover placeholder="Search task by ID or title..." onSelect={(user) => createMutation.mutate(user.id)} />
          <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
        </div>
      ) : (
        <button type="button" onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 text-sm text-secondary hover:text-primary transition-colors">
          <Plus className="h-3.5 w-3.5" /> Add dependency
        </button>
      )}
    </div>
  );
}
