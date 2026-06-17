import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { integrationsService } from "@/features/integrations/services/integrations";
import { projectsService } from "@/features/projects/services/projects";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoading } from "@/components/shared/LoadingSpinner";
import { useAuth } from "@/store/auth";

const INTEGRATION_TYPES = [
  { value: "github", label: "GitHub" },
  { value: "figma", label: "Figma" },
  { value: "email_hook", label: "Email Hook" },
];

interface FormData {
  project_id: string;
  type: string;
  label: string;
  config: Record<string, string>;
}

const emptyForm: FormData = {
  project_id: "",
  type: "github",
  label: "",
  config: {},
};

export default function IntegrationFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const isEdit = Boolean(id);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormData>(emptyForm);

  const { data: integration, isLoading: loadingIntegration } = useQuery({
    queryKey: ["integration", id],
    queryFn: () => integrationsService.get(Number(id)),
    enabled: isEdit,
  });

  const { data: projectsData } = useQuery({
    queryKey: ["projects-list-all"],
    queryFn: () => projectsService.list({ per_page: 100 }),
  });

  useEffect(() => {
    if (integration && isEdit) {
      setForm({
        project_id: String(integration.project_id),
        type: integration.type,
        label: integration.label || "",
        config: Object.entries(integration.config || {}).reduce(
          (acc, [k, v]) => ({ ...acc, [k]: String(v) }),
          {} as Record<string, string>
        ),
      });
    }
  }, [integration, isEdit]);

  const createMutation = useMutation({
    mutationFn: (data: { project_id: number; type: string; label?: string; config: Record<string, unknown> }) =>
      integrationsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      navigate("/integrations");
    },
    onError: (err: any) => setError(err?.response?.data?.detail || "Failed to create integration"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { label?: string; config: Record<string, unknown> }) =>
      integrationsService.update(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      navigate("/integrations");
    },
    onError: (err: any) => setError(err?.response?.data?.detail || "Failed to update integration"),
  });

  if (isEdit && loadingIntegration) return <PageLoading />;
  if (isEdit && !integration) return <p>Integration not found.</p>;

  if (!hasPermission("projects.update")) {
    return <p className="text-sm text-red-600">You don't have permission to manage integrations.</p>;
  }

  const configFields = () => {
    switch (form.type) {
      case "github":
        return (
          <>
            <label className="block text-sm font-medium">GitHub Token</label>
            <input type="password" className="w-full rounded-md border px-3 py-2 text-sm mt-1"
              value={form.config.token || ""}
              onChange={(e) => setForm({ ...form, config: { ...form.config, token: e.target.value } })}
              placeholder="ghp_..." />
            <label className="block text-sm font-medium mt-3">Repository</label>
            <input type="text" className="w-full rounded-md border px-3 py-2 text-sm mt-1"
              value={form.config.repo || ""}
              onChange={(e) => setForm({ ...form, config: { ...form.config, repo: e.target.value } })}
              placeholder="owner/repo" />
          </>
        );
      case "figma":
        return (
          <>
            <label className="block text-sm font-medium">Figma Token</label>
            <input type="password" className="w-full rounded-md border px-3 py-2 text-sm mt-1"
              value={form.config.token || ""}
              onChange={(e) => setForm({ ...form, config: { ...form.config, token: e.target.value } })}
              placeholder="figd_..." />
            <label className="block text-sm font-medium mt-3">File Key</label>
            <input type="text" className="w-full rounded-md border px-3 py-2 text-sm mt-1"
              value={form.config.file_key || ""}
              onChange={(e) => setForm({ ...form, config: { ...form.config, file_key: e.target.value } })}
              placeholder="abc123..." />
          </>
        );
      case "email_hook":
        return (
          <>
            <label className="block text-sm font-medium">Webhook URL</label>
            <input type="url" className="w-full rounded-md border px-3 py-2 text-sm mt-1"
              value={form.config.webhook_url || ""}
              onChange={(e) => setForm({ ...form, config: { ...form.config, webhook_url: e.target.value } })}
              placeholder="https://hooks.example.com/..." />
          </>
        );
      default:
        return null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.project_id) { setError("Please select a project"); return; }
    if (!form.type) { setError("Please select an integration type"); return; }

    const payload = {
      project_id: Number(form.project_id),
      type: form.type,
      label: form.label || undefined,
      config: form.config,
    };

    if (isEdit) {
      updateMutation.mutate({ label: form.label || undefined, config: form.config });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div>
      <PageHeader
        title={isEdit ? "Edit Integration" : "New Integration"}
        description={isEdit ? "Update integration configuration." : "Connect a new integration."}
      />
      <div className="mx-auto max-w-lg rounded-lg border bg-card p-6">
        {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEdit && (
            <>
              <div>
                <label className="block text-sm font-medium">Project</label>
                <select className="w-full rounded-md border px-3 py-2 text-sm mt-1"
                  value={form.project_id}
                  onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                >
                  <option value="">Select a project...</option>
                  {(projectsData?.items || []).map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Integration Type</label>
                <select className="w-full rounded-md border px-3 py-2 text-sm mt-1"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value, config: {} })}
                >
                  {INTEGRATION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium">Label (optional)</label>
            <input type="text" className="w-full rounded-md border px-3 py-2 text-sm mt-1"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="My GitHub Integration" />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Configuration</h3>
            {configFields()}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {isEdit ? "Update Integration" : "Create Integration"}
            </button>
            <button type="button" onClick={() => navigate("/integrations")}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
