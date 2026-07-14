import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatRelative } from "@/utils/formatters";
import { Activity as ActivityIcon } from "lucide-react";
import type { ActivityLog } from "@/types";

interface Props {
  taskId: number;
}

export function ActivitySection({ taskId }: Props) {
  const { data: activity, isLoading } = useQuery({
    queryKey: ["activity", taskId],
    queryFn: () => api.get("/activity", { params: { subject_type: "task", subject_id: taskId } }).then((r) => r.data?.data || r.data || []),
    enabled: Boolean(taskId),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-primary flex items-center gap-2"><ActivityIcon className="h-4 w-4" /> Activity</h3>
        {Array.from({ length: 4 }).map((_, i) => (<Skeleton key={i} variant="rect" className="h-12 w-full" />))}
      </div>
    );
  }

  const entries = (activity as ActivityLog[]) ?? [];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-primary flex items-center gap-2"><ActivityIcon className="h-4 w-4" /> Activity</h3>
      {entries.length === 0 ? (
        <p className="text-sm text-tertiary text-center py-6">No activity recorded</p>
      ) : (
        <div className="space-y-0">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-start gap-2.5 py-2 border-b border-subtle last:border-0">
              <div className="h-2 w-2 rounded-full bg-primary-soft mt-1.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-secondary">{entry.description}</p>
                <p className="text-xs text-tertiary mt-0.5">{formatRelative(entry.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
