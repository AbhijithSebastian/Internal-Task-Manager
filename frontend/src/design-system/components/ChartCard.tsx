import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

/**
 * Shared frame for the analytics widgets in Figma 14:7206–14:7211.
 */
export function ChartCard({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
}: ChartCardProps) {
  return (
    <section
      className={cn(
        "border-default flex flex-col gap-4 rounded-md border bg-surface p-5 shadow-card",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-primary">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-tertiary">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className={cn("min-h-0 flex-1", bodyClassName)}>{children}</div>
    </section>
  );
}
