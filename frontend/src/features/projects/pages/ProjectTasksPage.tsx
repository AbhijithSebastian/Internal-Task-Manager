import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProjectTasks } from "@/features/projects/hooks/useProject";
import { FilterBar } from "@/components/ui/FilterBar";
import { Table, type TableColumn } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { openDrawer } from "@/hooks/useDrawer";
import { Plus, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/utils/formatters";
import type { Task } from "@/types";

export default function ProjectTasksPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { data: tasksData, isLoading } = useProjectTasks(projectId);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const tasks = (tasksData || []).filter((t) => {
    if (statusFilter && t.status !== statusFilter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const priorityConfig: Record<string, { variant: "success" | "warning" | "danger" | "neutral"; label: string }> = {
    low: { variant: "neutral", label: "Low" },
    medium: { variant: "warning", label: "Medium" },
    high: { variant: "danger", label: "High" },
    urgent: { variant: "danger", label: "Urgent" },
  };

  const columns: TableColumn<Task>[] = [
    { key: "title", label: "Task", render: (t) => <span className="text-sm text-primary">{t.title}</span> },
    { key: "status", label: "Status", render: (t) => (
      <Badge variant={t.status === "done" ? "success" : t.status === "blocked" ? "danger" : t.status === "in_progress" ? "warning" : "neutral"} size="sm">{t.status_label || t.status}</Badge>
    )},
    { key: "priority", label: "Priority", render: (t) => (
      <Badge variant={priorityConfig[t.priority]?.variant || "neutral"} size="sm">{priorityConfig[t.priority]?.label || t.priority}</Badge>
    )},
    { key: "assignee", label: "Assignee", render: (t) => t.assignee ? (
      <div className="flex items-center gap-1.5"><Avatar name={t.assignee.name} size="sm" /><span className="text-xs text-secondary">{t.assignee.name}</span></div>
    ) : <span className="text-xs text-tertiary">—</span>},
    { key: "due_date", label: "Due", render: (t) => <span className="text-xs text-secondary">{t.due_date ? formatDate(t.due_date) : "—"}</span> },
  ];

  return (
    <div className="space-y-3">
      <FilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Search tasks..."
        filters={[{ key: "status", label: "All Statuses", value: statusFilter, onChange: setStatusFilter, options: [
          { value: "todo", label: "To Do" }, { value: "in_progress", label: "In Progress" },
          { value: "in_review", label: "In Review" }, { value: "done", label: "Done" }, { value: "blocked", label: "Blocked" },
        ]}]}
      />
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rect" className="h-10 w-full" />)}</div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center bg-surface border border-default rounded-lg">
          <CheckCircle2 className="h-8 w-8 text-tertiary mb-2" />
          <p className="text-sm text-tertiary">No tasks yet</p>
          <Button size="sm" variant="secondary" className="mt-3" onClick={() => navigate(`/work/tasks/new?project_id=${projectId}`)}>Add Task</Button>
        </div>
      ) : (
        <Table columns={columns} data={tasks} loading={false} keyExtractor={(t) => t.id}
          onRowClick={(t) => openDrawer("task", t.id)} />
      )}
      <div className="flex justify-end">
        <Button size="sm" variant="secondary" onClick={() => navigate(`/work/tasks/new?project_id=${projectId}`)}>
          <Plus className="h-3.5 w-3.5" /> Add Task
        </Button>
      </div>
    </div>
  );
}
