import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawerHeaderProps {
  title: string;
  subtitle?: string;
  onClose?: () => void;
  actions?: ReactNode;
  className?: string;
}

export function DrawerHeader({ title, subtitle, onClose, actions, className }: DrawerHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between px-6 py-4 border-b border-subtle shrink-0", className)}>
      <div className="min-w-0">
        <h2 className="text-xl font-semibold text-primary truncate">{title}</h2>
        {subtitle && <p className="text-xs text-tertiary mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {actions}
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-md text-secondary hover:bg-hover hover:text-primary transition-colors duration-fast">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
