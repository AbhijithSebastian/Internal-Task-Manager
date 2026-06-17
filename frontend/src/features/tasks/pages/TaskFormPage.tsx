import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksService } from "@/features/tasks/services/tasks";
import { projectsService } from "@/features/projects/services/projects";
import { usersService } from "@/features/users/services/users";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoading } from "@/components/shared/LoadingSpinner";

export default function TaskFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    title: "", description: "", status: "backlog", priority: "medium",
    due_date: "", assignee_id: "" as any, project_id: (searchParams.get("project_id") || "") as any,
  });
  const [error, setError] = useState("");

  const { data: task, isLoading } = useQuery({
    queryKey: ["task", id],
    queryFn: () => tasksService.get(Number(id)),
    enabled: isEdit,
  });

  const { data: projectsData } = useQuery({
    queryKey: ["projects-list"],
    queryFn: () => projectsService.list({ per_page: 100 }),
  });

  const { data: usersData } = useQuery({
    queryKey: ["users-list"],
    queryFn: () => usersService.list({ per_page: 200, is_active: true }),
  });

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description || "",
        status: task.status,
        priority: task.priority,
        due_date: task.due_date?.split("T")[0] || "",
        assignee_id: (task as any).assignee_id?.toString() || "",
        project_id: (task as any).project_id?.toString() || "",
      });
    }
  }, [task]);

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit ? tasksService.update(Number(id), data) : tasksService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      navigate(isEdit ? `/tasks/${id}` : "/tasks");
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
    };
    if (!payload.due_date) delete payload.due_date;
    mutation.mutate(payload);
  };

  if (isEdit && isLoading) return <PageLoading />;

  return (
    <div>
      <PageHeader title={isEdit ? "Edit Task" : "Create Task"} />
      <div className="max-w-2xl rounded-lg border bg-card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium">Title</label>
              <input type="text" required className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium">Description</label>
              <textarea rows={4} className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium">Status</label>
              <select className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {["backlog","todo","in_progress","in_review","approved","done","blocked","cancelled"].map((s) => (
                  <option key={s} value={s}>{s.replace("_", " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Priority</label>
              <select className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {["low","medium","high","critical"].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Project</label>
              <select className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}>
                <option value="">No project</option>
                {projectsData?.items?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Assignee</label>
              <select className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" value={form.assignee_id} onChange={(e) => setForm({ ...form, assignee_id: e.target.value })}>
                <option value="">Unassigned</option>
                {(usersData?.items || []).map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Due Date</label>
              <input type="date" className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={mutation.isPending} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {mutation.isPending ? "Saving..." : isEdit ? "Update Task" : "Create Task"}
            </button>
            <button type="button" onClick={() => navigate(-1)} className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
