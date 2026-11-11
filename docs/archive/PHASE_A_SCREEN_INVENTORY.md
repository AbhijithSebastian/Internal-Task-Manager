# Phase A — Screen Inventory

> **Status:** Complete
> **Total Screens:** 47
> **API Endpoints:** 95 (across 18 routers)
> **Base:** PRD v2.2, Information Architecture, Layout System

---

## Screen Index

| # | Screen | Route | Parent Module | Priority |
|---|--------|-------|---------------|----------|
| S01 | Login | `/auth/login` | Auth | P0 — Critical |
| S02 | Register | `/auth/register` | Auth | P0 — Critical |
| S03 | Forgot Password | `/auth/forgot-password` | Auth | P1 — High |
| S04 | Reset Password | `/auth/reset-password` | Auth | P1 — High |
| S05 | Smart Home Dashboard | `/dashboard` | Dashboard | P0 — Critical |
| S06 | Project List | `/work/projects` | Projects | P0 — Critical |
| S07 | Project Create | `/work/projects/new` | Projects | P0 — Critical |
| S08 | Project Workspace | `/work/projects/{id}` | Projects | P0 — Critical |
| S09 | Project Settings | `/work/projects/{id}/settings` | Projects | P1 — High |
| S10 | Task List | `/work/tasks` | Tasks | P0 — Critical |
| S11 | Task Detail | `/work/tasks/{id}` | Tasks | P0 — Critical |
| S12 | Task Create | `/work/tasks/new` | Tasks | P0 — Critical |
| S13 | Calendar | `/work/calendar` | Calendar | P1 — High |
| S14 | Milestones | `/work/milestones` | Milestones | P2 — Medium |
| S15 | People Directory | `/team/people` | People | P0 — Critical |
| S16 | User Profile | `/team/people/{id}` | People | P1 — High |
| S17 | User Create | `/administration/users/new` | Admin — Users | P1 — High |
| S18 | User Edit | `/administration/users/{id}` | Admin — Users | P1 — High |
| S19 | Meeting List | `/workspace/meetings` | Meetings | P1 — High |
| S20 | Meeting Detail | `/workspace/meetings/{id}` | Meetings | P1 — High |
| S21 | Meeting Create | `/workspace/meetings/new` | Meetings | P1 — High |
| S22 | Announcement List | `/workspace/announcements` | Announcements | P1 — High |
| S23 | Announcement Detail | `/workspace/announcements/{id}` | Announcements | P1 — High |
| S24 | Announcement Create | `/workspace/announcements/new` | Announcements | P1 — High |
| S25 | Notifications | `/workspace/notifications` | Notifications | P0 — Critical |
| S26 | Activity Timeline | `/workspace/activity` | Activity | P1 — High |
| S27 | Analytics Center | `/analytics` | Analytics | P1 — High |
| S28 | Project Health Report | `/analytics/project-health` | Analytics | P1 — High |
| S29 | Team Velocity Report | `/analytics/team-velocity` | Analytics | P1 — High |
| S30 | Workload Report | `/analytics/workload` | Analytics | P1 — High |
| S31 | Trends Report | `/analytics/trends` | Analytics | P2 — Medium |
| S32 | Exports | `/analytics/exports` | Analytics | P2 — Medium |
| S33 | Roles List | `/administration/roles` | Admin — Roles | P0 — Critical |
| S34 | Role Detail | `/administration/roles/{id}` | Admin — Roles | P0 — Critical |
| S35 | Role Create | `/administration/roles/new` | Admin — Roles | P1 — High |
| S36 | Permission Matrix | `/administration/permissions` | Admin — Permissions | P1 — High |
| S37 | Integration List | `/administration/integrations` | Admin — Integrations | P1 — High |
| S38 | Integration Detail | `/administration/integrations/{id}` | Admin — Integrations | P1 — High |
| S39 | Integration Create | `/administration/integrations/new` | Admin — Integrations | P1 — High |
| S40 | Settings — Profile | `/administration/settings/profile` | Settings | P0 — Critical |
| S41 | Settings — Account | `/administration/settings/account` | Settings | P1 — High |
| S42 | Settings — Workspace | `/administration/settings/workspace` | Settings | P2 — Medium |
| S43 | Settings — Notifications | `/administration/settings/notifications` | Settings | P2 — Medium |
| S44 | Settings — Appearance | `/administration/settings/appearance` | Settings | P2 — Medium |
| S45 | 404 Not Found | `*` | System | P0 — Critical |
| S46 | Error Boundary | `*` | System | P0 — Critical |
| S47 | Onboarding | `/onboarding` | System | P2 — Medium |

---

## Screen Specifications

### S01 — Login

| Field | Value |
|-------|-------|
| **Route** | `/auth/login` |
| **User Roles** | All (unauthenticated) |
| **Parent Module** | Auth |
| **Primary Goal** | Authenticate user and establish session |
| **Secondary Goals** | Password recovery entry point, registration entry point |
| **Entry Points** | Direct URL, session expiry redirect, logout redirect |
| **Exit Points** | Successful login → redirect to `/dashboard`, forgot password → `/auth/forgot-password`, register → `/auth/register` |
| **Related Screens** | S02 Register, S03 Forgot Password, S04 Reset Password |
| **Dependencies** | None |
| **Required API Endpoints** | `POST /api/v1/auth/login` |
| **Required Permissions** | None (public) |

### S02 — Register

