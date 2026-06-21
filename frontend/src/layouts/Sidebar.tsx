import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { navSections } from "@/lib/navigation";
import { useAuth } from "@/store/auth";
import { X } from "lucide-react";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (href: string) => {
    if (href === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(href);
  };

  return (
    <>
      {open && (
          <div
            className="fixed inset-0 z-drawer-bg bg-black/30 lg:hidden"
            onClick={onClose}
            aria-label="Close sidebar"
          />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-drawer flex w-60 flex-col bg-app border-r border-subtle transition-transform duration-slow lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between px-6 border-b border-subtle">
          <Link to="/dashboard" className="text-xl font-bold tracking-tight text-primary">
            Task Manager
          </Link>
          <button onClick={onClose} className="lg:hidden p-1 rounded-md hover:bg-hover text-secondary" aria-label="Close sidebar menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navSections.map((section) => {
            const visible = section.items.filter((item) => {
              if (!item.roles) return true;
              if (!user) return false;
              if (user.is_super_admin) return true;
              return item.roles.includes(user.role || "");
            });
            if (visible.length === 0) return null;
            return (
              <ul key={section.label} className="space-y-0.5">
                {visible.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        to={item.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-fast",
                          active
                            ? "bg-primary-soft text-primary"
                            : "text-secondary hover:bg-hover hover:text-primary"
                        )}
                      >
                        <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-tertiary")} />
                        <span>{item.label}</span>
                        {item.badge === "notification" && (
                          <span className="ml-auto w-2 h-2 rounded-full bg-semantic-danger" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            );
          })}
        </nav>
        <div className="p-3 border-t border-subtle">
          <Link
            to="/work/admin/settings"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-fast",
              isActive("/settings")
                ? "bg-primary-soft text-primary"
                : "text-secondary hover:bg-hover hover:text-primary"
            )}
          >
            <div className="h-6 w-6 rounded-full bg-primary-soft text-primary flex items-center justify-center text-xs font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-primary truncate">{user?.name || "User"}</p>
              <p className="text-xs text-tertiary truncate">{user?.role_label || "Member"}</p>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}
