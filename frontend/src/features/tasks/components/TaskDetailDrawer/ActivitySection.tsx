import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { queryKeys } from "@/services/queryKeys";
import { Skeleton } from "@/design-system";
import { formatRelative } from "@/utils/formatters";
import { Activity as ActivityIcon } from "lucide-react";
import type { ActivityLog } from "@/types";

interface Props {
  taskId: number;
}

export function ActivitySection({ taskId }: Props) {
  const { data: activity, isLoading } = useQuery({
    queryKey: queryKeys.activity.list("task", taskId),
    queryFn: () =>
      api
        .get("/activity", { params: { subject_type: "task", subject_id: taskId } })
        .then((r) => r.data?.data || r.data || []),
    enabled: Boolean(taskId),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-primary">
          <ActivityIcon className="h-4 w-4" /> Activity
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
      <h3 className="flex items-center gap-2 text-sm font-semibold text-primary">
        <ActivityIcon className="h-4 w-4" /> Activity
      </h3>
      {entries.length === 0 ? (
        <p className="py-6 text-center text-sm text-tertiary">No activity recorded</p>
      ) : (
        <div className="space-y-0">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start gap-2.5 border-b border-subtle py-2 last:border-0"
            >
              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-soft" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-secondary">{entry.description}</p>
                <p className="mt-0.5 text-xs text-tertiary">{formatRelative(entry.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
