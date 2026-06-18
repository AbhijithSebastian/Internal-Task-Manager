import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useAuth } from "@/store/auth";
import { useEntityDrawer } from "@/hooks/useEntityDrawer";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { SkeletonKpiRow, SkeletonCard } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { useNavigate } from "react-router-dom";
import { formatRelative } from "@/utils/formatters";
import {
  CheckSquare, Clock, AlertTriangle, TrendingUp,
  ArrowRight, Video, Plus,
} from "lucide-react";

interface DashboardData {
  my_tasks: Array<{
    id: number; title: string; status: string; priority: string;
    due_date?: string; project_name?: string;
    assignee?: { id: number; name: string };
  }>;
  task_counts: { total: number; due_today: number; overdue: number; completed_this_week: number; };
  upcoming_meetings: Array<{
    id: number; title: string; meeting_date: string; location?: string;
  }>;
  recent_activity: Array<{
    id: number; description: string; created_at: string;
    causer?: { id: number; name: string };
  }>;
}

const statusColor = (s: string) => {
  if (s === "done" || s === "approved") return "success";
  if (s === "in_progress") return "warning";
  if (s === "overdue" || s === "blocked") return "danger";
  if (s === "in_review") return "info";
  return "neutral";
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { openDrawer } = useEntityDrawer();

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard", "employee"],
    queryFn: () => api.get("/dashboard/employee").then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="page-container py-6 space-y-6">
        <SkeletonKpiRow cards={4} />
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-5">
            <SkeletonCard />
          </div>
          <div className="space-y-5">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  const c = data?.task_counts || { total: 0, due_today: 0, overdue: 0, completed_this_week: 0 };
  const completionRate = c.total > 0 ? Math.round((c.completed_this_week / c.total) * 100) : 0;
  const overdueRate = c.total > 0 ? Math.round((c.overdue / c.total) * 100) : 0;

  return (
    <div className="page-container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary">
            Welcome back, {user?.name?.split(" ")[0] || "there"}
          </h1>
          <p className="text-sm text-tertiary mt-0.5">
            {c.due_today > 0
              ? `You have ${c.due_today} task${c.due_today > 1 ? "s" : ""} due today.`
              : c.overdue > 0
              ? `${c.overdue} task${c.overdue > 1 ? "s" : ""} overdue.`
              : "All caught up."}
          </p>
        </div>
        <Button size="sm" onClick={() => navigate("/work/tasks/new")}>
          <Plus className="h-3.5 w-3.5" /> New Task
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-3.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-tertiary font-medium uppercase tracking-wider">My Tasks</span>
            <CheckSquare className="h-3.5 w-3.5 text-tertiary" />
          </div>
          <p className="text-xl font-bold text-primary">{c.total}</p>
        </Card>
        <Card className="p-3.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-tertiary font-medium uppercase tracking-wider">Due Today</span>
            <Clock className="h-3.5 w-3.5 text-tertiary" />
          </div>
          <p className="text-xl font-bold text-primary">{c.due_today}</p>
        </Card>
        <Card className="p-3.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-tertiary font-medium uppercase tracking-wider">Overdue</span>
            <AlertTriangle className="h-3.5 w-3.5 text-tertiary" />
          </div>
          <p className={`text-xl font-bold ${c.overdue > 0 ? "text-semantic-danger" : "text-primary"}`}>
            {c.overdue}
          </p>
          {overdueRate > 0 && <p className="text-xs text-semantic-danger">{overdueRate}% overdue rate</p>}
        </Card>
        <Card className="p-3.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-tertiary font-medium uppercase tracking-wider">Completed</span>
            <TrendingUp className="h-3.5 w-3.5 text-tertiary" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-bold text-primary">{c.completed_this_week}</p>
            <span className="text-xs text-tertiary">this week</span>
          </div>
          <div className="h-1.5 bg-subtle rounded-full overflow-hidden">
            <div className="h-full bg-semantic-success rounded-full" style={{ width: `${completionRate}%`}} />
          </div>
        </Card>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-5 lg:grid-cols-3">

        {/* Left: Tasks */}
        <div className="lg:col-span-2 space-y-5">

          {/* My Tasks List */}
          <Card className="p-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-subtle">
              <h2 className="text-sm font-semibold text-primary">My Tasks</h2>
              <button onClick={() => navigate("/work/tasks")} className="text-xs text-link hover:underline flex items-center gap-0.5">
                View all <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            {data?.my_tasks && data.my_tasks.length > 0 ? (
              <div className="divide-y divide-subtle">
                {data.my_tasks.slice(0, 5).map((task) => (
                  <button key={task.id} onClick={() => openDrawer("task", task.id)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-hover transition-colors duration-fast"
                  >
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-sm text-primary truncate">{task.title}</p>
                      <p className="text-xs text-tertiary mt-0.5">
                        {task.project_name && <>{task.project_name} · </>}
                        {task.due_date ? `Due ${formatRelative(task.due_date)}` : "No due date"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant={statusColor(task.status)} size="sm" dot>{task.status.replace("_", " ")}</Badge>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-10 text-center">
                <CheckSquare className="h-8 w-8 mx-auto text-tertiary mb-2" />
                <p className="text-sm text-tertiary">No tasks assigned yet</p>
                <Button size="sm" variant="ghost" className="mt-3" onClick={() => navigate("/work/tasks/new")}>
                  <Plus className="h-3.5 w-3.5" /> Create your first task
                </Button>
              </div>
            )}
            <div className="px-4 py-2.5 border-t border-subtle bg-subtle/30">
              <Button variant="ghost" size="sm" className="w-full text-link" onClick={() => navigate("/work/tasks/new")}>
                <Plus className="h-3.5 w-3.5" /> Add Task
              </Button>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-subtle">
              <h2 className="text-sm font-semibold text-primary">Recent Activity</h2>
            </div>
            {data?.recent_activity && data.recent_activity.length > 0 ? (
              <div className="divide-y divide-subtle">
                {data.recent_activity.slice(0, 6).map((a) => (
                  <div key={a.id} className="px-4 py-2.5 flex items-start gap-2.5">
                    <Avatar name={a.causer?.name || "S"} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-secondary leading-snug">
                        <span className="font-medium text-primary">{a.causer?.name || "System"}</span>{" "}
                        {a.description}
                      </p>
                      <p className="text-xs text-tertiary mt-0.5">{formatRelative(a.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-10 text-center">
                <p className="text-sm text-tertiary">No activity yet</p>
              </div>
            )}
          </Card>
        </div>

        {/* Right: Meetings + Quick Actions */}
        <div className="space-y-5">

          {/* Upcoming Meetings */}
          <Card className="p-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-subtle">
              <h2 className="text-sm font-semibold text-primary">Upcoming</h2>
              <button onClick={() => navigate("/work/meetings")} className="text-xs text-link hover:underline flex items-center gap-0.5">
                View all <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            {data?.upcoming_meetings && data.upcoming_meetings.length > 0 ? (
              <div className="divide-y divide-subtle">
                {data.upcoming_meetings.slice(0, 4).map((m) => (
                  <button key={m.id} onClick={() => openDrawer("meeting", m.id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-hover transition-colors"
                  >
                    <div className="h-8 w-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
                      <Video className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-primary truncate">{m.title}</p>
                      <p className="text-xs text-tertiary">{formatRelative(m.meeting_date)}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center">
                <Video className="h-7 w-7 mx-auto text-tertiary mb-1.5" />
                <p className="text-sm text-tertiary">No meetings</p>
              </div>
            )}
          </Card>

          {/* Quick Actions */}
          <Card>
            <h2 className="text-sm font-semibold text-primary mb-3">Quick Actions</h2>
            <div className="space-y-1.5">
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => navigate("/work/tasks/new")}>
                <Plus className="h-3.5 w-3.5" /> Create Task
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => navigate("/work/projects/new")}>
                <Plus className="h-3.5 w-3.5" /> New Project
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => navigate("/work/meetings/new")}>
                <Plus className="h-3.5 w-3.5" /> Schedule Meeting
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => navigate("/work/announcements/new")}>
                <Plus className="h-3.5 w-3.5" /> Post Announcement
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
