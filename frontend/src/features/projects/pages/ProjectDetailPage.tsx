import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { projectsService } from "@/features/projects/services/projects";
import { tasksService } from "@/features/tasks/services/tasks";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoading } from "@/components/shared/LoadingSpinner";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Pencil, Trash2, ArrowLeft } from "lucide-react";
import { formatDate } from "@/utils/formatters";
import { useAuth } from "@/store/auth";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import type { Task } from "@/types";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [taskPage, setTaskPage] = useState(1);

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectsService.get(Number(id)),
    enabled: Boolean(id),
  });

  const { data: tasksData } = useQuery({
    queryKey: ["project-tasks", id, taskPage],
    queryFn: () => tasksService.list({ project_id: id, page: taskPage, per_page: 10 }),
    enabled: Boolean(id),
  });

  const canEdit = hasPermission("project-edit");
  const canDelete = hasPermission("project-delete");
  const [showDelete, setShowDelete] = useState(false);

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => projectsService.delete(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      navigate("/projects");
    },
  });

  const taskColumns: Column<Task>[] = [
    { key: "title", label: "Task",
      render: (t) => <Link to={`/tasks/${t.id}`} className="font-medium hover:underline">{t.title}</Link>,
    },
    { key: "status", label: "Status", render: (t) => <StatusBadge status={t.status} /> },
    { key: "priority", label: "Priority", render: (t) => <PriorityBadge priority={t.priority} /> },
    { key: "assignee", label: "Assignee",
      render: (t) => (t as any).assignee?.name || "Unassigned",
    },
    { key: "due_date", label: "Due",
      render: (t) => t.due_date ? formatDate(t.due_date) : "-",
    },
  ];

  if (isLoading) return <PageLoading />;
  if (!project) return <p>Project not found.</p>;

  return (
    <div>
      <PageHeader
        title={project.name}
        actions={
          <div className="flex gap-2">
            <Link to="/projects" className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            {canEdit && (
              <Link to={`/projects/${project.id}/edit`} className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted">
                <Pencil className="h-4 w-4" /> Edit
              </Link>
            )}
            {canDelete && (
              <button onClick={() => setShowDelete(true)} className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            )}
          </div>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Details</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Description</dt>
                <dd className="text-right max-w-md">{project.description || "No description"}</dd>
              </div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Status</dt><dd><StatusBadge status={project.status} /></dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Priority</dt><dd><PriorityBadge priority={project.priority} /></dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Start Date</dt><dd>{project.start_date ? formatDate(project.start_date) : "-"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Deadline</dt><dd>{project.deadline ? formatDate(project.deadline) : "-"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Budget</dt><dd>{project.budget ? `$${project.budget.toFixed(2)}` : "-"}</dd></div>
            </dl>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Tasks</h2>
              {hasPermission("task-create") && (
                <Link to={`/tasks/new?project_id=${project.id}`} className="text-sm text-primary hover:underline">Add Task</Link>
              )}
            </div>
            <DataTable
              columns={taskColumns}
              data={tasksData?.items ?? []}
              loading={false}
              page={taskPage}
              totalPages={tasksData?.total_pages}
              onPageChange={setTaskPage}
              keyExtractor={(t) => t.id}
              emptyMessage="No tasks in this project."
              onRowClick={(t) => navigate(`/tasks/${t.id}`)}
            />
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6 h-fit">
          <h2 className="mb-4 text-lg font-semibold">Members</h2>
          {(project as any).members?.length > 0 ? (
            <ul className="space-y-2">
              {(project as any).members?.map((m: any) => (
                <li key={m.user_id} className="flex items-center gap-2 text-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {m.user?.name?.[0] || "?"}
                  </div>
                  <div>
                    <p className="font-medium">{m.user?.name}</p>
                    <p className="text-xs text-muted-foreground">{m.role || "member"}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No members yet.</p>
          )}
        </div>
      </div>
      <ConfirmDialog
        open={showDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${project.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}
