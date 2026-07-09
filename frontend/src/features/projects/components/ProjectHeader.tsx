import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/store/auth";
import { useUpdateProjectStatus, useDeleteProject, useDuplicateProject } from "@/features/projects/hooks/useProject";
import { EditProjectDialog } from "@/features/projects/components/EditProjectDialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ArrowLeft, Edit3, Trash2, MoreVertical, Archive, Copy } from "lucide-react";
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
  const duplicateMutation = useDuplicateProject();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const handleDuplicate = () => {
    duplicateMutation.mutate({ id: project.id });
    setMenuOpen(false);
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
            <div ref={menuRef} className="relative">
              <Button size="sm" variant="secondary" onClick={() => setMenuOpen(!menuOpen)}>
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-surface border border-default rounded-lg shadow-dropdown z-dropdown py-1">
                  {canEdit && (
                    <button onClick={() => { setEditOpen(true); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-primary hover:bg-hover transition-colors text-left">
                      <Edit3 className="h-3.5 w-3.5 text-tertiary" /> Edit Project
                    </button>
                  )}
                  <button onClick={handleDuplicate} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-primary hover:bg-hover transition-colors text-left">
                    <Copy className="h-3.5 w-3.5 text-tertiary" /> Duplicate Project
                  </button>
                  {project.status !== "archived" && (
                    <button onClick={() => { statusMutation.mutate({ id: project.id, status: "archived" }); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-primary hover:bg-hover transition-colors text-left">
                      <Archive className="h-3.5 w-3.5 text-tertiary" /> Archive Project
                    </button>
                  )}
                  {canDelete && (
                    <button onClick={() => { setDeleteConfirm(true); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-semantic-danger hover:bg-danger-soft transition-colors text-left">
                      <Trash2 className="h-3.5 w-3.5" /> Delete Project
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-secondary">
          <div className="flex items-center gap-2">
            <span className="text-tertiary">Progress</span>
            <div className="w-24 h-1.5 bg-subtle rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-fast" style={{ width: `${Math.min(progress, 100)}%` }} />
            </div>
            <span className="text-primary font-medium tabular-nums">{Math.min(progress, 100)}%</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-tertiary">Owner</span>
            {project.author ? (
              <>
                <Avatar name={project.author.name} size="sm" />
                <span>{project.author.name}</span>
              </>
            ) : (
              <span className="text-tertiary italic">—</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-tertiary">Members</span>
            {memberAvatars.length > 0 ? (
              <>
                <div className="flex -space-x-1.5">
                  {memberAvatars.map((m) => (
                    <Avatar key={m.id} name={m.user?.name || "?"} size="sm" className="ring-2 ring-app" />
                  ))}
                </div>
                <span className="tabular-nums">{project.members_count || project.member_count || memberAvatars.length}</span>
              </>
            ) : (
              <span className="text-tertiary italic">—</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <span className="text-tertiary">Due</span>
            {project.deadline ? (
              <span>{formatDate(project.deadline)}</span>
            ) : (
              <span className="text-tertiary italic">—</span>
            )}
          </div>

          <ProjectHealth progress={progress} overdueTasks={0} />
        </div>
      </div>

      <EditProjectDialog open={editOpen} onClose={() => setEditOpen(false)} project={project} />

      <ConfirmDialog
        open={deleteConfirm}
        onCancel={() => setDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete project"
        message={`Delete "${project.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />
    </>
  );
}
