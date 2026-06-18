import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksService } from "@/features/tasks/services/tasks";
import { api } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { SkeletonForm } from "@/components/ui/Skeleton";
import { ArrowLeft } from "lucide-react";

const statusOptions = [
  { value: "backlog", label: "Backlog" },
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review", label: "In Review" },
  { value: "approved", label: "Approved" },
  { value: "done", label: "Done" },
  { value: "blocked", label: "Blocked" },
  { value: "cancelled", label: "Cancelled" },
];

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export default function TaskFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    due_date: "",
    assignee_id: "",
    project_id: searchParams.get("project_id") || "",
    estimated_hours: "",
  });
  const [error, setError] = useState("");

  const { data: task, isLoading: taskLoading } = useQuery({
    queryKey: ["task", id],
    queryFn: () => tasksService.get(Number(id)),
    enabled: isEdit,
  });

  const { data: projectsData } = useQuery({
    queryKey: ["projects-list"],
    queryFn: () => api.get("/projects").then((r) => r.data),
  });

  const { data: usersData } = useQuery({
    queryKey: ["users-list"],
    queryFn: () => api.get("/users").then((r) => r.data),
  });

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description || "",
        status: task.status,
        priority: task.priority,
        due_date: task.due_date?.split("T")[0] || "",
        assignee_id: task.assignee_id?.toString() || "",
        project_id: task.project_id?.toString() || "",
        estimated_hours: task.estimated_hours?.toString() || "",
      });
    }
  }, [task]);

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      isEdit ? tasksService.update(Number(id), data) : tasksService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      navigate(isEdit ? `/work/tasks/${id}` : "/work/tasks");
    },
    onError: (err: any) => setError(err?.response?.data?.detail || "Failed to save"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const payload: Record<string, unknown> = {
      ...form,
      assignee_id: form.assignee_id ? Number(form.assignee_id) : undefined,
      project_id: form.project_id ? Number(form.project_id) : undefined,
      estimated_hours: form.estimated_hours ? Number(form.estimated_hours) : undefined,
    };
    if (!payload.due_date) delete payload.due_date;
    mutation.mutate(payload);
  };

  if (isEdit && taskLoading) {
    return (
      <div className="page-container py-6 space-y-5">
        <div className="h-6 w-48 bg-subtle skeleton-pulse rounded-md" />
        <SkeletonForm fields={6} />
      </div>
    );
  }

  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  const projects = Array.isArray(projectsData) ? projectsData : projectsData?.items || projectsData?.data || [];
  const users = Array.isArray(usersData) ? usersData : usersData?.items || usersData?.data || [];

  return (
    <div className="page-container py-6 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1 rounded-md text-tertiary hover:text-primary hover:bg-hover">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-xl font-bold text-primary">{isEdit ? "Edit Task" : "Create Task"}</h1>
      </div>

      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-md bg-semantic-danger-soft px-4 py-3 text-sm text-semantic-danger border border-semantic-danger/20">
              {error}
            </div>
          )}

          <Input
            label="Title"
            required
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="What needs to be done?"
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-primary">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Add a description..."
              rows={4}
              className="w-full rounded-md bg-surface border border-default px-3 py-2 text-sm text-primary placeholder:text-tertiary hover:border-hover focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary transition-colors duration-fast resize-y"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => update("status", e.target.value)}
              options={statusOptions}
            />
            <Select
              label="Priority"
              value={form.priority}
              onChange={(e) => update("priority", e.target.value)}
              options={priorityOptions}
            />
            <Select
              label="Project"
              value={form.project_id}
              onChange={(e) => update("project_id", e.target.value)}
              placeholder="No project"
              options={projects.map((p: any) => ({ value: String(p.id), label: p.name }))}
            />
            <Select
              label="Assignee"
              value={form.assignee_id}
              onChange={(e) => update("assignee_id", e.target.value)}
              placeholder="Unassigned"
              options={users.map((u: any) => ({ value: String(u.id), label: u.name }))}
            />
            <Input
              label="Due Date"
              type="date"
              value={form.due_date}
              onChange={(e) => update("due_date", e.target.value)}
            />
            <Input
              label="Estimated Hours"
              type="number"
              value={form.estimated_hours}
              onChange={(e) => update("estimated_hours", e.target.value)}
              placeholder="e.g. 4"
              min="0"
              step="0.5"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" loading={mutation.isPending}>
              {isEdit ? "Update Task" : "Create Task"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
