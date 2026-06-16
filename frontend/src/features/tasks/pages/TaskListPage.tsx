import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { tasksService } from "@/features/tasks/services/tasks";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { Plus } from "lucide-react";
import { formatDate } from "@/utils/formatters";
import { useAuth } from "@/store/auth";
import type { Task } from "@/types";

export default function TaskListPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [projectId, _setProjectId] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["tasks", page, search, status, priority, projectId],
    queryFn: () => tasksService.list({ page, search, status, priority, project_id: projectId || undefined, per_page: 15 }),
  });

  const canCreate = hasPermission("task-create");

  const columns: Column<Task>[] = [
    { key: "title", label: "Title", sortable: true,
      render: (t) => <Link to={`/tasks/${t.id}`} className="font-medium hover:underline">{t.title}</Link>,
    },
    { key: "project", label: "Project",
      render: (t) => (t as any).project?.name ? <span className="text-muted-foreground">{(t as any).project.name}</span> : "-",
    },
    { key: "status", label: "Status", render: (t) => <StatusBadge status={t.status} /> },
    { key: "priority", label: "Priority", render: (t) => <PriorityBadge priority={t.priority} /> },
    { key: "assignee", label: "Assignee",
      render: (t) => (t as any).assignee?.name || "Unassigned",
    },
    { key: "due_date", label: "Due", sortable: true,
      render: (t) => t.due_date ? formatDate(t.due_date) : "-",
    },
  ];

  const statusFilter = ["", "backlog", "todo", "in_progress", "in_review", "approved", "done", "blocked", "cancelled"];

  return (
    <div>
      <PageHeader
        title="Tasks"
        description="Manage all tasks."
        actions={canCreate ? (
          <Link to="/tasks/new" className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> New Task
          </Link>
        ) : undefined}
      />
      <div className="mb-4 flex flex-wrap gap-3">
        <input type="text" placeholder="Search tasks..." className="block w-full max-w-sm rounded-md border px-3 py-2 text-sm" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <select className="rounded-md border px-3 py-2 text-sm" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          {statusFilter.map((s) => <option key={s} value={s}>{s ? s.replace("_", " ") : "All statuses"}</option>)}
        </select>
        <select className="rounded-md border px-3 py-2 text-sm" value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }}>
          <option value="">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        loading={isLoading}
        page={page}
        totalPages={data?.total_pages}
        onPageChange={setPage}
        keyExtractor={(t) => t.id}
        emptyMessage="No tasks found."
        onRowClick={(t) => navigate(`/tasks/${t.id}`)}
      />
    </div>
  );
}