| Field | Value |
|-------|-------|
| **Route** | `/auth/register` |
| **User Roles** | All (unauthenticated) |
| **Parent Module** | Auth |
| **Primary Goal** | Create a new user account |
| **Secondary Goals** | — |
| **Entry Points** | Direct URL, login page "Don't have account?" link |
| **Exit Points** | Successful registration → redirect to `/dashboard`, back to login |
| **Related Screens** | S01 Login |
| **Dependencies** | None |
| **Required API Endpoints** | `POST /api/v1/auth/register` |
| **Required Permissions** | None (public) |

### S03 — Forgot Password

| Field | Value |
|-------|-------|
| **Route** | `/auth/forgot-password` |
| **User Roles** | All (unauthenticated) |
| **Parent Module** | Auth |
| **Primary Goal** | Request password reset email |
| **Secondary Goals** | — |
| **Entry Points** | Login page "Forgot password?" link |
| **Exit Points** | Email sent → confirmation view, back to login |
| **Related Screens** | S01 Login, S04 Reset Password |
| **Dependencies** | Email service |
| **Required API Endpoints** | `POST /api/v1/auth/forgot-password` |
| **Required Permissions** | None (public) |

### S04 — Reset Password

| Field | Value |
|-------|-------|
| **Route** | `/auth/reset-password` |
| **User Roles** | All (unauthenticated, with valid token) |
| **Parent Module** | Auth |
| **Primary Goal** | Set new password using reset token |
| **Secondary Goals** | — |
| **Entry Points** | Email reset link |
| **Exit Points** | Success → redirect to login, invalid/expired token → error state |
| **Related Screens** | S01 Login, S03 Forgot Password |
| **Dependencies** | Email service, valid reset token |
| **Required API Endpoints** | `POST /api/v1/auth/reset-password` |
| **Required Permissions** | None (token-gated) |

### S05 — Smart Home Dashboard

| Field | Value |
|-------|-------|
| **Route** | `/dashboard` |
| **User Roles** | All (role-adaptive content) |
| **Parent Module** | Dashboard |
| **Primary Goal** | Answer three questions: What's happening? What needs attention? What can I do next? |
| **Secondary Goals** | Quick access to recent tasks, upcoming schedule, notifications summary, project health (PM+), team activity (TL+), system status (admin) |
| **Entry Points** | Post-login redirect, sidebar "Dashboard" link, logo click |
| **Exit Points** | Click any widget item → entity detail (drawer or page), new action via header |
| **Related Screens** | S06, S10, S11, S15, S19, S22, S25, S26, S27, S33, S40 |
| **Dependencies** | Tasks, Projects, Meetings, Notifications, Activity, Announcements modules must have data |
| **Required API Endpoints** | `GET /api/v1/dashboard/stats`, `GET /api/v1/dashboard/role-data`, `GET /api/v1/dashboard/projects`, `GET /api/v1/dashboard/activities`, `GET /api/v1/tasks?filter=today` (for My Tasks), `GET /api/v1/notifications/count` |
| **Required Permissions** | None (authenticated) — data scoped by role |

### S06 — Project List

| Field | Value |
|-------|-------|
| **Route** | `/work/projects` |
| **User Roles** | super-admin, project-manager, team-lead (view) |
| **Parent Module** | Projects |
| **Primary Goal** | Browse, search, and filter all projects |
| **Secondary Goals** | View project health at a glance, navigate to project workspace, create new project |
| **Entry Points** | Sidebar "Projects", dashboard project health widget, project count KPI click |
| **Exit Points** | Click project → S08 Project Workspace, click "+ New" → S07 Project Create, click user avatar → S16 User Profile |
| **Related Screens** | S05, S07, S08, S09, S16, S26 |
| **Dependencies** | None |
| **Required API Endpoints** | `GET /api/v1/projects`, `GET /api/v1/projects/search` |
| **Required Permissions** | `projects.list` (authenticated) |

### S07 — Project Create

| Field | Value |
|-------|-------|
| **Route** | `/work/projects/new` |
| **User Roles** | super-admin, project-manager |
| **Parent Module** | Projects |
| **Primary Goal** | Create new project with configuration |
| **Secondary Goals** | Add initial members, set dates, configure status |
| **Entry Points** | S06 Project List "+ New" button, header "New" menu → "New Project", dashboard quick action |
| **Exit Points** | Save → redirect to S08 Project Workspace, Cancel → return to S06 Project List |
| **Related Screens** | S06, S08 |
| **Dependencies** | None |
| **Required API Endpoints** | `POST /api/v1/projects` |
| **Required Permissions** | `projects.create` |

### S08 — Project Workspace

| Field | Value |
|-------|-------|
| **Route** | `/work/projects/{id}` |
| **User Roles** | super-admin, project-manager, team-lead (view), employee (member, view) |
| **Parent Module** | Projects |
| **Primary Goal** | Single source of truth for all project activity, tasks, members, timeline, and settings |
| **Secondary Goals** | Track progress via overview KPIs, manage tasks within project scope, manage members, view timeline/milestones, review reports, audit activity |
| **Entry Points** | S06 Project List card/row click, dashboard project health widget, task project link, notification entity link |
| **Exit Points** | Tab navigation stays in workspace, click task → S11 Task Detail (drawer or page), click member → S16 User Profile, click meeting → S20 Meeting Detail |
| **Related Screens** | S06, S07, S09, S10, S11, S12, S14, S16, S20, S22, S26, S28, S40 |
| **Dependencies** | Project must exist (404 if deleted) |
| **Required API Endpoints** | `GET /api/v1/projects/{project_id}`, `GET /api/v1/projects/{project_id}/members`, `GET /api/v1/tasks?project_id={id}`, `GET /api/v1/activity?resource=project&resource_id={id}`, `GET /api/v1/milestones?project_id={id}`, `GET /api/v1/attachments?project_id={id}`, `GET /api/v1/reports/project/{project_id}/preview` |
| **Required Permissions** | `projects.read` (authenticated) — tab content adapts per role |

