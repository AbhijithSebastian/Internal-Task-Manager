import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { useEndpointActivity } from "../hooks/useEndpoints";
import { formatRelative } from "@/utils/formatters";

interface EndpointActivitySectionProps {
  endpointId: number;
}

export function EndpointActivitySection({ endpointId }: EndpointActivitySectionProps) {
  const { data, isLoading } = useEndpointActivity(endpointId);

  if (isLoading) return <Skeleton variant="rect" className="h-24 w-full" />;

  const activities = data?.activities ?? [];

  if (activities.length === 0) {
    return <p className="text-sm text-tertiary">No activity recorded yet.</p>;
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {activities.map((a) => (
        <div key={a.id} className="flex items-center justify-between py-2 border-b border-subtle last:border-0">
          <div className="flex items-center gap-2">
            <Badge variant="neutral" size="sm">{a.action.replace(/_/g, " ")}</Badge>
            {a.user && <span className="text-xs text-secondary">{a.user.name}</span>}
          </div>
          <span className="text-xs text-tertiary">{formatRelative(a.created_at)}</span>
        </div>
      ))}
    </div>
  );
}
