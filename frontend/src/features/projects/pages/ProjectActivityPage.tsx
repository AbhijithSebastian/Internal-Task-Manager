import { useParams, Link } from "react-router-dom";
import { useProjectActivity } from "@/features/projects/hooks/useProject";
import { Card } from "@/components/ui/Card";
import { Activity, FileText, GitPullRequest, Users, Plus, Trash2, Edit3, CheckCircle, Archive, UserPlus, UserMinus, Target } from "lucide-react";
import { formatRelative } from "@/utils/formatters";
import type { LucideIcon } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  "Resource created": FileText,
  "Resource updated": Edit3,
  "Resource deleted": Trash2,
  "Endpoint created": GitPullRequest,
  "Endpoint updated": Edit3,
  "Endpoint deleted": Trash2,
  "Task created": Plus,
  "Task updated": Edit3,
  "Task deleted": Trash2,
  "Task status changed": CheckCircle,
  "Task assigned": Users,
  "Project created": Plus,
  "Project updated": Edit3,
  "Project deleted": Trash2,
  "Project status changed": Target,
  "Project archived": Archive,
  "Member added": UserPlus,
  "Member removed": UserMinus,
};

function getIcon(description: string): LucideIcon {
  for (const [key, icon] of Object.entries(ICON_MAP)) {
    if (description.startsWith(key)) return icon;
  }
  return Activity;
}

function getEntityLink(subjectType: string | undefined, subjectId: number | string | undefined, projectId: string): string | null {
  if (!subjectId) return null;
  switch (subjectType) {
    case "projects": return `/projects/${projectId}`;
    case "tasks": return `/projects/${projectId}/tasks/${subjectId}`;
    case "resources": return `/projects/${projectId}/resources`;
    case "endpoints": return `/projects/${projectId}/endpoints`;
    case "meetings": return `/projects/${projectId}/meetings`;
    default: return null;
  }
}

export default function ProjectActivityPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: activity } = useProjectActivity(projectId);
  const activityData = activity || [];

  return (
    <div className="space-y-1.5">
      {activityData.length === 0 ? (
        <Card className="p-10">
          <div className="flex flex-col items-center text-center">
            <Activity className="h-8 w-8 text-tertiary mb-2" />
            <p className="text-sm font-medium text-primary">No activity yet</p>
            <p className="text-xs text-tertiary mt-1">Activity from all project modules will appear here.</p>
          </div>
        </Card>
      ) : (
        activityData.map((a) => {
          const Icon = getIcon(a.description);
          const entityLink = getEntityLink(a.subject_type, a.subject_id, projectId!);
          const content = (
            <Card key={a.id} className="p-3">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-subtle flex items-center justify-center shrink-0">
                  <Icon className="h-3.5 w-3.5 text-tertiary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-primary">{a.description}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-tertiary">
                    <span>{formatRelative(a.created_at)}</span>
                    {!!a.causer_id && !!a.properties?.causer_name && (
                      <span>by {String(a.properties.causer_name)}</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
          if (entityLink) {
            return <Link key={a.id} to={entityLink} className="block no-underline">{content}</Link>;
          }
          return content;
        })
      )}
    </div>
  );
}