### S09 — Project Settings

| Field | Value |
|-------|-------|
| **Route** | `/work/projects/{id}/settings` (tab within S08) |
| **User Roles** | super-admin, project-manager |
| **Parent Module** | Projects |
| **Primary Goal** | Update project configuration |
| **Secondary Goals** | Archive/delete project, manage status |
| **Entry Points** | S08 Project Workspace → Settings tab |
| **Exit Points** | Save → stay on settings with toast, Delete → confirm → redirect to S06 Project List |
| **Related Screens** | S06, S08 |
| **Dependencies** | Project must exist |
| **Required API Endpoints** | `PUT /api/v1/projects/{project_id}`, `PATCH /api/v1/projects/{project_id}/status`, `PATCH /api/v1/projects/{project_id}/archive`, `DELETE /api/v1/projects/{project_id}` |
| **Required Permissions** | `projects.update`, `projects.delete` |

### S10 — Task List

| Field | Value |
|-------|-------|
| **Route** | `/work/tasks` |
| **User Roles** | All (filtered by ownership/role) |
| **Parent Module** | Tasks |
| **Primary Goal** | Browse, search, filter, and manage tasks across views |
| **Secondary Goals** | Quick status changes, bulk operations, view switching (list/board/calendar), approval queue management (TL+), task creation |
| **Entry Points** | Sidebar "Tasks", dashboard My Tasks/Team Tasks widget click, project tasks tab, notification entity link |
| **Exit Points** | Click task → S11 Task Detail (drawer), click project link → S08 Project Workspace, click assignee → S16 User Profile, "+ New" → S12 Task Create |
| **Related Screens** | S05, S08, S11, S12, S13, S16, S26 |
| **Dependencies** | None |
| **Required API Endpoints** | `GET /api/v1/tasks`, `GET /api/v1/tasks/parents`, `PATCH /api/v1/tasks/{task_id}/status` (inline), `POST /api/v1/tasks/{task_id}/assign` (inline) |
| **Required Permissions** | `tasks.list` (authenticated) — data scoped by role |

### S11 — Task Detail

| Field | Value |
|-------|-------|
| **Route** | `/work/tasks/{id}` (full page) / drawer (from list) |
| **User Roles** | All (assigned/watcher/creator/member) |
| **Parent Module** | Tasks |
| **Primary Goal** | Complete task collaboration hub — view, update, comment, approve, log time |
| **Secondary Goals** | View activity history, manage attachments, manage subtasks, manage dependencies, submit for approval, log time |
| **Entry Points** | S10 Task List task click, S08 Project Workspace task click, dashboard task click, notification entity click, S26 Activity entity click |
| **Exit Points** | Close drawer → return to list, click project → S08 Project Workspace, click assignee → S16 User Profile, click attachment download |
| **Related Screens** | S08, S10, S12, S16, S26 |
| **Dependencies** | Task must exist |
| **Required API Endpoints** | `GET /api/v1/tasks/{task_id}`, `PUT /api/v1/tasks/{task_id}`, `PATCH /api/v1/tasks/{task_id}/status`, `POST /api/v1/tasks/{task_id}/assign`, `POST /api/v1/tasks/{task_id}/submit-for-review`, `POST /api/v1/tasks/{task_id}/approve`, `POST /api/v1/tasks/{task_id}/reject`, `POST /api/v1/tasks/{task_id}/block`, `POST /api/v1/tasks/{task_id}/unblock`, `POST /api/v1/tasks/{task_id}/subtasks`, `DELETE /api/v1/tasks/{task_id}/subtasks/{subtask_id}`, `POST /api/v1/tasks/{task_id}/dependencies`, `DELETE /api/v1/tasks/{task_id}/dependencies/{dependency_id}`, `GET /api/v1/comments?task_id={id}`, `POST /api/v1/comments` (task scope), `GET /api/v1/attachments?task_id={id}`, `POST /api/v1/attachments/upload` (task scope) |
| **Required Permissions** | `tasks.read` (authenticated) |

### S12 — Task Create

| Field | Value |
|-------|-------|
| **Route** | `/work/tasks/new` |
| **User Roles** | All |
| **Parent Module** | Tasks |
| **Primary Goal** | Create a new task |
| **Secondary Goals** | Set assignee, project, priority, due date, description, attachments |
| **Entry Points** | S10 Task List "+ New" button, header "New" menu → "New Task", S08 Project Workspace → Tasks tab "New Task", dashboard quick action |
| **Exit Points** | Save → redirect to S11 Task Detail (or back to list), Cancel → return to previous screen |
| **Related Screens** | S08, S10, S11 |
| **Dependencies** | At least one project must exist (if required) |
| **Required API Endpoints** | `POST /api/v1/tasks`, `GET /api/v1/users/search` (assignee picker), `GET /api/v1/projects` (project picker) |
| **Required Permissions** | `tasks.create` |

### S13 — Calendar

