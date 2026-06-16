import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoading } from "@/components/shared/LoadingSpinner";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { formatRelative } from "@/utils/formatters";
import { Link } from "react-router-dom";
import {
  Users, FolderKanban, CheckSquare, TrendingUp,
  TrendingDown, Minus,
} from "lucide-react";
import { useAuth } from "@/store/auth";

interface DashboardData {
  stats: {
    total_users: number;
    active_users: number;
    total_projects: number;
    active_projects: number;
    total_tasks: number;
    pending_tasks: number;
    user_stats?: { total: number; active: number };
    project_stats?: { total: number; active: number };
    task_stats?: { total: number; pending: number };
  };
  current_projects: Array<{
    id: number; name: string; status: string; priority: string;
    deadline?: string; members_count?: number;
  }>;
  recent_activities: Array<{
    id: number; description: string; created_at: string;
    causer?: { id: number; name: string };
  }>;
  trends?: { users: number; projects: number; tasks: number };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: () => api.get("/dashboard").then((r) => r.data),
  });

  if (isLoading) return <PageLoading />;
  if (!data) return null;

  const stats = data.stats;
  const trends = data.trends ?? { users: 0, projects: 0, tasks: 0 };

  const statCards = [
    {
      label: "Users",
      value: stats.total_users,
      sub: `${stats.active_users} active`,
      icon: Users,
      trend: trends.users,
      href: "/users",
    },
    {
      label: "Projects",
      value: stats.total_projects,
      sub: `${stats.active_projects} active`,
      icon: FolderKanban,
      trend: trends.projects,
      href: "/projects",
    },
    {
      label: "Tasks",
      value: stats.total_tasks,
      sub: `${stats.pending_tasks} pending`,
      icon: CheckSquare,
      trend: trends.tasks,
      href: "/tasks",
    },
  ];

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name || user?.email}`}
        description="Here's what's happening with your projects and tasks."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          const TrendIcon = card.trend > 0 ? TrendingUp : card.trend < 0 ? TrendingDown : Minus;
          const trendColor = card.trend > 0 ? "text-green-600" : card.trend < 0 ? "text-red-600" : "text-muted-foreground";
          return (
            <Link key={card.label} to={card.href} className="rounded-lg border bg-card p-6 shadow-sm transition-colors hover:bg-muted/50">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="text-3xl font-bold">{card.value}</p>
                </div>
                <Icon className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{card.sub}</span>
                <span className={`inline-flex items-center gap-0.5 text-xs ${trendColor}`}>
                  <TrendIcon className="h-3 w-3" />
                  {Math.abs(card.trend)}%
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Current Projects</h2>
            <Link to="/projects" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          {data.current_projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects yet.</p>
          ) : (
            <ul className="space-y-3">
              {data.current_projects.slice(0, 5).map((project) => (
                <li key={project.id} className="flex items-center justify-between">
                  <div>
                    <Link to={`/projects/${project.id}`} className="text-sm font-medium hover:underline">
                      {project.name}
                    </Link>
                    {project.deadline && (
                      <p className="text-xs text-muted-foreground">Due {formatRelative(project.deadline)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={project.priority} />
                    <StatusBadge status={project.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Recent Activity</h2>
          {data.recent_activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity.</p>
          ) : (
            <ul className="space-y-3">
              {data.recent_activities.slice(0, 10).map((activity) => (
                <li key={activity.id} className="text-sm">
                  <span className="font-medium">{activity.causer?.name || "System"}</span>{" "}
                  {activity.description}
                  <p className="text-xs text-muted-foreground">{formatRelative(activity.created_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
