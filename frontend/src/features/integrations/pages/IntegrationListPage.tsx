import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { integrationsService } from "@/features/integrations/services/integrations";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { formatDateTime, formatRelative } from "@/utils/formatters";
import { useAuth } from "@/store/auth";
import type { Integration } from "@/features/integrations/services/integrations";

export default function IntegrationListPage() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["integrations", page, search],
    queryFn: () => integrationsService.list({ page, search, per_page: 15 }),
  });

  const syncMutation = useMutation({
    mutationFn: (id: number) => integrationsService.sync(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["integrations"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => integrationsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      setDeleteId(null);
    },
  });

  const canCreate = hasPermission("projects.update");

  const columns: Column<Integration>[] = [
    {
      key: "type", label: "Type",
      render: (i) => (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          {i.type}
        </span>
      ),
    },
    {
      key: "label", label: "Label",
      render: (i) => <span className="font-medium">{i.label || i.type}</span>,
    },
    {
      key: "is_active", label: "Status",
      render: (i) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${i.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
          {i.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "last_synced_at", label: "Last Sync",
      render: (i) => i.last_synced_at ? formatRelative(i.last_synced_at) : "Never",
    },
    {
      key: "created_at", label: "Created",
      render: (i) => formatDateTime(i.created_at),
    },
    {
      key: "actions", label: "",
      render: (i) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); syncMutation.mutate(i.id); }}
            disabled={syncMutation.isPending}
            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
            title="Sync now"
          >
            <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteId(i.id); }}
            className="rounded p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Integrations"
        description="Manage project integrations (GitHub, Figma, Webhooks)."
        actions={canCreate ? (
          <Link to="/integrations/new" className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> New Integration
          </Link>
        ) : undefined}
      />
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by type or label..."
          className="block w-full max-w-sm rounded-md border px-3 py-2 text-sm"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        loading={isLoading}
        page={page}
        totalPages={data?.total_pages}
        onPageChange={setPage}
        keyExtractor={(i) => i.id}
        emptyMessage="No integrations found."
        onRowClick={(i) => navigate(`/integrations/${i.id}`)}
      />
      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Integration"
        message="Are you sure you want to delete this integration? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
