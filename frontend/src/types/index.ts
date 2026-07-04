export interface User {
  id: number;
  name: string;
  email: string;
  job_title?: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  inherit_role_permissions: boolean;
  email_verified_at?: string;
  last_login_at?: string;
  last_login_ip?: string;
  created_at: string;
  updated_at?: string;
  deleted_at?: string;
  role?: string;
  role_label?: string;
  is_super_admin: boolean;
  permissions?: string[];
  effective_permissions?: string[];
  roles?: Role[];
  department?: string;
  designation?: string;
  employee_id?: string;
  reporting_manager_id?: number;
}

export interface Role {
  id: number;
  name: string;
  guard_name: string;
  description?: string;
  color?: string;
  icon?: string;
  is_active: boolean;
  is_system: boolean;
  permissions?: Permission[];
  permission_ids?: number[];
  user_count?: number;
  created_at: string;
}

export interface Permission {
  id: number;
  name: string;
  guard_name: string;
  group?: string;
  label?: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  status: string;
  status_label?: string;
  priority: string;
  priority_label?: string;
  budget?: number;
  start_date?: string;
  deadline?: string;
  end_date?: string;
  author_id?: number;
  pm_id?: number;
  lead_id?: number;
  figma_url?: string;
  github_url?: string;
  docs_url?: string;
  meeting_url?: string;
  created_at: string;
  updated_at?: string;
  deleted_at?: string;
  author?: UserBrief;
  project_manager?: UserBrief;
  team_lead?: UserBrief;
  member_count?: number;
  members?: ProjectMember[];
  member_ids?: number[];
  members_count?: number;
}

export interface ProjectMember {
  id: number;
  project_id: number;
  user_id: number;
  role: string;
  user?: UserBrief;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  status_label?: string;
  priority: string;
  priority_label?: string;
  tags?: string[];
  blocked_reason?: string;
  due_date?: string;
  employee_eta?: string;
  estimated_hours?: number;
  project_id: number;
  project_name?: string;
  author_id?: number;
  author?: UserBrief;
  assignee?: UserBrief;
  assignees?: UserBrief[];
  assignee_id?: number;
  parent_id?: number;
  requires_approval: boolean;
  approver_id?: number;
  rejection_reason?: string;
  approved_at?: string;
  created_at: string;
  updated_at?: string;
  deleted_at?: string;
  comment_count?: number;
  subtask_count?: number;
  dependencies?: TaskBrief[];
  dependents?: TaskBrief[];
  subtasks?: Task[];
  comments?: Comment[];
  approval_status?: string;
  subtask_completion_rate?: number;
}

export interface TaskBrief {
  id: number;
  title: string;
  status: string;
  assignees?: UserBrief[];
}

export interface Comment {
  id: number;
  body: string;
  task_id: number;
  project_id?: number;
  parent_id?: number;
  author?: UserBrief;
  mentions?: Mention[];
  replies?: Comment[];
  created_at: string;
  updated_at?: string;
}

export interface Mention {
  id: number;
  user_id: number;
  comment_id: number;
  username?: string;
  created_at?: string;
}

export interface Meeting {
  id: number;
  project_id: number;
  project_name?: string;
  author?: UserBrief;
  organizer?: UserBrief;
  title: string;
  meeting_date: string;
  location?: string;
  recording_link?: string;
  next_meeting_date?: string;
  related_task_id?: number;
  attendees?: string[];
  summary: string;
  decisions_taken?: string;
  blockers?: string;
  action_items?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  priority: string;
  status: string;
  author?: UserBrief;
  published_at?: string;
  created_at: string;
  updated_at?: string;
  target_type?: string;
  target_id?: number;
  is_pinned?: boolean;
}


export interface Attachment {
  id: number;
  uuid: string;
  model_type: string;
  model_id: number;
  collection_name: string;
  name: string;
  file_name: string;
  mime_type?: string;
  disk: string;
  size: number;
  order_column?: number;
  created_at: string;
  url: string;
}

export interface ActivityLog {
  id: number;
  log_name?: string;
  description: string;
  subject_type?: string;
  subject_id?: number;
  causer_type?: string;
  causer_id?: number;
  properties?: Record<string, unknown>;
  event?: string;
  batch_uuid?: string;
  created_at: string;
}

export interface UserBrief {
  id: number;
  name: string;
  email?: string;
  job_title?: string;
  avatar_url?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface DashboardStats {
  active_projects: number;
  tasks_due_this_week: number;
  pending_reviews: number;
  trends: {
    active_projects: number;
    tasks_due_this_week: number;
    pending_reviews: number;
  };
}

export type TaskStatusValue = "backlog" | "todo" | "in_progress" | "in_review" | "approved" | "done" | "cancelled" | "blocked";
export type TaskPriorityValue = "low" | "medium" | "high" | "urgent";
export type ProjectStatusValue = "active" | "on_hold" | "completed" | "archived";
export type ProjectPriorityValue = "low" | "medium" | "high" | "urgent";
