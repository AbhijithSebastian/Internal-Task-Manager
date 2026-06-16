import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { projectsService } from "@/features/projects/services/projects";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { Plus } from "lucide-react";
import { formatDate } from "@/utils/formatters";
import { useAuth } from "@/store/auth";
import type { Project } from "@/types";

export default function ProjectListPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["projects", page, search, status],
    queryFn: () => projectsService.list({ page, search, status, per_page: 15 }),
  });

  const canCreate = hasPermission("project-create");

  const columns: Column<Project>[] = [
    { key: "name", label: "Name", sortable: true,
      render: (p) => <Link to={`/projects/${p.id}`} className="font-medium hover:underline">{p.name}</Link>,
    },
    { key: "status", label: "Status",
      render: (p) => <StatusBadge status={p.status} />,
    },
    { key: "priority", label: "Priority",
      render: (p) => <PriorityBadge priority={p.priority} />,
    },
    { key: "deadline", label: "Deadline", sortable: true,
      render: (p) => p.deadline ? formatDate(p.deadline) : "-",
    },
    { key: "members_count", label: "Members",
      render: (p) => `${(p as any).members_count || 0}`,
    },
    { key: "created_at", label: "Created", sortable: true,
      render: (p) => formatDate(p.created_at),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Manage all projects."
        actions={canCreate ? (
          <Link to="/projects/new" className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> New Project
          </Link>
        ) : undefined}
      />
      <div className="mb-4 flex gap-3">
        <input
          type="text" placeholder="Search projects..."
          className="block w-full max-w-sm rounded-md border px-3 py-2 text-sm"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select
          className="rounded-md border px-3 py-2 text-sm"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="on_hold">On Hold</option>
          <option value="archived">Archived</option>
        </select>
      </div>
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        loading={isLoading}
        page={page}
        totalPages={data?.total_pages}
        onPageChange={setPage}
        keyExtractor={(p) => p.id}
        emptyMessage="No projects found."
        onRowClick={(p) => navigate(`/projects/${p.id}`)}
      />
    </div>
  );
}
