import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { SkeletonForm } from "@/components/ui/Skeleton";
import { ArrowLeft } from "lucide-react";

export default function ProjectFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;
  const [form, setForm] = useState({
    name: "", description: "", status: "active", priority: "medium",
    start_date: "", deadline: "", figma_url: "", github_url: "", docs_url: "", pm_id: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: () => api.get(`/projects/${id}`).then((r) => r.data?.data || r.data),
    enabled: isEdit,
  });

  const { data: usersData } = useQuery({
    queryKey: ["users-minimal"],
    queryFn: () => api.get("/users", { params: { per_page: 200 } }).then((r) => r.data?.items || r.data?.data || []),
  });

  useEffect(() => {
    if (!project) return;
    const p = project as Record<string, unknown>;
    setForm({
      name: (p.name as string) || "",
      description: (p.description as string) || "",
      status: (p.status as string) || "active",
      priority: (p.priority as string) || "medium",
      start_date: ((p.start_date as string) || "").split("T")[0] || "",
      deadline: ((p.deadline as string) || "").split("T")[0] || "",
      figma_url: (p.figma_url as string) || "",
      github_url: (p.github_url as string) || "",
      docs_url: (p.docs_url as string) || "",
      pm_id: p.pm_id ? String(p.pm_id) : "",
    });
  }, [project]);

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post("/projects", data),
    onSuccess: (res) => { queryClient.invalidateQueries({ queryKey: ["projects"] }); navigate(`/work/projects/${res.data?.data?.id || res.data?.id}`); },
    onError: (err: { response?: { data?: { errors?: Record<string, string[]> } } }) => {
      const serverErrors = err.response?.data?.errors;
      if (serverErrors) {
        const flat: Record<string, string> = {};
        for (const [k, v] of Object.entries(serverErrors)) flat[k] = (v as string[])[0];
        setErrors(flat);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.put(`/projects/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["projects"] }); queryClient.invalidateQueries({ queryKey: ["project", id] }); navigate(`/work/projects/${id}`); },
    onError: (err: { response?: { data?: { errors?: Record<string, string[]> } } }) => {
      const serverErrors = err.response?.data?.errors;
      if (serverErrors) {
        const flat: Record<string, string> = {};
        for (const [k, v] of Object.entries(serverErrors)) flat[k] = (v as string[])[0];
        setErrors(flat);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const payload: Record<string, unknown> = {
      ...form,
      pm_id: form.pm_id ? Number(form.pm_id) : undefined,
    };
    if (!payload.start_date) delete payload.start_date;
    if (!payload.deadline) delete payload.deadline;
    if (isEdit) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  };

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  if (isEdit && isLoading) return <div className="page-container py-8"><SkeletonForm fields={6} /></div>;

  const users = Array.isArray(usersData) ? usersData as Array<{ id: number; name: string }> : [];

  return (
    <div className="page-container max-w-2xl py-6">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(isEdit ? `/work/projects/${id}` : "/work/projects")} className="p-1 rounded-md text-tertiary hover:text-primary hover:bg-hover transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-xl font-bold text-primary">{isEdit ? "Edit Project" : "New Project"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <div className="space-y-4">
            <Input label="Project name" value={form.name} onChange={(e) => set("name", e.target.value)} error={errors.name} required />
            <div>
              <label className="block text-sm font-medium text-primary mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={3}
                className="w-full rounded-md bg-surface border border-default px-3 py-2 text-sm text-primary placeholder:text-tertiary hover:border-hover focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary transition-colors duration-fast resize-y"
                placeholder="Describe the project..."
              />
              {errors.description && <p className="text-xs text-danger mt-1">{errors.description}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select label="Status" value={form.status} onChange={(e) => set("status", e.target.value)} options={[
                { value: "active", label: "Active" }, { value: "on_hold", label: "On Hold" },
                { value: "completed", label: "Completed" }, { value: "archived", label: "Archived" },
              ]} />
              <Select label="Priority" value={form.priority} onChange={(e) => set("priority", e.target.value)} options={[
                { value: "low", label: "Low" }, { value: "medium", label: "Medium" },
                { value: "high", label: "High" }, { value: "urgent", label: "Urgent" },
              ]} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Start date" type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} />
              <Input label="Deadline" type="date" value={form.deadline} onChange={(e) => set("deadline", e.target.value)} />
            </div>
            <Select label="Project Manager" value={form.pm_id} onChange={(e) => set("pm_id", e.target.value)} options={[
              { value: "", label: "None" },
              ...users.map((u: { id: number; name: string }) => ({ value: String(u.id), label: u.name })),
            ]} />
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-primary mb-4">Links</h3>
          <div className="space-y-4">
            <Input label="Figma URL" value={form.figma_url} onChange={(e) => set("figma_url", e.target.value)} placeholder="https://figma.com/file/..." />
            <Input label="GitHub URL" value={form.github_url} onChange={(e) => set("github_url", e.target.value)} placeholder="https://github.com/..." />
            <Input label="Docs URL" value={form.docs_url} onChange={(e) => set("docs_url", e.target.value)} placeholder="https://..." />
          </div>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
            {isEdit ? "Save Changes" : "Create Project"}
          </Button>
          <Button variant="secondary" onClick={() => navigate(isEdit ? `/work/projects/${id}` : "/work/projects")}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
