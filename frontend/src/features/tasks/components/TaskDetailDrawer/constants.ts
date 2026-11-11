import {
  ListChecks,
  MessageSquare,
  Activity as ActivityIcon,
  Paperclip,
  Link2,
} from "lucide-react";

export const STATUS_OPTIONS = [
  { value: "backlog", label: "Backlog" },
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review", label: "In Review" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
  { value: "blocked", label: "Blocked" },
];

export const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export type TabKey =
  "details" | "subtasks" | "comments" | "activity" | "attachments" | "dependencies";

export const TABS: { key: TabKey; label: string; icon: typeof ListChecks }[] = [
  { key: "details", label: "Details", icon: ListChecks },
  { key: "subtasks", label: "Subtasks", icon: ListChecks },
  { key: "comments", label: "Comments", icon: MessageSquare },
  { key: "activity", label: "Activity", icon: ActivityIcon },
  { key: "attachments", label: "Files", icon: Paperclip },
  { key: "dependencies", label: "Deps", icon: Link2 },
];
