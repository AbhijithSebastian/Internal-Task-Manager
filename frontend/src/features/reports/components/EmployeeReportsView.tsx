import { useState } from "react";
import type { PaginatedResponse, EmployeeReportRow } from "../services/reports";
import { formatDate } from "@/utils/formatters";
import { StatCard } from "@/components/shared/StatCard";
import { KpiBlock } from "@/components/shared/KpiBlock";
import { getPageNumbers } from "@/components/ui/Pagination";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Eye, Users, Calendar, Activity, Briefcase, Award, TrendingUp, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  data: PaginatedResponse<EmployeeReportRow>;
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

const scoreColor = (score: number) => score >= 70 ? "text-semantic-success" : score >= 40 ? "text-semantic-warning" : "text-semantic-danger";

export function EmployeeReportsView({ data, sortBy, sortDir, onSort, page, onPageChange, onPreview }: Props) {
  const items = data.items as EmployeeReportRow[];
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  return (
    <div className="bg-surface border border-default shadow-card rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-subtle bg-subtle/50">
              <th className="w-6 px-2 py-2"></th>
              <SortHeader label="Employee" field="name" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortHeader label="Role" field="role" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortHeader label="Department" field="department" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <th className="px-2 py-2 text-left text-[10px] font-medium uppercase tracking-wider text-secondary whitespace-nowrap">Projects</th>
              <SortHeader label="Tasks" field="assigned_tasks" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortHeader label="Completed" field="completed_tasks" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortHeader label="Overdue" field="overdue_tasks" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortHeader label="Rate" field="completion_rate" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortHeader label="Score" field="productivity_score" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <th className="px-2 py-2 text-right w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle">
            {items.map((row) => (
              <EmployeeRow
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

function EmployeeRow({ row, isExpanded, onToggle, onPreview }: { row: EmployeeReportRow; isExpanded: boolean; onToggle: () => void; onPreview: () => void }) {
  const rateColor = row.completion_rate >= 80 ? "bg-semantic-success" : row.completion_rate >= 40 ? "bg-semantic-warning" : "bg-semantic-danger";

  return (
    <>
      <tr className="hover:bg-hover transition-colors cursor-pointer" onClick={onToggle}>
        <td className="px-2 py-2.5 text-tertiary text-[10px]">{isExpanded ? "▾" : "▸"}</td>
        <td className="px-2 py-2.5">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-primary-soft text-primary flex items-center justify-center text-[10px] font-semibold shrink-0">
              {row.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-primary text-xs truncate max-w-[140px]">{row.name}</p>
              <p className="text-[10px] text-tertiary truncate max-w-[140px]">{row.email}</p>
            </div>
          </div>
        </td>
        <td className="px-2 py-2.5">
          <Badge variant="info" size="sm">{row.role || "—"}</Badge>
        </td>
        <td className="px-2 py-2.5 text-secondary text-[10px]">{row.department || "—"}</td>
        <td className="px-2 py-2.5 text-secondary">{row.project_count}</td>
        <td className="px-2 py-2.5">
          <span className="text-primary font-medium">{row.assigned_tasks}</span>
        </td>
        <td className="px-2 py-2.5">
          <div className="flex items-center gap-1.5 min-w-[80px]">
            <div className="flex-1 h-1.5 bg-subtle rounded-full overflow-hidden max-w-[40px]">
              <div className={cn("h-full rounded-full transition-all", rateColor)} style={{ width: `${Math.min(100, Math.max(0, row.completion_rate))}%` }} />
            </div>
            <span className="text-[10px] text-secondary w-8">{row.completion_rate}%</span>
          </div>
        </td>
        <td className="px-2 py-2.5">
          <span className={cn("text-[10px]", row.overdue_tasks > 0 ? "text-semantic-danger font-medium" : "text-secondary")}>
            {row.overdue_tasks}
          </span>
        </td>
        <td className="px-2 py-2.5 text-secondary text-[10px]">{row.completion_rate}%</td>
        <td className="px-2 py-2.5">
          <span className={cn("text-xs font-bold", scoreColor(row.productivity_score))}>{row.productivity_score}</span>
        </td>
        <td className="px-2 py-2.5 text-right">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onPreview(); }}>
            <Eye className="h-3 w-3" />
          </Button>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-subtle/30">
          <td colSpan={11} className="px-4 py-3">
            <EmployeeDetailPanel row={row} />
          </td>
        </tr>
      )}
    </>
  );
}

function EmployeeDetailPanel({ row }: { row: EmployeeReportRow }) {
  return (
    <div className="space-y-4 animate-in slide-in-from-top-1 duration-150">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-full bg-primary-soft text-primary flex items-center justify-center text-sm font-bold">{row.name.charAt(0).toUpperCase()}</div>
        <div>
          <p className="text-sm font-bold text-primary">{row.name}</p>
          <p className="text-[10px] text-tertiary">{row.email} {row.designation ? `· ${row.designation}` : ""}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        <StatCard icon={Briefcase} label="Role" value={row.role || "—"} />
        <StatCard icon={Users} label="Department" value={row.department || "—"} />
        <StatCard icon={Award} label="Designation" value={row.designation || "—"} />
        <StatCard icon={Calendar} label="Projects" value={String(row.project_count)} />
        <StatCard icon={BarChart3} label="Employee ID" value={row.employee_id || "—"} />
        <StatCard icon={TrendingUp} label="Score" value={String(row.productivity_score)} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiBlock label="Tasks" value={row.assigned_tasks} sub={`${row.completed_tasks} done · ${row.pending_tasks} pending`} />
        <KpiBlock label="Subtasks" value={row.assigned_subtasks} sub={`${row.completed_subtasks} done`} />
        <KpiBlock label="Overdue" value={row.overdue_tasks} color="text-semantic-danger" />
        <KpiBlock label="Meetings" value={row.meeting_count} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiBlock label="Total Hours" value={`${row.total_hours}h`} />
        <KpiBlock label="Avg Completion" value={row.average_completion_time != null ? `${row.average_completion_time}h` : "—"} />
        <KpiBlock label="Completion Rate" value={`${row.completion_rate}%`} color={row.completion_rate >= 80 ? "text-semantic-success" : row.completion_rate >= 40 ? "text-semantic-warning" : "text-semantic-danger"} />
        <KpiBlock label="Productivity" value={String(row.productivity_score)} color={scoreColor(row.productivity_score)} />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-tertiary">Productivity Score</span>
          <span className={cn("text-lg font-bold", scoreColor(row.productivity_score))}>{row.productivity_score}</span>
          <span className="text-[10px] text-tertiary">/100</span>
        </div>
        <div className="h-2 bg-subtle rounded-full overflow-hidden">
          <div className={cn("h-full rounded-full transition-all", row.productivity_score >= 70 ? "bg-semantic-success" : row.productivity_score >= 40 ? "bg-semantic-warning" : "bg-semantic-danger")}
            style={{ width: `${Math.min(100, row.productivity_score)}%` }} />
        </div>
      </div>

      {row.recent_activity.length > 0 && (
        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-tertiary mb-1.5">
            <Activity className="h-3 w-3 inline mr-1" />Recent Activity
          </h4>
          <div className="space-y-1.5">
            {row.recent_activity.map((a, i) => (
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




