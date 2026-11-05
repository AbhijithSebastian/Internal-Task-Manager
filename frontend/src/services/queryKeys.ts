export const queryKeys = {
  // Projects
  projects: {
    all: ["projects"] as const,
    list: (params: Record<string, unknown>) => ["projects", params] as const,
    recent: ["projects", "recent"] as const,
    detail: (id: string | number) => ["project", id] as const,
    tasks: (id: string | number) => ["project-tasks", id] as const,
    members: (id: string | number) => ["project-members", id] as const,
    meetings: (id: string | number) => ["project-meetings", id] as const,
    activity: (id: string | number) => ["project-activity", id] as const,
    design: (id: string | number) => ["design-assets", id] as const,
  },

  // Tasks
  tasks: {
    all: ["tasks"] as const,
    list: (params: Record<string, unknown>) => ["tasks", params] as const,
    detail: (id: string | number) => ["task", id] as const,
    dashboard: (userId?: number) => ["tasks", "dashboard", userId] as const,
    recent: (userId?: number) => ["tasks", "recent", userId] as const,
    overdue: (userId?: number) => ["tasks", "overdue", userId] as const,
    search: (query: string) => ["tasks-search", query] as const,
  },

  // Subtasks
  subtasks: {
    all: ["subtasks"] as const,
    list: (params: Record<string, unknown>) => ["subtasks", params] as const,
  },

  // Users
  users: {
    all: ["users"] as const,
    list: ["users-list"] as const,
    search: (query: string) => ["user-search", query] as const,
    searchDetail: (query: string) => ["users-search", query] as const,
  },

  // Meetings
  meetings: {
    all: ["meetings"] as const,
    upcoming: ["meetings", "upcoming"] as const,
  },

  // Announcements
  announcements: {
    all: ["announcements"] as const,
    recent: ["announcements", "recent"] as const,
  },

  // Endpoints
  endpoints: {
    all: ["endpoints"] as const,
    list: (projectId: string | number, params: Record<string, unknown>) => ["endpoints", projectId, params] as const,
    detail: (id: string | number) => ["endpoint", id] as const,
    references: (id: string | number) => ["endpoint-references", id] as const,
    activity: (id: string | number) => ["endpoint-activity", id] as const,
  },

  // Resources
  resources: {
    all: ["resources"] as const,
    list: (projectId: string | number, params: Record<string, unknown>) => ["resources", projectId, params] as const,
    detail: (id: string | number) => ["resource", id] as const,
    versions: (id: string | number) => ["resource-versions", id] as const,
    links: (id: string | number) => ["resource-links", id] as const,
    activity: (id: string | number) => ["resource-activity", id] as const,
  },

  // Reports
  reports: {
    all: ["reports"] as const,
    list: (params: Record<string, unknown>) => ["reports", params] as const,
    analytics: ["reports-analytics"] as const,
  },

  // Dashboard
  dashboard: {
    stats: ["dashboard", "stats"] as const,
    activities: ["dashboard", "activities"] as const,
  },

  // GitHub
  github: {
    repo: (owner: string, repo: string) => ["github-repo", owner, repo] as const,
    commits: (owner: string, repo: string, branch: string, page: number) => ["github-commits", owner, repo, branch, page] as const,
    pulls: (owner: string, repo: string, page: number) => ["github-pulls", owner, repo, page] as const,
    issues: (owner: string, repo: string, page: number) => ["github-issues", owner, repo, page] as const,
    branches: (owner: string, repo: string, page: number) => ["github-branches", owner, repo, page] as const,
    releases: (owner: string, repo: string, page: number) => ["github-releases", owner, repo, page] as const,
    contributors: (owner: string, repo: string, page: number) => ["github-contributors", owner, repo, page] as const,
    languages: (owner: string, repo: string) => ["github-languages", owner, repo] as const,
  },

  // Attachments
  attachments: {
    list: (modelType: string, modelId: number) => ["attachments", modelType, modelId] as const,
  },

  // Auth
  auth: {
    me: ["auth", "me"] as const,
  },

  // Comments
  comments: {
    list: (taskId: string | number) => ["comments", taskId] as const,
  },

  // Activity
  activity: {
    list: (subjectType: string, subjectId: string | number) => ["activity", subjectType, subjectId] as const,
  },

  // Admin
  admin: {
    settings: ["admin", "settings"] as const,
    permissions: ["admin", "permissions"] as const,
  },

  // Figma
  figma: {
    meta: (fileId: string | null) => ["figma-meta", fileId] as const,
  },
} as const;

export function invalidateProject(qc: { invalidateQueries: (options: { queryKey: readonly unknown[] }) => void }, projectId: string | number) {
  qc.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
  qc.invalidateQueries({ queryKey: queryKeys.projects.all });
  qc.invalidateQueries({ queryKey: queryKeys.projects.activity(projectId) });
  qc.invalidateQueries({ queryKey: queryKeys.projects.recent });
}

export function invalidateTask(qc: { invalidateQueries: (options: { queryKey: readonly unknown[] }) => void }, taskId?: string | number) {
  if (taskId) qc.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) });
  qc.invalidateQueries({ queryKey: queryKeys.tasks.all });
}
