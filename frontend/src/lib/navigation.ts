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
      { label: "Projects", href: "/work/projects", icon: FolderKanban },
      { label: "Meetings", href: "/work/meetings", icon: Video },
    ],
  },
  {
    label: "Team",
    items: [
      { label: "People", href: "/work/people", icon: Users },
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
    label: "Analytics",
    items: [
      { label: "Analytics", href: "/work/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Roles", href: "/work/admin/roles", icon: Shield },
      { label: "Permissions", href: "/work/admin/permissions", icon: Shield },
      { label: "Settings", href: "/work/admin/settings", icon: Settings },
    ],
  },
];
