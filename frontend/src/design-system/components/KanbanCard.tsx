import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface KanbanCardProps {
  title: ReactNode;
  status?: string;
  count?: number | string;
  meta?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  onClick?: () => void;
  className?: string;
  children?: ReactNode;
}

export function KanbanCard({
  title,
  status,
  count,
  meta,
  action,
  icon,
  onClick,
  className,
  children,
}: KanbanCardProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col rounded-md bg-subtle p-3",
        onClick && "cursor-pointer transition-colors hover:bg-grey-100",
        className,
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {icon && <span className="shrink-0 text-secondary">{icon}</span>}
            {status && (
              <span className="text-secondary-800 inline-flex shrink-0 items-center justify-center rounded-button bg-secondary-200 px-1.5 py-0.5 text-2xs font-semibold uppercase tracking-wide">
                {status}
              </span>
            )}
            {count !== undefined && (
              <span className="text-sm font-medium text-grey-800">{count}</span>
            )}
            {title && <span className="truncate text-sm font-medium text-primary">{title}</span>}
          </div>
          {meta && <span className="shrink-0 text-tertiary">{meta}</span>}
        </div>
        {action && (
          <div className="text-secondary-700 flex items-center justify-center gap-2 text-xs">
            {action}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
