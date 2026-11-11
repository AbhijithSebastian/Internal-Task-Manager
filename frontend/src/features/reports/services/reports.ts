import { api } from "@/services/api";
import type { PaginatedResponse } from "@/types";

export interface ReportsQueryParams {
  tab: string;
  page?: number;
  per_page?: number;
  search?: string;
  project_id?: number;
  user_id?: number;
  status?: string;
  priority?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_dir?: string;
}

export type { PaginatedResponse };

export interface MemberInfo {
  id: number;
  name: string;
  role: string;
}

export interface ProjectReportRow {
  id: number;
  name: string;
  description: string | null;
  client: string | null;
  status: string;
  status_label: string;
  priority: string;
  priority_label: string;
  progress: number;
  start_date: string | null;
  end_date: string | null;
  completion_date: string | null;
  pm: string | null;
  lead: string | null;
  team_leads: MemberInfo[];
  designers: MemberInfo[];
  developers: MemberInfo[];
  qa_members: MemberInfo[];
  team_members: MemberInfo[];
  planned_hours: number;
  actual_hours: number | null;
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  total_subtasks: number;
  completed_subtasks: number;
  meeting_count: number;
  attachment_count: number;
  health_score: number;
  blocked_count: number;
  overdue_count: number;
  created_at: string | null;
}

export interface TaskAssignee {
  id: number;
  name: string;
}

export interface TaskCommentBrief {
  body: string;
  author: string | null;
  created_at: string | null;
}

export interface TaskReportRow {
  id: number;
  title: string;
  description: string | null;
  status: string;
  status_label: string;
  priority: string;
  priority_label: string;
  project_id: number;
  project_name: string | null;
  assignees: TaskAssignee[];
  author: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  due_date: string | null;
  started_date: string | null;
  completed_date: string | null;
  comment_count: number;
  attachment_count: number;
  subtask_count: number;
  linked_meeting_count: number;
  time_tracking: null;
  comments: TaskCommentBrief[];
  duration_days: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface SubtaskReportRow {
  id: number;
  title: string;
  notes: string | null;
  status: string;
  status_label: string;
  priority: string;
  priority_label: string;
  parent_task_id: number;
  parent_task_title: string | null;
  project_id: number;
  project_name: string | null;
  assignees: TaskAssignee[];
  assigned_user: string | null;
  estimated_hours: number | null;
  due_date: string | null;
  started_date: string | null;
  completed_date: string | null;
  completion_time: number | null;
  duration_days: number | null;
  attachment_count: number;
  activity_history: { description: string; event: string; created_at: string | null }[];
  created_at: string | null;
  updated_at: string | null;
}

export interface ActivityEntry {
  description: string;
  event: string;
  created_at: string | null;
}

export interface EmployeeReportRow {
  id: number;
  name: string;
  email: string;
  job_title: string | null;
  department: string | null;
  designation: string | null;
  employee_id: string | null;
  avatar_url: string | null;
  roles: string[];
  role: string | null;
  assigned_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  assigned_subtasks: number;
  completed_subtasks: number;
  overdue_tasks: number;
  meeting_count: number;
  project_count: number;
  total_hours: number;
  average_completion_time: number | null;
  productivity_score: number;
  completion_rate: number;
  recent_activity: ActivityEntry[];
  created_at: string | null;
}

export interface ReportPreview {
  type: string;
  data: Record<string, unknown>;
}

export interface AnalyticsData {
  project_progress: {
    name: string;
    progress: number;
    total_tasks: number;
    completed_tasks: number;
    pending_tasks: number;
    status: string;
  }[];
  task_completion: { status: string; count: number }[];
  task_priority_distribution: { priority: string; count: number }[];
  employee_productivity: {
    name: string;
    assigned: number;
    completed: number;
    overdue: number;
    completion_rate: number;
    productivity_score: number;
  }[];
  workload_distribution: { name: string; Total: number; Completed: number; Pending: number }[];
  completion_trends: { month: string; completed: number }[];
  time_tracking: { name: string; estimated_hours: number }[];
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export const reportsService = {
  getReports: (params: ReportsQueryParams) =>
    api
      .get<{ data: PaginatedResponse<unknown>; tab: string }>("/reports", { params })
      .then((r) => r.data),

  getPreview: (reportType: string, itemId: number) =>
    api.get<ReportPreview>(`/reports/${reportType}/${itemId}/preview`).then((r) => r.data),

  exportReport: (params: ReportsQueryParams & { format: string }) =>
    api.get("/reports/export", { params, responseType: "blob" }).then((r) => r.data),

  exportPreviewPdf: async (reportType: string, itemId: number) => {
    const blob = await api
      .get(`/reports/${reportType}/${itemId}/export/pdf`, { responseType: "blob" })
      .then((r) => r.data);
    downloadBlob(blob, `${reportType}-${itemId}-report.pdf`);
  },

  exportPreviewDocx: async (reportType: string, itemId: number) => {
    const blob = await api
      .get(`/reports/${reportType}/${itemId}/export/docx`, { responseType: "blob" })
      .then((r) => r.data);
    downloadBlob(blob, `${reportType}-${itemId}-report.docx`);
  },

  getAnalytics: () => api.get<AnalyticsData>("/reports/analytics").then((r) => r.data),
};
