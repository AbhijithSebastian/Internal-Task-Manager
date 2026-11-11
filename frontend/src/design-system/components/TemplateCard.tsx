import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TemplateItem {
  title: string;
  description?: string;
  icon?: ReactNode;
  onClick?: () => void;
}

interface TemplateCardProps {
  title?: string;
  subtitle?: string;
  items: TemplateItem[];
  onClose?: () => void;
  footer?: ReactNode;
  className?: string;
}

export function TemplateCard({
  title = "Templates",
  subtitle = "Preview a template for your next request",
  items,
  onClose,
  footer,
  className,
}: TemplateCardProps) {
  return (
    <div
      className={cn(
        "border-default flex w-full flex-col gap-5 rounded-md border bg-surface p-5 shadow-card",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-medium text-primary">{title}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-tertiary">{subtitle}</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close templates"
            className="rounded-sm p-1 text-tertiary transition-colors hover:bg-hover hover:text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3.5">
        {items.map((item) => (
          <button
            key={item.title}
            type="button"
            onClick={item.onClick}
            className="flex items-start gap-2.5 rounded-md text-left transition-colors duration-fast hover:bg-hover"
          >
            <span className="flex h-control-icon-md w-control-icon-md shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
              {item.icon}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-primary">{item.title}</span>
              {item.description && (
                <span className="mt-0.5 block text-xs text-tertiary">{item.description}</span>
              )}
            </span>
          </button>
        ))}
      </div>

      {footer && <div className="border-t border-subtle pt-3">{footer}</div>}
    </div>
  );
}
