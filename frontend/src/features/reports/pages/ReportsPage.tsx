import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { reportsService } from "@/features/reports/services/reports";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
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
  UserCheck,
  MessageSquare,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "project_report" | "meeting_logs";

interface ProjectReport {
  id: number;
  name: string;
  completion_percentage: number;
  estimated_completion_date?: string;
  team_members: { id: number; name: string; avatar_url?: string; role: string }[];
  activities_count: number;
  meetings_count: number;
  completed_parts: string[];
}

interface MeetingReport {
  id: number;
  title: string;
  meeting_date: string;
  topic?: string;
  attendees: { id: number; name: string; avatar_url?: string; role: string }[];
  absentees?: string[];
  summary: string;
  remarks?: string;
  important_notes?: string;
  next_meeting_date?: string;
  project_name?: string;
}

const TABS: { key: Tab; label: string }[] = [
  { key: "project_report", label: "Project Report" },
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

function renderProjectReport(data: unknown, loading: boolean) {
  if (loading) return <SkeletonTable rows={4} columns={3} />;
  const items = (Array.isArray(data) ? data : []) as ProjectReport[];
  if (items.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Building2 className="h-8 w-8 text-tertiary" />}
          title="No project reports"
          description="Project reports will appear here once projects have data."
        />
      </Card>
    );
  }
  return (
    <div className="grid gap-4">
      {items.map((project) => (
        <ProjectReportCard key={project.id} project={project} />
      ))}
    </div>
  );
}

