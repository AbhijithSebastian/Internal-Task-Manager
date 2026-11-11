import { useAuth } from "@/store/auth";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { openDrawer } from "@/hooks/useDrawer";
import { useNavigate } from "react-router-dom";
import type { DashboardStats } from "@/types";
import { Avatar, Badge, Button, Card, Skeleton } from "@/design-system";
import { formatRelative } from "@/utils/formatters";
import { getPriorityVariant } from "@/utils/badgeVariants";
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Plus,
  Calendar,
  Megaphone,
  Activity,
  Building2,
  ListChecks,
} from "lucide-react";

interface DashboardActivity {
  id: number;
  description: string;
  created_at: string;
  causer?: {
    id: number;
    name: string;
    avatar_url?: string;
  };
}

interface DashboardTask {
  id: number;
  title: string;
  status: string;
  priority: string;
  due_date?: string;
  project_name?: string;
}

interface DashboardMeeting {
  id: number;
  title: string;
  meeting_date: string;
  organizer?: {
    id: number;
    name: string;
    avatar_url?: string;
  };
}

interface DashboardAnnouncement {
  id: number;
  title: string;
  priority: string;
  published_at?: string;
}

function TrendIndicator({ value }: { value: number }) {
  if (value > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
        <TrendingUp className="h-3.5 w-3.5" />
        +{value}%
      </span>
    );
  }
  if (value < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-danger">
        <TrendingDown className="h-3.5 w-3.5" />
        {value}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-grey-500">
      <TrendingUp className="h-3.5 w-3.5" />
      0%
    </span>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard", "stats"],
    queryFn: () => api.get("/dashboard/stats").then((r) => r.data),
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery<DashboardActivity[]>({
    queryKey: ["dashboard", "activities"],
    queryFn: () =>
      api.get("/dashboard/activities").then((r) => r.data?.data ?? r.data?.items ?? r.data ?? []),
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery<DashboardTask[]>({
    queryKey: ["tasks", "dashboard", user?.id],
    queryFn: () =>
      api
        .get("/tasks", {
          params: {
            assignee_id: user?.id,
            status: "todo,in_progress,in_review",
            per_page: 10,
          },
        })
        .then((r) => r.data?.data ?? r.data?.items ?? r.data ?? []),
    enabled: !!user?.id,
  });

  const { data: recentItems } = useQuery<DashboardTask[]>({
    queryKey: ["tasks", "recent", user?.id],
    queryFn: () =>
      api
        .get("/tasks", {
          params: {
            assignee_id: user?.id,
            per_page: 3,
            sort_by: "updated_at",
            sort_direction: "desc",
          },
        })
        .then((r) => r.data?.data ?? r.data?.items ?? r.data ?? []),
    enabled: !!user?.id,
  });

  const { data: meetingsData, isLoading: meetingsLoading } = useQuery<DashboardMeeting[]>({
    queryKey: ["meetings", "upcoming"],
    queryFn: () =>
      api
        .get("/meetings", {
          params: { per_page: 5, upcoming: true },
        })
        .then((r) => r.data?.data ?? r.data?.items ?? r.data ?? []),
  });

  const { data: announcementsData, isLoading: announcementsLoading } = useQuery<
    DashboardAnnouncement[]
  >({
    queryKey: ["announcements", "recent"],
    queryFn: () =>
      api
        .get("/announcements", {
          params: { per_page: 5, status: "published" },
        })
        .then((r) => r.data?.data ?? r.data?.items ?? r.data ?? []),
  });

  const { data: overdueCount } = useQuery<number>({
    queryKey: ["tasks", "overdue", user?.id],
    queryFn: () =>
      api
        .get("/tasks", {
          params: { assignee_id: user?.id, overdue: true, per_page: 1 },
        })
        .then((r) => {
          const d = r.data;
          return d.meta?.total ?? d.total ?? (Array.isArray(d) ? d.length : (d.data?.length ?? 0));
        }),
    enabled: !!user?.id,
  });

  const isLoading =
    statsLoading || activitiesLoading || tasksLoading || meetingsLoading || announcementsLoading;

  if (isLoading) {
    return (
      <div className="page-container space-y-5 py-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <Skeleton variant="text" className="h-3 w-20" />
                <Skeleton variant="rect" className="h-4 w-4 rounded" />
              </div>
              <Skeleton variant="text" className="h-8 w-16" />
              <Skeleton variant="text" className="h-3 w-24" />
            </Card>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card className="overflow-hidden p-0">
              <div className="flex items-center justify-between border-b border-subtle px-4 py-3">
                <Skeleton variant="text" className="h-4 w-24" />
                <Skeleton variant="text" className="h-3 w-16" />
              </div>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <Skeleton variant="rect" className="h-4 w-4 shrink-0 rounded" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <Skeleton variant="text" className="h-3.5 w-3/4" />
                    <Skeleton variant="text" className="h-3 w-1/2" />
                  </div>
                  <Skeleton variant="text" className="h-5 w-16 shrink-0 rounded-full" />
                </div>
              ))}
            </Card>
            <Card className="overflow-hidden p-0">
              <div className="border-b border-subtle px-4 py-3">
                <Skeleton variant="text" className="h-4 w-24" />
              </div>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                  <Skeleton variant="circle" className="h-6 w-6 shrink-0" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <Skeleton variant="text" className="h-3 w-3/4" />
                    <Skeleton variant="text" className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </Card>
          </div>
          <div className="space-y-4">
            <Card className="overflow-hidden p-0">
              <div className="flex items-center justify-between border-b border-subtle px-4 py-3">
                <Skeleton variant="text" className="h-4 w-24" />
                <Skeleton variant="text" className="h-3 w-16" />
              </div>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <Skeleton variant="rect" className="h-8 w-8 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <Skeleton variant="text" className="h-3 w-3/4" />
                    <Skeleton variant="text" className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </Card>
            <Card className="overflow-hidden p-0">
              <div className="border-b border-subtle px-4 py-3">
                <Skeleton variant="text" className="h-4 w-24" />
              </div>
              <div className="divide-y divide-subtle">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-1 px-4 py-2.5">
                    <Skeleton variant="text" className="h-3 w-3/4" />
                    <div className="flex items-center gap-2">
                      <Skeleton variant="text" className="h-3 w-16" />
                      <Skeleton variant="text" className="h-4 w-12 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <Skeleton variant="text" className="mb-3 h-4 w-24" />
              <div className="space-y-1.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} variant="rect" className="h-8 w-full rounded-md" />
                ))}
              </div>
            </Card>
            <Card>
              <Skeleton variant="text" className="mb-3 h-4 w-24" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Skeleton variant="text" className="h-3 w-2/3" />
                      <Skeleton variant="text" className="h-3 w-8" />
                    </div>
                    <Skeleton variant="rect" className="h-2 w-full rounded-full" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const tasks = Array.isArray(tasksData) ? tasksData : [];
  const recentList = Array.isArray(recentItems) ? recentItems : [];
  const activitiesList = Array.isArray(activities) ? activities : [];
  const meetings = Array.isArray(meetingsData) ? meetingsData : [];
  const announcements = Array.isArray(announcementsData) ? announcementsData : [];

  const kpis = {
    active_projects: stats?.active_projects ?? 0,
    tasks_due_this_week: stats?.tasks_due_this_week ?? 0,
    pending_reviews: stats?.pending_reviews ?? 0,
    overdue_tasks: overdueCount ?? 0,
  };

  const trends = stats?.trends ?? {
    active_projects: 0,
    tasks_due_this_week: 0,
    pending_reviews: 0,
  };

  return (
    <div className="page-container space-y-5 py-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary">
            Welcome back, {user?.name?.split(" ")[0] || "there"}
          </h1>
          <p className="mt-0.5 text-sm text-tertiary">{today}</p>
        </div>
        <Button size="sm" onClick={() => navigate("/work/tasks/new")}>
          <Plus className="h-3.5 w-3.5" /> New Task
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="space-y-2 p-4.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-grey-500">
              Active Projects
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight text-grey-900">{kpis.active_projects}</p>
          <TrendIndicator value={trends.active_projects} />
        </Card>

        <Card className="space-y-2 p-4.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-grey-500">
              Tasks Due This Week
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning-soft text-warning">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight text-grey-900">{kpis.tasks_due_this_week}</p>
          <TrendIndicator value={trends.tasks_due_this_week} />
        </Card>

        <Card className="space-y-2 p-4.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-grey-500">
              Pending Reviews
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
              <ListChecks className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight text-grey-900">{kpis.pending_reviews}</p>
          <TrendIndicator value={trends.pending_reviews} />
        </Card>

        <Card className="space-y-2 p-4.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-grey-500">
              Overdue Tasks
            </span>
            <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${kpis.overdue_tasks > 0 ? "bg-danger-soft text-danger" : "bg-grey-100 text-grey-600"}`}>
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p
            className={`text-2xl font-bold tracking-tight ${
              kpis.overdue_tasks > 0 ? "text-danger" : "text-grey-900"
            }`}
          >
            {kpis.overdue_tasks}
          </p>
          {kpis.overdue_tasks > 0 ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-danger">
              <TrendingDown className="h-3.5 w-3.5" />
              Needs attention
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
              <CheckSquare className="h-3.5 w-3.5" />
              All on track
            </span>
          )}
        </Card>
      </div>

      {/* Continue Working */}
      {recentList.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-subtle px-4 py-3">
            <h2 className="text-sm font-semibold text-primary">Continue Working</h2>
            <Clock className="h-3.5 w-3.5 text-tertiary" />
          </div>
          <div className="divide-y divide-subtle">
            {recentList.map((task) => (
              <button
                key={task.id}
                onClick={() => openDrawer("task", task.id)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors duration-fast hover:bg-hover"
              >
                <span className="border-default flex h-4 w-4 shrink-0 items-center justify-center rounded border bg-surface">
                  {task.status === "done" || task.status === "approved" ? (
                    <CheckSquare className="h-3 w-3 text-semantic-success" />
                  ) : null}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-primary">{task.title}</p>
                  <p className="mt-0.5 text-xs text-tertiary">
                    {task.project_name || "No project"}
                  </p>
                </div>
                <Badge variant={getPriorityVariant(task.priority)} size="sm" dot>
                  {task.priority}
                </Badge>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Main grid */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* My Tasks Widget */}
        <Card className="overflow-hidden p-0 lg:col-span-1">
          <div className="flex items-center justify-between border-b border-subtle px-4 py-3">
            <h2 className="text-sm font-semibold text-primary">My Tasks</h2>
            <button
              onClick={() => navigate("/work/tasks")}
              className="flex items-center gap-0.5 text-xs text-link hover:underline"
            >
              View all
            </button>
          </div>
          {tasks.length > 0 ? (
            <div className="divide-y divide-subtle">
              {tasks.slice(0, 10).map((task) => (
                <button
                  key={task.id}
                  onClick={() => openDrawer("task", task.id)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors duration-fast hover:bg-hover"
                >
                  <span className="border-default flex h-4 w-4 shrink-0 items-center justify-center rounded border bg-surface">
                    {task.status === "done" || task.status === "approved" ? (
                      <CheckSquare className="h-3 w-3 text-semantic-success" />
                    ) : null}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-primary">{task.title}</p>
                    <p className="mt-0.5 text-xs text-tertiary">
                      {task.project_name && <>{task.project_name} &middot; </>}
                      {task.due_date ? `Due ${formatRelative(task.due_date)}` : "No due date"}
                    </p>
                  </div>
                  <Badge variant={getPriorityVariant(task.priority)} size="sm" dot>
                    {task.priority}
                  </Badge>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-10 text-center">
              <CheckSquare className="mx-auto mb-2 h-8 w-8 text-tertiary" />
              <p className="text-sm text-tertiary">No tasks assigned yet</p>
              <Button
                size="sm"
                variant="ghost"
                className="mt-3"
                onClick={() => navigate("/work/tasks/new")}
              >
                <Plus className="h-3.5 w-3.5" /> Create your first task
              </Button>
            </div>
          )}
          {tasks.length > 0 && (
            <div className="bg-subtle/30 border-t border-subtle px-4 py-2.5">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center text-link"
                onClick={() => navigate("/work/tasks/new")}
              >
                <Plus className="h-3.5 w-3.5" /> Add Task
              </Button>
            </div>
          )}
        </Card>

        {/* Right column: Upcoming Meetings & Announcements */}
        <div className="space-y-4 lg:col-span-1">
          {/* Upcoming Meetings */}
          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-subtle px-4 py-3">
              <h2 className="text-sm font-semibold text-primary">Upcoming Meetings</h2>
              <button
                onClick={() => navigate("/work/meetings")}
                className="flex items-center gap-0.5 text-xs text-link hover:underline"
              >
                View all
              </button>
            </div>
            {meetings.length > 0 ? (
              <div className="divide-y divide-subtle">
                {meetings.slice(0, 5).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => openDrawer("meeting", m.id)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-hover"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                      <Calendar className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-primary">{m.title}</p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        {m.organizer && (
                          <Avatar name={m.organizer.name} size="sm" src={m.organizer.avatar_url} />
                        )}
                        <span className="text-xs text-tertiary">
                          {m.meeting_date ? formatRelative(m.meeting_date) : ""}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center">
                <Calendar className="mx-auto mb-1.5 h-7 w-7 text-tertiary" />
                <p className="text-sm text-tertiary">No upcoming meetings</p>
              </div>
            )}
          </Card>

          {/* Recent Announcements */}
          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-subtle px-4 py-3">
              <h2 className="text-sm font-semibold text-primary">Announcements</h2>
              <button
                onClick={() => navigate("/work/announcements")}
                className="flex items-center gap-0.5 text-xs text-link hover:underline"
              >
                View all
              </button>
            </div>
            {announcements.length > 0 ? (
              <div className="divide-y divide-subtle">
                {announcements.slice(0, 5).map((a) => (
                  <button
                    key={a.id}
                    onClick={() => openDrawer("announcement", a.id)}
                    className="flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-hover"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-semantic-info-soft text-semantic-info">
                      <Megaphone className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-primary">{a.title}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="text-xs text-tertiary">
                          {a.published_at ? formatRelative(a.published_at) : ""}
                        </span>
                        <Badge variant={getPriorityVariant(a.priority)} size="sm">
                          {a.priority}
                        </Badge>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center">
                <Megaphone className="mx-auto mb-1.5 h-7 w-7 text-tertiary" />
                <p className="text-sm text-tertiary">No announcements</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Recent Activity - Full Width */}
      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-subtle px-4 py-3">
          <h2 className="text-sm font-semibold text-primary">Recent Activity</h2>
          <Activity className="h-3.5 w-3.5 text-tertiary" />
        </div>
        {activitiesList.length > 0 ? (
          <div className="divide-y divide-subtle">
            {activitiesList.slice(0, 10).map((a) => (
              <div key={a.id} className="flex items-start gap-2.5 px-4 py-2.5">
                <Avatar name={a.causer?.name || "S"} size="sm" src={a.causer?.avatar_url} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug text-secondary">
                    {a.causer?.name && (
                      <span className="font-medium text-primary">{a.causer.name} </span>
                    )}
                    {a.description}
                  </p>
                  <p className="mt-0.5 text-xs text-tertiary">{formatRelative(a.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-10 text-center">
            <Activity className="mx-auto mb-2 h-8 w-8 text-tertiary" />
            <p className="text-sm text-tertiary">No activity yet</p>
          </div>
        )}
      </Card>
    </div>
  );
}
