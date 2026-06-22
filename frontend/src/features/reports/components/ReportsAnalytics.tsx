import { useQuery } from "@tanstack/react-query";
import { reportsService } from "@/features/reports/services/reports";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

const COLORS = ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"];

const STATUS_COLORS: Record<string, string> = {
  "Done": "#10B981", "In Progress": "#2563EB", "In Review": "#F59E0B",
  "Approved": "#8B5CF6", "To Do": "#94A3B8", "Backlog": "#CBD5E1",
  "Blocked": "#EF4444", "Cancelled": "#94A3B8",
};

function ChartCard({ title, subtitle, className, children }: { title: string; subtitle?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("bg-surface border border-default rounded-lg p-4", className)}>
      <h3 className="text-sm font-semibold text-primary">{title}</h3>
      {subtitle && <p className="text-[10px] text-tertiary mt-0.5">{subtitle}</p>}
      <div className="mt-3">
        {children}
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-48 text-xs text-tertiary">
      No data available
    </div>
  );
}

export function ReportsAnalytics() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["reports-analytics"],
    queryFn: () => reportsService.getAnalytics(),
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-surface border border-default rounded-lg p-4">
            <Skeleton className="h-4 w-1/2 mb-3" />
            <Skeleton className="h-48 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-surface border border-default rounded-lg p-6 text-center text-sm text-tertiary">
        Failed to load analytics. Try refreshing the page.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-tertiary">Auto-refreshes every 30 seconds. Data reflects current state across all projects.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ChartCard title="Project Progress" subtitle="Completion % per project">
          {data.project_progress.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.project_progress} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} unit="%" />
                <Tooltip formatter={(v: any) => `${v}%`} contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="progress" fill="#2563EB" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        <ChartCard title="Task Completion" subtitle="Tasks grouped by status">
          {data.task_completion.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data.task_completion}
                  dataKey="count"
                  nameKey="status"
                  cx="50%" cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  label={({ payload, percent }: any) => `${payload.status} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {data.task_completion.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "#94A3B8"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        <ChartCard title="Task Priority" subtitle="Priority distribution">
          {data.task_priority_distribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.task_priority_distribution} margin={{ top: 5, right: 5, left: -15, bottom: 0 }} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 9 }} />
                <YAxis type="category" dataKey="priority" tick={{ fontSize: 9 }} width={65} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="count" radius={[0, 3, 3, 0]}>
                  {data.task_priority_distribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        <ChartCard title="Employee Productivity" subtitle="Productivity score by employee">
          {data.employee_productivity.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.employee_productivity} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 8 }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="productivity_score" fill="#10B981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        <ChartCard title="Workload Distribution" subtitle="Tasks per project">
          {data.workload_distribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.workload_distribution} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 8 }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 9 }} />
                <Bar dataKey="Completed" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Pending" stackId="a" fill="#F59E0B" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        <ChartCard title="Time Tracking" subtitle="Estimated hours per project">
          {data.time_tracking.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.time_tracking} margin={{ top: 5, right: 5, left: -15, bottom: 0 }} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 9 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 8 }} width={80} />
                <Tooltip formatter={(v: any) => `${v}h`} contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="estimated_hours" fill="#8B5CF6" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        <ChartCard title="Completion Trends" subtitle="Tasks completed per month (6 months)" className="md:col-span-2 lg:col-span-3">
          {data.completion_trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.completion_trends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="completed" stroke="#2563EB" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>
      </div>
    </div>
  );
}
