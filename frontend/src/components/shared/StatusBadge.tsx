import { cn } from "@/lib/utils";
import { statusLabel, statusColor } from "@/utils/formatters";

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusColor(status),
        className
      )}
    >
      {statusLabel(status)}
    </span>
  );
}
