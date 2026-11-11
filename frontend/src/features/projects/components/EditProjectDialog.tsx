import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useUpdateProject } from "@/features/projects/hooks/useProject";
import { Button, Drawer, Input, Select } from "@/design-system";
import type { Project } from "@/types";

interface EditProjectDialogProps {
  open: boolean;
  onClose: () => void;
  project: Project;
}

export function EditProjectDialog({ open, onClose, project }: EditProjectDialogProps) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "active",
    priority: "medium",
    start_date: "",
    end_date: "",
    deadline: "",
    figma_url: "",
    github_url: "",
    docs_url: "",
    pm_id: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateMutation = useUpdateProject();

  const { data: usersData } = useQuery({
    queryKey: ["users-minimal"],
    queryFn: () =>
      api
        .get("/users", { params: { per_page: 100 } })
        .then((r) => r.data?.items || r.data?.data || []),
  });

  useEffect(() => {
    if (!project) return;
    const p = project as unknown as Record<string, unknown>;
    setForm({
      name: (p.name as string) || "",
      description: (p.description as string) || "",
      status: (p.status as string) || "active",
      priority: (p.priority as string) || "medium",
      start_date: ((p.start_date as string) || "").split("T")[0] || "",
      end_date: ((p.end_date as string) || "").split("T")[0] || "",
      deadline: ((p.deadline as string) || "").split("T")[0] || "",
      figma_url: (p.figma_url as string) || "",
      github_url: (p.github_url as string) || "",
      docs_url: (p.docs_url as string) || "",
      pm_id: p.pm_id ? String(p.pm_id) : "",
    });
    setErrors({});
  }, [project, open]);

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const payload: Record<string, unknown> = {
      ...form,
      pm_id: form.pm_id ? Number(form.pm_id) : undefined,
    };
    if (!payload.start_date) delete payload.start_date;
    if (!payload.end_date) delete payload.end_date;
    if (!payload.deadline) delete payload.deadline;

    updateMutation.mutate(
      { id: project.id, data: payload as Partial<Project> },
      {
        onSuccess: () => onClose(),
        onError: (err) => {
          const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]> } } };
          const serverErrors = axiosErr.response?.data?.errors;
          if (serverErrors) {
            const flat: Record<string, string> = {};
            for (const [k, v] of Object.entries(serverErrors)) flat[k] = (v as string[])[0];
            setErrors(flat);
          }
        },
      },
    );
  };

  const users = Array.isArray(usersData) ? (usersData as Array<{ id: number; name: string }>) : [];

  return (
    <Drawer open={open} onClose={onClose} title="Edit Project">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Project name"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          error={errors.name}
          required
        />
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-grey-500">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
            className="w-full resize-y rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-grey-900 transition-colors placeholder:text-grey-400 hover:border-grey-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            placeholder="Describe the project..."
          />
          {errors.description && <p className="mt-1 text-xs text-danger">{errors.description}</p>}
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
            label="End date"
            type="date"
            value={form.end_date}
            onChange={(e) => set("end_date", e.target.value)}
          />
        </div>
        {form.deadline && <input type="hidden" value={form.deadline} />}
        <Select
          label="Owner"
          value={form.pm_id}
          onChange={(e) => set("pm_id", e.target.value)}
          options={[
            { value: "", label: "None" },
            ...users.map((u) => ({ value: String(u.id), label: u.name })),
          ]}
        />
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-primary">External Links</h4>
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
        <div className="flex items-center justify-end gap-2.5 border-t border-border-default pt-4">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={updateMutation.isPending}>
            Save Changes
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