| Field | Value |
|-------|-------|
| **Route** | `/work/calendar` |
| **User Roles** | All |
| **Parent Module** | Calendar |
| **Primary Goal** | Unified view of all time-based entities (tasks, meetings, milestones) |
| **Secondary Goals** | Navigate month/week/day views, click entity to open detail, filter by project/type |
| **Entry Points** | Sidebar "Calendar", dashboard schedule widget, meeting/notification date links |
| **Exit Points** | Click event → S11 Task Detail or S20 Meeting Detail or S14 Milestone detail (drawer), click "+" → create meeting/milestone form |
| **Related Screens** | S05, S10, S11, S14, S19, S20 |
| **Dependencies** | Tasks, Meetings, Milestones modules must have data |
| **Required API Endpoints** | `GET /api/v1/tasks?date_range=month`, `GET /api/v1/meetings?date_range=month`, `GET /api/v1/milestones?date_range=month` |
| **Required Permissions** | None (authenticated) — data scoped by membership/assignment |

### S14 — Milestones

| Field | Value |
|-------|-------|
| **Route** | `/work/milestones` |
| **User Roles** | super-admin, project-manager |
| **Parent Module** | Milestones |
| **Primary Goal** | Cross-project milestone timeline view |
| **Secondary Goals** | Track key dates, navigate to project workspace |
| **Entry Points** | Sidebar (if visible), S08 Project Workspace → Timeline tab, dashboard milestone widget |
| **Exit Points** | Click milestone → S08 Project Workspace (scoped to milestone), click project → S08 |
| **Related Screens** | S08, S13 |
| **Dependencies** | Milestones module backend |
| **Required API Endpoints** | `GET /api/v1/milestones` |
| **Required Permissions** | `projects.read` |

### S15 — People Directory

| Field | Value |
|-------|-------|
| **Route** | `/team/people` |
| **User Roles** | All |
| **Parent Module** | People |
| **Primary Goal** | Find and view company directory |
| **Secondary Goals** | Search users, view role/department, navigate to user profile |
| **Entry Points** | Sidebar "People", dashboard team size widget, @mention user picker, assignee selector |
| **Exit Points** | Click user → S16 User Profile, click email → mailto: link |
| **Related Screens** | S05, S16, S17, S18, S26 |
| **Dependencies** | None |
| **Required API Endpoints** | `GET /api/v1/users`, `GET /api/v1/users/search` |
| **Required Permissions** | `users.list` (authenticated) |

### S16 — User Profile

| Field | Value |
|-------|-------|
| **Route** | `/team/people/{id}` |
| **User Roles** | All (public info) |
| **Parent Module** | People |
| **Primary Goal** | View user details, activity, and assigned work |
| **Secondary Goals** | See assigned tasks, recent activity, role/permissions (admin) |
| **Entry Points** | S15 People Directory user click, assignee avatar click (any screen), @mention link, notification actor click |
| **Exit Points** | Click task → S11 Task Detail, click meeting → S20 Meeting Detail, close → return to previous screen |
| **Related Screens** | S10, S11, S15, S17, S18, S19, S26 |
| **Dependencies** | User must exist |
| **Required API Endpoints** | `GET /api/v1/users/{user_id}`, `GET /api/v1/tasks?assignee_id={id}`, `GET /api/v1/activity?actor_id={id}` |
| **Required Permissions** | `users.read` (authenticated) |

### S17 — User Create

| Field | Value |
|-------|-------|
| **Route** | `/administration/users/new` |
| **User Roles** | super-admin |
| **Parent Module** | Admin — Users |
| **Primary Goal** | Create new user account from admin panel |
| **Secondary Goals** | Set initial role, activate account |
| **Entry Points** | S15 People Directory (admin only: "+ New" button), S18 User Edit section |
| **Exit Points** | Save → redirect to S16 User Profile or S18 User Edit, Cancel → return to S15 |
| **Related Screens** | S15, S16, S18 |
| **Dependencies** | Roles module for role dropdown |
| **Required API Endpoints** | `POST /api/v1/users`, `GET /api/v1/roles` (role picker) |
| **Required Permissions** | `users.create` |

### S18 — User Edit

| Field | Value |
|-------|-------|
| **Route** | `/administration/users/{id}` |
| **User Roles** | super-admin |
| **Parent Module** | Admin — Users |
| **Primary Goal** | Edit user profile, role, permissions, activation status |
| **Secondary Goals** | Toggle active status, change role, reset password (admin-initiated) |
| **Entry Points** | S15 People Directory user action menu "Edit", S16 User Profile (admin only: "Edit" button) |
| **Exit Points** | Save → stay with toast, Delete → confirm → redirect to S15 |
| **Related Screens** | S15, S16, S17, S34 |
| **Dependencies** | User must exist |
| **Required API Endpoints** | `PUT /api/v1/users/{user_id}`, `POST /api/v1/users/{user_id}/toggle-active`, `DELETE /api/v1/users/{user_id}`, `POST /api/v1/users/{user_id}/restore`, `GET /api/v1/permissions/users/{user_id}`, `PUT /api/v1/permissions/users/{user_id}/role` |
| **Required Permissions** | `users.update`, `users.delete`, `permissions.manage` |

### S19 — Meeting List

| Field | Value |
|-------|-------|
| **Route** | `/workspace/meetings` |
| **User Roles** | All |
| **Parent Module** | Meetings |
| **Primary Goal** | Browse and search upcoming/past meetings |
| **Secondary Goals** | View meeting details, join meetings, create new meetings |
| **Entry Points** | Sidebar "Meetings", dashboard schedule widget, calendar meeting click |
| **Exit Points** | Click meeting → S20 Meeting Detail (drawer), "+ New" → S21 Meeting Create |
| **Related Screens** | S05, S13, S20, S21 |
| **Dependencies** | None |
| **Required API Endpoints** | `GET /api/v1/meetings` |
| **Required Permissions** | None (authenticated) |

