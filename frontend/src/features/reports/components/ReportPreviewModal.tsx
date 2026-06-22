import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { reportsService } from "@/features/reports/services/reports";
import { X, Calendar, User, Tag, Clock, Activity, MessageSquare, Paperclip, FileText, Download } from "lucide-react";
import { formatDate } from "@/utils/formatters";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface Props {
  reportType: string;
  itemId: number;
  onClose: () => void;
}

export function ReportPreviewModal({ reportType, itemId, onClose }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["report-preview", reportType, itemId],
    queryFn: () => reportsService.getPreview(reportType, itemId),
  });
  const [exporting, setExporting] = useState<"pdf" | "docx" | null>(null);

  const preview = data?.data;
  const reportLabel = reportType === "projects" ? "Project" : reportType === "tasks" ? "Task" : reportType === "subtasks" ? "Subtask" : "Employee";

  const handleExportPdf = async () => {
    setExporting("pdf");
    try {
      await reportsService.exportPreviewPdf(reportType, itemId);
    } catch { /* silent */ }
    setExporting(null);
  };

  const handleExportDocx = async () => {
    setExporting("docx");
    try {
      await reportsService.exportPreviewDocx(reportType, itemId);
    } catch { /* silent */ }
    setExporting(null);
  };

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white border border-gray-200 rounded-xl shadow-elevated w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 shrink-0 bg-gray-50">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <div>
              <h2 className="text-sm font-bold text-gray-900 capitalize">
                {reportLabel} Report Preview
              </h2>
              <p className="text-[10px] text-gray-500">{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" disabled={exporting !== null} onClick={handleExportPdf}>
              <Download className="h-3.5 w-3.5" /> {exporting === "pdf" ? "Generating..." : "PDF"}
            </Button>
            <Button variant="secondary" size="sm" disabled={exporting !== null} onClick={handleExportDocx}>
              <FileText className="h-3.5 w-3.5" /> {exporting === "docx" ? "Generating..." : "DOCX"}
            </Button>
            <button onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto py-8 px-8" id="report-content">
            {isLoading ? (
              <div className="space-y-5">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <div className="grid grid-cols-4 gap-3 mt-6">
                  {[1,2,3,4].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
                </div>
                <Skeleton className="h-32 rounded-lg" />
              </div>
            ) : isError ? (
              <div className="text-center py-16 text-sm text-gray-500">Failed to load preview data.</div>
            ) : preview ? (
              <div className="space-y-6 text-gray-800">
                <ReportWatermark />
                {reportType === "projects" && <ProjectReport preview={preview} />}
                {reportType === "tasks" && <TaskReport preview={preview} />}
                {reportType === "subtasks" && <SubtaskReport preview={preview} />}
                {reportType === "employees" && <EmployeeReport preview={preview} />}
                <ReportFooter />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportWatermark() {
  return (
    <div className="border-b border-gray-300 pb-3 mb-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 tracking-tight">Internal Task Manager</h1>
          <p className="text-[10px] text-gray-500">Enterprise Project Intelligence · Reports Module</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-400">Generated</p>
          <p className="text-xs font-medium text-gray-700">{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
        </div>
      </div>
    </div>
  );
}

function ReportFooter() {
  return (
    <div className="border-t border-gray-200 pt-3 text-center">
      <p className="text-[9px] text-gray-400">Internal Task Manager · Confidential · Generated {new Date().toLocaleString()}</p>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: any; label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {Icon && <Icon className="h-3.5 w-3.5 text-gray-400 shrink-0" />}
      <span className="text-gray-500 min-w-[90px] text-[11px]">{label}</span>
      <span className="text-gray-800 font-medium text-[11px]">{value ?? "—"}</span>
    </div>
  );
}

function KpiCard({ value, label, color }: { value: string; label: string; color?: string }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
      <p className={cn("text-xl font-bold text-gray-900", color)}>{value}</p>
      <p className="text-[9px] text-gray-500 mt-0.5 uppercase tracking-wider">{label}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2 pb-1.5 border-b border-gray-200">
        {title}
      </h3>
      {children}
    </div>
  );
}

function memberTag(name: string) {
  return <span key={name} className="inline-block px-2 py-0.5 mr-1 mb-1 rounded bg-gray-100 text-[10px] text-gray-700">{name}</span>;
}

function ProjectReport({ preview: d }: { preview: Record<string, any> }) {
  return (
    <>
      <div>
        <h2 className="text-base font-bold text-gray-900">{d.name}</h2>
        {d.description && <p className="text-xs text-gray-500 mt-0.5">{d.description}</p>}
      </div>

      <div className="grid grid-cols-4 gap-2">
        <KpiCard value={`${d.completion_rate}%`} label="Completion" />
        <KpiCard value={String(d.total_tasks)} label="Total Tasks" />
        <KpiCard value={String(d.completed_tasks)} label="Completed" color="text-green-600" />
        <KpiCard value={String(d.pending_tasks)} label="Pending" color="text-amber-600" />
      </div>

      <Section title="Overview">
        <div className="grid grid-cols-3 gap-x-6 gap-y-1.5">
          <DetailRow icon={Tag} label="Status" value={d.status_label} />
          <DetailRow icon={Tag} label="Priority" value={d.priority_label} />
          <DetailRow icon={Calendar} label="Start" value={d.start_date ? formatDate(d.start_date) : null} />
          <DetailRow icon={Calendar} label="End" value={d.end_date ? formatDate(d.end_date) : null} />
          <DetailRow icon={User} label="PM" value={d.pm} />
          <DetailRow icon={User} label="Lead" value={d.lead} />
        </div>
      </Section>

      <Section title="Progress">
        <div className="flex h-2.5 bg-gray-100 rounded-full overflow-hidden mb-2">
          <div className="bg-green-500 h-full" style={{ width: `${Math.min(100, d.completion_rate)}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
          <div className="p-1.5 rounded bg-gray-50"><span className="font-bold text-gray-800">{d.total_tasks}</span><span className="text-gray-500 ml-1">Total</span></div>
          <div className="p-1.5 rounded bg-gray-50"><span className="font-bold text-green-600">{d.completed_tasks}</span><span className="text-gray-500 ml-1">Done</span></div>
          <div className="p-1.5 rounded bg-gray-50"><span className="font-bold text-amber-600">{d.pending_tasks}</span><span className="text-gray-500 ml-1">Pending</span></div>
        </div>
      </Section>

      <Section title="Tasks & Subtasks">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-2 rounded bg-gray-50 border border-gray-100"><p className="text-[10px] text-gray-500">Tasks</p><p className="text-sm font-bold text-gray-900">{d.total_tasks}</p><p className="text-[10px] text-gray-500">{d.completed_tasks} completed · {d.pending_tasks} pending</p></div>
          <div className="p-2 rounded bg-gray-50 border border-gray-100"><p className="text-[10px] text-gray-500">Subtasks</p><p className="text-sm font-bold text-gray-900">{d.total_subtasks ?? 0}</p><p className="text-[10px] text-gray-500">{d.completed_subtasks ?? 0} completed</p></div>
        </div>
      </Section>

      <Section title="Health & Risks">
        <div className="grid grid-cols-4 gap-2">
          <KpiCard value={String(d.health_score)} label="Health" />
          <KpiCard value={String(d.blocked_count ?? 0)} label="Blocked" />
          <KpiCard value={String(d.overdue_count ?? 0)} label="Overdue" />
          <KpiCard value={String(d.meeting_count ?? 0)} label="Meetings" />
        </div>
      </Section>

      {d.team_leads?.length > 0 && <Section title="Team Leads"><div className="flex flex-wrap">{d.team_leads.map((m: any) => memberTag(m.name))}</div></Section>}
      {d.developers?.length > 0 && <Section title="Developers"><div className="flex flex-wrap">{d.developers.map((m: any) => memberTag(m.name))}</div></Section>}
      {d.team_members?.length > 0 && <Section title="Other Members"><div className="flex flex-wrap">{d.team_members.map((m: any) => memberTag(m.name))}</div></Section>}

      {d.recent_activity?.length > 0 && (
        <Section title="Recent Activity">
          <div className="space-y-1.5">
            {d.recent_activity.slice(0, 5).map((a: any, i: number) => (
              <div key={i} className="flex items-start gap-2 text-[11px]">
                <Activity className="h-3 w-3 text-gray-400 mt-0.5 shrink-0" />
                <div><p className="text-gray-600">{a.description}</p><p className="text-[10px] text-gray-400">{a.created_at ? formatDate(a.created_at) : ""}</p></div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}

function TaskReport({ preview: d }: { preview: Record<string, any> }) {
  return (
    <>
      <div><h2 className="text-base font-bold text-gray-900">{d.title}</h2>{d.description && <p className="text-xs text-gray-500 mt-0.5">{d.description}</p>}</div>

      <div className="grid grid-cols-4 gap-2">
        <KpiCard value={d.status_label} label="Status" />
        <KpiCard value={d.priority_label} label="Priority" />
        <KpiCard value={d.estimated_hours != null ? `${d.estimated_hours}h` : "—"} label="Est. Hours" />
        <KpiCard value={String(d.comments?.length ?? 0)} label="Comments" />
      </div>

      <Section title="Time & Dates">
        <div className="grid grid-cols-3 gap-x-6 gap-y-1.5">
          <DetailRow icon={Calendar} label="Created" value={d.created_at ? formatDate(d.created_at) : null} />
          <DetailRow icon={Calendar} label="Started" value={d.started_date ? formatDate(d.started_date) : "—"} />
          <DetailRow icon={Calendar} label="Completed" value={d.completed_date ? formatDate(d.completed_date) : "—"} />
          <DetailRow icon={Calendar} label="Due Date" value={d.due_date ? formatDate(d.due_date) : null} />
          <DetailRow icon={Clock} label="Est. Hours" value={d.estimated_hours != null ? `${d.estimated_hours}h` : null} />
          <DetailRow icon={Clock} label="Actual Hours" value={d.actual_hours != null ? `${d.actual_hours}h` : "Not tracked"} />
        </div>
      </Section>

      <Section title="Details">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
          <DetailRow icon={Tag} label="Project" value={d.project_name} />
          <DetailRow icon={User} label="Author" value={d.author} />
          <DetailRow icon={Paperclip} label="Attachments" value={d.attachment_count ?? 0} />
        </div>
      </Section>

      {d.assignees?.length > 0 && <Section title="Assignees"><div className="flex flex-wrap">{d.assignees.map((a: any) => memberTag(a.name))}</div></Section>}

      {d.meetings?.length > 0 && (
        <Section title="Linked Meetings">
          <div className="space-y-1">
            {d.meetings.slice(0, 5).map((m: any) => (
              <div key={m.id} className="flex items-center gap-2 text-[11px]">
                <Calendar className="h-3 w-3 text-gray-400" />
                <span className="text-gray-500">{m.date ? formatDate(m.date) : "—"}</span>
                <span className="text-gray-800">{m.title}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {d.comments?.length > 0 && (
        <Section title="Comments">
          <div className="space-y-2">
            {d.comments.slice(0, 5).map((c: any, i: number) => (
              <div key={i} className="p-2 rounded bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-1">
                  <MessageSquare className="h-3 w-3" />
                  <span>{c.author || "Unknown"}</span><span>·</span><span>{c.created_at ? formatDate(c.created_at) : ""}</span>
                </div>
                <p className="text-[11px] text-gray-600">{c.body}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {d.activity?.length > 0 && (
        <Section title="Activity Timeline">
          <div className="space-y-1.5">
            {d.activity.slice(0, 5).map((a: any, i: number) => (
              <div key={i} className="flex items-start gap-2 text-[11px]">
                <Activity className="h-3 w-3 text-gray-400 mt-0.5 shrink-0" />
                <div><p className="text-gray-600">{a.description}</p><p className="text-[10px] text-gray-400">{a.created_at ? formatDate(a.created_at) : ""}</p></div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}

function SubtaskReport({ preview: d }: { preview: Record<string, any> }) {
  return (
    <>
      <div><h2 className="text-base font-bold text-gray-900">{d.title}</h2></div>

      <div className="grid grid-cols-4 gap-2">
        <KpiCard value={d.status_label} label="Status" />
        <KpiCard value={d.priority_label} label="Priority" />
        <KpiCard value={d.completion_time != null ? `${d.completion_time}h` : "—"} label="Completion" />
        <KpiCard value={String(d.attachment_count ?? 0)} label="Attachments" />
      </div>

      <Section title="Time & Dates">
        <div className="grid grid-cols-3 gap-x-6 gap-y-1.5">
          <DetailRow icon={Calendar} label="Created" value={d.created_at ? formatDate(d.created_at) : null} />
          <DetailRow icon={Calendar} label="Started" value={d.started_date ? formatDate(d.started_date) : "—"} />
          <DetailRow icon={Calendar} label="Completed" value={d.completed_date ? formatDate(d.completed_date) : "—"} />
          <DetailRow icon={Calendar} label="Due Date" value={d.due_date ? formatDate(d.due_date) : null} />
          <DetailRow icon={Clock} label="Est. Hours" value={d.estimated_hours != null ? `${d.estimated_hours}h` : null} />
          <DetailRow icon={Clock} label="Completion" value={d.completion_time != null ? `${d.completion_time}h` : "—"} />
        </div>
      </Section>

      <Section title="Details">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
          <DetailRow icon={Tag} label="Parent Task" value={d.parent_task_title} />
          <DetailRow icon={Tag} label="Project" value={d.project_name} />
          <DetailRow icon={Paperclip} label="Attachments" value={d.attachment_count ?? 0} />
        </div>
      </Section>

      {d.assignees?.length > 0 && <Section title="Assigned Users"><div className="flex flex-wrap">{d.assignees.map((a: any) => memberTag(a.name))}</div></Section>}
      {d.notes && <Section title="Notes"><p className="text-[11px] text-gray-600 leading-relaxed bg-gray-50 p-2 rounded border border-gray-100">{d.notes}</p></Section>}

      {d.activity?.length > 0 && (
        <Section title="Activity History">
          <div className="space-y-1.5">
            {d.activity.slice(0, 5).map((a: any, i: number) => (
              <div key={i} className="flex items-start gap-2 text-[11px]">
                <Activity className="h-3 w-3 text-gray-400 mt-0.5 shrink-0" />
                <div><p className="text-gray-600">{a.description}</p><p className="text-[10px] text-gray-400">{a.created_at ? formatDate(a.created_at) : ""}</p></div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}

function EmployeeReport({ preview: d }: { preview: Record<string, any> }) {
  return (
    <>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">{d.name?.charAt(0).toUpperCase()}</div>
        <div>
          <h2 className="text-base font-bold text-gray-900">{d.name}</h2>
          <p className="text-xs text-gray-500">{d.email}{d.designation ? ` · ${d.designation}` : ""}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <KpiCard value={String(d.assigned_tasks)} label="Tasks" />
        <KpiCard value={String(d.completed_tasks)} label="Completed" color="text-green-600" />
        <KpiCard value={String(d.overdue_tasks)} label="Overdue" color="text-red-600" />
        <KpiCard value={`${d.completion_rate}%`} label="Rate" />
      </div>

      <div className="grid grid-cols-4 gap-2">
        <KpiCard value={String(d.assigned_subtasks ?? 0)} label="Subtasks" />
        <KpiCard value={String(d.completed_subtasks ?? 0)} label="Subtasks Done" color="text-green-600" />
        <KpiCard value={`${d.total_hours ?? 0}h`} label="Total Hours" />
        <KpiCard value={d.average_completion_time != null ? `${d.average_completion_time}h` : "—"} label="Avg Completion" />
      </div>

      <Section title="Scorecard">
        <div className="space-y-2">
          <div className="flex items-center justify-between"><span className="text-[11px] text-gray-500">Productivity Score</span><span className={cn("text-lg font-bold", d.productivity_score >= 70 ? "text-green-600" : d.productivity_score >= 40 ? "text-amber-600" : "text-red-600")}>{d.productivity_score}/100</span></div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className={cn("h-full rounded-full", d.productivity_score >= 70 ? "bg-green-500" : d.productivity_score >= 40 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${Math.min(100, d.productivity_score)}%` }} />
          </div>
        </div>
      </Section>

      <Section title="Details">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
          <DetailRow icon={Tag} label="Role" value={d.role} />
          <DetailRow icon={Tag} label="Department" value={d.department} />
          <DetailRow icon={Tag} label="Designation" value={d.designation} />
          <DetailRow icon={Tag} label="Employee ID" value={d.employee_id} />
          <DetailRow icon={Calendar} label="Projects" value={d.project_count ?? 0} />
          <DetailRow icon={User} label="Pending" value={d.pending_tasks} />
        </div>
      </Section>

      {d.meetings?.length > 0 && (
        <Section title="Recent Meetings">
          <div className="space-y-1">
            {d.meetings.slice(0, 5).map((m: any) => (
              <div key={m.id} className="flex items-center gap-2 text-[11px]">
                <Calendar className="h-3 w-3 text-gray-400" />
                <span className="text-gray-500">{m.date ? formatDate(m.date) : "—"}</span>
                <span className="text-gray-800">{m.title}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {d.recent_activity?.length > 0 && (
        <Section title="Recent Activity">
          <div className="space-y-1.5">
            {d.recent_activity.slice(0, 5).map((a: any, i: number) => (
              <div key={i} className="flex items-start gap-2 text-[11px]">
                <Activity className="h-3 w-3 text-gray-400 mt-0.5 shrink-0" />
                <div><p className="text-gray-600">{a.description}</p><p className="text-[10px] text-gray-400">{a.created_at ? formatDate(a.created_at) : ""}</p></div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
