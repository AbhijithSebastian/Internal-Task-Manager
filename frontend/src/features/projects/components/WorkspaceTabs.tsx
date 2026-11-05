import { NavLink } from "react-router-dom";
import { FileText, CheckCircle2, Users, CalendarDays, Globe, Palette, FolderOpen, Activity, Github } from "lucide-react";

const tabs = [
  { id: "", label: "Overview", icon: FileText, path: "" },
  { id: "tasks", label: "Tasks", icon: CheckCircle2, path: "tasks" },
  { id: "members", label: "Members", icon: Users, path: "members" },
  { id: "meetings", label: "Meetings", icon: CalendarDays, path: "meetings" },
  { id: "endpoints", label: "End Points", icon: Globe, path: "endpoints" },
  { id: "design", label: "Design", icon: Palette, path: "design" },
  { id: "resources", label: "Resources", icon: FolderOpen, path: "resources" },
  { id: "activity", label: "Activity", icon: Activity, path: "activity" },
  { id: "github", label: "GitHub", icon: Github, path: "github" },
];

export function WorkspaceTabs({ projectId }: { projectId: number }) {
  const basePath = `/work/projects/${projectId}`;

  return (
    <div className="flex gap-0.5 border-b border-subtle overflow-x-auto mt-4">
      {tabs.map((tab) => (
        <NavLink
          key={tab.id}
          to={tab.path ? `${basePath}/${tab.path}` : basePath}
          end={tab.path === ""}
          className={({ isActive }) =>
            `flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors duration-fast ${
              isActive ? "border-primary text-primary" : "border-transparent text-tertiary hover:text-secondary hover:border-hover"
            }`
          }
        >
          <tab.icon className="h-3.5 w-3.5" />
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}
