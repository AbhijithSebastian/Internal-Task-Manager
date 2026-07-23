/* ═══════════════════════════════════════════════════════════════════
   Application Constants
   Centralized magic values for consistency and maintainability
   ═══════════════════════════════════════════════════════════════════ */

// ─── Pagination ─────────────────────────────────────────────────
export const PAGE_SIZES = {
  default: 20,
  small: 10,
  dashboard: 5,
  large: 50,
  all: 100,
} as const;

export const DEFAULT_PAGE_SIZE = PAGE_SIZES.default;

// ─── Cache Durations (ms) ──────────────────────────────────────
export const CACHE_DURATIONS = {
  short: 30_000,      // 30s — general queries
  medium: 60_000,     // 1min — stable data
  long: 5 * 60_000,   // 5min — permissions, settings
  permanent: Infinity, // Never refetch
} as const;

// ─── Timing ─────────────────────────────────────────────────────
export const TIMING = {
  debounce: 300,       // Search debounce
  clipboardReset: 2000, // Clipboard feedback reset
  toastDuration: 5000,  // Toast auto-dismiss
  redirectDelay: 2000,  // Post-action redirect
} as const;

// ─── Date Formats ──────────────────────────────────────────────
export const DATE_FORMATS = {
  date: "MMM d, yyyy",
  dateTime: "MMM d, yyyy h:mm a",
  short: "MMM d",
  time: "h:mm a",
} as const;

// ─── File Upload ────────────────────────────────────────────────
export const FILE_LIMITS = {
  maxUploadSize: 50 * 1024 * 1024, // 50MB
  maxAvatarSize: 5 * 1024 * 1024,  // 5MB
  maxAttachments: 10,
} as const;

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
] as const;

export const ACCEPTED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain", "text/csv",
] as const;

// ─── Task Constants ─────────────────────────────────────────────
export const TASK_STATUSES = [
  "backlog", "todo", "in_progress", "in_review", "approved",
  "done", "cancelled", "blocked",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;

export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_STATUS_LABELS: Record<string, string> = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  approved: "Approved",
  done: "Done",
  cancelled: "Cancelled",
  blocked: "Blocked",
};

export const TASK_PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

// ─── Project Constants ──────────────────────────────────────────
export const PROJECT_STATUSES = [
  "active", "on_hold", "completed", "archived",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_PRIORITIES = ["low", "medium", "high", "urgent"] as const;

export type ProjectPriority = (typeof PROJECT_PRIORITIES)[number];

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  on_hold: "On Hold",
  completed: "Completed",
  archived: "Archived",
};

// ─── Announcement Constants ─────────────────────────────────────
export const ANNOUNCEMENT_STATUSES = [
  "draft", "published", "scheduled", "archived",
] as const;

export type AnnouncementStatus = (typeof ANNOUNCEMENT_STATUSES)[number];

export const ANNOUNCEMENT_PRIORITIES = ["low", "medium", "high", "urgent"] as const;

// ─── Endpoint Constants ─────────────────────────────────────────
export const ENDPOINT_STATUSES = ["draft", "review", "active", "deprecated"] as const;

export type EndpointStatus = (typeof ENDPOINT_STATUSES)[number];

// ─── Role Names ─────────────────────────────────────────────────
export const ROLE_NAMES = {
  admin: "admin",
  manager: "manager",
  lead: "lead",
  developer: "developer",
  designer: "designer",
  qa: "qa_member",
  viewer: "viewer",
} as const;

// ─── Permission Names ───────────────────────────────────────────
export const PERMISSIONS = {
  // Projects
  PROJECT_VIEW: "project-view",
  PROJECT_CREATE: "project-create",
  PROJECT_EDIT: "project-edit",
  PROJECT_DELETE: "project-delete",

  // Tasks
  TASK_VIEW: "task-view",
  TASK_CREATE: "task-create",
  TASK_EDIT: "task-edit",
  TASK_DELETE: "task-delete",

  // Announcements
  ANNOUNCEMENT_VIEW: "announcement-view",
  ANNOUNCEMENT_CREATE: "announcement-create",
  ANNOUNCEMENT_EDIT: "announcement-edit",
  ANNOUNCEMENT_DELETE: "announcement-delete",

  // Users
  USER_VIEW: "user-view",
  USER_CREATE: "user-create",
  USER_EDIT: "user-edit",
  USER_DELETE: "user-delete",

  // Roles
  ROLE_VIEW: "role-view",
  ROLE_CREATE: "role-create",
  ROLE_EDIT: "role-edit",
  ROLE_DELETE: "role-delete",

  // Reports
  REPORT_VIEW: "report-view",
  REPORT_EXPORT: "report-export",

  // Resources
  RESOURCE_VIEW: "resource-view",
  RESOURCE_UPLOAD: "resource-upload",
  RESOURCE_DELETE: "resource-delete",

  // Endpoints
  ENDPOINT_VIEW: "endpoint-view",
  ENDPOINT_CREATE: "endpoint-create",
  ENDPOINT_EDIT: "endpoint-edit",
  ENDPOINT_DELETE: "endpoint-delete",

  // Meetings
  MEETING_VIEW: "meeting-view",
  MEETING_CREATE: "meeting-create",
  MEETING_EDIT: "meeting-edit",
  MEETING_DELETE: "meeting-delete",

  // Admin
  ADMIN_SETTINGS: "admin-settings",
} as const;

// ─── Notification Categories ────────────────────────────────────
export const NOTIFICATION_CATEGORIES = [
  "task_assigned", "task_completed", "task_overdue",
  "meeting_scheduled", "meeting_reminder",
  "announcement_published",
  "comment_added", "mention",
] as const;

// ─── GitHub ─────────────────────────────────────────────────────
export const GITHUB = {
  API_BASE: "https://api.github.com",
  PER_PAGE: 30,
  MAX_COMMITS: 250,
} as const;

// ─── Figma ──────────────────────────────────────────────────────
export const FIGMA = {
  API_BASE: "https://api.figma.com/v1",
} as const;

// ─── Animation Classes ──────────────────────────────────────────
export const ANIMATIONS = {
  fadeIn: "animate-fade-in",
  slideUp: "animate-slide-up",
  scaleIn: "animate-scale-in",
  skeletonPulse: "skeleton-pulse",
} as const;
