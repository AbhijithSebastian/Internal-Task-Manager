import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { tasksService } from "@/features/tasks/services/tasks";
import { useAuth } from "@/store/auth";
import { Button } from "@/components/ui/Button";
import { FilterBar, type ViewMode } from "@/components/ui/FilterBar";
import { Table, type TableColumn } from "@/components/ui/Table";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { SkeletonKpiRow } from "@/components/ui/Skeleton";
import { TaskStatusBadge, TaskPriorityBadge } from "@/features/tasks/components/TaskStatusBadge";
import { TaskDetailDrawer } from "@/features/tasks/components/TaskDetailDrawer";
import { Plus, AlertTriangle, CheckSquare, TrendingUp } from "lucide-react";
import { formatDate } from "@/utils/formatters";
import type { Task } from "@/types";

const statusFilterOpts = [
  { value: "backlog", label: "Backlog" },
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review", label: "In Review" },
  { value: "done", label: "Done" },
  { value: "blocked", label: "Blocked" },
  { value: "cancelled", label: "Cancelled" },
];

const priorityFilterOpts = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const assigneeFilterOpts = [
  { value: "me", label: "Assigned to me" },
];

export default function TaskListPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [drawerTaskId, setDrawerTaskId] = useState<number | null>(null);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [priority, setPriority] = useState(searchParams.get("priority") || "");
  const [assignee, setAssignee] = useState(searchParams.get("assignee") || "");
  const [view, setView] = useState<ViewMode>("list");
  const [sortBy, setSortBy] = useState("due_date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedKeys, setSelectedKeys] = useState<Set<string | number>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ["tasks", page, search, status, priority, assignee, sortBy, sortDirection],
    queryFn: () => tasksService.list({
      page,
      search: search || undefined,
      status: status || undefined,
      priority: priority || undefined,
      assignee: assignee || undefined,
      sort_by: sortBy,
      sort_direction: sortDirection,
      per_page: 20,
    }),
  });

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDirection("asc");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setPriority("");
    setAssignee("");
    setPage(1);
    setSearchParams({}, { replace: true });
  };

  const activeChips = [
    ...(status ? [{ key: "status", label: `Status: ${status.replace("_", " ")}`, onRemove: () => { setStatus(""); setPage(1); } }] : []),
    ...(priority ? [{ key: "priority", label: `Priority: ${priority}`, onRemove: () => { setPriority(""); setPage(1); } }] : []),
    ...(assignee ? [{ key: "assignee", label: "Assigned to me", onRemove: () => { setAssignee(""); setPage(1); } }] : []),
    ...(search ? [{ key: "search", label: `Search: "${search}"`, onRemove: () => { setSearch(""); setPage(1); } }] : []),
  ];

  const columns: TableColumn<Task>[] = [
    {
      key: "title",
      label: "Task",
      sortable: true,
      render: (t) => (
        <div>
          <p className="font-medium text-primary truncate max-w-md">{t.title}</p>
          {t.project_name && (
            <p className="text-xs text-tertiary mt-0.5">{t.project_name}</p>
          )}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (t) => <TaskStatusBadge status={t.status} />,
    },
    {
      key: "priority",
      label: "Priority",
      render: (t) => <TaskPriorityBadge priority={t.priority} />,
    },
    {
      key: "assignee",
      label: "Assignee",
      render: (t) =>
        t.assignee ? (
          <div className="flex items-center gap-2">
            <Avatar name={t.assignee.name} size="sm" />
            <span className="text-sm text-secondary">{t.assignee.name}</span>
          </div>
        ) : (
          <span className="text-sm text-tertiary">Unassigned</span>
        ),
    },
    {
      key: "due_date",
      label: "Due",
      sortable: true,
      render: (t) => (
        <span className={t.due_date && new Date(t.due_date) < new Date() && t.status !== "done" ? "text-semantic-danger text-sm font-medium" : "text-sm text-secondary"}>
          {t.due_date ? formatDate(t.due_date) : "—"}
        </span>
      ),
    },
  ];

  const canCreate = hasPermission("task-create");
  const tasks = data?.items || [];
  const taskCounts = {
    total: data?.total || 0,
    overdue: tasks.filter((t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== "done").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    done_this_week: tasks.filter((t) => t.status === "done").length,
  };

  return (
    <div className="page-container py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary">Tasks</h1>
        </div>
        {canCreate && (
          <Button onClick={() => navigate("/work/tasks/new")}>
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        )}
      </div>

      {isLoading ? (
        <SkeletonKpiRow cards={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-tertiary">Total Tasks</p>
            <p className="text-hero font-bold text-primary">{taskCounts.total}</p>
          </Card>
          <Card className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-tertiary">
              <TrendingUp className="h-3.5 w-3.5" />
              In Progress
            </div>
            <p className="text-hero font-bold text-primary">{taskCounts.in_progress}</p>
          </Card>
          <Card className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-tertiary">
              <AlertTriangle className="h-3.5 w-3.5" />
              Overdue
            </div>
            <p className={taskCounts.overdue > 0 ? "text-hero font-bold text-semantic-danger" : "text-hero font-bold text-primary"}>
              {taskCounts.overdue}
            </p>
          </Card>
          <Card className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-tertiary">
              <CheckSquare className="h-3.5 w-3.5" />
              Completed
            </div>
            <p className="text-hero font-bold text-primary">{taskCounts.done_this_week}</p>
          </Card>
        </div>
      )}

      <FilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search tasks..."
        filters={[
          { key: "status", label: "All Statuses", options: statusFilterOpts, value: status, onChange: (v) => { setStatus(v); setPage(1); } },
          { key: "priority", label: "All Priorities", options: priorityFilterOpts, value: priority, onChange: (v) => { setPriority(v); setPage(1); } },
          { key: "assignee", label: "All Assignees", options: assigneeFilterOpts, value: assignee, onChange: (v) => { setAssignee(v); setPage(1); } },
        ]}
        view={view}
        availableViews={["list", "board", "calendar"]}
        onViewChange={setView}
        activeChips={activeChips.length > 0 ? activeChips : undefined}
        onClearAll={activeChips.length > 0 ? clearFilters : undefined}
      />

      {view === "list" && (
        <Table
          columns={columns}
          data={tasks}
          loading={isLoading}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSort={handleSort}
          onRowClick={(t) => setDrawerTaskId(t.id)}
          keyExtractor={(t) => t.id}
          selectedKeys={selectedKeys}
          onSelectChange={setSelectedKeys}
          page={page}
          totalPages={data?.total_pages}
          total={data?.total}
          onPageChange={setPage}
          exportable
          exportFilename="tasks"
        />
      )}

      {view === "board" && (
        <TaskBoardView tasks={tasks} loading={isLoading} onTaskClick={(id) => setDrawerTaskId(id)} />
      )}

      {view === "calendar" && (
        <TaskCalendarView tasks={tasks} loading={isLoading} onTaskClick={(id) => setDrawerTaskId(id)} />
      )}

      <TaskDetailDrawer
        taskId={drawerTaskId}
        onClose={() => setDrawerTaskId(null)}
      />
    </div>
  );
}

function TaskBoardView({ tasks, loading, onTaskClick }: { tasks: Task[]; loading: boolean; onTaskClick: (id: number) => void }) {
  const columns = ["backlog", "todo", "in_progress", "in_review", "done"];
  const columnLabels: Record<string, string> = {
    backlog: "Backlog", todo: "To Do", in_progress: "In Progress",
    in_review: "In Review", done: "Done",
  };
  const grouped = columns.map((col) => ({
    status: col,
    label: columnLabels[col],
    tasks: tasks.filter((t) => t.status === col),
  }));

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => (
          <div key={col} className="flex-1 min-w-[280px] space-y-3">
            <div className="h-6 w-24 bg-subtle skeleton-pulse rounded" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-surface border border-default shadow-card rounded-lg p-4 space-y-3">
                <div className="h-4 w-3/4 bg-subtle skeleton-pulse rounded" />
                <div className="h-3 w-1/2 bg-subtle skeleton-pulse rounded" />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {grouped.map((col) => (
        <div key={col.status} className="flex-1 min-w-[280px] space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-primary">{col.label}</h3>
            <span className="text-xs text-tertiary bg-subtle px-2 py-0.5 rounded-full">{col.tasks.length}</span>
          </div>
          <div className="space-y-2">
            {col.tasks.map((task) => (
              <button
                key={task.id}
                onClick={() => onTaskClick(task.id)}
                className="w-full text-left bg-surface border border-default shadow-card rounded-lg p-4 hover:shadow-elevated hover:border-hover transition-all duration-fast space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-primary truncate">{task.title}</p>
                  <TaskPriorityBadge priority={task.priority} />
                </div>
                <div className="flex items-center gap-2 text-xs text-tertiary">
                  {task.assignee && <span>{task.assignee.name}</span>}
                  {task.due_date && (
                    <>
                      <span>·</span>
                      <span className={new Date(task.due_date) < new Date() && task.status !== "done" ? "text-semantic-danger" : ""}>
                        {formatDate(task.due_date)}
                      </span>
                    </>
                  )}
                </div>
              </button>
            ))}
            {col.tasks.length === 0 && (
              <div className="bg-subtle/50 border border-dashed border-default rounded-lg p-4 text-center">
                <p className="text-xs text-tertiary">No tasks</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function TaskCalendarView({ tasks, loading, onTaskClick }: { tasks: Task[]; loading: boolean; onTaskClick: (id: number) => void }) {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const startDay = startOfMonth.getDay();
  const daysInMonth = endOfMonth.getDate();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const leadingBlanks = Array.from({ length: startDay }, (_, i) => i);

  const tasksByDate: Record<number, Task[]> = {};
  tasks.forEach((t) => {
    if (t.due_date) {
      const d = new Date(t.due_date);
      if (d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()) {
        const day = d.getDate();
        if (!tasksByDate[day]) tasksByDate[day] = [];
        tasksByDate[day].push(t);
      }
    }
  });

  if (loading) {
    return (
      <div className="bg-surface border border-default shadow-card rounded-lg p-4">
        <div className="grid grid-cols-7 gap-1">
          {dayNames.map((d) => (
            <div key={d} className="h-4 bg-subtle skeleton-pulse rounded m-1" />
          ))}
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-24 bg-subtle skeleton-pulse rounded m-1" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-default shadow-card rounded-lg overflow-hidden">
      <div className="grid grid-cols-7 border-b border-subtle">
        {dayNames.map((d) => (
          <div key={d} className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-tertiary text-center">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {leadingBlanks.map((i) => (
          <div key={`blank-${i}`} className="min-h-[100px] border-b border-r border-subtle bg-subtle/30" />
        ))}
        {days.map((day) => {
          const dayTasks = tasksByDate[day] || [];
          const isToday = day === today.getDate();
          return (
            <div
              key={day}
              className={`min-h-[100px] border-b border-r border-subtle p-1.5 ${
                isToday ? "bg-primary-soft/30" : ""
              }`}
            >
              <span
                className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium ${
                  isToday ? "bg-primary text-inverse" : "text-secondary"
                }`}
              >
                {day}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayTasks.slice(0, 3).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onTaskClick(t.id)}
                    className="w-full text-left text-xs px-1.5 py-0.5 rounded truncate bg-primary-soft text-primary hover:bg-primary-soft-hover transition-colors duration-fast"
                  >
                    {t.title}
                  </button>
                ))}
                {dayTasks.length > 3 && (
                  <p className="text-xs text-tertiary px-1">+{dayTasks.length - 3} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
