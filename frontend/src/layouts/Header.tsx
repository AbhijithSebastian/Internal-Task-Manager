import { useNavigate, useLocation } from "react-router-dom";
import { Bell, Plus, Menu, ChevronRight, Search, Command } from "lucide-react";
import { useAuth } from "@/store/auth";
import { useState, useRef, useEffect } from "react";
import { useEntityDrawer } from "@/hooks/useEntityDrawer";

interface HeaderProps {
  onMenuClick: () => void;
  onSearchClick?: () => void;
}

const newActions = [
  { label: "New Task", href: "/work/tasks/new", roles: [] },
  { label: "New Project", href: "/work/projects/new", roles: [] },
  { label: "New Meeting", href: "/work/meetings/new", roles: [] },
  { label: "New Announcement", href: "/work/announcements/new", roles: [] },
];

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
  const { closeDrawer } = useEntityDrawer();
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const newRef = useRef<HTMLDivElement>(null);
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
      if (newRef.current && !newRef.current.contains(e.target as Node)) setNewMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const goToNotifications = () => {
    closeDrawer();
    navigate("/work/notifications");
    setNotifOpen(false);
  };

  return (
    <header className="sticky top-0 z-sticky flex items-center h-14 px-6 bg-surface border-b border-default">
      <button onClick={onMenuClick} className="mr-3 p-1.5 rounded-md text-secondary hover:bg-hover lg:hidden" aria-label="Open sidebar menu">
        <Menu className="h-5 w-5" />
      </button>
      <nav className="flex items-center gap-1 text-sm text-tertiary flex-1 min-w-0">
        {breadcrumbs.map((crumb) => (
          <span key={crumb.href} className="flex items-center gap-1 min-w-0">
            {!crumb.isLast ? (
              <button
                onClick={() => navigate(crumb.href)}
                className="hover:text-primary truncate transition-colors duration-fast"
              >
                {crumb.label}
              </button>
            ) : (
              <span className="text-primary font-medium truncate">{crumb.label}</span>
            )}
            {!crumb.isLast && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
          </span>
        ))}
      </nav>
      <button
        onClick={onSearchClick}
        className="flex items-center gap-2 px-3 py-1.5 mr-2 rounded-md text-secondary hover:bg-hover hover:text-primary transition-colors duration-fast text-sm"
        aria-label="Open search"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded border border-subtle px-1 py-0.5 text-xs text-tertiary">
          <Command className="h-3 w-3" />
          <span>K</span>
        </kbd>
      </button>
      <div className="flex items-center gap-2">
        <div ref={newRef} className="relative">
          <button
            onClick={() => { setNewMenuOpen(!newMenuOpen); setNotifOpen(false); setProfileOpen(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-inverse text-sm font-medium hover:bg-primary-hover active:bg-primary-active transition-colors duration-fast"
            aria-label="Create new"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New</span>
          </button>
          {newMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-surface border border-default rounded-lg shadow-dropdown z-dropdown py-1">
              {newActions.map((action) => (
                <button
                  key={action.href}
                  onClick={() => { closeDrawer(); navigate(action.href); setNewMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-primary hover:bg-hover transition-colors duration-fast"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setNewMenuOpen(false); setProfileOpen(false); }}
            className="relative p-2 rounded-md text-secondary hover:bg-hover transition-colors duration-fast"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-semantic-danger" />
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full mt-1 w-80 bg-surface border border-default rounded-lg shadow-dropdown z-dropdown">
              <div className="flex items-center justify-between px-4 py-3 border-b border-subtle">
                <span className="text-sm font-semibold text-primary">Notifications</span>
                <button className="text-xs text-link hover:underline">Mark all read</button>
              </div>
              <div className="max-h-72 overflow-y-auto">
                <div className="px-4 py-8 text-center text-sm text-tertiary">
                  No new notifications
                </div>
              </div>
              <button
                onClick={goToNotifications}
                className="w-full px-4 py-2.5 text-sm text-center text-primary hover:bg-hover border-t border-subtle transition-colors duration-fast"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
        <div ref={profileRef} className="relative">
          <button
            onClick={() => { setProfileOpen(!profileOpen); setNewMenuOpen(false); setNotifOpen(false); }}
            className="flex items-center gap-2 p-1 rounded-md hover:bg-hover transition-colors duration-fast"
          >
            <div className="h-7 w-7 rounded-full bg-primary-soft text-primary flex items-center justify-center text-xs font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-surface border border-default rounded-lg shadow-dropdown z-dropdown py-1">
              <div className="px-4 py-2 border-b border-subtle">
                <p className="text-sm font-medium text-primary">{user?.name}</p>
                <p className="text-xs text-tertiary">{user?.email}</p>
              </div>
              <button
                onClick={() => { navigate("/work/notifications"); setProfileOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm text-primary hover:bg-hover transition-colors duration-fast"
              >
                Notifications
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-semantic-danger hover:bg-hover transition-colors duration-fast"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
