import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Users,
  Video,
  Megaphone,
  Bell,
  BarChart3,
  Shield,
  Settings,
  ListChecks,
  type LucideIcon,
} from "lucide-react";

export interface NavSection {
  label: string;
  items: NavItem[];
}

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: "notification";
  roles?: string[];
}

export const navSections: NavSection[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Work",
    items: [
      { label: "Tasks", href: "/work/tasks", icon: CheckSquare },
      { label: "Subtasks", href: "/work/subtasks", icon: ListChecks },
      { label: "Projects", href: "/work/projects", icon: FolderKanban },
      { label: "Meetings", href: "/work/meetings", icon: Video },
    ],
  },
  {
    label: "Team",
    items: [
      { label: "Users", href: "/work/users", icon: Users },
      { label: "Announcements", href: "/work/announcements", icon: Megaphone },
    ],
  },
  {
    label: "Activity",
    items: [
      { label: "Notifications", href: "/work/notifications", icon: Bell, badge: "notification" },
    ],
  },
  {
    label: "Reports",
    items: [
      { label: "Reports", href: "/work/reports", icon: BarChart3 },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Roles & Permissions", href: "/work/admin/roles", icon: Shield },
      { label: "Settings", href: "/work/admin/settings", icon: Settings },
    ],
  },
];
