import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Button, Card, Input, Select, SkeletonForm } from "@/design-system";
import { ArrowLeft, X, Upload, FileText } from "lucide-react";

export default function ProjectFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "active",
    priority: "medium",
    start_date: "",
    deadline: "",
    figma_url: "",
    github_url: "",
    docs_url: "",
    pm_id: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const {
    data: project,
    isLoading,
    isError: projectError,
  } = useQuery({
    queryKey: ["project", id],
    queryFn: () => api.get(`/projects/${id}`).then((r) => r.data?.data || r.data),
    enabled: isEdit,
  });

  const { data: usersData } = useQuery({
    queryKey: ["users-minimal"],
    queryFn: () =>
      api
        .get("/users", { params: { per_page: 100 } })
        .then((r) => r.data?.items || r.data?.data || []),
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
    onSuccess: async (res) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      const projectId = res.data?.data?.id || res.data?.id;
      if (projectId && files.length > 0) {
        setUploading(true);
        try {
          for (const file of files) {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("model_type", "project");
            fd.append("model_id", String(projectId));
            fd.append("collection_name", "attachments");
            await api.post("/attachments/upload", fd, {
              headers: { "Content-Type": "multipart/form-data" },
            });
          }
        } catch (e) {
          console.error("Failed to upload some files", e);
        }
        setUploading(false);
      }
      navigate(`/work/projects/${projectId}`);
    },
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      navigate(`/work/projects/${id}`);
    },
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

  if (isEdit && isLoading)
    return (
      <div className="page-container py-8">
        <SkeletonForm fields={6} />
      </div>
    );
  if (isEdit && projectError)
    return (
      <div className="page-container py-6">
        <p className="text-sm text-danger">Failed to load project. Please try again.</p>
      </div>
    );

  const users = Array.isArray(usersData) ? (usersData as Array<{ id: number; name: string }>) : [];

  return (
    <div className="page-container max-w-2xl py-6">
      <div className="mb-5 flex items-center gap-3">
        <button
          onClick={() => navigate(isEdit ? `/work/projects/${id}` : "/work/projects")}
          className="rounded-md p-1 text-tertiary transition-colors hover:bg-hover hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-xl font-bold text-primary">
          {isEdit ? "Edit Project" : "New Project"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <div className="space-y-4">
            <Input
              label="Project name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              error={errors.name}
              required
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-primary">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={3}
                className="border-default focus:ring-primary-ring w-full resize-y rounded-md border bg-surface px-3 py-2 text-sm text-primary transition-colors duration-fast placeholder:text-tertiary hover:border-hover focus:border-primary focus:outline-none focus:ring-2"
                placeholder="Describe the project..."
              />
              {errors.description && (
                <p className="mt-1 text-xs text-danger">{errors.description}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Status"
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
                options={[
                  { value: "active", label: "Active" },
                  { value: "on_hold", label: "On Hold" },
                  { value: "completed", label: "Completed" },
                  { value: "archived", label: "Archived" },
                ]}
              />
              <Select
                label="Priority"
                value={form.priority}
                onChange={(e) => set("priority", e.target.value)}
                options={[
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high", label: "High" },
                  { value: "urgent", label: "Urgent" },
                ]}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start date"
                type="date"
                value={form.start_date}
                onChange={(e) => set("start_date", e.target.value)}
              />
              <Input
                label="Deadline"
                type="date"
                value={form.deadline}
                onChange={(e) => set("deadline", e.target.value)}
              />
            </div>
            <Select
              label="Project Manager"
              value={form.pm_id}
              onChange={(e) => set("pm_id", e.target.value)}
              options={[
                { value: "", label: "None" },
                ...users.map((u: { id: number; name: string }) => ({
                  value: String(u.id),
                  label: u.name,
                })),
              ]}
            />
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-sm font-semibold text-primary">Links</h3>
          <div className="space-y-4">
            <Input
              label="Figma URL"
              value={form.figma_url}
              onChange={(e) => set("figma_url", e.target.value)}
              placeholder="https://figma.com/file/..."
            />
            <Input
              label="GitHub URL"
              value={form.github_url}
              onChange={(e) => set("github_url", e.target.value)}
              placeholder="https://github.com/..."
            />
            <Input
              label="Docs URL"
              value={form.docs_url}
              onChange={(e) => set("docs_url", e.target.value)}
              placeholder="https://..."
            />
          </div>
        </Card>

        {!isEdit && (
          <Card>
            <h3 className="mb-4 text-sm font-semibold text-primary">Attachments</h3>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-default flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-surface px-4 py-6 transition-colors hover:border-hover"
            >
              <Upload className="mb-1 h-5 w-5 text-tertiary" />
              <p className="text-sm text-tertiary">Click to add PDFs, Excel, images</p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                onChange={(e) => {
                  const selected = Array.from(e.target.files || []);
                  setFiles((prev) => [...prev, ...selected]);
                  if (e.target) e.target.value = "";
                }}
              />
            </div>
            {files.length > 0 && (
              <ul className="mt-3 space-y-1">
                {files.map((f, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 rounded-md bg-subtle px-2 py-1 text-sm text-secondary"
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0 text-tertiary" />
                    <span className="flex-1 truncate">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                      className="text-tertiary transition-colors hover:text-semantic-danger"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            loading={createMutation.isPending || updateMutation.isPending || uploading}
          >
            {isEdit ? "Save Changes" : uploading ? "Uploading files..." : "Create Project"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate(isEdit ? `/work/projects/${id}` : "/work/projects")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
