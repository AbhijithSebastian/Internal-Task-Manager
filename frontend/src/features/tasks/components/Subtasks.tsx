import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CheckCircle2, Circle, Plus, Trash2 } from "lucide-react";
import type { Task } from "@/types";

interface SubtasksProps {
  taskId: number;
  subtasks?: Task[];
  loading?: boolean;
}

export function Subtasks({ taskId, subtasks, loading }: SubtasksProps) {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");

  const addSubtask = useMutation({
    mutationFn: (text: string) =>
      api.post("/tasks", { title: text, parent_id: taskId, status: "todo" }).then((r) => r.data),
    onSuccess: () => {
      setTitle("");
      setShowAdd(false);
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
    },
  });

  const toggleSubtask = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.patch(`/tasks/${id}/status`, { status: status === "done" ? "todo" : "done" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["task", taskId] }),
  });

  const deleteSubtask = useMutation({
    mutationFn: (id: number) => api.delete(`/tasks/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["task", taskId] }),
  });

  const doneCount = subtasks?.filter((s) => s.status === "done").length || 0;
  const totalCount = subtasks?.length || 0;

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-4 w-32 bg-subtle skeleton-pulse rounded" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-4 w-4 bg-subtle skeleton-pulse rounded-full" />
            <div className="h-4 flex-1 bg-subtle skeleton-pulse rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-primary">Subtasks</h3>
        {totalCount > 0 && (
          <Badge variant="neutral" size="sm">
            {doneCount}/{totalCount}
          </Badge>
        )}
      </div>
      {totalCount > 0 && (
        <div className="h-1.5 w-full bg-subtle rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-slow"
            style={{ width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%` }}
          />
        </div>
      )}
      <ul className="space-y-1">
        {subtasks?.map((sub) => (
          <li key={sub.id} className="flex items-center gap-2 group">
            <button
              onClick={() => toggleSubtask.mutate({ id: sub.id, status: sub.status })}
              className="shrink-0 text-secondary hover:text-primary transition-colors duration-fast"
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
            <button
              onClick={() => deleteSubtask.mutate(sub.id)}
              className="opacity-0 group-hover:opacity-100 text-tertiary hover:text-semantic-danger transition-all duration-fast"
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
              if (e.key === "Enter" && title.trim()) addSubtask.mutate(title.trim());
              if (e.key === "Escape") { setShowAdd(false); setTitle(""); }
            }}
            autoFocus
          />
          <Button size="sm" onClick={() => title.trim() && addSubtask.mutate(title.trim())} loading={addSubtask.isPending}>
            Add
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setShowAdd(false); setTitle(""); }}>
            Cancel
          </Button>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 text-sm text-secondary hover:text-primary transition-colors duration-fast"
        >
          <Plus className="h-3.5 w-3.5" />
          Add subtask
        </button>
      )}
    </div>
  );
}
