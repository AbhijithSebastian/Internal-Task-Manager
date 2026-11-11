import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useEndpoints, useDeleteEndpoint } from "@/features/endpoints/hooks/useEndpoints";
import { EndpointCard } from "@/features/endpoints/components/EndpointCard";
import {
  EndpointFilters,
  type EndpointFiltersState,
} from "@/features/endpoints/components/EndpointFilters";
import { EndpointDetailDrawer } from "@/features/endpoints/components/EndpointDetailDrawer";
import { EndpointForm } from "@/features/endpoints/components/EndpointForm";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EnterpriseEmptyState } from "@/components/shared/EnterpriseEmptyState";
import { Button, Skeleton } from "@/design-system";
import { Globe, Plus } from "lucide-react";
import type { Endpoint } from "@/types/endpoints";

export default function ProjectEndpointsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [filters, setFilters] = useState<EndpointFiltersState>({
    search: "",
    method: "",
    status: "",
    sort: "",
  });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Endpoint | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Endpoint | null>(null);

  const queryParams = { ...filters };
  if (queryParams.sort === "") queryParams.sort = "newest";

  const { data, isLoading } = useEndpoints(projectId!, queryParams);
  const deleteEndpoint = useDeleteEndpoint(projectId!);

  const endpoints = data?.items ?? [];
  const total = data?.total ?? 0;

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteEndpoint.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  }, [deleteTarget, deleteEndpoint]);

  const handleEdit = (e: Endpoint) => {
    setSelectedId(null);
    setEditTarget(e);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditTarget(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-primary">Endpoints</h2>
          <p className="text-sm text-tertiary">
            {total} endpoint{total !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditTarget(null);
            setShowForm(true);
          }}
        >
          <Plus className="h-4 w-4" /> Create Endpoint
        </Button>
      </div>

      <EndpointFilters filters={filters} onChange={setFilters} />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rect" className="h-28 rounded-lg" />
          ))}
        </div>
      ) : endpoints.length === 0 ? (
        <EnterpriseEmptyState
          icon={<Globe className="h-12 w-12" />}
          title="No endpoints yet"
          description={
            filters.search || filters.method || filters.status
              ? "Try adjusting your filters"
              : "Create your first API endpoint"
          }
          primaryAction={{
            label: "Create Endpoint",
            onClick: () => {
              setEditTarget(null);
              setShowForm(true);
            },
          }}
          helpLink={{ label: "Learn about endpoints", href: "https://docs.example.com/endpoints" }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {endpoints.map((e) => (
            <EndpointCard
              key={e.id}
              endpoint={e}
              onClick={() => setSelectedId(e.id)}
              onEdit={handleEdit}
              onDelete={() => setDeleteTarget(e)}
            />
          ))}
        </div>
      )}

      <EndpointDetailDrawer
        endpointId={selectedId}
        onClose={() => setSelectedId(null)}
        onEdit={handleEdit}
        onDelete={(e) => {
          setSelectedId(null);
          setDeleteTarget(e);
        }}
      />

      <EndpointForm
        projectId={projectId!}
        endpoint={editTarget}
        open={showForm}
        onClose={handleFormClose}
      />

      {deleteTarget && (
        <ConfirmDialog
          open={true}
          title="Delete Endpoint"
          message={`Are you sure you want to delete "${deleteTarget.name}"? This will soft-delete it.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteEndpoint.isPending}
        />
      )}
    </div>
  );
}
