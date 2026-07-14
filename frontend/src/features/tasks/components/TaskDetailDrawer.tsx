import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { TaskStatusBadge, TaskPriorityBadge } from "@/features/tasks/components/TaskStatusBadge";
import { formatDateTime, formatRelative } from "@/utils/formatters";
import { AlertCircle } from "lucide-react";
import { AttachmentsSection } from "@/components/shared/AttachmentsSection";
import { TABS, type TabKey } from "./TaskDetailDrawer/constants";
import type { TaskDetailDrawerProps } from "./TaskDetailDrawer/types";
import { DetailsSection } from "./TaskDetailDrawer/DetailsSection";
import { SubtasksSection } from "./TaskDetailDrawer/SubtasksSection";
import { CommentsSection } from "./TaskDetailDrawer/CommentsSection";
import { ActivitySection } from "./TaskDetailDrawer/ActivitySection";
import { DependenciesSection } from "./TaskDetailDrawer/DependenciesSection";
import type { Task } from "@/types";

export function TaskDetailDrawer({ taskId, onClose }: TaskDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("details");

  const { data: task, isLoading, error } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => api.get(`/tasks/${taskId}`).then((r) => r.data?.data || r.data),
    enabled: Boolean(taskId),
  });

  const t = task as Task | undefined;

  useEffect(() => { if (taskId) setActiveTab("details"); }, [taskId]);

  return (
    <Drawer open={Boolean(taskId)} onClose={onClose} title={t?.title || "Task"} className="max-w-2xl">
      {isLoading ? (
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <Skeleton variant="rect" className="h-5 w-20" />
            <Skeleton variant="rect" className="h-5 w-16" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (<Skeleton key={i} variant="rect" className="h-10 w-full" />))}
        </div>
      ) : error || !t ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-tertiary mb-3" />
          <p className="text-sm text-tertiary">Task not found</p>
          <Button size="sm" variant="ghost" onClick={onClose} className="mt-4">Close</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <TaskStatusBadge status={t.status} />
            <TaskPriorityBadge priority={t.priority} />
          </div>

          <div className="flex gap-1 border-b border-subtle overflow-x-auto -mx-6 px-6">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors shrink-0 ${activeTab === tab.key ? "border-primary text-primary" : "border-transparent text-tertiary hover:text-secondary hover:border-subtle"}`}>
                  <Icon className="h-3.5 w-3.5" /> {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === "details" && <DetailsSection task={t} taskId={t.id} />}
          {activeTab === "subtasks" && <SubtasksSection taskId={t.id} subtasks={t.subtasks} />}
          {activeTab === "comments" && <CommentsSection taskId={t.id} projectId={t.project_id} />}
          {activeTab === "activity" && <ActivitySection taskId={t.id} />}
          {activeTab === "attachments" && <AttachmentsSection modelType="task" modelId={t.id} />}
          {activeTab === "dependencies" && <DependenciesSection taskId={t.id} task={t} />}

          <div className="pt-3 border-t border-subtle space-y-1 text-xs text-tertiary">
            <p>Created {formatDateTime(t.created_at)}{t.author && ` by ${t.author.name}`}</p>
            {t.updated_at && <p>Updated {formatRelative(t.updated_at)}</p>}
          </div>
        </div>
      )}
    </Drawer>
  );
}
