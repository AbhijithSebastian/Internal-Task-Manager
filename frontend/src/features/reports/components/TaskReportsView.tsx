import { useState } from "react";
import type { PaginatedResponse, TaskReportRow } from "../services/reports";
import { formatDate } from "@/utils/formatters";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Eye, Clock, MessageSquare, Paperclip, Users, Calendar, User, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  data: PaginatedResponse<TaskReportRow>;
  sortBy: string;
  sortDir: string;
  onSort: (key: string) => void;
  page: number;
  onPageChange: (page: number) => void;
  onPreview: (id: number) => void;
}

const statusBadge: Record<string, "info" | "warning" | "success" | "neutral" | "danger"> = {
  done: "success", in_progress: "info", in_review: "warning",
  approved: "success", backlog: "neutral", todo: "neutral",
  blocked: "danger", cancelled: "neutral",
};

const priorityBadge: Record<string, "success" | "warning" | "neutral" | "danger" | "info"> = {
  low: "neutral", medium: "info", high: "warning", urgent: "danger", critical: "danger",
};

function SortHeader({ label, field, sortBy, sortDir, onSort }: { label: string; field: string; sortBy: string; sortDir: string; onSort: (f: string) => void }) {
  return (
    <th className="px-2 py-2 text-left text-[10px] font-medium uppercase tracking-wider text-secondary select-none hover:text-primary cursor-pointer whitespace-nowrap" onClick={() => onSort(field)}>
      <div className="flex items-center gap-1">
        {label}
        {sortBy === field && <span className="text-[8px]">{sortDir === "asc" ? "▲" : "▼"}</span>}
      </div>
    </th>
  );
}

