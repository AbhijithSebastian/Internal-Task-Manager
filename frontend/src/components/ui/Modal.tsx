import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-4xl",
};

export function Modal({ open, onClose, title, children, footer, size = "md", className }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className={cn("relative bg-surface rounded-xl border border-default shadow-lg w-full mx-4", sizeClasses[size], className)}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-default">
            <h3 className="text-lg font-semibold text-primary">{title}</h3>
            <button onClick={onClose} className="p-1 rounded hover:bg-subtle transition-colors">
              <X className="h-4 w-4 text-tertiary" />
            </button>
          </div>
        )}
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-default flex items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
