import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useAuth } from "@/store/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { FilterBar, type ViewMode } from "@/components/ui/FilterBar";
import { Table, type TableColumn } from "@/components/ui/Table";
import { SkeletonKpiRow, SkeletonCard } from "@/components/ui/Skeleton";
import { Plus, FolderKanban, Users, Calendar, TrendingUp, CheckCircle2, Archive } from "lucide-react";
import { formatDate, formatRelative } from "@/utils/formatters";
import type { Project } from "@/types";

const statusConfig: Record<string, { variant: "success" | "warning" | "danger" | "neutral"; label: string }> = {
  active: { variant: "success", label: "Active" },
  on_hold: { variant: "warning", label: "On Hold" },
  completed: { variant: "neutral", label: "Completed" },
  archived: { variant: "neutral", label: "Archived" },
};

const priorityConfig: Record<string, { variant: "success" | "warning" | "danger" | "neutral"; label: string }> = {
  low: { variant: "neutral", label: "Low" },
  medium: { variant: "warning", label: "Medium" },
  high: { variant: "danger", label: "High" },
  urgent: { variant: "danger", label: "Urgent" },
};

function ProjectStatusBadge({ status }: { status: string }) {
  const c = statusConfig[status] || { variant: "neutral" as const, label: status };
  return <Badge variant={c.variant} size="sm" dot>{c.label}</Badge>;
}

function ProjectPriorityBadge({ priority }: { priority: string }) {
  const c = priorityConfig[priority] || { variant: "neutral" as const, label: priority };
  return <Badge variant={c.variant} size="sm">{c.label}</Badge>;
}

export default function ProjectListPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [view, setView] = useState<ViewMode>("list");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const { data, isLoading } = useQuery({
    queryKey: ["projects", page, search, status, sortBy, sortDirection],
    queryFn: () =>
      api.get("/projects", { params: { page, search, status, sort_by: sortBy, sort_direction: sortDirection, per_page: 20 } }).then((r) => r.data),
  });

  const projects: Project[] = data?.items || data?.data || [];
  const total = data?.total || 0;

  const handleSort = (key: string) => {
    if (sortBy === key) setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(key); setSortDirection("asc"); }
  };

  const clearFilters = () => { setSearch(""); setStatus(""); setPage(1); };

  const columns: TableColumn<Project>[] = [
    {
      key: "name", label: "Project", sortable: true,
      render: (p) => (
        <div>
          <p className="font-medium text-primary truncate max-w-sm">{p.name}</p>
          {p.description && <p className="text-xs text-tertiary mt-0.5 truncate max-w-sm">{p.description}</p>}
        </div>
      ),
    },
    {
      key: "status", label: "Status",
      render: (p) => <ProjectStatusBadge status={p.status} />,
    },
    {
      key: "priority", label: "Priority",
      render: (p) => <ProjectPriorityBadge priority={p.priority} />,
    },
    {
      key: "pm", label: "PM",
      render: (p) =>
        p.project_manager ? (
          <div className="flex items-center gap-2">
            <Avatar name={p.project_manager.name} size="sm" />
            <span className="text-sm text-secondary">{p.project_manager.name}</span>
          </div>
        ) : (
          <span className="text-sm text-tertiary">—</span>
        ),
    },
    {
      key: "deadline", label: "Deadline", sortable: true,
      render: (p) => (
        <span className="text-sm text-secondary">{p.deadline ? formatDate(p.deadline) : "—"}</span>
      ),
    },
    {
      key: "members_count", label: "Team",
      render: (p) => (
        <span className="text-sm text-secondary">{p.members_count || p.member_count || 0}</span>
      ),
    },
  ];

  const activeChips = [
    ...(status ? [{ key: "status", label: `Status: ${status}`, onRemove: () => { setStatus(""); setPage(1); } }] : []),
    ...(search ? [{ key: "search", label: `Search: "${search}"`, onRemove: () => { setSearch(""); setPage(1); } }] : []),
  ];

  const canCreate = hasPermission("project-create");

  return (
    <div className="page-container py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary">Projects</h1>
        </div>
        {canCreate && (
          <Button onClick={() => navigate("/work/projects/new")}>
            <Plus className="h-4 w-4" /> New Project
          </Button>
        )}
      </div>

      {isLoading ? (
        <SkeletonKpiRow cards={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-tertiary">
              <FolderKanban className="h-3.5 w-3.5" /> Total
            </div>
            <p className="text-xl font-bold text-primary">{total}</p>
          </Card>
          <Card className="p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-tertiary">
              <TrendingUp className="h-3.5 w-3.5" /> Active
            </div>
            <p className="text-xl font-bold text-primary">{projects.filter((p) => p.status === "active").length}</p>
          </Card>
          <Card className="p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-tertiary">
              <CheckCircle2 className="h-3.5 w-3.5" /> Completed
            </div>
            <p className="text-xl font-bold text-primary">{projects.filter((p) => p.status === "completed").length}</p>
          </Card>
          <Card className="p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-tertiary">
              <Archive className="h-3.5 w-3.5" /> Archived
            </div>
            <p className="text-xl font-bold text-primary">{projects.filter((p) => p.status === "archived").length}</p>
          </Card>
        </div>
      )}

      <FilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search projects..."
        filters={[
          { key: "status", label: "All Statuses", value: status, onChange: (v) => { setStatus(v); setPage(1); }, options: [
            { value: "active", label: "Active" },
            { value: "on_hold", label: "On Hold" },
            { value: "completed", label: "Completed" },
            { value: "archived", label: "Archived" },
          ]},
        ]}
        view={view}
        availableViews={["list", "grid"]}
        onViewChange={setView}
        activeChips={activeChips.length > 0 ? activeChips : undefined}
        onClearAll={activeChips.length > 0 ? clearFilters : undefined}
      />

      {view === "list" ? (
        <Table
          columns={columns}
          data={projects}
          loading={isLoading}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSort={handleSort}
          onRowClick={(p) => navigate(`/work/projects/${p.id}`)}
          keyExtractor={(p) => p.id}
          page={page}
          totalPages={data?.total_pages}
          total={data?.total}
          onPageChange={setPage}
          exportable
          exportFilename="projects"
        />
      ) : (
        <>
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-surface border border-default rounded-lg">
              <FolderKanban className="h-12 w-12 text-tertiary mb-3" />
              <h3 className="text-lg font-semibold text-primary">No projects yet</h3>
              <p className="text-sm text-secondary mt-1 mb-4">Create your first project to start tracking work.</p>
              {canCreate && (
                <Button onClick={() => navigate("/work/projects/new")}>
                  <Plus className="h-4 w-4" /> Create Project
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <Card
                  key={p.id}
                  variant="interactive"
                  onClick={() => navigate(`/work/projects/${p.id}`)}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary-soft text-primary flex items-center justify-center text-lg font-bold">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-primary truncate">{p.name}</p>
                          <p className="text-xs text-tertiary">Created {formatRelative(p.created_at)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-secondary">
                      <ProjectStatusBadge status={p.status} />
                      <ProjectPriorityBadge priority={p.priority} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-tertiary">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        {p.members_count || p.member_count || 0} members
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {p.deadline ? formatDate(p.deadline) : "No deadline"}
                      </div>
                    </div>
                    {p.project_manager && (
                      <div className="flex items-center gap-2 pt-1 border-t border-subtle">
                        <Avatar name={p.project_manager.name} size="sm" />
                        <span className="text-xs text-secondary">{p.project_manager.name}</span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
