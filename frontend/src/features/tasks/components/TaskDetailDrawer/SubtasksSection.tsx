import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { invalidateTask } from "@/services/queryKeys";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
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
      setTitle(""); setShowAdd(false);
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
            <div className="h-full bg-primary rounded-full transition-all duration-slow" style={{ width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%` }} />
          </div>
        </div>
      )}
      <ul className="space-y-0.5">
        {(!subtasks || subtasks.length === 0) && (
          <li className="text-sm text-tertiary py-3 text-center">No subtasks yet</li>
        )}
        {subtasks?.map((sub) => (
          <li key={sub.id} className="flex items-center gap-2 py-1.5 group">
            <button type="button" onClick={() => toggleMutation.mutate({ id: sub.id, currentStatus: sub.status })} className="shrink-0 text-secondary hover:text-primary transition-colors">
              {sub.status === "done" ? <CheckCircle2 className="h-4 w-4 text-semantic-success" /> : <Circle className="h-4 w-4" />}
            </button>
            <span className={`text-sm flex-1 min-w-0 truncate ${sub.status === "done" ? "text-tertiary line-through" : "text-primary"}`}>{sub.title}</span>
            {sub.assignees?.[0] && <Avatar name={sub.assignees[0].name} size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity" />}
            <button type="button" onClick={() => deleteMutation.mutate(sub.id)} className="opacity-0 group-hover:opacity-100 text-tertiary hover:text-semantic-danger transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
          </li>
        ))}
      </ul>
      {showAdd ? (
        <div className="flex items-center gap-2">
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Subtask title..." className="flex-1 h-8 px-3 rounded-md bg-surface border border-default text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary"
            onKeyDown={(e) => { if (e.key === "Enter" && title.trim()) addMutation.mutate(title.trim()); if (e.key === "Escape") { setShowAdd(false); setTitle(""); } }} autoFocus />
          <Button size="sm" onClick={() => title.trim() && addMutation.mutate(title.trim())} loading={addMutation.isPending}>Add</Button>
          <Button size="sm" variant="ghost" onClick={() => { setShowAdd(false); setTitle(""); }}>Cancel</Button>
        </div>
      ) : (
        <button type="button" onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 text-sm text-secondary hover:text-primary transition-colors">
          <Plus className="h-3.5 w-3.5" /> Add subtask
        </button>
      )}
    </div>
  );
}
