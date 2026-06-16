import { cn } from "@/lib/utils";
import { priorityLabel, priorityColor } from "@/utils/formatters";

export function PriorityBadge({ priority, className }: { priority: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        priorityColor(priority),
        className
      )}
    >
      {priorityLabel(priority)}
    </span>
  );
}
