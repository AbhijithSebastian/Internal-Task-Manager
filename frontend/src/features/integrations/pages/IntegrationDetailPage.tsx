import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { integrationsService } from "@/features/integrations/services/integrations";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoading } from "@/components/shared/LoadingSpinner";
import { RefreshCw, Pencil, ArrowLeft } from "lucide-react";
import { formatDateTime } from "@/utils/formatters";
import { useState } from "react";

export default function IntegrationDetailPage() {
  const { id } = useParams();
  const [syncResult, setSyncResult] = useState<any>(null);

  const { data: integration, isLoading } = useQuery({
    queryKey: ["integration", id],
    queryFn: () => integrationsService.get(Number(id)),
    enabled: Boolean(id),
  });

  const syncMutation = useMutation({
    mutationFn: () => integrationsService.sync(Number(id)),
    onSuccess: (data) => setSyncResult(data),
  });

  if (isLoading) return <PageLoading />;
  if (!integration) return <p>Integration not found.</p>;

  return (
    <div>
      <PageHeader
        title={integration.label || integration.type}
        actions={
          <div className="flex gap-2">
            <Link to="/integrations" className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            <Link to={`/integrations/${integration.id}/edit`} className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted">
              <Pencil className="h-4 w-4" /> Edit
            </Link>
            <button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
              {syncMutation.isPending ? "Syncing..." : "Sync Now"}
            </button>
          </div>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Details</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Type</dt>
              <dd className="font-medium">{integration.type}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Project ID</dt>
              <dd>{integration.project_id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${integration.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {integration.is_active ? "Active" : "Inactive"}
                </span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Last Synced</dt>
              <dd>{integration.last_synced_at ? formatDateTime(integration.last_synced_at) : "Never"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Created</dt>
              <dd>{formatDateTime(integration.created_at)}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Configuration</h2>
          {Object.entries(integration.config || {}).length > 0 ? (
            <dl className="space-y-2 text-sm">
              {Object.entries(integration.config).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <dt className="text-muted-foreground">{key}</dt>
                  <dd className="font-mono text-xs max-w-[200px] truncate">
                    {key.toLowerCase().includes("token") || key.toLowerCase().includes("password") || key.toLowerCase().includes("secret")
                      ? "••••••••"
                      : String(value)}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">No configuration set.</p>
          )}
        </div>
      </div>
      {syncResult && (
        <div className="mt-6 rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Sync Result</h2>
          <pre className="overflow-auto rounded bg-muted p-4 text-xs">
            {JSON.stringify(syncResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
