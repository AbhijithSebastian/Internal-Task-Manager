import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { reportsService } from "@/features/reports/services/reports";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDate } from "@/utils/formatters";
import {
  FileText,
  Download,
  ChevronDown,
  Building2,
  Calendar,
  Users,
  Activity,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "task_completion" | "workload_distribution" | "weekly_summary" | "meeting_logs";

interface TaskCompletionRow {
  project_id: number;
  project_name: string;
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  completion_rate: number;
}

interface WorkloadRow {
  user_id: number;
  user_name: string;
  [key: string]: number | string;
}

interface WeeklySummaryRow {
  date_from: string;
  date_to: string;
  tasks_created: number;
  tasks_completed: number;
  comments_added: number;
}

interface MeetingLogRow {
  meeting_id: number;
  project_name: string;
  date: string | null;
  title: string;
  attendees: string;
  summary: string;
  decisions_taken: string;
  blockers: string;
  action_items: string;
  notes: string;
  author_name: string | null;
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

function TaskCompletionView({ data }: { data: TaskCompletionRow[] }) {
  return (
    <div className="space-y-3">
      {data.map((row) => (
        <Card key={row.project_id} className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-primary">{row.project_name}</h3>
              <div className="flex items-center gap-4 mt-1 text-xs text-tertiary">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> {row.completed_tasks} done
                </span>
                <span>{row.pending_tasks} pending</span>
                <span>{row.total_tasks} total</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-lg font-bold text-primary">{row.completion_rate}%</span>
            </div>
          </div>
          <ProgressBar value={row.completion_rate} />
        </Card>
      ))}
    </div>
  );
}

function WorkloadView({ data }: { data: WorkloadRow[] }) {
  const statusKeys = data.length > 0
    ? Object.keys(data[0]).filter((k) => k.endsWith("_tasks") && k !== "total_tasks")
    : [];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-subtle">
            <th className="text-left py-2 px-3 text-xs font-medium text-tertiary uppercase">User</th>
            {statusKeys.map((key) => (
              <th key={key} className="text-center py-2 px-3 text-xs font-medium text-tertiary uppercase">
                {key.replace("_tasks", "").replace("_", " ")}
              </th>
            ))}
            <th className="text-center py-2 px-3 text-xs font-medium text-tertiary uppercase">Total</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.user_id} className="border-b border-subtle hover:bg-hover">
              <td className="py-2 px-3 text-primary font-medium">{row.user_name}</td>
              {statusKeys.map((key) => (
                <td key={key} className="text-center py-2 px-3 text-secondary">{row[key]}</td>
              ))}
              <td className="text-center py-2 px-3 text-primary font-semibold">{row.total_tasks}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WeeklySummaryView({ data }: { data: WeeklySummaryRow[] }) {
  return (
    <div className="space-y-3">
      {data.map((row, i) => (
        <Card key={i} className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-primary">
              {formatDate(row.date_from)} — {formatDate(row.date_to)}
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-subtle rounded-lg">
              <p className="text-2xl font-bold text-primary">{row.tasks_created}</p>
              <p className="text-xs text-tertiary mt-1">Tasks Created</p>
            </div>
            <div className="text-center p-3 bg-subtle rounded-lg">
              <p className="text-2xl font-bold text-semantic-success">{row.tasks_completed}</p>
              <p className="text-xs text-tertiary mt-1">Tasks Completed</p>
            </div>
            <div className="text-center p-3 bg-subtle rounded-lg">
              <p className="text-2xl font-bold text-primary">{row.comments_added}</p>
              <p className="text-xs text-tertiary mt-1">Comments Added</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function MeetingLogsView({ data }: { data: MeetingLogRow[] }) {
  return (
    <div className="space-y-3">
      {data.map((row) => (
        <Card key={row.meeting_id} className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-primary">{row.title}</h3>
                <div className="flex items-center gap-2 text-xs text-tertiary mt-0.5">
                  <span>{row.date ? formatDate(row.date) : "—"}</span>
                  {row.project_name && (
                    <>
                      <span>·</span>
                      <span>{row.project_name}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {row.attendees && (
            <div className="flex items-center gap-1.5 text-xs text-secondary">
              <Users className="h-3 w-3 text-tertiary" />
              <span className="font-medium text-tertiary">Attendees:</span> {row.attendees}
            </div>
          )}

          {row.summary && (
            <div>
              <p className="text-xs text-tertiary font-medium mb-1">Summary</p>
              <p className="text-sm text-secondary leading-relaxed">{row.summary}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {row.decisions_taken && (
              <div>
                <p className="text-xs text-tertiary font-medium mb-1">Decisions Taken</p>
                <p className="text-xs text-secondary">{row.decisions_taken}</p>
              </div>
            )}
            {row.blockers && (
              <div>
                <p className="text-xs text-tertiary font-medium mb-1">Blockers</p>
                <p className="text-xs text-secondary">{row.blockers}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {row.action_items && (
              <div>
                <p className="text-xs text-tertiary font-medium mb-1">Action Items</p>
                <p className="text-xs text-secondary">{row.action_items}</p>
              </div>
            )}
            {row.notes && (
              <div>
                <p className="text-xs text-tertiary font-medium mb-1">Notes</p>
                <p className="text-xs text-secondary">{row.notes}</p>
              </div>
            )}
          </div>

          {row.author_name && (
            <p className="text-xs text-tertiary">
              Reported by <span className="font-medium text-primary">{row.author_name}</span>
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}

function renderTabContent(tab: Tab, data: unknown, loading: boolean) {
  if (loading) return <SkeletonTable rows={4} columns={3} />;

  if (tab === "task_completion") {
    const items = Array.isArray(data) ? (data as TaskCompletionRow[]) : [];
    if (items.length === 0) {
      return (
        <Card>
          <EmptyState
            icon={<Building2 className="h-8 w-8 text-tertiary" />}
            title="No task data"
            description="Task completion data will appear here once projects have tasks."
          />
        </Card>
      );
    }
    return <TaskCompletionView data={items} />;
  }

  if (tab === "workload_distribution") {
    const items = Array.isArray(data) ? (data as WorkloadRow[]) : [];
    if (items.length === 0) {
      return (
        <Card>
          <EmptyState
            icon={<Activity className="h-8 w-8 text-tertiary" />}
            title="No workload data"
            description="Workload distribution will appear here once users have tasks."
          />
        </Card>
      );
    }
    return <WorkloadView data={items} />;
  }

  if (tab === "weekly_summary") {
    const items = Array.isArray(data) ? (data as WeeklySummaryRow[]) : [];
    if (items.length === 0) {
      return (
        <Card>
          <EmptyState
            icon={<Calendar className="h-8 w-8 text-tertiary" />}
            title="No weekly data"
            description="Weekly summary will appear here once there is activity."
          />
        </Card>
      );
    }
    return <WeeklySummaryView data={items} />;
  }

  if (tab === "meeting_logs") {
    const items = Array.isArray(data) ? (data as MeetingLogRow[]) : [];
    if (items.length === 0) {
      return (
        <Card>
          <EmptyState
            icon={<MessageSquare className="h-8 w-8 text-tertiary" />}
            title="No meeting logs"
            description="Meeting logs will appear here once meetings are conducted."
          />
        </Card>
      );
    }
    return <MeetingLogsView data={items} />;
  }

  return null;
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
      const blob = await reportsService.exportReport(activeTab, format);
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

  return (
    <div className="page-container py-6 space-y-5">
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

      {renderTabContent(activeTab, tabData, tabLoading)}
    </div>
  );
}
