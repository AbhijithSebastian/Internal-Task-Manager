import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DrawerFooterProps {
  children: ReactNode;
  className?: string;
}

export function DrawerFooter({ children, className }: DrawerFooterProps) {
  return (
    <div className={cn("flex items-center justify-end gap-2 px-6 py-4 border-t border-subtle shrink-0", className)}>
      {children}
    </div>
  );
}
