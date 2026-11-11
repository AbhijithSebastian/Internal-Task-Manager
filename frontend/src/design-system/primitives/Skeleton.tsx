import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circle" | "rect";
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = "rect", ...props }, ref) => {
    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={cn(
          "skeleton-pulse bg-grey-100",
          variant === "circle" && "rounded-full",
          variant === "text" && "h-4 rounded-sm",
          variant === "rect" && "rounded-sm",
          className,
        )}
        {...props}
      />
    );
  },
);

Skeleton.displayName = "Skeleton";

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "border-default space-y-4 rounded-md border bg-surface p-5 shadow-card",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <Skeleton variant="circle" className="h-10 w-10" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="h-5 w-2/3" />
          <Skeleton variant="text" className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton variant="text" className="h-3 w-full" />
      <Skeleton variant="text" className="h-3 w-5/6" />
      <Skeleton variant="text" className="h-3 w-4/6" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="border-default overflow-hidden rounded-md border bg-surface shadow-card">
      <div className="border-b border-subtle bg-subtle px-4 py-3">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} variant="text" className="h-4 flex-1" />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="border-b border-subtle px-4 py-3 last:border-0">
          <div className="flex gap-4">
            {Array.from({ length: columns }).map((_, colIdx) => (
              <Skeleton
                key={colIdx}
                variant="text"
                className={cn("h-3", colIdx === 0 ? "flex-[2]" : "flex-1")}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonKpiRow({ cards = 4 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: cards }).map((_, i) => (
        <div
          key={i}
          className="border-default space-y-3 rounded-md border bg-surface p-4 shadow-card"
        >
          <Skeleton variant="text" className="h-3 w-1/2" />
          <Skeleton variant="text" className="h-8 w-1/3" />
          <Skeleton variant="text" className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonForm({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-5">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton variant="text" className="h-4 w-1/4" />
          <Skeleton variant="rect" className="h-9 w-full" />
        </div>
      ))}
      <Skeleton variant="rect" className="h-9 w-24" />
    </div>
  );
}