### S20 — Meeting Detail

| Field | Value |
|-------|-------|
| **Route** | `/workspace/meetings/{id}` |
| **User Roles** | All (organizer + attendees) |
| **Parent Module** | Meetings |
| **Primary Goal** | View meeting agenda, notes, action items, and attendee list |
| **Secondary Goals** | Take notes during meeting, create action items via @mention, convert action items to tasks, track attendance |
| **Entry Points** | S19 Meeting List click, S13 Calendar event click, notification reminder click, S08 Project Workspace → Meetings tab |
| **Exit Points** | Close → return to list, click task → S11 Task Detail (from action item), click user → S16 User Profile |
| **Related Screens** | S10, S11, S13, S16, S19, S21 |
| **Dependencies** | Meeting must exist |
| **Required API Endpoints** | `GET /api/v1/meetings/{meeting_id}`, `PUT /api/v1/meetings/{meeting_id}`, `DELETE /api/v1/meetings/{meeting_id}`, `POST /api/v1/tasks` (action item → task conversion) |
| **Required Permissions** | None (authenticated) — organizer/attendee check in UI |

### S21 — Meeting Create

| Field | Value |
|-------|-------|
| **Route** | `/workspace/meetings/new` |
| **User Roles** | All |
| **Parent Module** | Meetings |
| **Primary Goal** | Schedule a new meeting |
| **Secondary Goals** | Set agenda, add attendees, link to project |
| **Entry Points** | S19 Meeting List "+ New" button, header "New" menu → "New Meeting", S08 Project Workspace → Meetings tab "New Meeting" |
| **Exit Points** | Save → redirect to S20 Meeting Detail, Cancel → return to S19 |
| **Related Screens** | S08, S19, S20 |
| **Dependencies** | None |
| **Required API Endpoints** | `POST /api/v1/meetings`, `GET /api/v1/users/search` (attendee picker), `GET /api/v1/projects` (project link) |
| **Required Permissions** | None (authenticated) |

### S22 — Announcement List

| Field | Value |
|-------|-------|
| **Route** | `/workspace/announcements` |
| **User Roles** | All |
| **Parent Module** | Announcements |
| **Primary Goal** | Browse company announcements in card feed |
| **Secondary Goals** | Read announcements, create new (HR+), pin/unpin (admin) |
| **Entry Points** | Sidebar "Announcements", dashboard announcements widget, notification announcement link |
| **Exit Points** | Click announcement → S23 Announcement Detail, "+ New" → S24 Announcement Create |
| **Related Screens** | S05, S23, S24 |
| **Dependencies** | None |
| **Required API Endpoints** | `GET /api/v1/announcements` |
| **Required Permissions** | None (authenticated) — create requires `announcements.create` |

### S23 — Announcement Detail

| Field | Value |
|-------|-------|
| **Route** | `/workspace/announcements/{id}` |
| **User Roles** | All |
| **Parent Module** | Announcements |
| **Primary Goal** | Read full announcement content |
| **Secondary Goals** | View author, publish date, update/delete (author + admin) |
| **Entry Points** | S22 Announcement List card click, notification announcement click |
| **Exit Points** | Close → return to list, Edit → S24 Announcement Create (pre-filled), Delete → confirm → redirect to S22 |
| **Related Screens** | S22, S24 |
| **Dependencies** | Announcement must exist |
| **Required API Endpoints** | `PUT /api/v1/announcements/{announcement_id}` (update), `DELETE /api/v1/announcements/{announcement_id}` |
| **Required Permissions** | None (authenticated) — update/delete requires `announcements.update` + author check |

### S24 — Announcement Create

| Field | Value |
|-------|-------|
| **Route** | `/workspace/announcements/new` |
| **User Roles** | hr, super-admin (announcements.create) |
| **Parent Module** | Announcements |
| **Primary Goal** | Create a new company announcement |
| **Secondary Goals** | Set audience (all/department/team), priority, rich text content |
| **Entry Points** | S22 Announcement List "+ New" button, header "New" menu → "New Announcement", dashboard quick action |
| **Exit Points** | Save → redirect to S23 Announcement Detail, Cancel → return to S22 |
| **Related Screens** | S22, S23 |
| **Dependencies** | None |
| **Required API Endpoints** | `POST /api/v1/announcements` |
| **Required Permissions** | `announcements.create` |

### S25 — Notifications

| Field | Value |
|-------|-------|
| **Route** | `/workspace/notifications` |
| **User Roles** | All |
| **Parent Module** | Notifications |
| **Primary Goal** | Categorized notification inbox — see everything that needs attention |
| **Secondary Goals** | Mark individual/ bulk read, filter by category (All, Unread, Mentions, Approvals), navigate to source entity |
| **Entry Points** | Header bell icon (unread count badge), sidebar "Notifications" (if linked) |
| **Exit Points** | Click notification → navigate to source entity (drawer or page), Mark all read → stay on page |
| **Related Screens** | S10, S11, S20, S23, S26 |
| **Dependencies** | Notification model must have data from all modules |
| **Required API Endpoints** | `GET /api/v1/notifications`, `GET /api/v1/notifications/count`, `PATCH /api/v1/notifications/{notification_id}/read`, `POST /api/v1/notifications/read-all` |
| **Required Permissions** | None (authenticated) — scoped to current user |

### S26 — Activity Timeline

