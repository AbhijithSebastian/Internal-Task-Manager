export type BadgeVariant = "default" | "neutral" | "info" | "success" | "warning" | "danger";

export const statusVariant: Record<string, BadgeVariant> = {
  done: "success",
  completed: "success",
  active: "success",
  published: "success",
  approved: "success",
  in_progress: "info",
  in_review: "warning",
  scheduled: "info",
  open: "info",
  todo: "neutral",
  backlog: "neutral",
  draft: "warning",
  blocked: "danger",
  cancelled: "neutral",
  archived: "neutral",
  closed: "neutral",
};

export const priorityVariant: Record<string, BadgeVariant> = {
  low: "neutral",
  medium: "info",
  high: "warning",
  urgent: "danger",
  critical: "danger",
};

export function getStatusVariant(status: string): BadgeVariant {
  return statusVariant[status] ?? "default";
}

export function getPriorityVariant(priority: string): BadgeVariant {
  return priorityVariant[priority] ?? "default";
}
