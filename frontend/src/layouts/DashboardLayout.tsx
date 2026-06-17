import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Shield, FolderKanban, CheckSquare,
  Calendar, Megaphone, FileText, Bell, User, Menu, X, LogOut,
  ChevronDown, Search,
} from "lucide-react";
import { useAuth } from "@/store/auth";
import { cn } from "@/lib/utils";
import SearchModal from "@/components/shared/SearchModal";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/users", icon: Users },
  { label: "Roles", href: "/roles", icon: Shield },
  { label: "Permissions", href: "/permissions", icon: Shield },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Tasks", href: "/tasks", icon: CheckSquare },
  { label: "Meetings", href: "/meetings", icon: Calendar },
  { label: "Announcements", href: "/announcements", icon: Megaphone },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Integrations", href: "/integrations", icon: FolderKanban },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform border-r bg-card transition-transform duration-200 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center border-b px-6">
          <Link to="/dashboard" className="text-xl font-bold">Task Manager</Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center border-b bg-card px-6">
          <button
            className="mr-4 lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <button
            className="mr-2 hidden items-center gap-2 rounded-lg border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted sm:flex"
            onClick={() => window.dispatchEvent(new Event("opensearch"))}
          >
            <Search className="h-4 w-4" />
            <span>Search...</span>
            <kbd className="ml-4 rounded border bg-background px-1.5 py-0.5 text-[11px] font-medium">⌘K</kbd>
          </button>
          <div className="flex-1" />
          <div className="relative group">
            <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted">
              <User className="h-4 w-4" />
              <span>{user?.name || user?.email}</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            <div className="absolute right-0 top-full z-50 mt-1 hidden w-48 rounded-md border bg-card shadow-lg group-hover:block">
              <div className="py-1">
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-sm hover:bg-muted"
                >
                  Profile
                </Link>
                <button
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-muted"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      <SearchModal />
    </div>
  );
}