| Field | Value |
|-------|-------|
| **Route** | `/workspace/activity` |
| **User Roles** | All |
| **Parent Module** | Activity |
| **Primary Goal** | Global timeline of all system activity |
| **Secondary Goals** | Filter by user, action type, resource type, date range, text search |
| **Entry Points** | Sidebar (if linked), dashboard recent activity widget "View All", S08 Project Workspace → Activity tab "View All" |
| **Exit Points** | Click user → S16 User Profile, click entity → S11/S20/S23 detail (drawer) |
| **Related Screens** | S05, S08, S11, S16, S20, S23 |
| **Dependencies** | Activity logs from all modules |
| **Required API Endpoints** | `GET /api/v1/activity` |
| **Required Permissions** | None (authenticated) |

### S27 — Analytics Center

| Field | Value |
|-------|-------|
| **Route** | `/analytics` |
| **User Roles** | super-admin, project-manager, team-lead |
| **Parent Module** | Analytics |
| **Primary Goal** | Landing page with overview charts and navigation to specific reports |
| **Secondary Goals** | View summary KPIs, see trends at a glance, navigate to detailed reports |
| **Entry Points** | Sidebar "Analytics", dashboard analytics widget |
| **Exit Points** | Click chart → S28/S29/S30/S31 specific report, click "Export" → S32 Exports |
| **Related Screens** | S05, S28, S29, S30, S31, S32 |
| **Dependencies** | Task, Project, Meeting data must exist for charts |
| **Required API Endpoints** | `GET /api/v1/reports` |
| **Required Permissions** | `reports.view` |

### S28 — Project Health Report

| Field | Value |
|-------|-------|
| **Route** | `/analytics/project-health` |
| **User Roles** | super-admin, project-manager, team-lead |
| **Parent Module** | Analytics |
| **Primary Goal** | Visual health assessment of all projects |
| **Secondary Goals** | Identify at-risk projects, view trend over time, export data |
| **Entry Points** | S27 Analytics Center chart click, S05 dashboard project health widget "View Report" |
| **Exit Points** | Click project → S08 Project Workspace, Click "Export" → S32 Exports |
| **Related Screens** | S05, S06, S08, S27, S32 |
| **Dependencies** | Task completion + project data |
| **Required API Endpoints** | `GET /api/v1/reports` (filtered), `GET /api/v1/reports/export` |
| **Required Permissions** | `reports.view` |

### S29 — Team Velocity Report

| Field | Value |
|-------|-------|
| **Route** | `/analytics/team-velocity` |
| **User Roles** | super-admin, project-manager, team-lead |
| **Parent Module** | Analytics |
| **Primary Goal** | Track team productivity over time |
| **Secondary Goals** | Compare periods, identify velocity changes, export |
| **Entry Points** | S27 Analytics Center chart click, S05 dashboard velocity widget (TL+) |
| **Exit Points** | Click data point → tooltip detail, "Export" → S32 |
| **Related Screens** | S05, S27, S32 |
| **Dependencies** | Task completion data with timestamps |
| **Required API Endpoints** | `GET /api/v1/reports` (filtered), `GET /api/v1/reports/export` |
| **Required Permissions** | `reports.view` |

### S30 — Workload Distribution Report

| Field | Value |
|-------|-------|
| **Route** | `/analytics/workload` |
| **User Roles** | super-admin, project-manager, team-lead |
| **Parent Module** | Analytics |
| **Primary Goal** | Visualize workload balance across team members |
| **Secondary Goals** | Identify overloaded/unallocated team members, export |
| **Entry Points** | S27 Analytics Center chart click, S08 Project Workspace → Reports tab |
| **Exit Points** | Click user → S16 User Profile, "Export" → S32 |
| **Related Screens** | S08, S16, S27, S32 |
| **Dependencies** | Task assignment + time tracking data |
| **Required API Endpoints** | `GET /api/v1/reports` (filtered), `GET /api/v1/reports/export` |
| **Required Permissions** | `reports.view` |

### S31 — Trends Report

| Field | Value |
|-------|-------|
| **Route** | `/analytics/trends` |
| **User Roles** | super-admin, project-manager |
| **Parent Module** | Analytics |
| **Primary Goal** | Long-term trends analysis (quarter over quarter) |
| **Secondary Goals** | Completion rate trends, cycle time trends, project health over time |
| **Entry Points** | S27 Analytics Center chart click |
| **Exit Points** | "Export" → S32, date range adjustment → chart update |
| **Related Screens** | S27, S28, S29, S32 |
| **Dependencies** | Historical data across multiple periods |
| **Required API Endpoints** | `GET /api/v1/reports` (with date range), `GET /api/v1/reports/export` |
| **Required Permissions** | `reports.view` |

### S32 — Exports

| Field | Value |
|-------|-------|
| **Route** | `/analytics/exports` |
| **User Roles** | super-admin, project-manager, team-lead |
| **Parent Module** | Analytics |
| **Primary Goal** | Export analytics data to CSV or PDF |
| **Secondary Goals** | Select date range, select report type, configure columns |
| **Entry Points** | S27/S28/S29/S30/S31 "Export" button, header quick action |
| **Exit Points** | Download starts → toast, Cancel → return to previous screen |
| **Related Screens** | S27, S28, S29, S30, S31 |
| **Dependencies** | Report generation backend |
| **Required API Endpoints** | `GET /api/v1/reports/export` |
| **Required Permissions** | `reports.export` |

### S33 — Roles List

