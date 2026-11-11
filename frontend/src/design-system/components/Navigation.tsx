import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  icon?: ReactNode;
  active?: boolean;
  badge?: ReactNode;
  onClick?: () => void;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

interface NavigationProps {
  sections: NavSection[];
  className?: string;
  "aria-label"?: string;
}

export function Navigation({ sections, className, ...props }: NavigationProps) {
  return (
    <nav
      aria-label={props["aria-label"] ?? "Navigation"}
      className={cn("flex flex-col gap-6", className)}
    >
      {sections.map((section, index) => (
        <div key={section.title ?? index} className="flex flex-col gap-1">
          {section.title && (
            <p className="px-3 pb-1 text-2xs font-semibold uppercase tracking-wide text-tertiary">
              {section.title}
            </p>
          )}
          {section.items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "flex h-9 w-full items-center gap-2.5 rounded-md px-3 text-sm font-medium transition-colors duration-fast",
                "focus-visible:ring-primary-ring focus-visible:outline-none focus-visible:ring-2",
                item.active
                  ? "bg-primary-soft text-primary"
                  : "text-secondary hover:bg-hover hover:text-primary",
              )}
            >
              {item.icon && (
                <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                  {item.icon}
                </span>
              )}
              <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
              {item.badge}
            </button>
          ))}
        </div>
      ))}
    </nav>
  );
}
