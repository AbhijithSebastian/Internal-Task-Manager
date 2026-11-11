import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Video,
  Megaphone,
  BarChart3,
  Users,
  Shield,
  Settings,
  ListChecks,
  type LucideIcon,
} from "lucide-react";

export interface NavSection {
  label: string;
  items: NavItem[];
  collapsible?: boolean;
}

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: "notification";
  roles?: string[];
  isProject?: boolean;
}

export const navSections: NavSection[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Projects",
    collapsible: true,
    items: [{ label: "View All", href: "/work/projects", icon: FolderKanban }],
  },
  {
    label: "Work",
    items: [
      { label: "Tasks", href: "/work/tasks", icon: CheckSquare },
      { label: "Subtasks", href: "/work/subtasks", icon: ListChecks },
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
    label: "Reports",
    items: [{ label: "Reports", href: "/work/reports", icon: BarChart3 }],
  },
  {
    label: "Administration",
    items: [
      { label: "Roles & Permissions", href: "/work/admin/roles", icon: Shield },
      { label: "Settings", href: "/work/admin/settings", icon: Settings },
    ],
  },
];
