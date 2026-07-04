import { useParams } from "react-router-dom";
import { useProjectActivity } from "@/features/projects/hooks/useProject";
import { Card } from "@/components/ui/Card";
import { Activity } from "lucide-react";
import { formatRelative } from "@/utils/formatters";

export default function ProjectActivityPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: activity } = useProjectActivity(projectId);
  const activityData = activity || [];

  return (
    <div className="space-y-1.5">
      {activityData.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center bg-surface border border-default rounded-lg">
          <Activity className="h-8 w-8 text-tertiary mb-2" />
          <p className="text-sm text-tertiary">No activity yet</p>
        </div>
      ) : (
        activityData.map((a) => (
          <Card key={a.id} className="p-3">
            <div className="flex items-start gap-2.5">
              <div className="h-2 w-2 rounded-full bg-primary-soft mt-1.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-primary">{a.description}</p>
                <p className="text-xs text-tertiary mt-0.5">{formatRelative(a.created_at)}</p>
                {a.causer_id && a.properties && (
                  <p className="text-xs text-tertiary mt-0.5">by {String(a.properties.causer_name || "Unknown")}</p>
                )}
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
