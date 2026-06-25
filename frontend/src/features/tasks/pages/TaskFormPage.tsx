import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksService } from "@/features/tasks/services/tasks";
import { api } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { SkeletonForm } from "@/components/ui/Skeleton";
import { Avatar } from "@/components/ui/Avatar";
import { ArrowLeft, X, Upload, FileText } from "lucide-react";

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
    assignee_ids: [] as number[],
    project_id: searchParams.get("project_id") || "",
    estimated_hours: "",
  });
  const [error, setError] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: task, isLoading: taskLoading } = useQuery({
    queryKey: ["task", id],
    queryFn: () => tasksService.get(Number(id)),
    enabled: isEdit,
  });

  const { data: projectsData } = useQuery({
    queryKey: ["projects-list"],
    queryFn: () => api.get("/projects", { params: { per_page: 100 } }).then((r) => r.data),
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
        assignee_ids: (task.assignees || []).map((a) => a.id),
        project_id: task.project_id?.toString() || "",
        estimated_hours: task.estimated_hours?.toString() || "",
      });
    }
  }, [task]);

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      isEdit ? tasksService.update(Number(id), data) : tasksService.create(data),
    onSuccess: async (result: any) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      if (!isEdit && files.length > 0) {
        const taskId = result.id || result?.data?.id;
        if (taskId) {
          setUploading(true);
          try {
            for (const file of files) {
              const fd = new FormData();
              fd.append("file", file);
              fd.append("model_type", "task");
              fd.append("model_id", String(taskId));
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
      }
      navigate("/work/tasks");
    },
    onError: (err: any) => setError(err?.response?.data?.detail || "Failed to save"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const payload: Record<string, unknown> = {
      ...form,
      assignee_ids: form.assignee_ids.length > 0 ? form.assignee_ids : undefined,
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
            <div className="space-y-2">
              <label className="block text-sm font-medium text-primary">Assignees</label>
              <div className="max-h-40 overflow-y-auto border border-default rounded-md divide-y divide-subtle">
                {(users as Array<{ id: number; name: string }>).map((u) => {
                  const checked = form.assignee_ids.includes(u.id);
                  return (
                    <label key={u.id} className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors ${checked ? "bg-primary-soft text-primary" : "text-secondary hover:bg-hover"}`}>
                      <input type="checkbox" checked={checked} onChange={() => setForm((prev) => ({ ...prev, assignee_ids: checked ? prev.assignee_ids.filter((id) => id !== u.id) : [...prev.assignee_ids, u.id] }))} className="rounded border-default text-primary focus:ring-primary-ring" />
                      <Avatar name={u.name} size="sm" />
                      <span>{u.name}</span>
                    </label>
                  );
                })}
              </div>
              {form.assignee_ids.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {form.assignee_ids.map((id) => {
                    const u = (users as Array<{ id: number; name: string }>).find((x) => x.id === id);
                    if (!u) return null;
                    return (
                      <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-soft text-primary text-xs">
                        <Avatar name={u.name} size="sm" />
                        {u.name}
                        <button type="button" onClick={() => setForm((prev) => ({ ...prev, assignee_ids: prev.assignee_ids.filter((a) => a !== id) }))} className="hover:text-primary-hover"><X className="h-3 w-3" /></button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
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

          {!isEdit && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-primary">Attachments</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center py-6 px-4 rounded-lg border-2 border-dashed border-default hover:border-hover bg-surface cursor-pointer transition-colors"
              >
                <Upload className="h-5 w-5 text-tertiary mb-1" />
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
                <ul className="space-y-1">
                  {files.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 py-1 px-2 rounded-md bg-subtle text-sm text-secondary">
                      <FileText className="h-3.5 w-3.5 text-tertiary shrink-0" />
                      <span className="flex-1 truncate">{f.name}</span>
                      <button type="button" onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} className="text-tertiary hover:text-semantic-danger transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" loading={mutation.isPending || uploading}>
              {isEdit ? "Update Task" : (uploading ? "Uploading files..." : "Create Task")}
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
