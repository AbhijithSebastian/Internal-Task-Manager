import { useState, useCallback, useRef, useEffect, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { reportsService, type ReportsQueryParams } from "@/features/reports/services/reports";
import { Button } from "@/components/ui/Button";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import {
  FolderKanban,
  ListChecks,
  CheckSquare,
  Users,
  Download,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  AlertCircle,
  RefreshCw,
  Search,
  X,
  BarChart3,
  ChevronUp,
} from "lucide-react";
import { ProjectReportsView } from "../components/ProjectReportsView";
import { TaskReportsView } from "../components/TaskReportsView";
import { SubtaskReportsView } from "../components/SubtaskReportsView";
import { EmployeeReportsView } from "../components/EmployeeReportsView";
import { ReportPreviewModal } from "../components/ReportPreviewModal";

const ReportsAnalytics = lazy(() => import("../components/ReportsAnalytics"));

type TabId = "projects" | "tasks" | "subtasks" | "employees";

interface TabDef {
  id: TabId;
  label: string;
  icon: typeof FolderKanban;
}

const TABS: TabDef[] = [
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "tasks", label: "Tasks", icon: ListChecks },
  { id: "subtasks", label: "Subtasks", icon: CheckSquare },
  { id: "employees", label: "Employees", icon: Users },
];

interface Filters {
  search: string;
  status: string;
  priority: string;
  project_id: string;
  user_id: string;
  date_from: string;
  date_to: string;
}

