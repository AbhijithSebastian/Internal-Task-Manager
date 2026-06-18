import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Drawer({ open, onClose, title, children, className }: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    drawerRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-drawer-bg">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        ref={drawerRef}
        tabIndex={-1}
        className={cn(
          "absolute right-0 top-0 bottom-0 w-full max-w-[560px] bg-surface shadow-drawer flex flex-col animate-slide-in-right focus:outline-none",
          className
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-subtle shrink-0">
          <h2 className="text-xl font-semibold text-primary truncate">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-secondary hover:bg-hover hover:text-primary transition-colors duration-fast"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  );
}
