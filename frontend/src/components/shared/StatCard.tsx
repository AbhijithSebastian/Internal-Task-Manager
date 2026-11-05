import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  variant?: "default" | "compact";
  className?: string;
}

export function StatCard({ icon: Icon, label, value, variant = "default", className }: StatCardProps) {
  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2 p-2 rounded-md bg-surface border border-default/50", className)}>
        <Icon className="h-3.5 w-3.5 text-tertiary shrink-0" />
        <div className="min-w-0">
          <p className="text-[10px] text-tertiary">{label}</p>
          <p className="text-xs font-medium text-primary truncate">{value}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("p-3 rounded-lg border border-default bg-surface", className)}>
      <div className="flex items-center gap-2">
        <div className="shrink-0 w-8 h-8 rounded-lg bg-subtle flex items-center justify-center">
          <Icon className="h-4 w-4 text-tertiary" />
        </div>
        <div>
          <p className="text-lg font-semibold text-primary tabular-nums">{value}</p>
          <p className="text-xs text-tertiary">{label}</p>
        </div>
      </div>
    </div>
  );
}
