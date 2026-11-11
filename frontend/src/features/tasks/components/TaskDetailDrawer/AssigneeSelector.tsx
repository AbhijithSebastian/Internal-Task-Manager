import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { queryKeys } from "@/services/queryKeys";
import { Avatar } from "@/design-system";
import { UserPlus } from "lucide-react";
import { UserSearchPopover } from "./UserSearchPopover";
import type { UserBrief } from "@/types";

interface Props {
  assignees: UserBrief[];
  taskId: number;
}

export function AssigneeSelector({ assignees, taskId }: Props) {
  const queryClient = useQueryClient();
  const [showSearch, setShowSearch] = useState(false);

  const addMutation = useMutation({
    mutationFn: (userId: number) =>
      api.post(`/tasks/${taskId}/assign`, { user_id: userId }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) });
      setShowSearch(false);
    },
  });

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-tertiary">Assignees</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {assignees.length === 0 && <span className="text-sm text-tertiary">Unassigned</span>}
        {assignees.map((a) => (
          <div key={a.id} className="group relative">
            <Avatar name={a.name} size="sm" />
            <span className="sr-only">{a.name}</span>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setShowSearch(!showSearch)}
          className="border-default flex h-6 w-6 items-center justify-center rounded-full border border-dashed text-tertiary transition-colors hover:border-hover hover:text-primary"
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