function ProjectReportCard({ project }: { project: ProjectReport }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<ProjectReport | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const handlePreview = async () => {
    if (previewOpen) {
      setPreviewOpen(false);
      return;
    }
    setLoadingPreview(true);
    try {
      const data = await reportsService.getProjectPreview(project.id);
      setPreviewData(data);
    } catch {
      setPreviewData(null);
    }
    setLoadingPreview(false);
    setPreviewOpen(true);
  };

  const handleDownload = async () => {
    try {
      const blob = await reportsService.exportReport("project_report", "csv");
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `project-${project.id}-report.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      // silent
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-primary truncate">{project.name}</h3>
              {project.estimated_completion_date && (
                <p className="text-xs text-tertiary flex items-center gap-1 mt-0.5">
                  <Calendar className="h-3 w-3" />
                  Est. completion: {formatDate(project.estimated_completion_date)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="secondary" size="sm" onClick={handlePreview} loading={loadingPreview}>
              <Eye className="h-3.5 w-3.5" /> Preview
            </Button>
            <Button variant="secondary" size="sm" onClick={handleDownload}>
              <Download className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs text-tertiary mb-1">
              <span>Progress</span>
              <span className="font-medium text-primary">{Math.round(project.completion_percentage)}%</span>
            </div>
            <ProgressBar value={project.completion_percentage} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-2 text-xs text-tertiary">
            <Users className="h-3.5 w-3.5" />
            <span>{project.team_members.length} members</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-tertiary">
            <Activity className="h-3.5 w-3.5" />
            <span>{project.activities_count} activities</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-tertiary">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>{project.meetings_count} meetings</span>
          </div>
        </div>

        {project.completed_parts.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-tertiary">Completed Parts</p>
            <div className="flex flex-wrap gap-1.5">
              {project.completed_parts.map((part, i) => (
                <Badge key={i} variant="success" size="sm">
                  <CheckCircle2 className="h-2.5 w-2.5" /> {part}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {project.team_members.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-tertiary">Team Members</p>
            <div className="flex flex-wrap gap-2">
              {project.team_members.slice(0, 8).map((m) => (
                <div key={m.id} className="flex items-center gap-1.5">
                  <Avatar name={m.name} size="sm" src={m.avatar_url} />
                  <div className="text-xs">
                    <p className="text-primary">{m.name}</p>
                    <p className="text-tertiary">{m.role}</p>
                  </div>
                </div>
              ))}
              {project.team_members.length > 8 && (
                <span className="text-xs text-tertiary self-center">+{project.team_members.length - 8} more</span>
              )}
            </div>
          </div>
        )}
      </div>

      {previewOpen && (
        <div className="border-t border-subtle">
          <div className="p-4 bg-subtle/50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold uppercase text-tertiary tracking-wide">Full Preview</h4>
              <button onClick={() => setPreviewOpen(false)} className="text-xs text-link hover:underline">
                Close
              </button>
            </div>
            {previewData ? (
              <pre className="text-xs text-secondary whitespace-pre-wrap max-h-60 overflow-y-auto">
                {JSON.stringify(previewData, null, 2)}
              </pre>
            ) : (
              <p className="text-xs text-tertiary">Preview data not available</p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

function renderMeetingLogs(data: unknown, loading: boolean) {
  if (loading) return <SkeletonTable rows={4} columns={3} />;
  const items = (Array.isArray(data) ? data : []) as MeetingReport[];
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
    <div className="grid gap-4">
      {items.map((meeting) => (
        <MeetingReportCard key={meeting.id} meeting={meeting} />
      ))}
    </div>
  );
}

function MeetingReportCard({ meeting }: { meeting: MeetingReport }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<MeetingReport | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const handlePreview = async () => {
    if (previewOpen) {
      setPreviewOpen(false);
      return;
    }
    setLoadingPreview(true);
    try {
      const data = await reportsService.getMeetingLog(meeting.id);
      setPreviewData(data);
    } catch {
      setPreviewData(null);
    }
    setLoadingPreview(false);
    setPreviewOpen(true);
  };

  const handleDownload = async () => {
    try {
      const blob = await reportsService.exportReport("meeting_logs", "csv");
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `meeting-${meeting.id}-report.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      // silent
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-primary truncate">{meeting.title}</h3>
              <div className="flex items-center gap-2 text-xs text-tertiary mt-0.5">
                <span>{formatDate(meeting.meeting_date)}</span>
                {meeting.project_name && (
                  <>
                    <span>·</span>
                    <span>{meeting.project_name}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="secondary" size="sm" onClick={handlePreview} loading={loadingPreview}>
              <Eye className="h-3.5 w-3.5" /> Preview
            </Button>
            <Button variant="secondary" size="sm" onClick={handleDownload}>
              <Download className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {meeting.topic && (
          <div>
            <p className="text-xs text-tertiary font-medium">Topic</p>
            <p className="text-sm text-primary">{meeting.topic}</p>
          </div>
        )}

        {meeting.summary && (
          <div>
            <p className="text-xs text-tertiary font-medium mb-1">Summary</p>
            <p className="text-sm text-secondary leading-relaxed line-clamp-3">{meeting.summary}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {meeting.attendees.length > 0 && (
            <div>
              <p className="text-xs text-tertiary font-medium mb-1 flex items-center gap-1">
                <UserCheck className="h-3 w-3" /> Attendees ({meeting.attendees.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {meeting.attendees.slice(0, 6).map((a) => (
                  <div key={a.id} className="flex items-center gap-1 bg-subtle rounded-full px-2 py-0.5">
                    <Avatar name={a.name} size="sm" src={a.avatar_url} />
                    <span className="text-xs text-primary">{a.name}</span>
                    <span className="text-[10px] text-tertiary">({a.role})</span>
                  </div>
                ))}
                {meeting.attendees.length > 6 && (
                  <span className="text-xs text-tertiary">+{meeting.attendees.length - 6}</span>
                )}
              </div>
            </div>
          )}
          {meeting.absentees && meeting.absentees.length > 0 && (
            <div>
              <p className="text-xs text-tertiary font-medium mb-1">Absentees</p>
              <div className="flex flex-wrap gap-1">
                {meeting.absentees.map((name, i) => (
                  <Badge key={i} variant="neutral" size="sm">{name}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {meeting.remarks && (
            <div>
              <p className="text-xs text-tertiary font-medium">Remarks</p>
              <p className="text-xs text-secondary">{meeting.remarks}</p>
            </div>
          )}
          {meeting.important_notes && (
            <div>
              <p className="text-xs text-tertiary font-medium">Important Notes</p>
              <p className="text-xs text-secondary">{meeting.important_notes}</p>
            </div>
          )}
        </div>

        {meeting.next_meeting_date && (
          <div className="flex items-center gap-1.5 text-xs text-primary">
            <Calendar className="h-3.5 w-3.5" />
            Next meeting: {formatDate(meeting.next_meeting_date)}
          </div>
        )}
      </div>

      {previewOpen && (
        <div className="border-t border-subtle">
          <div className="p-4 bg-subtle/50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold uppercase text-tertiary tracking-wide">Full Preview</h4>
              <button onClick={() => setPreviewOpen(false)} className="text-xs text-link hover:underline">
                Close
              </button>
            </div>
            {previewData ? (
              <pre className="text-xs text-secondary whitespace-pre-wrap max-h-60 overflow-y-auto">
                {JSON.stringify(previewData, null, 2)}
              </pre>
            ) : (
              <p className="text-xs text-tertiary">Preview data not available</p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

function renderTabContent(tab: Tab, data: unknown, loading: boolean) {
  switch (tab) {
    case "project_report":
      return renderProjectReport(data, loading);
    case "meeting_logs":
      return renderMeetingLogs(data, loading);
  }
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("project_report");
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