const defaultFilters: Filters = {
  search: "",
  status: "",
  priority: "",
  project_id: "",
  user_id: "",
  date_from: "",
  date_to: "",
};

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("projects");
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [exportOpen, setExportOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<{ type: string; id: number } | null>(null);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const buildParams = useCallback((): ReportsQueryParams => {
    const params: ReportsQueryParams = {
      tab: activeTab,
      page,
      per_page: 15,
      sort_by: sortBy,
      sort_dir: sortDir,
    };
    if (filters.search) params.search = filters.search;
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    if (filters.project_id) params.project_id = Number(filters.project_id);
    if (filters.user_id) params.user_id = Number(filters.user_id);
    if (filters.date_from) params.date_from = filters.date_from;
    if (filters.date_to) params.date_to = filters.date_to;
    return params;
  }, [activeTab, page, sortBy, sortDir, filters]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["reports", buildParams()],
    queryFn: () => reportsService.getReports(buildParams()),
  });

  const reportData = data?.data;

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    setPage(1);
    setFilters(defaultFilters);
  };

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortDir("desc");
    }
  };

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    setPage(1);
  };

  const handleExport = async (format: string) => {
    setExportOpen(false);
    try {
      const blob = await reportsService.exportReport({ ...buildParams(), format });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeTab}-report.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      // silent
    }
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");
  const activeChips: { key: string; label: string; onRemove: () => void }[] = [];
  if (filters.search) activeChips.push({ key: "search", label: `Search: "${filters.search}"`, onRemove: () => updateFilter("search", "") });
  if (filters.status) activeChips.push({ key: "status", label: `Status: ${filters.status}`, onRemove: () => updateFilter("status", "") });
  if (filters.priority) activeChips.push({ key: "priority", label: `Priority: ${filters.priority}`, onRemove: () => updateFilter("priority", "") });
  if (filters.project_id) activeChips.push({ key: "project_id", label: `Project #${filters.project_id}`, onRemove: () => updateFilter("project_id", "") });
  if (filters.date_from) activeChips.push({ key: "date_from", label: `From: ${filters.date_from}`, onRemove: () => updateFilter("date_from", "") });
  if (filters.date_to) activeChips.push({ key: "date_to", label: `To: ${filters.date_to}`, onRemove: () => updateFilter("date_to", "") });

  const filterCount = activeChips.length;

  return (
    <div className="page-container py-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-primary tracking-tight">Reports</h1>
          <p className="text-xs text-tertiary mt-0.5">Generate and export detailed reports across all modules</p>
        </div>
        <div ref={exportRef} className="relative">
          <Button variant="secondary" size="sm" onClick={() => setExportOpen(!exportOpen)} disabled={!reportData?.items?.length}>
            <Download className="h-3.5 w-3.5" /> Export
            <ChevronDown className={cn("h-3 w-3 ml-1 transition-transform", exportOpen && "rotate-180")} />
          </Button>
          {exportOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-surface border border-default rounded-lg shadow-dropdown z-dropdown py-1">
              <button onClick={() => handleExport("csv")} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-primary hover:bg-hover">
                <FileText className="h-3.5 w-3.5" /> Export CSV
              </button>
              <button onClick={() => handleExport("xlsx")} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-primary hover:bg-hover">
                <FileSpreadsheet className="h-3.5 w-3.5" /> Export XLSX
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1 border-b border-subtle pb-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                activeTab === tab.id
                  ? "bg-primary text-inverse shadow-sm"
                  : "text-secondary hover:text-primary hover:bg-hover"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.slice(0, 4)}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-tertiary pointer-events-none" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              placeholder="Search..."
              className="w-full h-8 pl-8 pr-7 rounded-md bg-surface border border-default text-xs text-primary placeholder:text-tertiary hover:border-hover focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary transition-colors"
            />
            {filters.search && (
              <button onClick={() => updateFilter("search", "")} className="absolute right-2 top-1/2 -translate-y-1/2 text-tertiary hover:text-secondary">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <select
            value={filters.status}
            onChange={(e) => updateFilter("status", e.target.value)}
            className="h-8 px-2 rounded-md bg-surface border border-default text-xs text-primary hover:border-hover focus:outline-none focus:ring-2 focus:ring-primary-ring"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
            <option value="backlog">Backlog</option>
            <option value="blocked">Blocked</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={filters.priority}
            onChange={(e) => updateFilter("priority", e.target.value)}
            className="h-8 px-2 rounded-md bg-surface border border-default text-xs text-primary hover:border-hover focus:outline-none focus:ring-2 focus:ring-primary-ring"
          >
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => updateFilter("date_from", e.target.value)}
            className="h-8 px-2 rounded-md bg-surface border border-default text-xs text-primary hover:border-hover focus:outline-none focus:ring-2 focus:ring-primary-ring"
            title="From date"
          />
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => updateFilter("date_to", e.target.value)}
            className="h-8 px-2 rounded-md bg-surface border border-default text-xs text-primary hover:border-hover focus:outline-none focus:ring-2 focus:ring-primary-ring"
            title="To date"
          />
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-xs text-secondary hover:text-primary px-2 py-1 flex items-center gap-1">
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>
        {filterCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {activeChips.map((chip) => (
              <span
                key={chip.key}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-soft text-primary text-[10px] font-medium"
              >
                {chip.label}
                <button onClick={chip.onRemove} className="hover:text-primary-hover"><X className="h-2.5 w-2.5" /></button>
              </span>
            ))}
          </div>
        )}
        </div>

      <button
        onClick={() => setAnalyticsOpen(!analyticsOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
          analyticsOpen ? "bg-primary-soft text-primary" : "text-secondary hover:text-primary hover:bg-hover"
        )}
      >
        <BarChart3 className="h-3.5 w-3.5" />
        Analytics
        {analyticsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {analyticsOpen && (
        <div className="animate-in slide-in-from-top-1 duration-200">
          <Suspense fallback={<SkeletonTable rows={4} />}>
            <ReportsAnalytics />
          </Suspense>
        </div>
      )}

      {isError ? (
        <div className="bg-surface border border-default rounded-lg p-8 text-center space-y-3">
          <div className="h-10 w-10 rounded-full bg-danger-soft flex items-center justify-center mx-auto">
            <AlertCircle className="h-5 w-5 text-danger" />
          </div>
          <h3 className="text-sm font-semibold text-primary">Failed to load reports</h3>
          <p className="text-xs text-tertiary max-w-sm mx-auto">
            There was an error fetching report data. Please try again or check your connection.
          </p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </Button>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          <SkeletonTable rows={5} columns={activeTab === "employees" ? 8 : 7} />
        </div>
      ) : reportData && (reportData as any).items && (reportData as any).items.length > 0 ? (
        <>
          {activeTab === "projects" && (
            <ProjectReportsView
              data={reportData as any}
              sortBy={sortBy}
              sortDir={sortDir}
              onSort={handleSort}
              page={page}
              onPageChange={setPage}
              onPreview={(id) => setPreviewItem({ type: "projects", id })}
            />
          )}
          {activeTab === "tasks" && (
            <TaskReportsView
              data={reportData as any}
              sortBy={sortBy}
              sortDir={sortDir}
              onSort={handleSort}
              page={page}
              onPageChange={setPage}
              onPreview={(id) => setPreviewItem({ type: "tasks", id })}
            />
          )}
          {activeTab === "subtasks" && (
            <SubtaskReportsView
              data={reportData as any}
              sortBy={sortBy}
              sortDir={sortDir}
              onSort={handleSort}
              page={page}
              onPageChange={setPage}
              onPreview={(id) => setPreviewItem({ type: "subtasks", id })}
            />
          )}
          {activeTab === "employees" && (
            <EmployeeReportsView
              data={reportData as any}
              sortBy={sortBy}
              sortDir={sortDir}
              onSort={handleSort}
              page={page}
              onPageChange={setPage}
              onPreview={(id) => setPreviewItem({ type: "employees", id })}
            />
          )}
        </>
      ) : (
        <div className="bg-surface border border-default rounded-lg p-8 text-center space-y-3">
          <div className="h-10 w-10 rounded-full bg-subtle flex items-center justify-center mx-auto">
            <FileText className="h-5 w-5 text-tertiary" />
          </div>
          <h3 className="text-sm font-semibold text-primary">No data found</h3>
          <p className="text-xs text-tertiary max-w-sm mx-auto">
            {hasActiveFilters
              ? "No results match your current filters. Try adjusting or clearing them."
              : "No report data is available yet. Data will appear here once items are created."}
          </p>
          {hasActiveFilters && (
            <Button variant="secondary" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      )}

      {previewItem && (
        <ReportPreviewModal
          reportType={previewItem.type}
          itemId={previewItem.id}
          onClose={() => setPreviewItem(null)}
        />
      )}
    </div>
  );
}
