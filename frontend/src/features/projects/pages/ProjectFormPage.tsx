import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsService } from "@/features/projects/services/projects";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoading } from "@/components/shared/LoadingSpinner";

export default function ProjectFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: "", description: "", status: "active", priority: "medium",
    deadline: "", start_date: "", budget: "" as any,
  });
  const [error, setError] = useState("");

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectsService.get(Number(id)),
    enabled: isEdit,
  });

  useEffect(() => {
    if (project) {
      setForm({
        name: project.name,
        description: project.description || "",
        status: project.status,
        priority: project.priority,
        deadline: project.deadline?.split("T")[0] || "",
        start_date: project.start_date?.split("T")[0] || "",
        budget: project.budget?.toString() || "",
      });
    }
  }, [project]);

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit ? projectsService.update(Number(id), data) : projectsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      navigate(isEdit ? `/projects/${id}` : "/projects");
    },
    onError: (err: any) => setError(err?.response?.data?.detail || "Failed to save"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const payload: Record<string, unknown> = { ...form };
    if (!payload.deadline) delete payload.deadline;
    if (!payload.start_date) delete payload.start_date;
    if (!payload.budget) delete payload.budget;
    else payload.budget = Number(payload.budget);
    mutation.mutate(payload);
  };

  if (isEdit && isLoading) return <PageLoading />;

  return (
    <div>
      <PageHeader title={isEdit ? "Edit Project" : "Create Project"} />
      <div className="max-w-2xl rounded-lg border bg-card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium">Name</label>
              <input type="text" required className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium">Description</label>
              <textarea rows={4} className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium">Status</label>
              <select className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Priority</label>
              <select className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Start Date</label>
              <input type="date" className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium">Deadline</label>
              <input type="date" className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium">Budget</label>
              <input type="number" step="0.01" className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={mutation.isPending} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {mutation.isPending ? "Saving..." : isEdit ? "Update Project" : "Create Project"}
            </button>
            <button type="button" onClick={() => navigate(-1)} className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
