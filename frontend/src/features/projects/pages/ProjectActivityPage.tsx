import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useProjectActivity } from "@/features/projects/hooks/useProject";
import { Card } from "@/components/ui/Card";
import { Activity, FileText, GitPullRequest, Users, Plus, Trash2, Edit3, CheckCircle, Archive, UserPlus, UserMinus, Target, Filter, Github, Palette, GitBranch, Upload } from "lucide-react";
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
  "GitHub connected": Github,
  "GitHub disconnected": Github,
  "Branch changed": GitBranch,
  "Commit synced": Github,
  "Design uploaded": Upload,
  "Design connected": Palette,
};

const TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "tasks", label: "Tasks" },
  { value: "resources", label: "Resources" },
  { value: "endpoints", label: "Endpoints" },
  { value: "meetings", label: "Meetings" },
  { value: "members", label: "Members" },
  { value: "projects", label: "Projects" },
];

function getIcon(description: string): LucideIcon {
  for (const [key, icon] of Object.entries(ICON_MAP)) {
    if (description.startsWith(key)) return icon;
  }
  return Activity;
}

function getEntityLink(subjectType: string | undefined, subjectId: number | string | undefined, projectId: string): string | null {
  if (!subjectId) return null;
  switch (subjectType) {
    case "projects": return `/work/projects/${projectId}`;
    case "tasks": return `/work/projects/${projectId}/tasks/${subjectId}`;
    case "resources": return `/work/projects/${projectId}/resources`;
    case "endpoints": return `/work/projects/${projectId}/endpoints`;
    case "meetings": return `/work/projects/${projectId}/meetings`;
    default: return null;
  }
}

export default function ProjectActivityPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: activity } = useProjectActivity(projectId);
  const [typeFilter, setTypeFilter] = useState("");
  const activityData = activity || [];

  const filteredData = typeFilter
    ? activityData.filter((a) => a.subject_type === typeFilter)
    : activityData;

  const grouped = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const thisWeekStart = new Date(today.getTime() - today.getDay() * 86400000);
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const groups: { label: string; items: typeof filteredData }[] = [];
    const map: Record<string, typeof filteredData> = {};

    filteredData.forEach((a) => {
      const d = new Date(a.created_at);
      let key: string;
      if (d >= today) key = "Today";
      else if (d >= yesterday) key = "Yesterday";
      else if (d >= thisWeekStart) key = "This Week";
      else if (d >= thisMonthStart) key = "This Month";
      else key = "Older";
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });

    const order = ["Today", "Yesterday", "This Week", "This Month", "Older"];
    order.forEach((l) => { if (map[l]) groups.push({ label: l, items: map[l] }); });
    return groups;
  }, [filteredData]);

  return (
    <div className="space-y-3">
      {activityData.length > 0 && (
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-tertiary" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-8 px-2 rounded text-xs bg-surface border border-default text-primary hover:border-hover focus:outline-none focus:ring-1 focus:ring-primary-ring"
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {typeFilter && (
            <button onClick={() => setTypeFilter("")} className="text-xs text-tertiary hover:text-primary underline">Clear</button>
          )}
        </div>
      )}

      <div className="space-y-4">
        {grouped.length === 0 ? (
          <Card className="p-10">
            <div className="flex flex-col items-center text-center">
              <Activity className="h-8 w-8 text-tertiary mb-2" />
              <p className="text-sm font-medium text-primary">
                {typeFilter ? "No matching activity" : "No activity yet"}
              </p>
              <p className="text-xs text-tertiary mt-1">Activity from all project modules will appear here.</p>
            </div>
          </Card>
        ) : (
          grouped.map((group) => (
            <div key={group.label}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary mb-2">{group.label}</h3>
              <div className="space-y-1.5">
                {group.items.map((a) => {
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
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
