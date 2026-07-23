import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { openDrawer } from "@/hooks/useDrawer";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FilterBar } from "@/components/ui/FilterBar";
import { Table, type TableColumn } from "@/components/ui/Table";
import { SkeletonKpiRow } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { CheckCircle2, Circle, ListChecks, Trash2, ListTodo, Plus, X, Search } from "lucide-react";
import type { Task } from "@/types";

export default function SubtaskListPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [parentQuery, setParentQuery] = useState("");
  const [selectedParent, setSelectedParent] = useState<{ id: number; title: string } | null>(null);
  const parentSearchRef = useRef<HTMLDivElement>(null);

  const { data: parentResults } = useQuery({
    queryKey: ["tasks-search", parentQuery],
    queryFn: () =>
      api.get("/tasks/parents", { params: { q: parentQuery } }).then((r) => r.data?.tasks || r.data?.data || r.data || []),
    enabled: parentQuery.length >= 1,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["subtasks", page, search],
    queryFn: () =>
      api
        .get("/tasks", { params: { has_parent: true, page, search, per_page: 20 } })
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

  const createMutation = useMutation({
    mutationFn: (data: { title: string; parent_id: number }) =>
      api.post(`/tasks/${data.parent_id}/subtasks`, { title: data.title }).then((r) => r.data),
    onSuccess: () => {
      setNewTitle("");
      setSelectedParent(null);
      setParentQuery("");
      setShowModal(false);
      queryClient.invalidateQueries({ queryKey: ["subtasks"] });
    },
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
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus className="h-3.5 w-3.5" /> New Subtask
        </Button>
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

      {showModal && createPortal(
        <div className="fixed inset-0 z-modal flex items-start justify-center pt-20" onClick={() => setShowModal(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative w-full max-w-md bg-surface rounded-xl shadow-elevated border border-default" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-subtle">
              <h2 className="text-base font-semibold text-primary">New Subtask</h2>
              <button type="button" onClick={() => setShowModal(false)} className="p-1 rounded text-tertiary hover:text-primary hover:bg-hover transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-primary">Subtask Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  className="w-full h-9 px-3 rounded-md bg-surface border border-default text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5" ref={parentSearchRef}>
                <label className="text-sm font-medium text-primary">Parent Task</label>
                {selectedParent ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary-soft text-sm text-primary">
                    <span className="flex-1 truncate">{selectedParent.title}</span>
                    <button type="button" onClick={() => { setSelectedParent(null); setParentQuery(""); }} className="text-tertiary hover:text-primary transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-tertiary" />
                    <input
                      type="text"
                      value={parentQuery}
                      onChange={(e) => setParentQuery(e.target.value)}
                      placeholder="Search parent tasks..."
                      className="w-full h-9 pl-8 pr-3 rounded-md bg-surface border border-default text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary"
                    />
                    {parentQuery.length >= 1 && (
                      <div className="absolute top-full left-0 right-0 mt-1 z-10 bg-surface border border-default rounded-lg shadow-elevated max-h-48 overflow-y-auto">
                        {(!parentResults || (parentResults as any[]).length === 0) ? (
                          <div className="p-3 text-sm text-tertiary text-center">No tasks found</div>
                        ) : (
                          (parentResults as any[]).map((t: any) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => { setSelectedParent({ id: t.id, title: t.title }); setParentQuery(""); }}
                              className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-hover transition-colors"
                            >
                              {t.title}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-subtle">
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button
                size="sm"
                loading={createMutation.isPending}
                disabled={!newTitle.trim() || !selectedParent}
                onClick={() => {
                  if (newTitle.trim() && selectedParent) {
                    createMutation.mutate({ title: newTitle.trim(), parent_id: selectedParent.id });
                  }
                }}
              >
                <Plus className="h-3.5 w-3.5" /> Create
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
