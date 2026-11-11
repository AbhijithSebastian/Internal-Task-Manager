import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Badge, type BadgeVariant } from "../primitives/Badge";

const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  todo: "neutral",
  "to do": "neutral",
  backlog: "neutral",
  cancelled: "neutral",
  canceled: "neutral",
  done: "success",
  completed: "success",
  complete: "success",
  approved: "success",
  active: "success",
  online: "success",
  "in progress": "info",
  in_progress: "info",
  inprogress: "info",
  "in review": "warning",
  in_review: "warning",
  review: "warning",
  pending: "warning",
  "on hold": "warning",
  blocked: "danger",
  overdue: "danger",
  failed: "danger",
  rejected: "danger",
  offline: "neutral",
};

export function statusVariant(status: string): BadgeVariant {
  return STATUS_VARIANTS[status.trim().toLowerCase()] ?? "default";
}

interface StatusBadgeProps {
  status: string;
  label?: string;
  dot?: boolean;
  size?: "sm" | "md";
  className?: string;
  children?: ReactNode;
}

export function StatusBadge({
  status,
  label,
  dot = true,
  size = "sm",
  className,
  children,
}: StatusBadgeProps) {
  return (
    <Badge
      variant={statusVariant(status)}
      size={size}
      dot={dot}
      className={cn("capitalize", className)}
    >
      {children ?? label ?? status}
    </Badge>
  );
}
