import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { navSections } from "@/lib/navigation";
import { useAuth } from "@/store/auth";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { X, History } from "lucide-react";
import { Skeleton } from "@/design-system";
import type { Project } from "@/types";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

function ProjectLinks({ onClose }: { onClose: () => void }) {
  const location = useLocation();

  const { data: recent, isLoading } = useQuery<Project[]>({
    queryKey: ["projects", "recent"],
    queryFn: () =>
      api.get("/projects/recent").then((r) => r.data?.items || r.data?.data || r.data || []),
    staleTime: 60_000,
  });

  const projects = (recent || []).slice(0, 5);

  if (isLoading) {
    return (
      <div className="space-y-1 py-1 pl-9 pr-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} variant="text" className="h-5 w-24" />
        ))}
      </div>
    );
  }

  if (projects.length === 0) return null;

  return (
    <div className="space-y-0.5 py-1 pl-9 pr-3">
      {projects.map((p) => {
        const href = `/work/projects/${p.id}`;
        const active = location.pathname.startsWith(href);
        return (
          <Link
            key={p.id}
            to={href}
            onClick={onClose}
            className={cn(
              "flex items-center gap-2 rounded px-2 py-1 text-xs font-medium transition-colors duration-fast",
              active
                ? "bg-primary-soft text-primary"
                : "text-tertiary hover:bg-hover hover:text-secondary",
            )}
            title={p.name}
          >
            <History className="h-3 w-3 shrink-0" />
            <span className="truncate">{p.name}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (href: string) => {
    if (href === "/dashboard") return location.pathname === "/dashboard";
    if (href === "/work/projects") return location.pathname === "/work/projects";
    return location.pathname.startsWith(href);
  };

  return (
    <>
      {open && (
        <div
          className="bg-black/30 fixed inset-0 z-drawer-bg lg:hidden"
          onClick={onClose}
          aria-label="Close sidebar"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-drawer flex w-[267px] flex-col border-r border-border-default bg-surface transition-transform duration-slow lg:static lg:z-0 lg:translate-x-0 lg:transform-none lg:transition-none",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-[52px] items-center justify-between border-b border-border-default px-5">
          <Link to="/dashboard" className="flex items-center gap-2.5 text-base font-bold tracking-tight text-grey-900">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white shadow-sm">
              <span className="text-xs font-bold">ITM</span>
            </div>
            <span>Task Manager</span>
          </Link>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-secondary hover:bg-hover lg:hidden"
            aria-label="Close sidebar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
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
                {section.label === "Projects" && (
                  <li className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-tertiary">
                    {section.label}
                  </li>
                )}
                {visible.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        to={item.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-fast",
                          active
                            ? "bg-primary-soft text-primary"
                            : "text-secondary hover:bg-hover hover:text-primary",
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0",
                            active ? "text-primary" : "text-tertiary",
                          )}
                        />
                        <span>{item.label}</span>
                        {item.badge === "notification" && (
                          <span className="ml-auto h-2 w-2 rounded-full bg-semantic-danger" />
                        )}
                      </Link>
                    </li>
                  );
                })}
                {section.label === "Projects" && <ProjectLinks onClose={onClose} />}
              </ul>
            );
          })}
        </nav>
        <div className="border-t border-subtle p-3">
          <Link
            to="/work/admin/settings"
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-fast",
              isActive("/settings")
                ? "bg-primary-soft text-primary"
                : "text-secondary hover:bg-hover hover:text-primary",
            )}
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-primary">{user?.name || "User"}</p>
              <p className="truncate text-xs text-tertiary">{user?.role_label || "Member"}</p>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}
