import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SkeletonKpiRow } from "@/components/ui/Skeleton";
import {
  TrendingUp, TrendingDown, Activity, CheckCircle2,
  AlertTriangle, BarChart3
} from "lucide-react";

export default function AnalyticsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => api.get("/analytics/summary").then((r) => r.data?.data || r.data || {}),
  });

  const { data: projectHealth } = useQuery({
    queryKey: ["analytics", "project-health"],
    queryFn: () => api.get("/analytics/project-health").then((r) => r.data?.data || r.data || []),
  });

  const { data: completionTrend } = useQuery({
    queryKey: ["analytics", "completion-trend"],
    queryFn: () => api.get("/analytics/completion-trend", { params: { days: 30 } }).then((r) => r.data?.data || r.data || []),
  });

  const s = (stats || {}) as Record<string, unknown>;

  const kpis = [
    { label: "Active Projects", value: String(s.active_projects ?? "—"), icon: Activity, trend: s.active_project_trend as number, color: "text-primary" },
    { label: "Total Tasks", value: String(s.total_tasks ?? "—"), icon: BarChart3, trend: s.task_trend as number, color: "text-semantic-info" },
    { label: "Completed This Week", value: String(s.completed_this_week ?? "—"), icon: CheckCircle2, trend: null, color: "text-semantic-success" },
    { label: "Overdue Tasks", value: String(s.overdue_tasks ?? "—"), icon: AlertTriangle, trend: null, color: "text-semantic-danger" },
  ];

  return (
    <div className="page-container py-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-primary">Analytics</h1>
      </div>

      {isLoading ? (
        <SkeletonKpiRow cards={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card key={kpi.label} className="p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-tertiary">
                  <Icon className={`h-3.5 w-3.5 ${kpi.color}`} /> {kpi.label}
                </div>
                <p className="text-xl font-bold text-primary">{kpi.value}</p>
                {kpi.trend != null && (
                  <div className={`flex items-center gap-1 text-xs ${kpi.trend >= 0 ? "text-semantic-success" : "text-semantic-danger"}`}>
                    {kpi.trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(kpi.trend).toFixed(1)}% from last month
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Project Health */}
      <div>
        <h2 className="text-sm font-semibold text-primary mb-3">Project Health</h2>
        {isLoading ? (
          <SkeletonKpiRow cards={3} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.isArray(projectHealth) && projectHealth.length > 0 ? projectHealth.map((p: Record<string, unknown>) => (
              <Card key={p.id as number} className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-primary">{p.name as string}</p>
                  <Badge variant={
                    p.health === "good" ? "success" : p.health === "at_risk" ? "warning" : "danger"
                  } size="sm">{p.health as string}</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-tertiary">Progress</span>
                    <span className="text-primary font-medium">{p.progress_percentage as number || 0}%</span>
                  </div>
                  <div className="h-1.5 bg-subtle rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${p.progress_percentage as number || 0}%` }} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-tertiary pt-1">
                    <div className="text-center"><p className="text-primary font-medium">{p.completed_tasks as number || 0}</p><p>Done</p></div>
                    <div className="text-center"><p className="text-primary font-medium">{p.in_progress_tasks as number || 0}</p><p>In Prog</p></div>
                    <div className="text-center"><p className="text-primary font-medium">{p.total_tasks as number || 0}</p><p>Total</p></div>
                  </div>
                </div>
              </Card>
            )) : (
              <p className="text-sm text-secondary col-span-3">No project health data available.</p>
            )}
          </div>
        )}
      </div>

      {/* Completion Trend */}
      <div>
        <h2 className="text-sm font-semibold text-primary mb-3">Completion Trend (Last 30 Days)</h2>
        <Card>
          {Array.isArray(completionTrend) && completionTrend.length > 0 ? (
            <div className="space-y-3">
              {completionTrend.map((d: Record<string, unknown>, i: number) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-xs text-tertiary w-16 shrink-0">{d.date as string}</span>
                  <div className="flex-1 h-6 bg-subtle rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${d.completion_rate as number || 0}%` }} />
                  </div>
                  <span className="text-xs text-primary font-medium w-10 text-right">{d.completed as number || 0}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-secondary">No trend data available.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
