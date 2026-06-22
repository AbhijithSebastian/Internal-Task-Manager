import { useState } from "react";
import type { PaginatedResponse, ProjectReportRow } from "../services/reports";
import { formatDate } from "@/utils/formatters";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Eye, Users, Clock, CheckCircle2, FileText, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  data: PaginatedResponse<ProjectReportRow>;
  sortBy: string;
  sortDir: string;
  onSort: (key: string) => void;
  page: number;
  onPageChange: (page: number) => void;
  onPreview: (id: number) => void;
}

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

const statusBadge: Record<string, "success" | "warning" | "neutral" | "info" | "danger"> = {
  active: "success", on_hold: "warning", completed: "info", archived: "neutral",
};

const priorityBadge: Record<string, "success" | "warning" | "neutral" | "danger" | "info"> = {
  low: "neutral", medium: "info", high: "warning", urgent: "danger",
};

export function ProjectReportsView({ data, sortBy, sortDir, onSort, page, onPageChange, onPreview }: Props) {
  const items = data.items as ProjectReportRow[];
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  return (
    <div className="bg-surface border border-default shadow-card rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-subtle bg-subtle/50">
              <th className="w-6 px-2 py-2"></th>
              <SortHeader label="Project" field="name" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortHeader label="Status" field="status" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortHeader label="Priority" field="priority" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortHeader label="Progress" field="progress" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <th className="px-2 py-2 text-left text-[10px] font-medium uppercase tracking-wider text-secondary whitespace-nowrap">Team</th>
              <SortHeader label="Tasks" field="total_tasks" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortHeader label="Subtasks" field="total_subtasks" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortHeader label="Health" field="health_score" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortHeader label="Meetings" field="meeting_count" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <th className="px-2 py-2 text-right w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle">
            {items.map((row) => (
              <ProjectRow
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

function ProjectRow({ row, isExpanded, onToggle, onPreview }: { row: ProjectReportRow; isExpanded: boolean; onToggle: () => void; onPreview: () => void }) {
  const progressColor = row.progress >= 80 ? "bg-semantic-success" : row.progress >= 40 ? "bg-semantic-warning" : "bg-semantic-danger";
  const healthColor = row.health_score >= 70 ? "text-semantic-success" : row.health_score >= 40 ? "text-semantic-warning" : "text-semantic-danger";

  return (
    <>
      <tr className="hover:bg-hover transition-colors cursor-pointer" onClick={onToggle}>
        <td className="px-2 py-2.5 text-tertiary text-[10px]">{isExpanded ? "▾" : "▸"}</td>
        <td className="px-2 py-2.5">
          <div className="min-w-0">
            <p className="font-medium text-primary text-xs truncate max-w-[160px]">{row.name || "Untitled"}</p>
            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-tertiary">
              {row.pm && <span title="PM">{row.pm}</span>}
              {row.lead && <span title="Lead">{row.lead ? `· ${row.lead}` : ""}</span>}
            </div>
          </div>
        </td>
        <td className="px-2 py-2.5">
          <Badge variant={statusBadge[row.status] ?? "neutral"} size="sm">{row.status_label}</Badge>
        </td>
        <td className="px-2 py-2.5">
          <Badge variant={priorityBadge[row.priority] ?? "neutral"} size="sm">{row.priority_label}</Badge>
        </td>
        <td className="px-2 py-2.5">
          <div className="flex items-center gap-1.5 min-w-[80px]">
            <div className="flex-1 h-1.5 bg-subtle rounded-full overflow-hidden max-w-[50px]">
              <div className={cn("h-full rounded-full transition-all", progressColor)} style={{ width: `${Math.min(100, row.progress)}%` }} />
            </div>
            <span className="text-[10px] text-tertiary w-8 text-right">{row.progress}%</span>
          </div>
        </td>
        <td className="px-2 py-2.5">
          <div className="flex items-center gap-1 text-secondary text-[10px]">
            <Users className="h-3 w-3 text-tertiary" />
            <span>{row.team_members.length + row.developers.length + row.team_leads.length} members</span>
          </div>
        </td>
        <td className="px-2 py-2.5 text-secondary">
          <span className="text-primary font-medium">{row.completed_tasks}</span>/{row.total_tasks}
        </td>
        <td className="px-2 py-2.5 text-secondary">
          <span className="text-primary font-medium">{row.completed_subtasks}</span>/{row.total_subtasks}
        </td>
        <td className="px-2 py-2.5">
          <span className={cn("text-xs font-medium", healthColor)}>{row.health_score}</span>
        </td>
        <td className="px-2 py-2.5 text-secondary">{row.meeting_count}</td>
        <td className="px-2 py-2.5 text-right">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onPreview(); }}>
            <Eye className="h-3 w-3" />
          </Button>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-subtle/30">
          <td colSpan={11} className="px-4 py-3">
            <ProjectDetailPanel row={row} />
          </td>
        </tr>
      )}
    </>
  );
}

function ProjectDetailPanel({ row }: { row: ProjectReportRow }) {
  return (
    <div className="space-y-4 animate-in slide-in-from-top-1 duration-150">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard icon={Calendar} label="Start Date" value={row.start_date ? formatDate(row.start_date) : "—"} />
        <StatCard icon={Calendar} label="End Date" value={row.end_date ? formatDate(row.end_date) : "—"} />
        <StatCard icon={Clock} label="Planned Hours" value={String(row.planned_hours)} />
        <StatCard icon={Clock} label="Actual Hours" value={row.actual_hours != null ? String(row.actual_hours) : "—"} />
        <StatCard icon={CheckCircle2} label="Completion" value={row.completion_date ? formatDate(row.completion_date) : "—"} />
        <StatCard icon={FileText} label="Attachments" value={String(row.attachment_count)} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {row.team_leads.length > 0 && <RoleGroup title="Team Leads" members={row.team_leads} />}
        {row.designers.length > 0 && <RoleGroup title="Designers" members={row.designers} />}
        {row.developers.length > 0 && <RoleGroup title="Developers" members={row.developers} />}
        {row.qa_members.length > 0 && <RoleGroup title="QA Members" members={row.qa_members} />}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiBlock label="Total Tasks" value={row.total_tasks} sub={`${row.completed_tasks} done · ${row.pending_tasks} pending`} />
        <KpiBlock label="Total Subtasks" value={row.total_subtasks} sub={`${row.completed_subtasks} done`} />
        <KpiBlock label="Meetings" value={row.meeting_count} />
        <KpiBlock label="Health Score" value={row.health_score} sub={`${row.blocked_count} blocked · ${row.overdue_count} overdue`} color={row.health_score >= 70 ? "text-semantic-success" : row.health_score >= 40 ? "text-semantic-warning" : "text-semantic-danger"} />
      </div>

      {row.team_members.length > 0 && (
        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-tertiary mb-1.5">Other Members</h4>
          <div className="flex flex-wrap gap-1.5">
            {row.team_members.map((m) => (
              <span key={m.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-subtle text-[10px] text-secondary">{m.name} <span className="text-tertiary">({m.role})</span></span>
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
      <div className="min-w-0">
        <p className="text-[10px] text-tertiary">{label}</p>
        <p className="text-xs font-medium text-primary truncate">{value}</p>
      </div>
    </div>
  );
}

function RoleGroup({ title, members }: { title: string; members: { name: string; role: string }[] }) {
  return (
    <div className="p-2 rounded-md bg-surface border border-default/50">
      <p className="text-[10px] text-tertiary mb-1">{title}</p>
      <div className="flex flex-wrap gap-1">
        {members.map((m, i) => (
          <span key={i} className="text-[10px] text-primary font-medium">{m.name}{i < members.length - 1 ? "," : ""}</span>
        ))}
      </div>
    </div>
  );
}

function KpiBlock({ label, value, sub, color }: { label: string; value: number; sub?: string; color?: string }) {
  return (
    <div className="p-2 rounded-md bg-surface border border-default/50">
      <p className="text-[10px] text-tertiary">{label}</p>
      <p className={cn("text-base font-bold text-primary", color)}>{value}</p>
      {sub && <p className="text-[10px] text-tertiary mt-0.5">{sub}</p>}
    </div>
  );
}

function getPageNumbers(current: number, total: number): (number | "..." )[] {
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
