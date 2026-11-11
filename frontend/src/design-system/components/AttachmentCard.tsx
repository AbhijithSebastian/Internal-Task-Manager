import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AttachmentCardProps {
  name: string;
  meta?: ReactNode;
  preview?: ReactNode;
  badge?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function AttachmentCard({
  name,
  meta,
  preview,
  badge,
  onClick,
  className,
}: AttachmentCardProps) {
  return (
    <div
      className={cn(
        "border-default flex w-full flex-col overflow-hidden rounded-md border bg-surface",
        onClick && "cursor-pointer transition-shadow hover:shadow-card",
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
      <div className="border-default flex h-32 items-center justify-center overflow-hidden border-b bg-subtle">
        {preview}
      </div>
      <div className="flex flex-col gap-2.5 px-2.5 pb-3 pt-2.5">
        <p className="text-secondary-900 truncate text-sm font-medium">{name}</p>
        {(meta || badge) && (
          <div className="flex min-w-0 items-center gap-1.5 text-sm text-grey-800">
            {badge}
            {meta && <span className="truncate">{meta}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

interface AttachmentListProps {
  children: ReactNode;
  className?: string;
}

export function AttachmentList({ children, className }: AttachmentListProps) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-3", className)}>{children}</div>
  );
}