| Field | Value |
|-------|-------|
| **Route** | `/administration/roles` |
| **User Roles** | super-admin |
| **Parent Module** | Admin — Roles |
| **Primary Goal** | View and manage all user roles |
| **Secondary Goals** | Create new roles, view role-member counts, navigate to role detail |
| **Entry Points** | Sidebar "Administration → Roles" |
| **Exit Points** | Click role → S34 Role Detail, "+ New" → S35 Role Create, click user count → S15 (filtered) |
| **Related Screens** | S15, S34, S35, S36 |
| **Dependencies** | None |
| **Required API Endpoints** | `GET /api/v1/roles` |
| **Required Permissions** | `permissions.view` |

### S34 — Role Detail

| Field | Value |
|-------|-------|
| **Route** | `/administration/roles/{id}` |
| **User Roles** | super-admin |
| **Parent Module** | Admin — Roles |
| **Primary Goal** | View role details and manage permissions |
| **Secondary Goals** | View members with this role, update permission set, rename role |
| **Entry Points** | S33 Roles List role click |
| **Exit Points** | Save permissions → toast, Delete → confirm → redirect to S33, click member → S16 User Profile |
| **Related Screens** | S16, S33, S35, S36 |
| **Dependencies** | Role must exist |
| **Required API Endpoints** | `GET /api/v1/roles/{role_id}`, `GET /api/v1/roles/{role_id}/permissions`, `PUT /api/v1/roles/{role_id}/permissions` |
| **Required Permissions** | `permissions.view`, `permissions.manage` (for updates) |

### S35 — Role Create

| Field | Value |
|-------|-------|
| **Route** | `/administration/roles/new` |
| **User Roles** | super-admin |
| **Parent Module** | Admin — Roles |
| **Primary Goal** | Create a new custom role |
| **Secondary Goals** | Set initial permissions, name, description |
| **Entry Points** | S33 Roles List "+ New" button |
| **Exit Points** | Save → redirect to S34 Role Detail, Cancel → return to S33 |
| **Related Screens** | S33, S34 |
| **Dependencies** | Permission model must be defined |
| **Required API Endpoints** | `POST /api/v1/roles` (if exists), permission listing endpoint |
| **Required Permissions** | `permissions.manage` |

### S36 — Permission Matrix

| Field | Value |
|-------|-------|
| **Route** | `/administration/permissions` |
| **User Roles** | super-admin |
| **Parent Module** | Admin — Permissions |
| **Primary Goal** | Full permission matrix view — resources × actions × roles |
| **Secondary Goals** | Audit who can do what, identify permission gaps |
| **Entry Points** | Sidebar "Administration → Permissions", S34 Role Detail "View Full Matrix" |
| **Exit Points** | Click cell → toggle permission (with confirm), return to S33/S34 |
| **Related Screens** | S33, S34 |
| **Dependencies** | All permission definitions must exist |
| **Required API Endpoints** | `GET /api/v1/permissions/users/{user_id}` (user-specific), role permissions aggregate |
| **Required Permissions** | `permissions.view` |

### S37 — Integration List

| Field | Value |
|-------|-------|
| **Route** | `/administration/integrations` |
| **User Roles** | super-admin |
| **Parent Module** | Admin — Integrations |
| **Primary Goal** | View and manage all external integrations |
| **Secondary Goals** | Trigger sync, view sync status, create new integration |
| **Entry Points** | Sidebar "Administration → Integrations", dashboard admin integration widget |
| **Exit Points** | Click integration → S38 Integration Detail, "+ New" → S39 Integration Create |
| **Related Screens** | S05, S38, S39 |
| **Dependencies** | None |
| **Required API Endpoints** | `GET /api/v1/integrations` |
| **Required Permissions** | None (authenticated) — admin sidebar hides for non-admin |

### S38 — Integration Detail

| Field | Value |
|-------|-------|
| **Route** | `/administration/integrations/{id}` |
| **User Roles** | super-admin |
| **Parent Module** | Admin — Integrations |
| **Primary Goal** | View integration configuration, status, and sync log |
| **Secondary Goals** | Trigger manual sync, update configuration, delete integration |
| **Entry Points** | S37 Integration List integration click |
| **Exit Points** | Delete → confirm → redirect to S37, Sync → sync executes with progress, Edit → update fields |
| **Related Screens** | S37, S39 |
| **Dependencies** | Integration must exist |
| **Required API Endpoints** | `GET /api/v1/integrations/{integration_id}`, `PUT /api/v1/integrations/{integration_id}`, `DELETE /api/v1/integrations/{integration_id}`, `POST /api/v1/integrations/{integration_id}/sync` |
| **Required Permissions** | None (authenticated) — admin only via sidebar access |

### S39 — Integration Create

| Field | Value |
|-------|-------|
| **Route** | `/administration/integrations/new` |
| **User Roles** | super-admin |
| **Parent Module** | Admin — Integrations |
| **Primary Goal** | Configure a new external integration |
| **Secondary Goals** | Test connection before saving, select integration type |
| **Entry Points** | S37 Integration List "+ New" button |
| **Exit Points** | Save → redirect to S38 Integration Detail, Cancel → return to S37 |
| **Related Screens** | S37, S38 |
| **Dependencies** | None |
| **Required API Endpoints** | `POST /api/v1/integrations`, `POST /api/v1/integrations/{integration_id}/sync` (test) |
| **Required Permissions** | `projects.update` (backend permission check) |

### S40 — Settings — Profile

