import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function CategoryCard({ eyebrow, title, children, className }: CategoryCardProps) {
  return (
    <div
      className={cn(
        "border-default flex flex-col overflow-hidden rounded-xl border bg-surface pt-5 shadow-card",
        className,
      )}
    >
      <div className="flex flex-col gap-3 px-3.5">
        <p className="text-xs text-secondary">{eyebrow}</p>
        <p className="text-xl font-semibold leading-tight text-primary">{title}</p>
      </div>
      <div className="mt-6 flex-1 rounded-tl-control bg-grey-900 p-2.5 text-grey-300">
        {children}
      </div>
    </div>
  );
}
