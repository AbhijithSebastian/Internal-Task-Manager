import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { invalidateTask } from "@/services/queryKeys";
import { Avatar, Button } from "@/design-system";
import { ListChecks, Circle, CheckCircle2, Plus, Trash2 } from "lucide-react";
import type { Task } from "@/types";

interface Props {
  taskId: number;
  subtasks?: Task[];
}

export function SubtasksSection({ taskId, subtasks }: Props) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const addMutation = useMutation({
    mutationFn: (t: string) =>
      api.post(`/tasks/${taskId}/subtasks`, { title: t }).then((r) => r.data),
    onSuccess: () => {
      setTitle("");
      setShowAdd(false);
      invalidateTask(queryClient, taskId);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, currentStatus }: { id: number; currentStatus: string }) =>
      api.patch(`/tasks/${id}/status`, { status: currentStatus === "done" ? "todo" : "done" }),
    onSuccess: () => invalidateTask(queryClient, taskId),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/tasks/${taskId}/subtasks/${id}`),
    onSuccess: () => invalidateTask(queryClient, taskId),
  });

  const doneCount = subtasks?.filter((s) => s.status === "done").length ?? 0;
  const totalCount = subtasks?.length ?? 0;

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-primary">
        <ListChecks className="h-4 w-4" />
        Subtasks
      </h3>
      {totalCount > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-tertiary">
            <span>
              {doneCount} of {totalCount} done
            </span>
            <span>{totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-subtle">
            <div
              className="h-full rounded-full bg-primary transition-all duration-slow"
              style={{ width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}
      <ul className="space-y-0.5">
        {(!subtasks || subtasks.length === 0) && (
          <li className="py-3 text-center text-sm text-tertiary">No subtasks yet</li>
        )}
        {subtasks?.map((sub) => (
          <li key={sub.id} className="group flex items-center gap-2 py-1.5">
            <button
              type="button"
              onClick={() => toggleMutation.mutate({ id: sub.id, currentStatus: sub.status })}
              className="shrink-0 text-secondary transition-colors hover:text-primary"
            >
              {sub.status === "done" ? (
                <CheckCircle2 className="h-4 w-4 text-semantic-success" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
            </button>
            <span
              className={`min-w-0 flex-1 truncate text-sm ${sub.status === "done" ? "text-tertiary line-through" : "text-primary"}`}
            >
              {sub.title}
            </span>
            {sub.assignees?.[0] && (
              <Avatar
                name={sub.assignees[0].name}
                size="sm"
                className="opacity-0 transition-opacity group-hover:opacity-100"
              />
            )}
            <button
              type="button"
              onClick={() => deleteMutation.mutate(sub.id)}
              className="text-tertiary opacity-0 transition-all hover:text-semantic-danger group-hover:opacity-100"
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
            className="border-default focus:ring-primary-ring h-8 flex-1 rounded-md border bg-surface px-3 text-sm text-primary placeholder:text-tertiary focus:border-primary focus:outline-none focus:ring-2"
            onKeyDown={(e) => {
              if (e.key === "Enter" && title.trim()) addMutation.mutate(title.trim());
              if (e.key === "Escape") {
                setShowAdd(false);
                setTitle("");
              }
            }}
            autoFocus
          />
          <Button
            size="sm"
            onClick={() => title.trim() && addMutation.mutate(title.trim())}
            loading={addMutation.isPending}
          >
            Add
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setShowAdd(false);
              setTitle("");
            }}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 text-sm text-secondary transition-colors hover:text-primary"
        >
          <Plus className="h-3.5 w-3.5" /> Add subtask
        </button>
      )}
    </div>
  );
}
