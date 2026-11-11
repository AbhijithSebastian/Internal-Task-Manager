import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FormSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div>
          {title && <h3 className="text-sm font-semibold text-primary">{title}</h3>}
          {description && <p className="mt-0.5 text-xs text-tertiary">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

interface FormActionsProps {
  children: ReactNode;
  className?: string;
  align?: "start" | "center" | "end" | "between";
}

const alignClasses = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
};

export function FormActions({ children, className, align = "end" }: FormActionsProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 border-t border-subtle pt-4",
        alignClasses[align],
        className,
      )}
    >
      {children}
    </div>
  );
}
