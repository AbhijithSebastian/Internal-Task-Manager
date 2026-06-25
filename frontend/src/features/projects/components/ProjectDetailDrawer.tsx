import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { Drawer } from "@/components/ui/Drawer";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/utils/formatters";
import { Users, ListTodo, AlertCircle } from "lucide-react";
import { AttachmentsSection } from "@/components/shared/AttachmentsSection";
import type { Project } from "@/types";

interface ProjectDetailDrawerProps {
  projectId: number | null;
  onClose: () => void;
}

export function ProjectDetailDrawer({ projectId, onClose }: ProjectDetailDrawerProps) {
  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => api.get(`/projects/${projectId}`).then((r) => r.data?.data || r.data),
    enabled: Boolean(projectId),
  });

  const navigate = useNavigate();
  const p = project as Project | undefined;

  return (
    <Drawer open={Boolean(projectId)} onClose={onClose} title={p?.name || "Project"}>
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton variant="rect" className="h-6 w-48" />
          <Skeleton variant="rect" className="h-20 w-full" />
          <Skeleton variant="rect" className="h-16 w-full" />
          <Skeleton variant="rect" className="h-16 w-full" />
        </div>
      ) : !p ? (
        <div className="flex flex-col items-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-tertiary mb-3" />
          <p className="text-sm text-secondary">Project not found</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Badge variant={p.status === "active" ? "success" : p.status === "on_hold" ? "warning" : "neutral"} size="sm" dot>
              {p.status_label || p.status}
            </Badge>
            <Badge variant="info" size="sm">{p.priority_label || p.priority}</Badge>
          </div>

          {p.description && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-tertiary">Description</p>
              <p className="text-sm text-secondary whitespace-pre-wrap bg-subtle rounded-lg p-3">{p.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {p.member_count !== undefined && (
              <Card className="p-3 cursor-pointer hover:bg-hover transition-colors" onClick={() => { onClose(); navigate(`/work/projects/${p.id}`); }}>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-tertiary" />
                  <div>
                    <p className="text-xs text-tertiary">Members</p>
                    <p className="text-sm font-medium text-primary">{p.member_count}</p>
                  </div>
                </div>
              </Card>
            )}
            <Card className="p-3 cursor-pointer hover:bg-hover transition-colors" onClick={() => { onClose(); navigate(`/work/projects/${p.id}`); }}>
              <div className="flex items-center gap-2 text-sm">
                <ListTodo className="h-4 w-4 text-tertiary" />
                <div>
                  <p className="text-xs text-tertiary">Tasks</p>
                  <p className="text-sm font-medium text-primary">View</p>
                </div>
              </div>
            </Card>
          </div>

          {p.start_date && (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-tertiary">Start Date</p>
              <p className="text-sm text-primary">{formatDate(p.start_date)}</p>
            </div>
          )}
          {p.deadline && (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-tertiary">Deadline</p>
              <p className="text-sm text-primary">{formatDate(p.deadline)}</p>
            </div>
          )}

          <div className="space-y-1 text-xs text-tertiary">
            {p.created_at && <p>Created {formatDate(p.created_at)}</p>}
          </div>

          <div className="border-t border-subtle pt-4">
            <AttachmentsSection modelType="project" modelId={p.id} />
          </div>
        </div>
      )}
    </Drawer>
  );
}
