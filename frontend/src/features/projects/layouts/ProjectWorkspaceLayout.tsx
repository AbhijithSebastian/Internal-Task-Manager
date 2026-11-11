import { Outlet, useParams, useNavigate } from "react-router-dom";
import { useProject, useProjectTasks } from "@/features/projects/hooks/useProject";
import { ProjectHeader } from "@/features/projects/components/ProjectHeader";
import { WorkspaceTabs } from "@/features/projects/components/WorkspaceTabs";
import { Button, Skeleton } from "@/design-system";

export default function ProjectWorkspaceLayout() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading, isError } = useProject(projectId);
  const { data: tasks } = useProjectTasks(projectId);

  if (isLoading) {
    return (
      <div className="page-container space-y-5 py-6">
        <div className="flex items-center gap-3">
          <Skeleton variant="rect" className="h-7 w-7 rounded" />
          <Skeleton variant="text" className="h-6 w-48" />
        </div>
        <Skeleton variant="rect" className="h-9 w-full max-w-md rounded" />
        <Skeleton variant="rect" className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="page-container py-16 text-center">
        <p className="text-sm text-secondary">Project not found</p>
        <Button size="sm" className="mt-3" onClick={() => navigate("/work/projects")}>
          Back to Projects
        </Button>
      </div>
    );
  }

  const completedCount = (tasks || []).filter((t) => t.status === "done").length;
  const totalCount = (tasks || []).length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="page-container space-y-0 py-6">
      <ProjectHeader project={project} progress={progress} />
      <WorkspaceTabs projectId={project.id} />
      <div className="pt-5">
        <Outlet context={{ project, tasks }} />
      </div>
    </div>
  );
}
