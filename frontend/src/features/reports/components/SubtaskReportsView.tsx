import { useState } from "react";
import type { PaginatedResponse, SubtaskReportRow } from "../services/reports";
import { formatDate } from "@/utils/formatters";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Eye, Calendar, Clock, User, Paperclip, Layers, Activity, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  data: PaginatedResponse<SubtaskReportRow>;
  sortBy: string;
  sortDir: string;
  onSort: (key: string) => void;
  page: number;
  onPageChange: (page: number) => void;
  onPreview: (id: number) => void;
}

const statusBadge: Record<string, "info" | "warning" | "success" | "neutral" | "danger"> = {
  done: "success", in_progress: "info", in_review: "warning",
  backlog: "neutral", todo: "neutral",
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

export function SubtaskReportsView({ data, sortBy, sortDir, onSort, page, onPageChange, onPreview }: Props) {
  const items = data.items as SubtaskReportRow[];
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  return (
    <div className="bg-surface border border-default shadow-card rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-subtle bg-subtle/50">
              <th className="w-6 px-2 py-2"></th>
              <SortHeader label="Subtask" field="title" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortHeader label="Parent Task" field="parent_task_title" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortHeader label="Project" field="project_name" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortHeader label="Status" field="status" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortHeader label="Priority" field="priority" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <th className="px-2 py-2 text-left text-[10px] font-medium uppercase tracking-wider text-secondary whitespace-nowrap">Assigned</th>
              <SortHeader label="Completion" field="completion_time" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <th className="px-2 py-2 text-center text-[10px] font-medium uppercase tracking-wider text-secondary" title="Attachments"><Paperclip className="h-3 w-3 mx-auto" /></th>
              <th className="px-2 py-2 text-right w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle">
            {items.map((row) => (
              <SubtaskRow
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

function SubtaskRow({ row, isExpanded, onToggle, onPreview }: { row: SubtaskReportRow; isExpanded: boolean; onToggle: () => void; onPreview: () => void }) {
  return (
    <>
      <tr className="hover:bg-hover transition-colors cursor-pointer" onClick={onToggle}>
        <td className="px-2 py-2.5 text-tertiary text-[10px]">{isExpanded ? "▾" : "▸"}</td>
        <td className="px-2 py-2.5">
          <div className="min-w-0">
            <p className="font-medium text-primary text-xs truncate max-w-[180px]">{row.title}</p>
            {row.notes && <p className="text-[10px] text-tertiary mt-0.5 truncate max-w-[180px]">{row.notes}</p>}
          </div>
        </td>
        <td className="px-2 py-2.5 text-secondary text-[10px] truncate max-w-[150px]">{row.parent_task_title || "—"}</td>
        <td className="px-2 py-2.5 text-secondary text-[10px] truncate max-w-[100px]">{row.project_name || "—"}</td>
        <td className="px-2 py-2.5">
          <Badge variant={statusBadge[row.status] ?? "neutral"} size="sm">{row.status_label}</Badge>
        </td>
        <td className="px-2 py-2.5">
          <Badge variant={priorityBadge[row.priority] ?? "neutral"} size="sm">{row.priority_label}</Badge>
        </td>
        <td className="px-2 py-2.5">
          <div className="flex items-center gap-1">
            {row.assignees.length > 0 ? (
              <>
                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary-soft text-primary text-[8px] font-medium border border-surface" title={row.assignees[0].name}>
                  {row.assignees[0].name.charAt(0).toUpperCase()}
                </span>
                <span className="text-[10px] text-secondary">{row.assignees[0].name}</span>
                {row.assignees.length > 1 && <span className="text-[9px] text-tertiary">+{row.assignees.length - 1}</span>}
              </>
            ) : <span className="text-tertiary text-[10px]">—</span>}
          </div>
        </td>
        <td className="px-2 py-2.5">
          {row.completion_time != null ? (
            <span className="text-[10px] text-secondary">{row.completion_time}h</span>
          ) : row.status === "done" ? (
            <span className="text-[10px] text-tertiary">—</span>
          ) : (
            <span className="text-[10px] text-tertiary">In progress</span>
          )}
        </td>
        <td className="px-2 py-2.5 text-center text-secondary text-[10px]">{row.attachment_count}</td>
        <td className="px-2 py-2.5 text-right">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onPreview(); }}>
            <Eye className="h-3 w-3" />
          </Button>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-subtle/30">
          <td colSpan={10} className="px-4 py-3">
            <SubtaskDetailPanel row={row} />
          </td>
        </tr>
      )}
    </>
  );
}

function SubtaskDetailPanel({ row }: { row: SubtaskReportRow }) {
  return (
    <div className="space-y-4 animate-in slide-in-from-top-1 duration-150">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2">
        <StatCard icon={Layers} label="Parent Task" value={row.parent_task_title || "—"} />
        <StatCard icon={Calendar} label="Created" value={row.created_at ? formatDate(row.created_at) : "—"} />
        <StatCard icon={Calendar} label="Started" value={row.started_date ? formatDate(row.started_date) : "—"} />
        <StatCard icon={CheckCircle2} label="Completed" value={row.completed_date ? formatDate(row.completed_date) : "—"} />
        <StatCard icon={Calendar} label="Due" value={row.due_date ? formatDate(row.due_date) : "—"} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <StatCard icon={Clock} label="Duration" value={row.duration_days != null ? `${row.duration_days}d` : "—"} />
        <StatCard icon={Clock} label="Completion Time" value={row.completion_time != null ? `${row.completion_time}h` : "—"} />
        <StatCard icon={Paperclip} label="Attachments" value={String(row.attachment_count)} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiBlock label="Est. Hours" value={row.estimated_hours != null ? `${row.estimated_hours}h` : "—"} />
        <KpiBlock label="Duration" value={row.duration_days != null ? `${row.duration_days}d` : "—"} />
        <KpiBlock label="Completion" value={row.completion_time != null ? `${row.completion_time}h` : "—"} />
        <KpiBlock label="Efficiency" value={row.estimated_hours && row.completion_time ? `${Math.round((row.estimated_hours / row.completion_time) * 100)}%` : "—"} color={row.estimated_hours && row.completion_time ? (row.estimated_hours >= row.completion_time ? "text-semantic-success" : "text-semantic-warning") : undefined} />
      </div>

      {row.assignees.length > 0 && (
        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-tertiary mb-1.5">
            <User className="h-3 w-3 inline mr-1" />Assigned Users
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {row.assignees.map((a) => (
              <span key={a.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-subtle text-[10px] text-secondary">{a.name}</span>
            ))}
          </div>
        </div>
      )}

      {row.notes && (
        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-tertiary mb-1">Notes</h4>
          <p className="text-[11px] text-secondary leading-relaxed bg-subtle/50 p-2 rounded-md">{row.notes}</p>
        </div>
      )}

      {row.activity_history.length > 0 && (
        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-tertiary mb-1.5">
            <Activity className="h-3 w-3 inline mr-1" />Activity History
          </h4>
          <div className="space-y-1.5">
            {row.activity_history.map((a, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px]">
                <Activity className="h-3 w-3 text-tertiary mt-0.5 shrink-0" />
                <div>
                  <p className="text-secondary">{a.description}</p>
                  <p className="text-[10px] text-tertiary">{a.created_at ? formatDate(a.created_at) : ""}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-md bg-surface border border-default/50">
      <Icon className="h-3.5 w-3.5 text-tertiary shrink-0" />
      <div className="min-w-0 overflow-hidden">
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