| Field | Value |
|-------|-------|
| **Route** | `/administration/settings/profile` |
| **User Roles** | All (own profile) |
| **Parent Module** | Settings |
| **Primary Goal** | Edit personal profile information |
| **Secondary Goals** | Update name, avatar, bio, contact info |
| **Entry Points** | Header user avatar dropdown → "Profile", sidebar user section → "Settings" |
| **Exit Points** | Save → toast "Profile updated", switch tab → S41/S42/S43/S44 |
| **Related Screens** | S16, S41, S42, S43, S44 |
| **Dependencies** | None |
| **Required API Endpoints** | `PUT /api/v1/users/{user_id}` (self), `GET /api/v1/auth/me` |
| **Required Permissions** | None (authenticated) — self-service |

### S41 — Settings — Account

| Field | Value |
|-------|-------|
| **Route** | `/administration/settings/account` |
| **User Roles** | All (own account) |
| **Parent Module** | Settings |
| **Primary Goal** | Manage account security |
| **Secondary Goals** | Change password, view active sessions, enable 2FA (future) |
| **Entry Points** | S40 Settings → Account tab |
| **Exit Points** | Save → toast, switch tab → S40/S42/S43/S44, logout via session management |
| **Related Screens** | S01, S40, S42, S43, S44 |
| **Dependencies** | None |
| **Required API Endpoints** | `POST /api/v1/auth/forgot-password` (password change), `POST /api/v1/auth/logout` |
| **Required Permissions** | None (authenticated) — self-service |

### S42 — Settings — Workspace

| Field | Value |
|-------|-------|
| **Route** | `/administration/settings/workspace` |
| **User Roles** | super-admin |
| **Parent Module** | Settings |
| **Primary Goal** | Configure workspace-level settings |
| **Secondary Goals** | Update workspace name, logo, default settings |
| **Entry Points** | S40 Settings → Workspace tab (admin only) |
| **Exit Points** | Save → toast, switch tab |
| **Related Screens** | S40, S41, S43, S44 |
| **Dependencies** | Settings model (backend) |
| **Required API Endpoints** | `PUT /api/v1/settings/workspace` (new endpoint needed) |
| **Required Permissions** | `settings.update` |

### S43 — Settings — Notifications

| Field | Value |
|-------|-------|
| **Route** | `/administration/settings/notifications` |
| **User Roles** | All (own preferences) |
| **Parent Module** | Settings |
| **Primary Goal** | Configure personal notification preferences |
| **Secondary Goals** | Toggle notification types on/off, set email frequency |
| **Entry Points** | S40 Settings → Notifications tab |
| **Exit Points** | Save → toast, switch tab |
| **Related Screens** | S25, S40, S41, S42, S44 |
| **Dependencies** | Notification preferences model (backend) |
| **Required API Endpoints** | New endpoints needed: `GET /api/v1/settings/notifications`, `PUT /api/v1/settings/notifications` |
| **Required Permissions** | None (authenticated) — self-service |

### S44 — Settings — Appearance

| Field | Value |
|-------|-------|
| **Route** | `/administration/settings/appearance` |
| **User Roles** | All (personalization) |
| **Parent Module** | Settings |
| **Primary Goal** | Customize visual preferences |
| **Secondary Goals** | Toggle dark/light mode, set interface density, choose locale |
| **Entry Points** | S40 Settings → Appearance tab |
| **Exit Points** | Save → toast (theme applies immediately), switch tab |
| **Related Screens** | S40, S41, S42, S43 |
| **Dependencies** | LocalStorage + CSS variable switching (no backend needed) |
| **Required API Endpoints** | None (client-side) |
| **Required Permissions** | None (authenticated) |

### S45 — 404 Not Found

| Field | Value |
|-------|-------|
| **Route** | `*` (catch-all) |
| **User Roles** | All |
| **Parent Module** | System |
| **Primary Goal** | Inform user the requested page does not exist |
| **Secondary Goals** | Provide navigation options (Dashboard, Go Back) |
| **Entry Points** | Any invalid URL, deleted entity deep link |
| **Exit Points** | "Go to Dashboard" → S05, "Go Back" → browser history back |
| **Related Screens** | S05 |
| **Dependencies** | None |
| **Required API Endpoints** | None |
| **Required Permissions** | None |

### S46 — Error Boundary

| Field | Value |
|-------|-------|
| **Route** | `*` (React error boundary) |
| **User Roles** | All |
| **Parent Module** | System |
| **Primary Goal** | Gracefully handle uncaught runtime errors |
| **Secondary Goals** | Provide reload option, log error details to console |
| **Entry Points** | Any uncaught React error in any screen |
| **Exit Points** | "Reload" → re-mount section, "Go to Dashboard" → S05 |
| **Related Screens** | S05, S45 |
| **Dependencies** | None |
| **Required API Endpoints** | None |
| **Required Permissions** | None |

### S47 — Onboarding

| Field | Value |
|-------|-------|
| **Route** | `/onboarding` |
| **User Roles** | All (first-time users) |
| **Parent Module** | System |
| **Primary Goal** | Guide first-time users through workspace setup |
| **Secondary Goals** | Create first project, invite team members, explain key features |
| **Entry Points** | First login detection → redirect if no projects exist and user is new |
| **Exit Points** | Complete onboarding → redirect to S05 Dashboard, Skip → dismiss permanently |
| **Related Screens** | S05, S06, S07 |
| **Dependencies** | First-time user detection |
| **Required API Endpoints** | `GET /api/v1/projects` (to check if any exist), `POST /api/v1/projects` (quick create) |
| **Required Permissions** | None (authenticated) |

---

*End of Phase A — 47 Screens Identified*
