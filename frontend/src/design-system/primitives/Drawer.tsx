import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
}

export function Drawer({ open, onClose, title, children, className, footer }: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
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

  return createPortal(
    <div className="fixed inset-0 z-drawer-bg">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity" onClick={onClose} aria-hidden="true" />
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          "absolute inset-y-0 right-0 z-drawer flex w-full max-w-[620px] flex-col",
          "animate-slide-in-right border-l border-border-default bg-surface shadow-drawer focus:outline-none",
          className,
        )}
      >
        {title && <DrawerHeader title={title} onClose={onClose} />}
        {children}
        {footer && <DrawerFooter>{footer}</DrawerFooter>}
      </div>
    </div>,
    document.body,
  );
}

interface DrawerHeaderProps {
  title: string;
  subtitle?: string;
  onClose?: () => void;
  actions?: ReactNode;
  className?: string;
}

export function DrawerHeader({ title, subtitle, onClose, actions, className }: DrawerHeaderProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-between border-b border-border-default px-6 py-4",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="truncate text-xl font-bold text-grey-900 font-sans">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-grey-500">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {actions}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="rounded-lg p-1.5 text-grey-500 transition-colors hover:bg-grey-50 hover:text-grey-900"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

interface DrawerBodyProps {
  children: ReactNode;
  className?: string;
}

export function DrawerBody({ children, className }: DrawerBodyProps) {
  return <div className={cn("flex-1 overflow-y-auto px-6 py-5", className)}>{children}</div>;
}

interface DrawerFooterProps {
  children: ReactNode;
  className?: string;
}

export function DrawerFooter({ children, className }: DrawerFooterProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-end gap-2 border-t border-subtle px-6 py-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
