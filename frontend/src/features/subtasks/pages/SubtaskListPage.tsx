import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { openDrawer } from "@/hooks/useDrawer";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FilterBar } from "@/components/ui/FilterBar";
import { Table, type TableColumn } from "@/components/ui/Table";
import { SkeletonKpiRow } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { CheckCircle2, Circle, ListChecks, Trash2, ListTodo } from "lucide-react";
import type { Task } from "@/types";

export default function SubtaskListPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["subtasks", page, search],
    queryFn: () =>
      api
        .get("/tasks", { params: { has_parent: true, page, search, per_page: 20, with: "parent" } })
        .then((r) => r.data?.items || r.data?.data || []),
  });

  const subtasks: Task[] = Array.isArray(data) ? data : data?.items || [];
  const total = data?.total || subtasks.length;

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.patch(`/tasks/${id}/status`, { status: status === "done" ? "todo" : "done" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subtasks"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/tasks/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subtasks"] }),
  });

  const doneCount = subtasks.filter((s) => s.status === "done").length;

  const columns: TableColumn<Task>[] = [
    {
      key: "status",
      label: "",
      width: "40px",
      render: (t) => (
        <button
          onClick={(e) => { e.stopPropagation(); toggleMutation.mutate({ id: t.id, status: t.status }); }}
          className="text-secondary hover:text-primary transition-colors"
        >
          {t.status === "done" ? <CheckCircle2 className="h-4 w-4 text-semantic-success" /> : <Circle className="h-4 w-4" />}
        </button>
      ),
    },
    {
      key: "title",
      label: "Subtask",
      render: (t) => (
        <div>
          <p className={`text-sm font-medium ${t.status === "done" ? "text-tertiary line-through" : "text-primary"}`}>{t.title}</p>
          {t.parent_id && <p className="text-xs text-tertiary">Parent task #{t.parent_id}</p>}
        </div>
      ),
    },
    {
      key: "status_label",
      label: "Status",
      render: (t) => <Badge variant={t.status === "done" ? "success" : t.status === "blocked" ? "danger" : "neutral"} size="sm">{t.status_label || t.status}</Badge>,
    },
    {
      key: "assignee",
      label: "Assignee",
      render: (t) => <span className="text-sm text-secondary">{t.assignee?.name || "—"}</span>,
    },
    {
      key: "actions",
      label: "",
      width: "60px",
      render: (t) => (
        <button
          onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(t.id); }}
          className="p-1.5 rounded text-tertiary hover:text-semantic-danger hover:bg-danger-soft transition-colors"
          title="Delete subtask"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="page-container py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary">Subtasks</h1>
        </div>
      </div>

      {isLoading ? (
        <SkeletonKpiRow cards={2} />
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-tertiary">
              <ListTodo className="h-3.5 w-3.5" /> Total
            </div>
            <p className="text-xl font-bold text-primary">{total}</p>
          </Card>
          <Card className="p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-tertiary">
              <CheckCircle2 className="h-3.5 w-3.5" /> Completed
            </div>
            <p className="text-xl font-bold text-primary">{doneCount}</p>
          </Card>
          <Card className="p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-tertiary">
              <Circle className="h-3.5 w-3.5" /> Pending
            </div>
            <p className="text-xl font-bold text-primary">{total - doneCount}</p>
          </Card>
        </div>
      )}

      <FilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search subtasks..."
        filters={[]}
      />

      <Table
        columns={columns}
        data={subtasks}
        loading={isLoading}
        onRowClick={(t) => openDrawer("task", t.id)}
        keyExtractor={(t) => t.id}
        page={page}
        total={total}
        totalPages={data?.total_pages}
        onPageChange={setPage}
        emptyState={
          <EmptyState
            icon={<ListChecks className="h-8 w-8 text-tertiary" />}
            title="No subtasks"
            description="Subtasks will appear here once tasks have subtasks added."
          />
        }
      />
    </div>
  );
}
