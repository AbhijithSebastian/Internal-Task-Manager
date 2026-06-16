import { format, formatDistanceToNow, parseISO } from "date-fns";

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    return format(parseISO(dateStr), "MMM d, yyyy");
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    return format(parseISO(dateStr), "MMM d, yyyy h:mm a");
  } catch {
    return dateStr;
  }
}

export function formatRelative(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    backlog: "Backlog",
    todo: "To Do",
    in_progress: "In Progress",
    in_review: "In Review",
    approved: "Approved",
    done: "Done",
    cancelled: "Cancelled",
    blocked: "Blocked",
    active: "Active",
    on_hold: "On Hold",
    completed: "Completed",
    archived: "Archived",
    draft: "Draft",
    published: "Published",
    pending: "Pending",
  };
  return labels[status] ?? status;
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    backlog: "bg-gray-100 text-gray-800",
    todo: "bg-blue-100 text-blue-800",
    in_progress: "bg-yellow-100 text-yellow-800",
    in_review: "bg-orange-100 text-orange-800",
    approved: "bg-green-100 text-green-800",
    done: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    blocked: "bg-red-100 text-red-800",
    active: "bg-green-100 text-green-800",
    on_hold: "bg-yellow-100 text-yellow-800",
    completed: "bg-gray-100 text-gray-800",
    archived: "bg-gray-100 text-gray-800",
    draft: "bg-gray-100 text-gray-800",
    published: "bg-green-100 text-green-800",
  };
  return colors[status] ?? "bg-gray-100 text-gray-800";
}

export function priorityLabel(priority: string): string {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

export function priorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: "bg-gray-100 text-gray-800",
    medium: "bg-blue-100 text-blue-800",
    high: "bg-orange-100 text-orange-800",
    urgent: "bg-red-100 text-red-800",
  };
  return colors[priority] ?? "bg-gray-100 text-gray-800";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
