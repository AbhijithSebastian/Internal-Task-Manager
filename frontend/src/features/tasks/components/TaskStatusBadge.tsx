import { Badge } from "@/components/ui/Badge";

const statusConfig: Record<string, { variant: "success" | "warning" | "danger" | "info" | "neutral" | "default"; label: string }> = {
  backlog: { variant: "neutral", label: "Backlog" },
  todo: { variant: "info", label: "To Do" },
  in_progress: { variant: "warning", label: "In Progress" },
  in_review: { variant: "default", label: "In Review" },
  approved: { variant: "success", label: "Approved" },
  done: { variant: "success", label: "Done" },
  cancelled: { variant: "neutral", label: "Cancelled" },
  blocked: { variant: "danger", label: "Blocked" },
};

export function TaskStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { variant: "neutral" as const, label: status };
  return (
    <Badge variant={config.variant} size="sm" dot>
      {config.label}
    </Badge>
  );
}

const priorityConfig: Record<string, { variant: "success" | "warning" | "danger" | "neutral"; label: string }> = {
  low: { variant: "neutral", label: "Low" },
  medium: { variant: "info" as any, label: "Medium" },
  high: { variant: "warning", label: "High" },
  urgent: { variant: "danger", label: "Urgent" },
};

export function TaskPriorityBadge({ priority }: { priority: string }) {
  const config = priorityConfig[priority] || { variant: "neutral" as const, label: priority };
  return (
    <Badge variant={config.variant} size="sm">
      {config.label}
    </Badge>
  );
}
