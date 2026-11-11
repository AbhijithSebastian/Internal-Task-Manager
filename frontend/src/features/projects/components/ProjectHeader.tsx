import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/store/auth";
import {
  useUpdateProjectStatus,
  useDeleteProject,
  useDuplicateProject,
} from "@/features/projects/hooks/useProject";
import { EditProjectDialog } from "@/features/projects/components/EditProjectDialog";
import { Avatar, Badge, Button } from "@/design-system";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ArrowLeft, Edit3, Trash2, MoreVertical, Archive, Copy } from "lucide-react";
import { formatDate } from "@/utils/formatters";
import type { Project } from "@/types";
import { useQueryClient } from "@tanstack/react-query";

const statusConfig: Record<
  string,
  { variant: "success" | "warning" | "danger" | "neutral"; label: string }
> = {
  active: { variant: "success", label: "Active" },
  on_hold: { variant: "warning", label: "On Hold" },
  completed: { variant: "neutral", label: "Completed" },
  archived: { variant: "neutral", label: "Archived" },
};

const priorityConfig: Record<
  string,
  { variant: "success" | "warning" | "danger" | "neutral"; label: string }
> = {
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
  return (
    <Badge variant={variant} size="sm" dot>
      {label}
    </Badge>
  );
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
  const statusCfg = statusConfig[project.status] || {
    variant: "neutral" as const,
    label: project.status,
  };

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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              onClick={() => navigate("/work/projects")}
              className="shrink-0 rounded-md p-1 text-tertiary hover:bg-hover hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-bold text-primary">{project.name}</h1>
                <Badge variant={statusCfg.variant} dot>
                  {statusCfg.label}
                </Badge>
                {project.priority_label && (
                  <Badge variant={priorityConfig[project.priority]?.variant || "neutral"} size="sm">
                    {project.priority_label}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {next.map((s) => (
              <Button
                key={s}
                size="sm"
                variant="secondary"
                onClick={() => statusMutation.mutate({ id: project.id, status: s })}
                loading={statusMutation.isPending}
              >
                {s === "completed"
                  ? "Mark Complete"
                  : s === "archived"
                    ? "Archive"
                    : `Move to ${s.replace("_", " ")}`}
              </Button>
            ))}
            <div ref={menuRef} className="relative">
              <Button size="sm" variant="secondary" onClick={() => setMenuOpen(!menuOpen)}>
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
              {menuOpen && (
                <div className="border-default absolute right-0 top-full z-dropdown mt-1 w-52 rounded-lg border bg-surface py-1 shadow-dropdown">
                  {canEdit && (
                    <button
                      onClick={() => {
                        setEditOpen(true);
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-primary transition-colors hover:bg-hover"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-tertiary" /> Edit Project
                    </button>
                  )}
                  <button
                    onClick={handleDuplicate}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-primary transition-colors hover:bg-hover"
                  >
                    <Copy className="h-3.5 w-3.5 text-tertiary" /> Duplicate Project
                  </button>
                  {project.status !== "archived" && (
                    <button
                      onClick={() => {
                        statusMutation.mutate({ id: project.id, status: "archived" });
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-primary transition-colors hover:bg-hover"
                    >
                      <Archive className="h-3.5 w-3.5 text-tertiary" /> Archive Project
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => {
                        setDeleteConfirm(true);
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-semantic-danger transition-colors hover:bg-danger-soft"
                    >
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
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-subtle">
              <div
                className="h-full rounded-full bg-primary transition-all duration-fast"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <span className="font-medium tabular-nums text-primary">
              {Math.min(progress, 100)}%
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-tertiary">Owner</span>
            {project.author ? (
              <>
                <Avatar name={project.author.name} size="sm" />
                <span>{project.author.name}</span>
              </>
            ) : (
              <span className="italic text-tertiary">—</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-tertiary">Members</span>
            {memberAvatars.length > 0 ? (
              <>
                <div className="flex -space-x-1.5">
                  {memberAvatars.map((m) => (
                    <Avatar
                      key={m.id}
                      name={m.user?.name || "?"}
                      size="sm"
                      className="ring-app ring-2"
                    />
                  ))}
                </div>
                <span className="tabular-nums">
                  {project.members_count || project.member_count || memberAvatars.length}
                </span>
              </>
            ) : (
              <span className="italic text-tertiary">—</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <span className="text-tertiary">Due</span>
            {project.deadline ? (
              <span>{formatDate(project.deadline)}</span>
            ) : (
              <span className="italic text-tertiary">—</span>
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
