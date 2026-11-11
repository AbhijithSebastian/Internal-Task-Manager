import { useQuery } from "@tanstack/react-query";
import { reportsService } from "@/features/reports/services/reports";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";
import { ChartCard, Skeleton } from "@/design-system";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
];

const STATUS_COLORS: Record<string, string> = {
  Done: "var(--chart-2)",
  "In Progress": "var(--chart-1)",
  "In Review": "var(--chart-3)",
  Approved: "var(--chart-5)",
  "To Do": "var(--chart-neutral)",
  Backlog: "var(--chart-neutral-soft)",
  Blocked: "var(--chart-4)",
  Cancelled: "var(--chart-neutral)",
};

const AXIS_TICK = { fontSize: 9, fill: "var(--chart-axis)" };

function EmptyChart() {
  return (
    <div className="flex h-48 items-center justify-center text-xs text-tertiary">
      No data available
    </div>
  );
}

export default function ReportsAnalytics() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["reports-analytics"],
    queryFn: () => reportsService.getAnalytics(),
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border-default rounded-md border bg-surface p-4">
            <Skeleton className="mb-3 h-4 w-1/2" />
            <Skeleton className="h-48 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="border-default rounded-md border bg-surface p-6 text-center text-sm text-tertiary">
        Failed to load analytics. Try refreshing the page.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-tertiary">
        Auto-refreshes every 30 seconds. Data reflects current state across all projects.
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ChartCard title="Project Progress" subtitle="Completion % per project">
          {data.project_progress.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={data.project_progress}
                margin={{ top: 5, right: 5, left: -15, bottom: 0 }}
              >
                <XAxis
                  dataKey="name"
                  tick={AXIS_TICK}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                />
                <YAxis domain={[0, 100]} tick={AXIS_TICK} unit="%" />
                <Tooltip
                  formatter={(v?: unknown) => `${String(v)}%`}
                  contentStyle={{ fontSize: 11 }}
                />
                <Bar dataKey="progress" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        <ChartCard title="Task Completion" subtitle="Tasks grouped by status">
          {data.task_completion.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data.task_completion}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  label={({ payload, percent }) => {
                    const status = (payload as { status?: string } | undefined)?.status ?? "";
                    return `${status} ${((percent ?? 0) * 100).toFixed(0)}%`;
                  }}
                  labelLine={false}
                >
                  {data.task_completion.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={STATUS_COLORS[entry.status] || "var(--chart-neutral)"}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        <ChartCard title="Task Priority" subtitle="Priority distribution">
          {data.task_priority_distribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={data.task_priority_distribution}
                margin={{ top: 5, right: 5, left: -15, bottom: 0 }}
                layout="vertical"
              >
                <XAxis type="number" tick={AXIS_TICK} />
                <YAxis type="category" dataKey="priority" tick={AXIS_TICK} width={65} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="count" radius={[0, 3, 3, 0]}>
                  {data.task_priority_distribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        <ChartCard title="Employee Productivity" subtitle="Productivity score by employee">
          {data.employee_productivity.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={data.employee_productivity}
                margin={{ top: 5, right: 5, left: -15, bottom: 0 }}
              >
                <XAxis
                  dataKey="name"
                  tick={AXIS_TICK}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                />
                <YAxis domain={[0, 100]} tick={AXIS_TICK} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="productivity_score" fill="var(--chart-2)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        <ChartCard title="Workload Distribution" subtitle="Tasks per project">
          {data.workload_distribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={data.workload_distribution}
                margin={{ top: 5, right: 5, left: -15, bottom: 0 }}
              >
                <XAxis
                  dataKey="name"
                  tick={AXIS_TICK}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                />
                <YAxis tick={AXIS_TICK} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 9 }} />
                <Bar dataKey="Completed" stackId="a" fill="var(--chart-2)" />
                <Bar dataKey="Pending" stackId="a" fill="var(--chart-3)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        <ChartCard title="Time Tracking" subtitle="Estimated hours per project">
          {data.time_tracking.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={data.time_tracking}
                margin={{ top: 5, right: 5, left: -15, bottom: 0 }}
                layout="vertical"
              >
                <XAxis type="number" tick={AXIS_TICK} />
                <YAxis type="category" dataKey="name" tick={AXIS_TICK} width={80} />
                <Tooltip
                  formatter={(v?: unknown) => `${String(v)}h`}
                  contentStyle={{ fontSize: 11 }}
                />
                <Bar dataKey="estimated_hours" fill="var(--chart-5)" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        <ChartCard
          title="Completion Trends"
          subtitle="Tasks completed per month (6 months)"
          className="md:col-span-2 lg:col-span-3"
        >
          {data.completion_trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart
                data={data.completion_trends}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--chart-axis)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--chart-axis)" }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>
      </div>
    </div>
  );
}
