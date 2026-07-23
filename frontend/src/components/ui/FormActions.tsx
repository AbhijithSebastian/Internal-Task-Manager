import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FormActionsProps {
  children: ReactNode;
  className?: string;
  align?: "start" | "center" | "end" | "between";
}

export function FormActions({ children, className, align = "end" }: FormActionsProps) {
  const alignClasses = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
  };

  return (
    <div className={cn("flex items-center gap-2 pt-4 border-t border-subtle", alignClasses[align], className)}>
      {children}
    </div>
  );
}
