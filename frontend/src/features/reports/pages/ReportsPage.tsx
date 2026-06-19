import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { reportsService } from "@/features/reports/services/reports";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Skeleton, SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDate } from "@/utils/formatters";
import {
  FileText,
  Download,
  CheckCircle2,
  Clock,
  Users,
  Calendar,
  Activity,
  AlertTriangle,
  BarChart3,
  ChevronDown,
  Building2,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "task_completion" | "workload_distribution" | "weekly_summary" | "meeting_logs";

interface TaskCompletionReport {
  project_id: number;
  project_name: string;
  total_tasks: number;
  completed_tasks: number;
  completion_percentage: number;
}

interface WorkloadReport {
  user_id: number;
  user_name: string;
  avatar_url?: string;
  assigned_tasks: number;
  completed_tasks: number;
  completion_rate: number;
}

interface WeeklySummaryItem {
  label: string;
  value: number;
  change?: number;
}

interface MeetingLogReport {
  id: number;
  title: string;
  meeting_date: string;
  project_name?: string;
  organizer?: {
    id: number;
    name: string;
    avatar_url?: string;
  };
  summary?: string;
}

interface ProjectHealthReport {
  id: number;
  name: string;
  health: "good" | "at_risk" | "critical";
  progress_percentage: number;
  completed_tasks: number;
  in_progress_tasks: number;
  total_tasks: number;
}

const TABS: { key: Tab; label: string }[] = [
  { key: "task_completion", label: "Task Completion" },
  { key: "workload_distribution", label: "Workload Distribution" },
  { key: "weekly_summary", label: "Weekly Summary" },
  { key: "meeting_logs", label: "Meeting Logs" },
];

function ProgressBar({ value, className }: { value: number; className?: string }) {
  const color =
    value >= 80
      ? "bg-semantic-success"
      : value >= 40
        ? "bg-semantic-warning"
        : "bg-semantic-danger";
  return (
    <div className={cn("h-2 bg-subtle rounded-full overflow-hidden", className)}>
      <div
        className={cn("h-full rounded-full transition-all", color)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

const summaryIcons = [CheckCircle2, Clock, Users, Calendar, Activity, BarChart3, AlertTriangle, UserCheck];

function renderTaskCompletion(data: unknown, loading: boolean) {
  if (loading) return <SkeletonTable rows={5} columns={4} />;
  const items = (Array.isArray(data) ? data : []) as TaskCompletionReport[];
  if (items.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<CheckCircle2 className="h-8 w-8 text-tertiary" />}
          title="No task completion data"
          description="Complete some tasks to see completion reports."
        />
      </Card>
    );
  }
  return (
    <div className="bg-surface border border-default shadow-card rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-subtle bg-subtle">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-secondary">Project</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-secondary">Progress</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-secondary">Completed</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-secondary">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle">
            {items.map((item) => (
              <tr key={item.project_id} className="hover:bg-hover transition-colors duration-fast">
                <td className="px-4 py-3 text-sm font-medium text-primary">{item.project_name}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <ProgressBar value={item.completion_percentage} className="flex-1" />
                    <span className="text-xs text-tertiary shrink-0 w-10 text-right">
                      {Math.round(item.completion_percentage)}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-right text-semantic-success font-medium">{item.completed_tasks}</td>
                <td className="px-4 py-3 text-sm text-right text-secondary">{item.total_tasks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function renderWorkloadDistribution(data: unknown, loading: boolean) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton variant="circle" className="h-10 w-10" />
              <div className="space-y-1.5 flex-1">
                <Skeleton variant="text" className="h-4 w-2/3" />
                <Skeleton variant="text" className="h-3 w-1/3" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton variant="text" className="h-3 w-16" />
                <Skeleton variant="text" className="h-3 w-10" />
              </div>
              <Skeleton variant="rect" className="h-2 w-full rounded-full" />
            </div>
          </Card>
        ))}
      </div>
    );
  }
  const items = (Array.isArray(data) ? data : []) as WorkloadReport[];
  if (items.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Users className="h-8 w-8 text-tertiary" />}
          title="No workload data"
          description="Assign tasks to users to see workload distribution."
        />
      </Card>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card key={item.user_id} className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Avatar name={item.user_name} size="md" src={item.avatar_url} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-primary truncate">{item.user_name}</p>
              <div className="flex items-center gap-2 text-xs text-tertiary mt-0.5">
                <span>{item.assigned_tasks} tasks</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">{Math.round(item.completion_rate)}%</p>
              <p className="text-xs text-tertiary">completion</p>
            </div>
          </div>
          <ProgressBar value={item.completion_rate} />
          <div className="flex items-center justify-between text-xs text-tertiary pt-1">
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-semantic-success" />
              {item.completed_tasks} done
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3 text-semantic-warning" />
              {item.assigned_tasks - item.completed_tasks} pending
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}

function renderWeeklySummary(data: unknown, loading: boolean) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton variant="text" className="h-3 w-20" />
              <Skeleton variant="rect" className="h-4 w-4 rounded" />
            </div>
            <Skeleton variant="text" className="h-8 w-16" />
            <Skeleton variant="text" className="h-3 w-24" />
          </Card>
        ))}
      </div>
    );
  }
  let items: WeeklySummaryItem[] = [];
  if (Array.isArray(data)) {
    items = data as WeeklySummaryItem[];
  } else if (data && typeof data === "object") {
    items = Object.entries(data as Record<string, unknown>).map(([key, val]) => ({
      label: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      value: typeof val === "number" ? val : 0,
    }));
  }
  if (items.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<BarChart3 className="h-8 w-8 text-tertiary" />}
          title="No weekly summary"
          description="Data will appear here once the week progresses."
        />
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item, idx) => {
        const Icon = summaryIcons[idx % summaryIcons.length];
        return (
          <Card key={item.label} className="p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-tertiary font-medium uppercase tracking-wider">{item.label}</span>
              <Icon className="h-3.5 w-3.5 text-tertiary" />
            </div>
            <p className="text-2xl font-bold text-primary">{item.value.toLocaleString()}</p>
            {item.change != null && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-xs",
                  item.change >= 0 ? "text-semantic-success" : "text-semantic-danger"
                )}
              >
                {item.change >= 0 ? "+" : ""}{item.change}% from last week
              </span>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function renderMeetingLogs(data: unknown, loading: boolean) {
  if (loading) return <SkeletonTable rows={5} columns={4} />;
  const items = (Array.isArray(data) ? data : []) as MeetingLogReport[];
  if (items.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Calendar className="h-8 w-8 text-tertiary" />}
          title="No meeting logs"
          description="Meeting logs will appear here once meetings are conducted."
        />
      </Card>
    );
  }
  return (
    <div className="bg-surface border border-default shadow-card rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-subtle bg-subtle">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-secondary">Meeting</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-secondary">Project</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-secondary">Organizer</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-secondary">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-secondary">Summary</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-hover transition-colors duration-fast">
                <td className="px-4 py-3 text-sm font-medium text-primary">{item.title}</td>
                <td className="px-4 py-3 text-sm text-secondary">{item.project_name || "-"}</td>
                <td className="px-4 py-3">
                  {item.organizer ? (
                    <div className="flex items-center gap-2">
                      <Avatar name={item.organizer.name} size="sm" src={item.organizer.avatar_url} />
                      <span className="text-sm text-primary">{item.organizer.name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-tertiary">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-secondary">{formatDate(item.meeting_date)}</td>
                <td className="px-4 py-3 text-sm text-tertiary max-w-xs truncate">
                  {item.summary || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function renderTabContent(tab: Tab, data: unknown, loading: boolean) {
  switch (tab) {
    case "task_completion":
      return renderTaskCompletion(data, loading);
    case "workload_distribution":
      return renderWorkloadDistribution(data, loading);
    case "weekly_summary":
      return renderWeeklySummary(data, loading);
    case "meeting_logs":
      return renderMeetingLogs(data, loading);
  }
}

function ProjectHealthCard({ project }: { project: ProjectHealthReport }) {
  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-primary">{project.name}</p>
        <Badge variant={project.health === "good" ? "success" : project.health === "at_risk" ? "warning" : "danger"} size="sm">
          {project.health === "good" ? "Good" : project.health === "at_risk" ? "At Risk" : "Critical"}
        </Badge>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-tertiary">Progress</span>
          <span className="text-primary font-medium">{project.progress_percentage}%</span>
        </div>
        <ProgressBar value={project.progress_percentage} />
        <div className="grid grid-cols-3 gap-2 text-xs text-tertiary pt-1">
          <div className="text-center">
            <p className="text-primary font-medium">{project.completed_tasks}</p>
            <p>Done</p>
          </div>
          <div className="text-center">
            <p className="text-primary font-medium">{project.in_progress_tasks}</p>
            <p>In Prog</p>
          </div>
          <div className="text-center">
            <p className="text-primary font-medium">{project.total_tasks}</p>
            <p>Total</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

function ProjectHealthSection() {
  const { data: projectHealth, isLoading: healthLoading } = useQuery({
    queryKey: ["reports", "project-health"],
    queryFn: () =>
      api
        .get("/reports/project/0/preview")
        .then((r) => r.data?.data ?? r.data ?? null)
        .catch(() => null),
    retry: false,
  });

  const projectHealthArr = (Array.isArray(projectHealth) ? projectHealth : projectHealth ? [projectHealth] : []) as ProjectHealthReport[];

  if (projectHealthArr.length === 0 && !healthLoading) return null;

  return (
    <div>
      <h2 className="text-sm font-semibold text-primary mb-3">
        <Building2 className="h-4 w-4 inline mr-1.5 -mt-0.5" />
        Project Health
      </h2>
      {healthLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton variant="text" className="h-4 w-24" />
                <Skeleton variant="text" className="h-5 w-14 rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton variant="text" className="h-3 w-16" />
                  <Skeleton variant="text" className="h-3 w-8" />
                </div>
                <Skeleton variant="rect" className="h-2 w-full rounded-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projectHealthArr.map((p) => (
            <ProjectHealthCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("task_completion");
  const [exportOpen, setExportOpen] = useState(false);
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

  const { data: tabData, isLoading: tabLoading } = useQuery({
    queryKey: ["reports", activeTab],
    queryFn: () => reportsService.getByTab(activeTab),
  });

  const handleExport = async (format: "csv" | "xlsx") => {
    setExportOpen(false);
    try {
      const blob = await reportsService.exportReport(format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeTab}-report.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      // Export failed silently
    }
  };

  return (
    <div className="page-container py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary">Reports</h1>
        <div ref={exportRef} className="relative">
          <Button variant="secondary" size="sm" onClick={() => setExportOpen(!exportOpen)}>
            <Download className="h-3.5 w-3.5" /> Export
            <ChevronDown className={cn("h-3 w-3 ml-1 transition-transform", exportOpen && "rotate-180")} />
          </Button>
          {exportOpen && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-surface border border-default rounded-lg shadow-dropdown z-dropdown py-1">
              <button
                onClick={() => handleExport("csv")}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-primary hover:bg-hover"
              >
                <FileText className="h-3.5 w-3.5" /> Export CSV
              </button>
              <button
                onClick={() => handleExport("xlsx")}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-primary hover:bg-hover"
              >
                <FileText className="h-3.5 w-3.5" /> Export XLSX
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-2 border-b border-subtle pb-3">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-colors",
              activeTab === tab.key
                ? "bg-primary text-inverse"
                : "text-secondary hover:text-primary hover:bg-hover"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {renderTabContent(activeTab, tabData, tabLoading)}

      {/* Project Health */}
      <ProjectHealthSection />
    </div>
  );
}
