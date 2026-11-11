import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface NavbarItem {
  label: string;
  active?: boolean;
  icon?: ReactNode;
  onClick?: () => void;
}

interface NavbarProps {
  brand?: ReactNode;
  logo?: ReactNode;
  items?: NavbarItem[];
  actions?: ReactNode;
  className?: string;
}

/**
 * Top application bar — Figma "Navbar" (9:1835).
 * 52px tall, white surface, 1px bottom border, 22px horizontal padding.
 */
export function Navbar({ brand, logo, items = [], actions, className }: NavbarProps) {
  return (
    <header
      className={cn(
        "border-default flex h-navbar w-full items-center justify-between gap-4 border-b bg-surface px-5",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {logo}
        {brand && (
          <div className="flex min-w-0 items-center gap-2.5 text-lg text-primary">{brand}</div>
        )}
      </div>

      {items.length > 0 && (
        <nav className="hidden min-w-0 flex-1 items-center gap-4 lg:flex" aria-label="Primary">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "inline-flex h-8 items-center gap-2 whitespace-nowrap text-sm font-medium transition-colors duration-fast",
                item.active ? "text-primary" : "text-secondary-700 hover:text-primary",
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      )}

      <div className="flex shrink-0 items-center gap-2">{actions}</div>
    </header>
  );
}
