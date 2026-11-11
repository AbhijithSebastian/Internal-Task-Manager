import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  variant?: "default" | "compact";
  className?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  variant = "default",
  className,
}: StatCardProps) {
  if (variant === "compact") {
    return (
      <div
        className={cn(
          "border-default/50 flex items-center gap-2 rounded-md border bg-surface p-2",
          className,
        )}
      >
        <Icon className="h-3.5 w-3.5 shrink-0 text-tertiary" />
        <div className="min-w-0">
          <p className="text-2xs text-tertiary">{label}</p>
          <p className="truncate text-xs font-medium text-primary">{value}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("border-default rounded-lg border bg-surface p-3", className)}>
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-subtle">
          <Icon className="h-4 w-4 text-tertiary" />
        </div>
        <div>
          <p className="text-lg font-semibold tabular-nums text-primary">{value}</p>
          <p className="text-xs text-tertiary">{label}</p>
        </div>
      </div>
    </div>
  );
}
