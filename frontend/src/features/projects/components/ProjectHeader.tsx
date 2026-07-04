import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/store/auth";
import { useUpdateProjectStatus, useDeleteProject } from "@/features/projects/hooks/useProject";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Drawer } from "@/components/ui/Drawer";
import { ArrowLeft, Edit3, Trash2 } from "lucide-react";
import { formatDate } from "@/utils/formatters";
import type { Project } from "@/types";
import { useQueryClient } from "@tanstack/react-query";

const statusConfig: Record<string, { variant: "success" | "warning" | "danger" | "neutral"; label: string }> = {
  active: { variant: "success", label: "Active" },
  on_hold: { variant: "warning", label: "On Hold" },
  completed: { variant: "neutral", label: "Completed" },
  archived: { variant: "neutral", label: "Archived" },
};

const priorityConfig: Record<string, { variant: "success" | "warning" | "danger" | "neutral"; label: string }> = {
  low: { variant: "neutral", label: "Low" },
  medium: { variant: "warning", label: "Medium" },
  high: { variant: "danger", label: "High" },
  urgent: { variant: "danger", label: "Urgent" },
};

const statusTransitions: Record<string, string[]> = {
  active: ["on_hold", "completed"],
  on_hold: ["active", "completed"],
  completed: ["archived"],
  archived: ["active"],
};

function ProjectHealth({ progress, overdueTasks }: { progress: number; overdueTasks: number }) {
  const healthy = progress >= 75 && overdueTasks === 0;
  const warning = progress >= 40 && overdueTasks <= 2;
  const variant = healthy ? "success" : warning ? "warning" : "danger";
  const label = healthy ? "Healthy" : warning ? "At Risk" : "Critical";
  return <Badge variant={variant} size="sm" dot>{label}</Badge>;
}

export function ProjectHeader({ project, progress }: { project: Project; progress: number }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const statusMutation = useUpdateProjectStatus();
  const deleteMutation = useDeleteProject();
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const canEdit = hasPermission("project-edit");
  const canDelete = hasPermission("project-delete");
  const next = statusTransitions[project.status] || [];
  const statusCfg = statusConfig[project.status] || { variant: "neutral" as const, label: project.status };

  const handleDelete = () => {
    deleteMutation.mutate(project.id, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        navigate("/work/projects");
      },
    });
  };

  const memberAvatars = (project.members || []).slice(0, 5);

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button onClick={() => navigate("/work/projects")} className="p-1 rounded-md text-tertiary hover:text-primary hover:bg-hover shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-primary truncate">{project.name}</h1>
                <Badge variant={statusCfg.variant} dot>{statusCfg.label}</Badge>
                {project.priority_label && <Badge variant={priorityConfig[project.priority]?.variant || "neutral"} size="sm">{project.priority_label}</Badge>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {next.map((s) => (
              <Button key={s} size="sm" variant="secondary" onClick={() => statusMutation.mutate({ id: project.id, status: s })} loading={statusMutation.isPending}>
                {s === "completed" ? "Mark Complete" : s === "archived" ? "Archive" : `Move to ${s.replace("_", " ")}`}
              </Button>
            ))}
            {canEdit && <Button size="sm" variant="secondary" onClick={() => navigate(`/work/projects/${project.id}/edit`)}><Edit3 className="h-3.5 w-3.5" /></Button>}
            {canDelete && <Button size="sm" variant="danger" onClick={() => setDeleteConfirm(true)}><Trash2 className="h-3.5 w-3.5" /></Button>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-secondary">
          {progress >= 0 && (
            <div className="flex items-center gap-2">
              <span className="text-tertiary">Progress</span>
              <div className="w-24 h-1.5 bg-subtle rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-fast" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-primary font-medium">{progress}%</span>
            </div>
          )}

          {project.author && (
            <div className="flex items-center gap-1.5">
              <span className="text-tertiary">Owner</span>
              <Avatar name={project.author.name} size="sm" />
              <span>{project.author.name}</span>
            </div>
          )}

          {memberAvatars.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-tertiary">Members</span>
              <div className="flex -space-x-1.5">
                {memberAvatars.map((m) => (
                  <Avatar key={m.id} name={m.user?.name || "?"} size="sm" className="ring-2 ring-app" />
                ))}
              </div>
              <span>{project.members_count || project.member_count || memberAvatars.length}</span>
            </div>
          )}

          {project.deadline && (
            <div className="flex items-center gap-1">
              <span className="text-tertiary">Due</span>
              <span>{formatDate(project.deadline)}</span>
            </div>
          )}

          <ProjectHealth progress={progress} overdueTasks={0} />
        </div>
      </div>

      <Drawer open={deleteConfirm} onClose={() => setDeleteConfirm(false)} title="Delete project">
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            Delete <strong className="text-primary">{project.name}</strong>? This cannot be undone.
          </p>
          <div className="flex items-center gap-2">
            <Button variant="danger" size="sm" onClick={handleDelete} loading={deleteMutation.isPending}>Delete</Button>
            <Button variant="secondary" size="sm" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
          </div>
        </div>
      </Drawer>
    </>
  );
}