export function TaskReportsView({ data, sortBy, sortDir, onSort, page, onPageChange, onPreview }: Props) {
  const items = data.items as TaskReportRow[];
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  return (
    <div className="bg-surface border border-default shadow-card rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-subtle bg-subtle/50">
              <th className="w-6 px-2 py-2"></th>
              <SortHeader label="Task" field="title" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortHeader label="Project" field="project_name" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortHeader label="Status" field="status" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortHeader label="Priority" field="priority" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <th className="px-2 py-2 text-left text-[10px] font-medium uppercase tracking-wider text-secondary whitespace-nowrap">Assignees</th>
              <SortHeader label="Est. Hours" field="estimated_hours" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortHeader label="Duration" field="duration_days" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <th className="px-2 py-2 text-center text-[10px] font-medium uppercase tracking-wider text-secondary" title="Comments"><MessageSquare className="h-3 w-3 mx-auto" /></th>
              <th className="px-2 py-2 text-center text-[10px] font-medium uppercase tracking-wider text-secondary" title="Attachments"><Paperclip className="h-3 w-3 mx-auto" /></th>
              <th className="px-2 py-2 text-center text-[10px] font-medium uppercase tracking-wider text-secondary" title="Meetings"><Calendar className="h-3 w-3 mx-auto" /></th>
              <th className="px-2 py-2 text-right w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle">
            {items.map((row) => (
              <TaskRow
                key={row.id}
                row={row}
                isExpanded={expandedRow === row.id}
                onToggle={() => setExpandedRow(expandedRow === row.id ? null : row.id)}
                onPreview={() => onPreview(row.id)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {data.total_pages > 1 && (
        <div className="flex items-center justify-between px-3 py-2 border-t border-subtle">
          <p className="text-[10px] text-tertiary">
            {(page - 1) * data.per_page + 1}–{Math.min(page * data.per_page, data.total)} of {data.total}
          </p>
          <div className="flex items-center gap-1">
            <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="h-7 w-7 flex items-center justify-center rounded border border-default text-secondary hover:bg-hover disabled:opacity-30 text-xs">‹</button>
            {getPageNumbers(page, data.total_pages).map((p, i) =>
              p === "..." ? <span key={`e${i}`} className="px-1 text-[10px] text-tertiary">…</span>
                : <button key={String(p)} onClick={() => onPageChange(p as number)} className={`h-7 w-7 flex items-center justify-center rounded text-xs font-medium ${p === page ? "bg-primary text-inverse" : "text-secondary hover:bg-hover"}`}>{p}</button>
            )}
            <button disabled={page >= data.total_pages} onClick={() => onPageChange(page + 1)} className="h-7 w-7 flex items-center justify-center rounded border border-default text-secondary hover:bg-hover disabled:opacity-30 text-xs">›</button>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskRow({ row, isExpanded, onToggle, onPreview }: { row: TaskReportRow; isExpanded: boolean; onToggle: () => void; onPreview: () => void }) {
  return (
    <>
      <tr className="hover:bg-hover transition-colors cursor-pointer" onClick={onToggle}>
        <td className="px-2 py-2.5 text-tertiary text-[10px]">{isExpanded ? "▾" : "▸"}</td>
        <td className="px-2 py-2.5">
          <div className="min-w-0">
            <p className="font-medium text-primary text-xs truncate max-w-[200px]">{row.title}</p>
            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-tertiary">
              <User className="h-2.5 w-2.5" />
              <span>{row.author || "—"}</span>
            </div>
          </div>
        </td>
        <td className="px-2 py-2.5 text-secondary text-[10px] max-w-[100px] truncate">{row.project_name || "—"}</td>
        <td className="px-2 py-2.5">
          <Badge variant={statusBadge[row.status] ?? "neutral"} size="sm">{row.status_label}</Badge>
        </td>
        <td className="px-2 py-2.5">
          <Badge variant={priorityBadge[row.priority] ?? "neutral"} size="sm">{row.priority_label}</Badge>
        </td>
        <td className="px-2 py-2.5">
          <div className="flex items-center gap-1">
            <div className="flex -space-x-1">
              {row.assignees.slice(0, 3).map((a) => (
                <span key={a.id} className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary-soft text-primary text-[8px] font-medium border border-surface" title={a.name}>
                  {a.name.charAt(0).toUpperCase()}
                </span>
              ))}
            </div>
            {row.assignees.length > 3 && <span className="text-[9px] text-tertiary ml-0.5">+{row.assignees.length - 3}</span>}
            {row.assignees.length === 0 && <span className="text-tertiary text-[10px]">—</span>}
          </div>
        </td>
        <td className="px-2 py-2.5 text-secondary">{row.estimated_hours != null ? `${row.estimated_hours}h` : "—"}</td>
        <td className="px-2 py-2.5 text-secondary">{row.duration_days != null ? `${row.duration_days}d` : "—"}</td>
        <td className="px-2 py-2.5 text-center text-secondary text-[10px]">{row.comment_count}</td>
        <td className="px-2 py-2.5 text-center text-secondary text-[10px]">{row.attachment_count}</td>
        <td className="px-2 py-2.5 text-center text-secondary text-[10px]">{row.linked_meeting_count}</td>
        <td className="px-2 py-2.5 text-right">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onPreview(); }}>
            <Eye className="h-3 w-3" />
          </Button>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-subtle/30">
          <td colSpan={12} className="px-4 py-3">
            <TaskDetailPanel row={row} />
          </td>
        </tr>
      )}
    </>
  );
}

function TaskDetailPanel({ row }: { row: TaskReportRow }) {
  return (
    <div className="space-y-4 animate-in slide-in-from-top-1 duration-150">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        <StatCard icon={User} label="Author" value={row.author || "—"} />
        <StatCard icon={Calendar} label="Created" value={row.created_at ? formatDate(row.created_at) : "—"} />
        <StatCard icon={Calendar} label="Started" value={row.started_date ? formatDate(row.started_date) : "—"} />
        <StatCard icon={CheckCircle2} label="Completed" value={row.completed_date ? formatDate(row.completed_date) : "—"} />
        <StatCard icon={Calendar} label="Due" value={row.due_date ? formatDate(row.due_date) : "—"} />
        <StatCard icon={Clock} label="Duration" value={row.duration_days != null ? `${row.duration_days} days` : "—"} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatCard icon={Clock} label="Est. Hours" value={row.estimated_hours != null ? `${row.estimated_hours}h` : "—"} />
        <StatCard icon={Clock} label="Actual Hours" value={row.actual_hours != null ? `${row.actual_hours}h` : "Not tracked"} />
        <StatCard icon={Paperclip} label="Attachments" value={String(row.attachment_count)} />
        <StatCard icon={Calendar} label="Linked Meetings" value={String(row.linked_meeting_count)} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <KpiBlock label="Subtasks" value={row.subtask_count} />
        <KpiBlock label="Comments" value={row.comment_count} />
        {row.time_tracking === null && <KpiBlock label="Time Tracking" value="—" />}
      </div>

      {row.assignees.length > 0 && (
        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-tertiary mb-1.5">
            <Users className="h-3 w-3 inline mr-1" />Assignees ({row.assignees.length})
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {row.assignees.map((a) => (
              <span key={a.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-subtle text-[10px] text-secondary">{a.name}</span>
            ))}
          </div>
        </div>
      )}

      {row.comments.length > 0 && (
        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-tertiary mb-1.5">
            <MessageSquare className="h-3 w-3 inline mr-1" />Recent Comments
          </h4>
          <div className="space-y-1.5">
            {row.comments.map((c, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px]">
                <MessageSquare className="h-3 w-3 text-tertiary mt-0.5 shrink-0" />
                <div>
                  <p className="text-secondary line-clamp-2">{c.body}</p>
                  <p className="text-[10px] text-tertiary">{c.author || "Unknown"} · {c.created_at ? formatDate(c.created_at) : ""}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {row.description && (
        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-tertiary mb-1">Description</h4>
          <p className="text-[11px] text-secondary leading-relaxed">{row.description}</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-md bg-surface border border-default/50">
      <Icon className="h-3.5 w-3.5 text-tertiary shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] text-tertiary">{label}</p>
        <p className="text-xs font-medium text-primary truncate">{value}</p>
      </div>
    </div>
  );
}

function KpiBlock({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="p-2 rounded-md bg-surface border border-default/50">
      <p className="text-[10px] text-tertiary">{label}</p>
      <p className={cn("text-base font-bold text-primary", color)}>{value}</p>
    </div>
  );
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}
