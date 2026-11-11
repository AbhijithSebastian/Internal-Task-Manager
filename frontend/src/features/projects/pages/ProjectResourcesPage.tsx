import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useResources, useDeleteResource } from "@/features/resources/hooks/useResources";
import { ResourceCard } from "@/features/resources/components/ResourceCard";
import {
  ResourceFilters,
  type ResourceFiltersState,
} from "@/features/resources/components/ResourceFilters";
import { ResourceDetailDrawer } from "@/features/resources/components/ResourceDetailDrawer";
import { ResourceUploadDialog } from "@/features/resources/components/ResourceUploadDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EnterpriseEmptyState } from "@/components/shared/EnterpriseEmptyState";
import { Button, Skeleton } from "@/design-system";
import { Files, Plus } from "lucide-react";
import type { Resource } from "@/types/resources";

export default function ProjectResourcesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [filters, setFilters] = useState<ResourceFiltersState>({
    search: "",
    resource_type: "",
    category: "",
    sort: "",
  });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Resource | null>(null);

  const queryParams = { ...filters };
  if (queryParams.sort === "") queryParams.sort = "newest";

  const { data, isLoading } = useResources(projectId!, queryParams);
  const deleteResource = useDeleteResource(projectId!);

  const resources = data?.items ?? [];
  const total = data?.total ?? 0;

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteResource.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  }, [deleteTarget, deleteResource]);

  const categories = [...new Set(resources.map((r) => r.category).filter(Boolean))] as string[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-primary">Resources</h2>
          <p className="text-sm text-tertiary">
            {total} resource{total !== 1 ? "s" : ""}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowUpload(true)}>
          <Plus className="h-4 w-4" /> Add Resource
        </Button>
      </div>

      <ResourceFilters filters={filters} onChange={setFilters} categories={categories} />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rect" className="h-28 rounded-lg" />
          ))}
        </div>
      ) : resources.length === 0 ? (
        <EnterpriseEmptyState
          icon={<Files className="h-12 w-12" />}
          title="No resources yet"
          description={
            filters.search || filters.resource_type
              ? "Try adjusting your filters"
              : "Upload a file or add a link to get started"
          }
          primaryAction={{ label: "Upload Resource", onClick: () => setShowUpload(true) }}
          secondaryAction={{ label: "Link Existing", onClick: () => setShowUpload(true) }}
          helpLink={{
            label: "Learn about resource management",
            href: "https://docs.example.com/resources",
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {resources.map((r) => (
            <ResourceCard
              key={r.id}
              resource={r}
              onClick={() => setSelectedId(r.id)}
              onDelete={() => setDeleteTarget(r)}
            />
          ))}
        </div>
      )}

      <ResourceDetailDrawer
        resourceId={selectedId}
        onClose={() => setSelectedId(null)}
        onDelete={(r) => {
          setSelectedId(null);
          setDeleteTarget(r);
        }}
      />

      <ResourceUploadDialog
        projectId={projectId!}
        open={showUpload}
        onClose={() => setShowUpload(false)}
      />

      {deleteTarget && (
        <ConfirmDialog
          open={true}
          title="Delete Resource"
          message={`Are you sure you want to delete "${deleteTarget.name}"? This will soft-delete it.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteResource.isPending}
        />
      )}
    </div>
  );
}
