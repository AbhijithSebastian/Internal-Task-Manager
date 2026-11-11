import { useNavigate, useLocation } from "react-router-dom";
import { Bell, Menu, ChevronRight, Search } from "lucide-react";
import { useAuth } from "@/store/auth";
import { useState, useRef, useEffect } from "react";

interface HeaderProps {
  onMenuClick: () => void;
  onSearchClick?: () => void;
}

const breadcrumbLabels: Record<string, string> = {
  dashboard: "Dashboard",
  work: "Work",
  tasks: "Tasks",
  projects: "Projects",
  meetings: "Meetings",
  users: "Users",
  announcements: "Announcements",
  notifications: "Notifications",
  reports: "Reports",
  admin: "Administration",
  roles: "Roles",
  permissions: "Permissions",
  settings: "Settings",
  new: "New",
  edit: "Edit",
  invite: "Invite",
};

export function Header({ onMenuClick, onSearchClick }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const pathSegments = location.pathname.split("/").filter(Boolean);
  const breadcrumbs = pathSegments.map((seg, i) => ({
    label: breadcrumbLabels[seg] || seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    href: "/" + pathSegments.slice(0, i + 1).join("/"),
    isLast: i === pathSegments.length - 1,
  }));

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="border-border-default sticky top-0 z-sticky flex h-[52px] items-center border-b bg-surface px-5 gap-4">
      <button
        onClick={onMenuClick}
        className="mr-1 rounded-md p-1.5 text-secondary hover:bg-hover lg:hidden"
        aria-label="Open sidebar menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <nav className="flex min-w-0 flex-1 items-center gap-1.5 text-xs text-grey-500 font-medium">
        {breadcrumbs.map((crumb) => (
          <span key={crumb.href} className="flex min-w-0 items-center gap-1.5">
            {!crumb.isLast ? (
              <button
                onClick={() => navigate(crumb.href)}
                className="truncate transition-colors duration-fast hover:text-primary"
              >
                {crumb.label}
              </button>
            ) : (
              <span className="truncate font-semibold text-grey-900">{crumb.label}</span>
            )}
            {!crumb.isLast && <ChevronRight className="h-3 w-3 shrink-0 text-grey-400" />}
          </span>
        ))}
      </nav>

      {onSearchClick && (
        <button
          onClick={onSearchClick}
          className="hidden md:flex items-center gap-2 rounded-lg border border-border-default bg-grey-50 px-3 py-1.5 text-xs text-grey-500 hover:border-border-hover hover:text-grey-700 transition-colors duration-fast w-56"
          title="Quick search (Ctrl+K or ⌘K)"
        >
          <Search className="h-3.5 w-3.5 text-grey-400" />
          <span className="flex-1 text-left">Search tasks, boards...</span>
          <kbd className="rounded border border-border-default bg-surface px-1 py-0.5 text-[10px] font-mono text-grey-500">⌘K</kbd>
        </button>
      )}

      <div className="flex items-center gap-1.5">
        <div ref={notifRef} className="relative">
          <button
            onClick={() => {
              setNotifOpen(!notifOpen);
              setProfileOpen(false);
            }}
            className="relative rounded-lg p-2 text-grey-600 transition-colors duration-fast hover:bg-grey-50 hover:text-grey-900"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </button>
          {notifOpen && (
            <div className="border-border-default absolute right-0 top-full z-dropdown mt-1.5 w-80 rounded-xl border bg-surface shadow-dropdown">
              <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
                <span className="text-sm font-semibold text-grey-900">Notifications</span>
                <button className="text-xs text-primary font-medium hover:underline">Mark all read</button>
              </div>
              <div className="max-h-72 overflow-y-auto">
                <div className="px-4 py-8 text-center text-sm text-grey-500">
                  No new notifications
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={profileRef} className="relative">
          <button
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 rounded-lg p-1 transition-colors duration-fast hover:bg-grey-50"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border-default bg-primary-100 text-xs font-bold text-primary-1000 shadow-sm">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          </button>
          {profileOpen && (
            <div className="border-border-default absolute right-0 top-full z-dropdown mt-1.5 w-52 rounded-xl border bg-surface py-1.5 shadow-dropdown">
              <div className="border-b border-border-subtle px-4 py-2">
                <p className="text-sm font-semibold text-grey-900 truncate">{user?.name}</p>
                <p className="text-xs text-grey-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-xs font-medium text-danger hover:bg-grey-50 transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
