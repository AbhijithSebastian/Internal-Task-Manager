# Product Requirement Document: Internal Task Manager

**Version:** 2.2 (Final Refinement — Ready for Implementation Planning)
**Status:** Draft for Approval
**Author:** Principal Product & Design Team

---

## Table of Contents

1. [Product Vision & Principles](#1-product-vision--principles)
2. [Product Goals](#2-product-goals)
3. [User Personas](#3-user-personas)
4. [User Roles & Permissions](#4-user-roles--permissions)
5. [User Journeys (Implementation Drivers)](#5-user-journeys-implementation-drivers)
6. [Information Architecture](#6-information-architecture)
7. [Navigation & Workspace Context](#7-navigation--workspace-context)
8. [Smart Home Dashboard](#8-smart-home-dashboard)
9. [Standardized Module Pattern](#9-standardized-module-pattern)
10. [Module Architecture](#10-module-architecture)
11. [Cross-Module Relationships](#11-cross-module-relationships)
12. [Notification System](#12-notification-system)
13. [Activity Timeline](#13-activity-timeline)
14. [Analytics Center](#14-analytics-center)
15. [Collaboration Workflows](#15-collaboration-workflows)
16. [Empty States](#16-empty-states)
17. [Loading States](#17-loading-states)
18. [Error States](#18-error-states)
19. [Responsive & Mobile Behavior](#19-responsive--mobile-behavior)
20. [Accessibility (WCAG 2.2 AA)](#20-accessibility-wcag-22-aa)
21. [Enterprise Design System](#21-enterprise-design-system)
22. [Component Library](#22-component-library)
23. [User Flows](#23-user-flows)
24. [Feature Inventory](#24-feature-inventory)
25. [Phased Implementation Roadmap](#25-phased-implementation-roadmap)

---

## 1. Product Vision & Principles

### Vision

An internal task management platform that makes team coordination feel effortless, so employees can focus on doing their best work instead of managing tools. The Internal Task Manager is the central nervous system of the company — tracking who is working on what, surfacing what needs attention, and connecting people through transparent communication.

### Page Design Principle: Three Questions

**Every page in the application must immediately answer:**

1. **What is happening?** — Current state summary (KPI cards, counts, status indicators)
2. **What requires my attention?** — Overdue items, pending approvals, flagged tasks, mentions
3. **What can I do next?** — Primary actions, quick-create, contextual next steps

If a page cannot answer all three questions within the first 800px of viewport height, it must be redesigned before implementation. This principle overrides all other design preferences.

### Design Values

- **Calm clarity** — No flashing UI, no crowded dashboards. White space is structural.
- **Progressive disclosure** — Show summaries first, reveal detail on interaction.
- **Permission-aware** — Every screen adapts to the user's role; no greyed-out buttons.
- **Interconnected** — No page is an island. Navigation, breadcrumbs, and cross-references tie everything together.
- **Speed** — Skeleton screens, optimistic updates, keyboard shortcuts.

---

## 2. Product Goals

1. **Eliminate context-switching.** Every page tells the user what's happening, what needs attention, and what to do next — without opening other tabs.
2. **Surface what needs attention.** KPI cards, badges, overdue warnings, and notification counts make priorities obvious without searching.
3. **Support every stage of work.** From ideation (announcements, meetings) through execution (tasks, milestones) to reflection (analytics, activity logs).
4. **Scale from 5 to 5000 users.** Role-based dashboards ensure relevance at every level.
5. **Be self-explanatory.** Empty states, onboarding flows, contextual help eliminate training.
6. **Respect user permissions.** No forbidden errors — only relevant content is shown.
7. **Deliver value after every phase.** Each implementation phase produces a usable product increment.

---

## 3. User Personas

### Persona A: Executive (CEO, CTO, VP)
- **Needs:** High-level health. Who is falling behind? Are we on track?
- **Answers the three questions:** What's happening across the org? Which projects are at risk? Where should I focus attention?
- **Primary pages:** Executive Dashboard, Analytics Center, Activity

### Persona B: Project Manager
- **Needs:** Create/manage projects, track progress, generate reports, orchestrate delivery
- **Answers the three questions:** Are my projects on track? What's overdue? Who needs unblocking?
- **Primary pages:** PM Dashboard, Project Workspace, Tasks, Calendar, Analytics, Meetings

### Persona C: Team Lead
- **Needs:** Review team work, approve tasks, manage workload, coordinate with PM
- **Answers the three questions:** What is my team working on? What needs my approval? Who is overloaded?
- **Primary pages:** TL Dashboard, Tasks (review queue), Calendar, Meetings

### Persona D: Individual Contributor (Employee)
- **Needs:** See their tasks, update status, log time, attend meetings, collaborate
- **Answers the three questions:** What do I need to do today? What's overdue? What's next?
- **Primary pages:** Employee Dashboard, Tasks (My Tasks), Calendar, Announcements

### Persona E: HR / People Operations
- **Needs:** Manage people data, send announcements, schedule company events
- **Answers the three questions:** Who joined/departed? What needs communicating? Upcoming events?
- **Primary pages:** HR Dashboard, People, Announcements, Calendar

### Persona F: Administrator / IT
- **Needs:** Configure system, manage users/roles, audit activity, maintain integrations
- **Answers the three questions:** Is the system healthy? Are there security concerns? What changed?
- **Primary pages:** Admin Dashboard, Administration (Roles, Permissions, Integrations, Settings), Activity

---

## 4. User Roles & Permissions

### Role Definitions

| Role | Capabilities | Dashboard |
|------|-------------|-----------|
| **super-admin** | Full access — users, roles, permissions, integrations, settings, all data | Executive + Admin combined |
| **project-manager** | Create/edit/delete projects, manage members, all task ops, approvals, reports | PM Dashboard |
| **team-lead** | View team, create/assign/approve tasks within projects, view reports (team) | Team Lead Dashboard |
| **employee** | Own tasks only, submit for approval, log time, comment, upload, view announcements | Employee Dashboard |
| **hr** | Manage profiles, create announcements, schedule meetings, view people directory | HR Dashboard |

### Permission Model

RBAC with `resource.action` pattern. `is_super_admin=True` bypasses all checks.

---

## 5. User Journeys (Implementation Drivers)

The product is built around **five core user journeys**. Every feature exists to serve one or more of these journeys. The implementation roadmap (Section 25) is organized by journey coverage.

### Journey A: Employee Daily Workflow

```
Login → Smart Home Dashboard
         ├── What's happening: KPI cards (my tasks, due today, overdue)
         ├── Needs attention: overdue tasks highlighted in red
         ├── What's next: "Continue where you left off" — last opened task
         │
         ├── Open task from widget → Task Detail (full page)
         │     ├── Update status (Todo → In Progress)
         │     ├── Log time (2h)
         │     ├── Upload attachment (screenshot)
         │     ├── Add comment with @mention for reviewer
         │     └── Submit for approval
         │
         ├── Check bell → Notifications (categorized feed)
         │     ├── Read: task assigned notification
         │     └── Read: meeting reminder
         │
         ├── Join meeting via Calendar → Meeting Detail
         │     ├── View agenda
         │     ├── Review notes
         │     └── Action item assigned to me
         │
         └── End of day → Logout
```

### Journey B: Team Lead Management Workflow

```
Login → Team Lead Dashboard
         ├── KPI: team's tasks, pending review, overdue, completed this week
         ├── Attention: approval queue (number badge)
         │
         ├── Click approval queue → Task List (filtered: pending review)
         │     ├── Open task → Task Detail
         │     │     ├── Review description + attachments
         │     │     ├── Approve → status to Done
         │     │     └── Or Request Changes → comment required
         │     └── Bulk approve (select multiple)
         │
         ├── Calendar → check today's meetings
         │     ├── Open meeting → Meeting Detail
         │     │     ├── Take notes
         │     │     ├── @mention creates action items
         │     │     └── Convert action items to tasks
         │
         ├── Analytics Center → Team Velocity report
         │     └── Compare this week vs last week
         │
         └── Project Workspace → check health of active project
               ├── Overview tab → progress bar, overdue list
               └── Members tab → view who is overloaded
```

### Journey C: Project Manager Planning & Monitoring

```
Login → PM Dashboard
         ├── KPI: active projects, tasks in progress, overdue, upcoming milestones
         ├── Attention: projects with declining health (red dots)
         │
         ├── Click low-health project → Project Workspace
         │     ├── Overview tab → progress, overdue tasks, recent activity
         │     ├── Tasks tab → filter by overdue → bulk reassign
         │     ├── Timeline tab → milestone dates → adjust
         │     ├── Calendar tab → view all deadlines
         │     ├── Members tab → check who is overloaded
         │     └── Settings tab → update status, PM, dates
         │
         ├── Create new project via New menu
         │     ├── Full-page form → name, description, PM, dates, members
         │     ├── Redirect to Project Workspace → Overview tab
         │     ├── Create milestones (Timeline tab)
         │     ├── Create tasks (Tasks tab) → assign to members
         │     └── Schedule kickoff meeting (Meetings tab)
         │
         ├── Analytics Center → Project Health report
         │     └── Export CSV for exec review
         │
         └── Activity → review all changes since last check
```

### Journey D: Executive Weekly Review

```
Login → Executive Dashboard
         ├── KPI: projects, total tasks, overdue, team size (with trends)
         ├── Attention: project health chart → identify at-risk projects
         │
         ├── Click at-risk project → Project Workspace (read-only mode)
         │     ├── Overview tab → progress, overdue tasks
         │     └── Activity tab → what changed recently
         │
         ├── Analytics Center → Completion trends
         │     └── Compare quarter-over-quarter
         │
         └── Activity → global timeline → filter by date range
               └── Identify bottlenecks
```

### Journey E: Administrator Configuration

```
Login → Admin Dashboard
         ├── KPI: active users, active integrations, system health
         ├── Attention: failed integration syncs, pending invites
         │
         ├── People → search user → edit role
         ├── Roles → review permissions → adjust
         ├── Integrations → check sync status → reconfigure
         ├── Activity → filter by "system" → audit changes
         └── Settings → update workspace name, logo, defaults
```

---

## 6. Information Architecture

```
app.example.com/
│
├── /dashboard                    # Smart Home (role-adaptive personal workspace)
│
├── /work/
│   ├── /projects                 # Project hub (grid + table)
│   ├── /projects/{id}            # Project workspace (10 tabs)
│   ├── /tasks                    # Task hub (board / list / table / calendar)
│   ├── /tasks/{id}               # Task detail (collaboration hub)
│   ├── /calendar                 # Unified calendar (tasks, meetings, milestones)
│   └── /milestones               # Milestone timeline (cross-project)
│
├── /team/
│   └── /people                   # User directory
│       └── /people/{id}          # User profile
│
├── /analytics                    # Analytics Center
│   ├── /analytics/project-health
│   ├── /analytics/team-velocity
│   ├── /analytics/workload
│   ├── /analytics/trends
│   └── /analytics/exports
│
├── /workspace/
│   ├── /meetings                 # Meeting hub
│   │   └── /meetings/{id}        # Meeting detail (lifecycle)
│   ├── /announcements            # Announcements feed
│   │   └── /announcements/{id}   # Announcement detail
│   ├── /notifications            # Categorized notification inbox
│   └── /activity                 # Global timeline
│
├── /administration/
│   ├── /administration/roles
│   │   └── /administration/roles/{id}
│   ├── /administration/permissions
│   ├── /administration/integrations
│   │   └── /administration/integrations/{id}
│   └── /administration/settings
│       ├── /administration/settings/profile
│       ├── /administration/settings/account
│       ├── /administration/settings/workspace
│       ├── /administration/settings/notifications
│       └── /administration/settings/appearance
│
└── (no standalone search page)
```

---

## 7. Navigation & Workspace Context

### Workspace Context Bar

Every page includes a context bar beneath the header that answers "Where am I?" at a glance.

```
┌────────────────────────────────────────────────────────────────────────┐
│  Header: [← Back]  Breadcrumbs  │  [+] New ▼  │  🔔 3  │  👤 Alex ▼ │
├────────────────────────────────────────────────────────────────────────┤
│  Workspace Context:                                                  │
│  [🏢 All Projects] > [📋 Mobile App] > [🏁 Sprint 3] > [🔨 TSK-142] │
│  ─────────────────────────────────────────────────────────────        │
│  Project health: ●●●●○  |  PM: Alex  |  Due: Jun 30  |  6 members   │
└────────────────────────────────────────────────────────────────────────┘
│  Page Content...                                                       │
```

**Context Components:**
- **Breadcrumbs** — Full path from top-level section to current entity. Clickable at every level.
- **Context metadata** — For entity pages, show key info (health, owner, dates, counts) in a compact strip below breadcrumbs.
- **Current project indicator** — When inside a project context (tasks, meetings within a project), show project name + health.
- **Current sprint/milestone** — When filtered to a sprint context, show name and progress.

### Sidebar

```
┌──────────────────────────────────────┐
│ [Logo] Internal TM                   │  ← Click → Smart Home Dashboard
│                                      │
│ ◉ Smart Home                         │  ← Active indicator (dot)
│                                      │
│ WORK                                 │  ← Section label (not clickable)
│ ○ Projects            [12 active]   │  ← Live count badge
│ ○ Tasks                 [8 mine]    │
│ ○ Calendar                           │
│ ○ Milestones                         │
│                                      │
│ TEAM                                 │
│ ○ People                             │
│                                      │
│ ANALYTICS                            │
│ ○ Analytics Center                   │
│                                      │
│ WORKSPACE                            │
│ ○ Meetings                           │
│ ○ Announcements                      │
│ ○ Notifications         [5 unread]  │
│ ○ Activity                           │
│                                      │
│ ADMINISTRATION                       │  ← Hidden from Employee & HR
│ ○ Roles                 [4]         │
│ ○ Permissions                        │
│ ○ Integrations          [3 active]  │
│ ○ Settings                           │
│                                      │
│ ─────────────────────────────────── │
│ 👤 Alex Chen                      ▼ │
└──────────────────────────────────────┘
```

### "New" Quick-Action Menu

Header button that replaces global search:

```
[ + New ▼ ]
   ├── New Project     (→ /projects/new)
   ├── New Task        (→ drawer on current page context)
   ├── New Meeting     (→ /meetings/new)
   └── New Announcement (→ /announcements/new)
```

Keyboard shortcut: `N` (when not in an input). The menu adapts contextually — inside a project, "New Task" pre-fills the project field.

---

## 8. Smart Home Dashboard

### Design Principle

The dashboard is not a statistics page. It is a **personal workspace** that answers:

1. **What is happening?** — Your current workload, project health, team activity
2. **What requires your attention?** — Overdue tasks, pending approvals, unread notifications, declining projects
3. **What can you do next?** — Continue where you left off, suggested next tasks, quick-create buttons

### Dashboard Layout (Role-Adaptive)

Every variant follows this structure:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Smart Home                                    Good morning, Alex!          │
│  Your personal workspace                             [ + New ▼ ]            │
│                                                                              │
│ ┌────────────────────────────────────────────────────────────────────────┐  │
│ │ Continue Where You Left Off                                            │  │
│ │ ┌────────────────────────────────────────────────────────────────────┐ │  │
│ │ │ 📋 TSK-142: Design landing page — Status: In Progress              │ │  │
│ │ │   Last opened 5m ago. Click to resume.                             │ │  │
│ │ └────────────────────────────────────────────────────────────────────┘ │  │
│ └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐                    │
│ │ My Tasks  │ │ Due Today │ │ Overdue   │ │ Completed │  ← KPI row         │
│ │ 8         │ │ 3         │ │ 1         │ │ 5 this wk │                    │
│ │           │ │           │ │ 🔴 !      │ │           │                    │
│ └───────────┘ └───────────┘ └───────────┘ └───────────┘                    │
│                                                                              │
│ ┌────────────────────────────────┐ ┌────────────────────────────────────┐  │
│ │ 📋 My Upcoming Tasks          │ │ 📅 Today's Schedule                │  │
│ │ (next 7 days, sorted by due)  │ │                                    │  │
│ │                                │ │ ┌──────────────────────────────┐  │  │
│ │ ○ TSK-142: Design landing     │ │ │ 10:00 Team Standup           │  │  │
│ │     Due today ●●●●●○○  🔴     │ │ │ 02:00 Sprint Planning        │  │  │
│ │ ○ TSK-150: Fix auth bug       │ │ │ 04:00 1:1 with Sarah         │  │  │
│ │     Due tomorrow ○○○○○○       │ │ └──────────────────────────────┘  │  │
│ │ ○ TSK-151: Write API docs     │ │   [View Full Calendar →]         │  │
│ │     Due Fri ○○○○○○            │ └────────────────────────────────────┘  │
│ │                                │                                         │
│ │   [View All Tasks →]          │ ┌────────────────────────────────────┐  │
│ └────────────────────────────────┘ │ 🔔 Recent Notifications            │  │
│                                    │ ┌──────────────────────────────┐  │  │
│ ┌────────────────────────────────┐ │ │🔵 Alex assigned TSK-160     │  │  │
│ │ 📢 Recent Announcements        │ │ │🟢 Sarah mentioned you       │  │  │
│ │ ┌──────────────────────────┐  │ │ │🟡 Meeting in 15 min         │  │  │
│ │ │ Q3 Planning — Admin, 2h  │  │ │ └──────────────────────────────┘  │  │
│ │ │ Office Closed Fri — HR   │  │ │   [View All →]                    │  │
│ │ └──────────────────────────┘  │ └────────────────────────────────────┘  │
│ └────────────────────────────────┘                                         │
│                                                                              │
│ ┌────────────────────────────────┐ ┌────────────────────────────────────┐  │
│ │ 🏁 Recently Viewed Projects   │ │ 📊 Quick Stats                     │  │
│ │ ┌──────────────────────────┐  │ │                                    │  │
│ │ │ Mobile App ●●●●○  65%   │  │ │ Tasks completed: 12 this week      │  │
│ │ │ Web Portal ●●●○○  40%   │  │ │ Meetings attended: 4 this week     │  │
│ │ │ API Service ●●●●●  90%  │  │ │ Projects active: 5                 │  │
│ │ └──────────────────────────┘  │ │ Avg response time: 4.2h            │  │
│ │   [View All Projects →]      │ └────────────────────────────────────┘  │
│ └────────────────────────────────┘                                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Role-Adaptive Variations

Each role gets the same dashboard structure but with role-specific content:

| Component | Executive | PM | Team Lead | Employee | HR | Admin |
|-----------|-----------|-----|-----------|----------|-----|-------|
| Continue Where You Left Off | Last viewed project | Last viewed project/task | Last viewed task/approval | Last viewed task | Last viewed announcement | Last viewed admin page |
| KPI Row | Projects, Total tasks, Overdue, Team size | Active projects, Tasks in progress, Overdue, Milestones due | Team tasks, Pending review, Completed this week, Overdue | My tasks, Due today, Overdue, Completed | Total employees, New this month, Departing, Events | Active users, Integrations, System health, Pending invites |
| Upcoming Tasks | All projects (overview) | All projects | Team tasks | My tasks | — | — |
| Today's Schedule | All meetings (company-wide) | Project meetings + reviews | Team meetings + 1:1s | My meetings | Company events | — |
| Project Health | Company-wide chart | My projects | Team's projects | — | — | — |
| Announcements | All | All | All | All | — | All |
| Recent Activity | All | My projects | My team | My tasks | People changes | System changes |
| Quick Stats | Org-level | Project-level | Team-level | Personal | People stats | System stats |

### Empty State (New User)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                   🚀 Welcome to Internal TM, Alex!                          │
│                                                                              │
│     What is happening?  → Nothing yet — your workspace is empty.             │
│     What needs attention? → Nothing yet — let's get started!                 │
│     What can you do next? → Choose an action below:                         │
│                                                                              │
│     ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐       │
│     │ + Create Project │  │ 📖 Take a Tour    │  │ 👤 Invite Team   │       │
│     └──────────────────┘  └──────────────────┘  └──────────────────┘       │
│                                                                              │
│     ┌──────────────────────────────────────────────────────────────────┐    │
│     │ 💡 Quick tips:                                                    │    │
│     │   1. Create a project → add tasks → assign to team members        │    │
│     │   2. Schedule a meeting → take notes → action items               │    │
│     │   3. Check here daily for your tasks, meetings, and updates       │    │
│     └──────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Standardized Module Pattern

Every major module (Projects, Tasks, Meetings, People, Announcements, Integrations, Activity, Notifications) follows this exact layout:

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [Breadcrumbs]                                            [New Button]  │
│  Page Title                                                              │
│  Page Description (1 line)                                               │
│                                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                   │
│  │ KPI 1    │ │ KPI 2    │ │ KPI 3    │ │ KPI 4    │   ← KPI Row      │
│  │ Value ▲  │ │ Value ▼  │ │ Value —  │ │ Value ▲  │   (4 cards)      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘                   │
│                                                                          │
│  [Filter Bar: Search + Filter Dropdowns + View Switcher]                │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ Content Area (Table / Grid / Board / Calendar / List)            │   │
│  │                                                                  │   │
│  │                                                                  │   │
│  │                                                                  │   │
│  │                                                                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  [Pagination / Empty State / Load More]                                  │
│                                                                          │
│  [Detail Drawer (opens on row/item click) — optional]                    │
└──────────────────────────────────────────────────────────────────────────┘
```

**Rules:**
1. **KPI Row** is always the first content after the header. Never skip it.
2. **Filter Bar** is always below KPI row, above content.
3. **View Switcher** (Table / Grid / Board / Calendar) is part of the filter bar.
4. **Detail Drawer** slides from right on row click. For complex entities, a full-page detail is used instead.
5. **Bulk Actions** appear when items are selected (checkbox column).
6. **Empty State** replaces content area when no data exists.
7. **Every page must answer the three questions within the first 800px of viewport.**

---

## 10. Module Architecture

### 10.1 Project Workspace (10 Tabs)

**Purpose:** A self-contained workspace for a bounded scope of work.

**List Page:** Follows standardized pattern. KPI Row → Active/Archived/Overdue/My Projects. Grid (default) + Table views. Filters: Status, PM, Date range. Search by name.

**Detail Page (full page with 10 tabs):**

| Tab | Content | Answers |
|-----|---------|---------|
| **Overview** | Progress bar, KPI summary (tasks total/done/overdue), health dots, milestones timeline (next 3), overdue tasks list, recent activity, key info panel, member avatars | What's happening? Project health at a glance |
| **Tasks** | Full task board/list filtered to project | What needs attention? Overdue/in progress tasks |
| **Timeline** | Gantt chart of tasks + milestones | What's happening? Timeline view |
| **Calendar** | Project-specific calendar (task due dates, milestones, meetings) | What's happening? Date-based view |
| **Files** | Attachment grid (all files from project tasks) with preview/download | What can I do? Access files |
| **Members** | Member table with roles, add/remove/change role | Who is involved? |
| **Meetings** | Meetings associated with this project | What's happening? Upcoming/past meetings |
| **Reports** | Project-specific analytics (completion trend, velocity) | How are we doing? |
| **Activity** | Filtered activity feed for this project | What changed recently? |
| **Settings** | Edit project fields, status, transfer, danger zone | What can I do? Configure |

### 10.2 Task Detail (Collaboration Hub)

**Purpose:** The primary collaboration object where work gets done, discussed, and tracked.

**List Page:** Standardized pattern. KPI Row → Total/In Progress/Pending Review/Overdue. Filters: Project, Assignee, Status, Priority, Due date, Tags, Watcher. Views: Board (Kanban by status, default), List (sortable table), Calendar (by due date). Group by: Status, Priority, Assignee, Project. Bulk actions: Change status, Reassign, Change priority, Add tag, Delete.

**Detail Page (full page):**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ← Work / Tasks / Project Alpha              TSK-142                         │
│ ▢ Design landing page                                    Status: In Prog ▼ │
│ ─────────────────────────────────────────────────────────────               │
│ Description: Create a responsive landing page...                            │
│                                                                              │
│ ┌────────┬────────┬────────┬────────┬────────┬────────┐                    │
│ │Assignee│Priority│ Due    │ Repeat │ Est.   │ Tracked│                    │
│ │Alex    │ ● High │Jun 20  │ Weekly │ 8h     │ 3.5h   │                    │
│ └────────┴────────┴────────┴────────┴────────┴────────┘                    │
│                                                                              │
│ ┌──────────────────────────────┐ ┌──────────────────────────────────────┐  │
│ │ Dependencies                 │ │ Subtasks                              │  │
│ │ 🔗 Blocked by: TSK-140 ✓   │ │ ☐ Sub-task 1 (Alex)                   │  │
│ │ 🔗 Blocks: TSK-150, TSK-151│ │ ☑ Sub-task 2 (Sarah)  ✓ Jun 18       │  │
│ │   [+ Add dependency]        │ │   [+ Add subtask]                      │  │
│ └──────────────────────────────┘ └──────────────────────────────────────┘  │
│                                                                              │
│ ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐ │
│ │ Watchers (4)         │ │ Tags                 │ │ Approval             │ │
│ │ [Alex][Sa][Jo][Mi]   │ │ frontend, design     │ │ Status: Pending Rev  │ │
│ │   [+ Watch]          │ │                      │ │ [Approve] [Reject]   │ │
│ └──────────────────────┘ └──────────────────────┘ └──────────────────────┘ │
│                                                                              │
│ ──────────────── Time Tracking ────────────────                             │
│ [ 2h  ] [Task: Design ▼] [ + Log ]    Today: 2h • Week: 6h • Total: 12h   │
│                                                                              │
│ ──────────────── Comments & Activity ────────────────                       │
│ ┌──────────────────────────────────────────────────────────────────────┐   │
│ │ 💬 Alex changed status to "In Progress" — 2h ago                      │  │
│ │ 📎 Sarah uploaded design-v2.png                                       │  │
│ │ 💬 John: "See the Figma link in the description"                      │  │
│ │    ⤷ Alex: "Got it, thanks!"                                         │  │
│ │ ────────────────────────────────────────────────────────────────────  │  │
│ │ [Write a comment... @mention, 📎 attach files]              [Send]   │  │
│ └──────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 10.3 Calendar

**Purpose:** Unified view of all time-based events.

**Pattern:** KPI Row → Today's Events/This Week/Upcoming Milestones/Completed Tasks. View: Month (default), Week, Day. Filters: Project, Type (tasks/meetings/milestones). Legend: 🔴 Task Due, 📅 Meeting, 🏁 Milestone.

### 10.4 Milestones

**Pattern:** KPI Row → Active/Overdue/Completed/Upcoming. Timeline view (horizontal). Filter by project.

### 10.5 People

**Pattern:** KPI Row → Total/Active this Week/New this Month/Departments. Table (name, email, role, department, projects, status). Search + filter by role/status. Detail page: profile + assigned tasks + activity + project memberships.

### 10.6 Meetings

**Pattern:** KPI Row → Today/This Week/Upcoming/Past. Cards with title, date, duration, organizer, attendees, action items. Detail page: Attendees, Agenda, Notes (rich text), Action Items (auto-generated from @mentions, "Convert to Task" button), Attachments.

### 10.7 Announcements

**Pattern:** KPI Row → Total/This Month/Pinned/Drafts. Card feed. Filters: Category, Author, Date. Detail: Full content with rich text, author, publish date, attachments.

### 10.8 Notifications

**Pattern:** KPI Row → All/Unread/Mentions/Tasks/Meetings/System (as tabs or filter chips). Inbox-style list with read/unread indicator. Bulk: Mark all read.

### 10.9 Activity

**Pattern:** KPI Row → Today/This Week/This Month/Custom. Chronological timeline. Filters: User, Action, Resource, Date range. Search.

### 10.10 Analytics Center

*(See Section 14)*

---

## 11. Cross-Module Relationships

### Explicit Relationship Map

| Source Module | Relationship | Target Module | Mechanism |
|--------------|-------------|---------------|-----------|
| **Project** | contains | Milestones | FK: `milestone.project_id` |
| **Project** | contains | Tasks | FK: `task.project_id` |
| **Project** | has | Meetings | FK: `meeting.project_id` (optional) |
| **Project** | has | Integrations | FK: `integration.project_id` (optional) |
| **Project** | has | Members (Users) | Join: `project_members` |
| **Project** | generates | Reports | Query aggregation |
| **Task** | belongs to | Project | FK: `task.project_id` |
| **Task** | belongs to | Milestone | FK: `task.milestone_id` (optional) |
| **Task** | depends on | Task (self) | FK: `task_dependencies` |
| **Task** | has | Subtasks | FK: `task.parent_id` (self) |
| **Task** | has | Comments | FK: `comment.task_id` |
| **Task** | has | Attachments | FK: `attachment.task_id` |
| **Task** | has | Watchers (Users) | Join: `task_watchers` |
| **Task** | tracks | Time | FK: `time_entry.task_id` |
| **Task** | triggers | Notifications | Event → notification creation |
| **Task** | requires | Approval (User) | FK: `task.approved_by` |
| **Meeting** | generates | Tasks (action items) | User action: "Convert to Task" |
| **Meeting** | has | Attendees (Users) | Join: `meeting_attendees` |
| **Meeting** | belongs to | Project (optional) | FK: `meeting.project_id` |
| **Comment** | belongs to | Task | FK: `comment.task_id` |
| **Comment** | belongs to | User (author) | FK: `comment.author_id` |
| **Comment** | triggers | Notifications (@mention) | Mention parsing → notification |
| **Announcement** | belongs to | User (author) | FK: `announcement.author_id` |
| **Notification** | references | Any entity (polymorphic) | `notification.resource_type` + `resource_id` |
| **Activity** | records | Any entity (polymorphic) | `activity_log.resource_type` + `resource_id` |
| **Report** | consumes | Project + Task + Time data | Query aggregation |
| **Integration** | belongs to | Project | FK: `integration.project_id` |
| **Integration** | syncs with | External service | API calls |
| **User** | has | Roles | Join: `user_roles` |
| **Role** | has | Permissions | Join: `role_permissions` |
| **Calendar** | aggregates | Tasks + Meetings + Milestones | Query union |

### Key Rules

1. **Notifications always reference their source.** Clicking a notification navigates to the specific entity.
2. **Activity always records the actor, action, and resource.** Every create/update/delete is logged.
3. **Reports always use live data.** No caching of report results (unless explicitly scheduled).
4. **Calendar is a virtual module.** It queries task.due_date, meeting.date, milestone.due_date across all projects the user can see.
5. **Meetings can exist independently or within a project context.** A project meeting shows in both the project's Meetings tab and the global Meetings page.
6. **Deleting a project cascades:** soft-delete project → soft-delete tasks → orphan comments/attachments (kept for audit).

---

## 12. Notification System

### Categorized Feed (5 Tabs)

| Tab | Shows | Empty State |
|-----|-------|-------------|
| **All** | Every notification, newest first | None |
| **Unread** | Only unread | "All caught up!" |
| **Mentions** | @mentions across all entities | "No mentions yet" |
| **Tasks** | Task assigned, status changed, due, overdue | "No task notifications" |
| **Meetings** | Meeting invites, reminders, changes | "No meeting notifications" |
| **System** | Role changes, announcements, workspace updates | "No system notifications" |

### Notification Types

| Type | Priority | Icon | Auto-read? |
|------|----------|------|------------|
| Task assigned | High | 🔵 | No |
| Task mentioned | High | 🟢 | No |
| Task status changed | Medium | 🟡 | After 7 days |
| Task due in 24h | High | 🔴 | After viewed |
| Task overdue | High | 🔴 | After viewed |
| Meeting invitation | Medium | 📅 | After viewed |
| Meeting reminder (15m) | High | ⏰ | After viewed |
| Meeting changed/cancelled | Medium | 📅 | After 7 days |
| Approval requested | High | ✅ | No |
| Approval result | Medium | ✅ | After viewed |
| Comment reply | Low | 💬 | After 7 days |
| Project added | Medium | 📋 | After viewed |
| Role changed | Low | ⚙️ | After 7 days |
| Announcement | Low | 📢 | After 7 days |

---

## 13. Activity Timeline

### Entity-Level Timeline

Every detail page includes a scoped activity feed (Project Activity tab, Task activity section, Meeting notes area, User profile).

### Global Timeline (`/workspace/activity`)

**Pattern:** KPI Row → Today/This Week/This Month/Custom. Filters: User, Action (created/updated/deleted/commented/status change), Resource (project/task/meeting/milestone/announcement), Date range. Search by text.

Each entry: `[User] [action] [resource type] "[resource name]" — [relative time]`

---

## 14. Analytics Center

### Purpose

Data-driven insights — project health, team performance, trends, workload — organized as a dedicated section.

**Landing Page Layout:** KPI Row (Projects Tracked/Tasks Completed/On-Time Rate/Avg Cycle Time) → Dashboard grid of 4 charts (Completion Trend, Project Health, Team Workload, Overdue by Project).

### Report Pages

| Report | Chart | Audience | Business Value |
|--------|-------|----------|----------------|
| Project Health | Bar + health dots | Exec, PM | Identify at-risk projects |
| Team Velocity | Line (weekly) | PM, TL | Track team productivity |
| Task Completion Rate | Donut + stat | PM, Admin | Measure efficiency |
| Workload Distribution | Horizontal bar | PM, TL | Prevent burnout |
| Activity Summary | Stacked bar | Admin | Audit system usage |
| Custom Export | CSV/PDF | All with access | Offline analysis |

### Empty State

Charts show zero data with labels: "Insufficient data. Charts will populate as tasks are created and completed."

---

## 15. Collaboration Workflows

### Workflow 1: Task Assignment & Approval

```
Todo → In Progress → In Review → Approved → Done
                        ↓
              Changes Requested → In Progress
```

### Workflow 2: Meeting → Action Items → Tasks

```
Meeting notes with @mention
  → Action item auto-created (assigned to mentioned user)
  → "Convert to Task" button → task drawer pre-filled
  → Task appears in assignee's dashboard
  → Completion in task marks action item as done in meeting
```

### Workflow 3: Comment → Mention → Notification

```
Comment with @John
  → John sees notification (Mentions tab, 🔴 badge)
  → Click opens entity
  → Reply creates notification back to original commenter
```

### Workflow 4: Recurring Task

```
Task with recurrence "Weekly on Monday"
  → Due: next Monday
  → On completion: new instance created with +1 week
  → New instance linked to parent in activity history
```

### Workflow 5: Time Tracking

```
Task detail → "Log Time" → enter duration + description
  → Appears in task activity
  → Running total in task header
  → Aggregated in Analytics Center (workload, velocity)
```

---

## 16. Empty States

Every empty state follows this pattern and answers the three questions:

```
[Icon]
[Title]
[Description — 1-2 sentences explaining what this section is for]
[Primary Action button (if user has permission)]

Q: What is happening? → The title + description explain the current state.
Q: What needs attention? → Nothing — the section is empty.
Q: What can I do next? → The primary action button.
```

| Page | Icon | Title | Description | Action |
|------|------|-------|-------------|--------|
| Smart Home | 🚀 | Welcome! | "Your workspace is empty. Here's how to get started..." | + Create Project / Take a Tour / Invite Team |
| Projects | 📋 | No Projects Yet | "Projects help you organize tasks, milestones, and team members around a shared goal." | + Create Project |
| Tasks (no filter) | ✅ | No Tasks Yet | "Create your first task to get started." | + Create Task |
| Tasks (filtered) | 🔍 | No Tasks Match | "No tasks match the current filters. Try adjusting them." | Clear Filters / + Create Task |
| Calendar (period) | 📅 | No Events This Period | "No events scheduled for this period." | + Create Event |
| Milestones | 🏁 | No Milestones | "Milestones mark important dates in your project timeline." | (Create from Project → Timeline tab) |
| Meetings | 🎯 | No Meetings Scheduled | "Schedule a meeting to collaborate with your team." | + New Meeting |
| Announcements | 📢 | No Announcements Yet | "Announcements share updates with the company or specific teams." | + New Announcement |
| Notifications | 🔔 | All Caught Up! | "You'll be notified when someone mentions you, assigns you a task, or comments on your work." | — |
| Activity | 📜 | No Activity Recorded | "Activity begins when someone creates, updates, or comments on something in the workspace." | — |
| Integrations | 🔌 | No Integrations | "Connect your workspace to external tools like GitHub or Slack to automate workflows." | + Add Integration |
| People | — | — | Never empty after initial setup | — |
| Analytics | 📊 | Insufficient Data | "Charts will populate as tasks are created and completed." | — |

---

## 17. Loading States

### Skeleton Screens

Every page renders skeleton screens matching exact layout immediately (no waiting for API):
- **KPI row**: 4 gray rectangles with pulse animation
- **Tables**: Header row + 5 content rows (alternating gray bars)
- **Cards**: Image placeholder + 3 text lines
- **Detail pages**: Left metadata skeleton + right content skeleton
- **Charts**: Gray pill shapes where bars/lines would render

### Page Transitions

- Route changes: subtle fade (150ms). Skeleton screens render instantly.
- No spinner overlay for navigation — skeletons are the loading state.
- Tabs within detail pages: instant switch (pre-fetch adjacent tabs).

### Action Loading

- Buttons show spinner icon inside during mutations
- Forms: submit button disabled + "Saving..." text
- Dropdowns/selects: brief loading state (200ms minimum to avoid flicker)
- Optimistic updates for low-risk actions (status change, comment add)

---

## 18. Error States

| Error | UI | Behavior |
|-------|----|----------|
| **401 Unauthorized** | Toast "Session expired" | Redirect to login after toast |
| **403 Forbidden** | Inline banner | "You don't have permission to perform this action. Contact your administrator." |
| **404 Not Found** | Full-page error | Illustration + "Page not found" + [Go to Dashboard] button |
| **422 Validation** | Inline field errors | Red border + message below each field |
| **500 Server Error** | Toast | "Something went wrong. Please try again." + Retry button |
| **Network Error** | Persistent banner | "Connection lost. Retrying..." with live indicator. Auto-retry up to 3 times, then show manual retry button. |
| **Rate Limited** | Toast | "Too many requests. Please wait a moment." |
| **Empty Response (200 with no data)** | Empty State | Standard empty state for the module |

### Global Error Boundary

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                    ⚠️ Something Went Wrong                   │
│                                                              │
│     What happened? An unexpected error occurred in this      │
│     page. Our team has been notified automatically.          │
│                                                              │
│     What can you do?                                         │
│     [Reload Page]   [Go to Dashboard]                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 19. Responsive & Mobile Behavior

### Breakpoints

| Name | Width | Sidebar | Content |
|------|-------|---------|---------|
| Desktop | ≥1024px | Full (240px) | Full layout |
| Tablet | 768–1023px | Collapsed (64px, icons) | Full layout |
| Mobile | <768px | Hidden (bottom nav) | Stacked |

### Desktop (≥1024px)

- Full sidebar with labels + icons + count badges
- Tables: all columns visible
- KPI row: 4 cards in a row
- Project tabs: all visible in tab bar
- Detail drawers: slide from right (480px)
- Modals: centered, max 720px

### Tablet (768–1023px)

- Sidebar collapses to icon-only (64px). Labels shown as tooltips on hover.
- Tables: hide optional columns (show toggle to expand)
- KPI row: 2 columns × 2 rows
- Project tabs: horizontal scroll (overflow hidden with fade indicator)
- Detail drawers: full width (overlay, no gap)
- Modals: 90% width

### Mobile (<768px)

- Sidebar replaced by **bottom navigation bar** (5 items):
  - 🏠 Home (Dashboard)
  - 📋 Tasks
  - 📅 Calendar
  - 🔔 Notifications
  - ☰ More (hamburger → drawer overlay with full nav)
- Tables → **stacked card list** (each row becomes a card with key fields)
- KPI row → 2 columns
- Page description hidden (title only)
- Filter bar → collapses into "Filter" button → bottom sheet
- Detail drawers → **slide up from bottom** (fullscreen, 90% height)
- Modals → **fullscreen**
- Project tabs → **horizontal scroll with swipe gesture**
- Pagination → "Load more" button instead of page numbers
- **Gestures:**
  - Swipe left on task → mark complete
  - Swipe right on notification → mark read
  - Pull down on list → refresh
  - Tap top of screen → scroll to top
- Breadcrumbs: show only last 2 levels (parent + current, with "..." for overflow)
- Context bar: hidden (space is premium)

### Common responsive rules

- All interactive elements: minimum 44×44px touch target
- All forms: full-width inputs on mobile
- Select dropdowns: use native `<select>` on mobile
- Rich text editor: simplified toolbar on mobile (bold, italic, list only)
- Charts: simplified (no hover tooltips, use tap-to-select)

---

## 20. Accessibility (WCAG 2.2 AA)

### Compliance Requirements

| Criterion | Requirement | Implementation |
|-----------|-------------|----------------|
| **1.1.1 Non-text Content** (A) | All images have alt text | Avatar alt = user name, Icon alt = purpose, Chart alt = data summary |
| **1.3.1 Info and Relationships** (A) | Semantic HTML | Use `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<header>`, `<footer>` |
| **1.4.3 Contrast (Minimum)** (AA) | 4.5:1 normal text, 3:1 large text | All color tokens verified against white/black backgrounds |
| **1.4.4 Resize Text** (AA) | 200% zoom without loss | Use `rem` units, no fixed widths at mobile breakpoints |
| **1.4.10 Reflow** (AA) | No horizontal scroll at 320px | Responsive breakpoints handle all widths |
| **1.4.12 Text Spacing** (AA) | No loss of content with custom spacing | Overflow handling on all containers |
| **2.1.1 Keyboard** (A) | All functionality via keyboard | Tab order, arrow keys in tables/selects, Enter/Space for activation, Escape for close |
| **2.1.2 No Keyboard Trap** (A) | Focus never trapped | Modals trap focus but Escape exits |
| **2.4.1 Bypass Blocks** (A) | Skip-to-content link | First focusable element on every page |
| **2.4.3 Focus Order** (A) | Logical sequential focus | Left-to-right, top-to-bottom |
| **2.4.4 Link Purpose** (A) | Links describe their purpose | "View task TSK-142" not "Click here" |
| **2.4.6 Headings and Labels** (AA) | Descriptive headings/labels | h1 = page title, h2 = section titles |
| **2.4.7 Focus Visible** (AA) | Visible focus indicator | 2px solid ring, primary color, 2px offset |
| **2.5.3 Label in Name** (A) | Accessible name matches visible label | All form fields |
| **3.2.1 On Focus** (A) | No unexpected context change on focus | No auto-submit, no navigation on focus |
| **3.3.1 Error Identification** (A) | Errors described in text | Inline field errors + summary at top |
| **3.3.2 Labels or Instructions** (A) | Labels + instructions provided | All form fields |
| **4.1.2 Name, Role, Value** (A) | ARIA attributes on custom controls | `role="button"`, `aria-expanded`, `aria-selected` |
| **4.1.3 Status Messages** (AA) | Status changes announced | `aria-live="polite"` for toasts, notifications |

### Keyboard Navigation Map

| Key | Action |
|-----|--------|
| `Tab` | Move to next focusable element |
| `Shift+Tab` | Move to previous focusable element |
| `Enter` / `Space` | Activate button, toggle, link |
| `Escape` | Close modal, drawer, dropdown, menu |
| `Arrow Up/Down` | Navigate list, dropdown, table rows |
| `Arrow Left/Right` | Navigate tabs, calendar days |
| `N` | Open "New" quick-action menu (when not in input) |
| `/` | Focus search/filter input |
| `Ctrl+Enter` | Submit form (comment) |
| `1-5` | Switch notification category tabs |

### Focus Management

- **Modals/Drawers**: Trap focus inside; restore to trigger element on close
- **Page transitions**: Focus the `<h1>` of the new page
- **Inline errors**: Focus the first errored field
- **Notifications**: "Mark as read" action keeps focus on the notification item
- **Bulk actions**: After bulk action, focus returns to "Select all" checkbox

### Screen Reader Considerations

- Loading states: `aria-live="polite"` "Loading..."
- Skeleton screens: `aria-hidden="true"` with `role="presentation"` — no announcement
- Empty states: announced as "No items" with follow-up description
- KPI cards: each card is `role="article"` with `aria-label="{label}: {value}"`
- Tables: `role="grid"`, column headers `role="columnheader"`, sort indicator announced
- Charts: provided as data tables (hidden) alongside visual chart
- Notifications: each item `role="listitem"` with `aria-label="{summary}"`

### Reduced Motion

- Respect `prefers-reduced-motion: reduce`
- Remove all animations (pulse, fade, slide)
- Page transitions become instant
- Skeleton screens become static gray blocks (no pulse)
- Toast notifications appear without slide animation

---

## 21. Enterprise Design System

### Design Tokens

```css
/* Grid */
--grid-columns: 12;
--grid-gap: 16px;
--grid-gap-lg: 24px;

/* 8-Point Spacing System */
--space-0: 0px;
--space-1: 4px;    --space-2: 8px;    --space-3: 12px;
--space-4: 16px;   --space-5: 20px;   --space-6: 24px;
--space-8: 32px;   --space-10: 40px;  --space-12: 48px;
--space-14: 56px;  --space-16: 64px;  --space-20: 80px;
--space-24: 96px;

/* Typography Scale */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;

--font-size-xs: 0.75rem;     /* 12px — captions, metadata */
--font-size-sm: 0.875rem;    /* 14px — body small, table cells */
--font-size-base: 1rem;      /* 16px — body text */
--font-size-lg: 1.125rem;    /* 18px — large body */
--font-size-xl: 1.25rem;     /* 20px — section titles */
--font-size-2xl: 1.5rem;     /* 24px — page title */
--font-size-3xl: 1.875rem;   /* 30px — hero text */
--font-size-4xl: 2.25rem;    /* 36px — display */

--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;

--line-height-tight: 1.2;
--line-height-normal: 1.5;
--line-height-relaxed: 1.7;

/* Color Semantics — Light */
--color-bg: #ffffff;
--color-bg-secondary: #f8f9fa;
--color-bg-tertiary: #f0f1f3;
--color-surface: #ffffff;
--color-surface-hover: #f8f9fa;
--color-border: #e2e4e8;
--color-border-light: #eef0f2;
--color-divider: #eef0f2;

--color-text: #1a1d23;
--color-text-secondary: #5f6570;
--color-text-tertiary: #8f95a0;
--color-text-placeholder: #b0b5c0;
--color-text-inverse: #ffffff;

--color-primary: #4f6cf7;
--color-primary-hover: #3b5ae8;
--color-primary-active: #2f4ad4;
--color-primary-soft: #eef1fe;
--color-primary-soft-hover: #e0e5fd;

--color-success: #22c55e;
--color-success-soft: #e8faf0;
--color-warning: #f59e0b;
--color-warning-soft: #fef7e8;
--color-danger: #ef4444;
--color-danger-soft: #fde8e8;
--color-info: #3b82f6;
--color-info-soft: #e8f0fe;

/* Color Semantics — Dark */
--dark-bg: #0f1117;
--dark-bg-secondary: #1a1d28;
--dark-bg-tertiary: #232738;
--dark-surface: #1e2130;
--dark-surface-hover: #262a3c;
--dark-border: #2d3140;
--dark-border-light: #262a3c;
--dark-divider: #262a3c;
--dark-text: #e8eaed;
--dark-text-secondary: #9ca0ab;
--dark-text-tertiary: #6b7084;

/* Elevation System */
--shadow-xs: 0 1px 2px rgba(0,0,0,0.04);
--shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
--shadow-md: 0 4px 6px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04);
--shadow-lg: 0 10px 15px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.04);
--shadow-xl: 0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04);
--shadow-drawer: -4px 0 24px rgba(0,0,0,0.12);
--shadow-modal: 0 24px 48px rgba(0,0,0,0.16);
--shadow-sticky: 0 2px 8px rgba(0,0,0,0.08);

--dark-shadow-xs: 0 1px 2px rgba(0,0,0,0.2);
--dark-shadow-sm: 0 1px 3px rgba(0,0,0,0.3);
--dark-shadow-md: 0 4px 6px rgba(0,0,0,0.3);
--dark-shadow-lg: 0 10px 15px rgba(0,0,0,0.35);
--dark-shadow-xl: 0 20px 25px rgba(0,0,0,0.4);

/* Border Radius */
--radius-sm: 4px;    /* buttons, inputs, badges */
--radius-md: 6px;    /* cards, tables */
--radius-lg: 8px;    /* modals, drawers */
--radius-xl: 12px;   /* large containers */
--radius-2xl: 16px;  /* hero sections */
--radius-full: 9999px; /* pills, avatars */

/* Transitions */
--transition-fast: 150ms ease;
--transition-normal: 200ms ease;
--transition-slow: 300ms ease;
--transition-spring: 200ms cubic-bezier(0.34, 1.56, 0.64, 1);

/* Z-Index Scale */
--z-dropdown: 100;
--z-sticky: 200;
--z-drawer-backdrop: 300;
--z-drawer: 310;
--z-modal-backdrop: 400;
--z-modal: 410;
--z-toast: 500;
--z-tooltip: 600;
```

### Elevation System (Shadow Semantics)

| Level | Token | Used For |
|-------|-------|----------|
| 0 (flat) | None | Page surfaces, cards |
| 1 (raised) | shadow-xs | Hover on cards, subtle separation |
| 2 (elevated) | shadow-sm | Dropdowns, popovers, tooltips |
| 3 (floating) | shadow-md | Sticky headers, sticky columns |
| 4 (overlay) | shadow-lg | Drawers, side panels |
| 5 (modal) | shadow-xl | Modals, dialogs |
| 6 (toast) | shadow-xl + bg blur | Toasts, notifications |

### Color Usage Rules

- **Primary** — Interactive elements (buttons, links, focus rings, active states)
- **Success** — Completed, approved, active, healthy
- **Warning** — Pending, in progress, needs attention
- **Danger** — Overdue, rejected, blocked, errors
- **Info** — Neutral information, system notifications

### Data Visualization Guidelines

- **Bar charts**: Grouped comparisons (projects, people). Use primary + secondary + tertiary colors.
- **Line charts**: Time-series trends (velocity, completion rate). Use primary for main line, success for target.
- **Donut charts**: Proportions (status breakdown, completion rate). Use success/warning/danger segments.
- **Health dots**: 5-dot scale: 5 green, 4 green, 3 yellow, 2 orange, 1 red. Color transitions at 80%/60%/40%/20%.
- **Tooltips**: Show exact values on hover. On mobile, show on tap.
- **Empty charts**: Show gray pill placeholders with "Insufficient data" overlay.

### Iconography

- Use **lucide-react** for all icons (consistent 16px/20px/24px sizes)
- Icon colors inherit from parent text color unless semantic
- Empty state icons: scaled to 48px with color-soft background circle
- KPI icons: 20px, left of value

### Empty State Guidelines

- All empty states: centered illustration/icon + title + description + optional action
- No placeholder text ("Coming soon", "Under construction")
- Never show empty state on pages where data always exists (e.g., People, Dashboard)
- See Section 16 for per-module empty states

### Loading Skeleton Guidelines

- Match exact layout dimensions (not generic placeholders)
- Animate with pulse gradient (light → medium → light gray)
- Duration: 1.5s cycle, infinite until loaded
- Transition to real content: fade in 200ms (no jarring swap)
- Minimum skeleton display: 300ms (avoid flash for fast loads)

### Toast & Confirmation Patterns

| Pattern | Trigger | Duration | Dismiss |
|---------|---------|----------|---------|
| Success toast | Mutation succeeds | 3s | Auto + manual |
| Error toast | Mutation fails | 5s | Auto + manual |
| Warning toast | Non-blocking issue | 5s | Auto + manual |
| Confirm dialog | Destructive action | — | Must choose |
| Inline error | Validation failure | Persistent | On correction |

---

## 22. Component Library

### Shared UI Components

| Component | States | Keyboard | Responsive |
|-----------|--------|----------|------------|
| `Button` | default, hover, active, disabled, loading, focus | Enter/Space | Full-width on mobile |
| `Input` | default, focus, error, disabled, read-only | Tab, Enter | Full-width |
| `Select` | default, focus, error, disabled, searchable | Arrow keys, Enter | Native on mobile |
| `Textarea` | default, focus, error, disabled | Tab | Full-width |
| `DatePicker` | default, focus, range mode | Arrow keys, Enter | Bottom sheet on mobile |
| `Checkbox` | unchecked, checked, indeterminate, disabled | Space | — |
| `Radio` | unchecked, checked, disabled | Arrow keys | — |
| `Toggle` | on, off, disabled | Space | — |
| `Modal` | open, closing | Escape to close, focus trap | Fullscreen on mobile |
| `Drawer` | open, closing | Escape to close, focus trap | Fullscreen, slide-up on mobile |
| `Table` | sorted, filtered, selected, loading, empty | Arrow rows, Enter row | Stacked cards on mobile |
| `Card` | default, hover, selected | Enter | Full-width |
| `Badge` | default, success, warning, danger, info, outline | — | — |
| `Avatar` | image, initials, online/offline dot, sizes (sm/md/lg/xl) | — | Size adjusts |
| `AvatarGroup` | stacked, overflow count | — | Collapse count |
| `ProgressBar` | determinate (%), indeterminate, success/warning/danger | — | Full-width |
| `Tabs` | underline, pill, vertical; with count badges | Arrow keys, Home/End | Horizontal scroll on mobile |
| `Breadcrumbs` | clickable levels, truncation, "..." overflow | Tab, Enter | Last 2 levels on mobile |
| `Dropdown` | menu items, dividers, icons, submenu | Arrow keys, Enter, Escape | — |
| `DropdownMenu` (New) | same as Dropdown, for "New" quick-action | N shortcut | — |
| `Pagination` | page numbers, prev/next, first/last, compact | Arrow keys, Enter | "Load more" on mobile |
| `Toast` | success, error, warning, info, undo action | — | Full-width on mobile |
| `Tooltip` | top, bottom, left, right; delay show/hide | Focus + blur | — |
| `Spinner` | sm, md, lg; primary/white | — | — |
| `Skeleton` | text, avatar, card, table-row, chart-bar | — | Responsive dimensions |
| `EmptyState` | icon, title, description, action button | — | Centered |
| `ErrorState` | illustration, message, retry button | — | Centered |
| `ConfirmDialog` | title, message, confirm (danger/grey), cancel | Enter confirm, Escape cancel | Fullscreen on mobile |
| `KpiCard` | label, value, trend arrow, trend text | Tab | 4→2→2 columns |
| `FilterBar` | search input, filter dropdowns, view switcher | Tab, Enter | Collapse to "Filter" button on mobile |
| `ViewToggle` | grid, list, board, calendar icons | Arrow keys | Hide calendar on mobile |
| `HealthDots` | 5 dots, green→yellow→red gradient | — | — |
| `TagInput` | text input, tag pills, remove button | Backspace remove, Enter add | Full-width |
| `FileUpload` | drag zone, file list, progress, preview, remove | Tab, Enter | Full-width |
| `MentionInput` | text input, @mention popover, user list | Arrow keys select, Enter/ Tab confirm, Escape dismiss | Full-width |
| `RichTextEditor` | toolbar: bold, italic, heading, list, link, image | Tab toolbar, arrow through content | Simplified mobile toolbar |
| `Timeline` (Activity) | icon, user, action, timestamp; grouped by date | Arrow keys, Enter | — |
| `Timeline` (Gantt) | task bars, milestone diamonds, dependency lines | Arrow keys, Enter zoom | Horizontal scroll |
| `Calendar` | month/week/day views, event dots, click to open | Arrow days, Enter event | Swipe months on mobile |
| `Chart` | bar, line, donut; tooltip, legend, responsive | Tab data points, Enter drill | Simplified mobile |
| `StatCard` | label, value, trend, icon, bg color | — | Full-width |
| `KanbanBoard` | columns, cards, drag-and-drop | Arrow cards, Enter open | Single column on mobile |

### Layout Components

| Component | Description |
|-----------|-------------|
| `AppShell` | Sidebar + header + context bar + main + optional detail panel |
| `Sidebar` | Nav with sections, active states, count badges, user bottom-anchored |
| `Header` | Breadcrumbs, page title, New button, user avatar, notification bell |
| `ContextBar` | Group + breadcrumbs + metadata strip (project health, dates) |
| `PageLayout` | Standardized: title + description + KPI row + filter + content |
| `GridLayout` | 12-column responsive grid |
| `SplitPanel` | Left content + right detail, resizable |

---

## 23. User Flows

*(Moved to Section 5 — User Journeys are now the primary organizing principle.)*

---

## 24. Feature Inventory

### Feature Inventory by Module

| # | Feature | Business Value | Target Users | Priority | Backend Ready | Frontend Ready | Dependencies | Complexity |
|---|---------|---------------|-------------|----------|---------------|----------------|--------------|------------|
| **AUTH** | | | | | | | | |
| A.1 | Login (email + password) | Critical — entry point | All | Critical | ✅ Yes | ✅ Yes | None | S |
| A.2 | Register (self-service) | High — user acquisition | All | High | ✅ Yes | ✅ Yes | None | S |
| A.3 | JWT Access + Refresh tokens | Critical — session security | All | Critical | ✅ Yes | ✅ Yes | None | S |
| A.4 | Forgot / Reset password | High — account recovery | All | High | ✅ Yes | ✅ Yes | Email service | S |
| A.5 | Logout | Critical — session termination | All | Critical | ✅ Yes | ✅ Yes | None | S |
| **DASHBOARD** | | | | | | | | |
| D.1 | Smart Home (role-adaptive) | Critical — primary landing | All | Critical | 🟡 Partial | ❌ No | All modules feed data | XL |
| D.2 | KPI cards (role-specific) | Critical — instant status | All | Critical | 🟡 Partial | ❌ No | Aggregate API | M |
| D.3 | "Continue where you left off" | High — reduce friction | All | High | ❌ No | ❌ No | Activity log + recent items | M |
| D.4 | My Tasks widget | Critical — daily view | All | Critical | 🟡 Partial | ❌ No | Tasks API | S |
| D.5 | Today's Schedule widget | Critical — meeting awareness | All | Critical | 🟡 Partial | ❌ No | Meetings + Calendar API | S |
| D.6 | Recent Activity widget | Medium — awareness | All | Medium | 🟡 Partial | ❌ No | Activity API | S |
| D.7 | Announcements widget | Medium — communication | All | Medium | 🟡 Partial | ❌ No | Announcements API | S |
| D.8 | Project Health widget | High — exec visibility | PM+ | High | ❌ No | ❌ No | Aggregation endpoint | M |
| **PROJECTS** | | | | | | | | |
| P.1 | Project list (grid + table) | Critical — browse | PM+ | Critical | ✅ Yes | 🟡 Partial | None | M |
| P.2 | Project CRUD | Critical — core | PM+ | Critical | ✅ Yes | 🟡 Partial | None | M |
| P.3 | Project workspace (10 tabs) | Critical — single source | PM+ | Critical | 🟡 Partial | ❌ No | Tasks, Milestones, Members APIs | XL |
| P.4 | Project Overview tab | Critical — health summary | All (view) | Critical | 🟡 Partial | ❌ No | Task + Milestone aggregation | L |
| P.5 | Project Tasks tab | Critical — scope view | PM+ | Critical | 🟡 Partial | ❌ No | Tasks filtered by project | M |
| P.6 | Project Timeline (Gantt) | High — planning | PM | High | ❌ No | ❌ No | Task + Milestone dates | XL |
| P.7 | Project Calendar | High — date view | All | Medium | ❌ No | ❌ No | Calendar aggregation | L |
| P.8 | Project Files tab | High — document hub | All | High | 🟡 Partial | ❌ No | Attachment API | M |
| P.9 | Project Members tab | Critical — team mgmt | PM+ | Critical | ✅ Yes | ❌ No | User + Project Member API | M |
| P.10 | Project Meetings tab | High — context | All | Medium | ❌ No | ❌ No | Meetings filtered by project | S |
| P.11 | Project Reports tab | High — analytics | PM+ | High | ❌ No | ❌ No | Analytics aggregation | L |
| P.12 | Project Activity tab | Medium — audit | All | Medium | 🟡 Partial | ❌ No | Activity filtered by project | S |
| P.13 | Project Settings tab | High — configuration | PM+ | High | ✅ Yes | ❌ No | Project update API | S |
| P.14 | Project archive/restore | High — lifecycle | PM+ | High | ✅ Yes | ❌ No | None | S |
| P.15 | Project members CRUD | Critical — team mgmt | PM+ | Critical | ✅ Yes | ❌ No | None | M |
| **TASKS** | | | | | | | | |
| T.1 | Task CRUD | Critical — core | All | Critical | ✅ Yes | 🟡 Partial | Project + Assignee | M |
| T.2 | Task detail page (collaboration hub) | Critical — work happens here | All | Critical | 🟡 Partial | ❌ No | Comments, Attachments, Activity | XL |
| T.3 | Task list (board/table/calendar views) | Critical — browsing | All | Critical | 🟡 Partial | 🟡 Partial | None | L |
| T.4 | Task status workflow (Todo→Done) | Critical — progress | All | Critical | ✅ Yes | 🟡 Partial | None | M |
| T.5 | Task approval workflow | High — quality control | TL+ | High | ❌ No | ❌ No | Role + Status machine | L |
| T.6 | Task dependencies | High — sequencing | PM+ | High | ❌ No | ❌ No | Self-referential FK | M |
| T.7 | Subtasks | High — breakdown | All | High | ❌ No | ❌ No | Self-referential FK | M |
| T.8 | Task watchers | Medium — visibility | All | Medium | ❌ No | ❌ No | Join table + Notification | M |
| T.9 | Task attachments | High — files | All | Critical | ✅ Yes | ❌ No | File upload API | M |
| T.10 | Task comments | Critical — discussion | All | Critical | ✅ Yes | 🟡 Partial | None | M |
| T.11 | Recurring tasks | Medium — repeat work | All | Medium | ❌ No | ❌ No | Cron/scheduler | L |
| T.12 | Time tracking | High — billing/capacity | All | High | ❌ No | ❌ No | Time entry model | L |
| T.13 | Task bulk operations | High — efficiency | PM+ | High | ❌ No | ❌ No | Batch endpoint | M |
| T.14 | Task filters + search | Critical — findability | All | Critical | ✅ Yes | 🟡 Partial | None | M |
| **CALENDAR** | | | | | | | | |
| C.1 | Unified Calendar (month/week/day) | High — time view | All | High | ❌ No | ❌ No | Tasks, Meetings, Milestones APIs | XL |
| C.2 | Calendar filters (project, type) | High — focus | All | High | ❌ No | ❌ No | Calendar aggregation | M |
| C.3 | Calendar click → entity detail | High — navigation | All | High | ❌ No | ❌ No | Router to detail pages | M |
| **MILESTONES** | | | | | | | | |
| M.1 | Milestone CRUD | High — planning | PM+ | High | 🟡 Partial | ❌ No | Project FK | M |
| M.2 | Milestone cross-project timeline | Medium — overview | PM+ | Medium | ❌ No | ❌ No | Milestones API + dates | L |
| **PEOPLE** | | | | | | | | |
| U.1 | People directory (table) | Critical — find people | All | Critical | ✅ Yes | 🟡 Partial | None | S |
| U.2 | User profile page | High — context | All | High | 🟡 Partial | ❌ No | User + task + activity aggregation | M |
| U.3 | User CRUD (admin) | Critical — management | Admin | Critical | ✅ Yes | 🟡 Partial | Role API | M |
| U.4 | User search + filter | Critical — findability | All | Critical | ✅ Yes | 🟡 Partial | None | S |
| **ROLES & PERMISSIONS** | | | | | | | | |
| R.1 | Roles list + detail | Critical — RBAC | Admin | Critical | ✅ Yes | ❌ No | None | M |
| R.2 | Permission matrix | High — audit | Admin | High | 🟡 Partial | ❌ No | Role + Permission API | L |
| R.3 | Role permission editor | Critical — configuration | Admin | Critical | ✅ Yes | ❌ No | Role update API | M |
| **MEETINGS** | | | | | | | | |
| ME.1 | Meeting CRUD | High — scheduling | All | High | 🟡 Partial | ❌ No | User FK (organizer) | M |
| ME.2 | Meeting detail (agenda, notes) | High — collaboration | All | High | 🟡 Partial | ❌ No | None | L |
| ME.3 | Meeting action items | High — follow-up | All | High | ❌ No | ❌ No | Task creation | L |
| ME.4 | Action item → auto-task | High — workflow | All | High | ❌ No | ❌ No | Meeting + Task API | M |
| ME.5 | Meeting list with calendar integration | Medium — scheduling | All | Medium | ❌ No | ❌ No | Calendar aggregation | M |
| **ANNOUNCEMENTS** | | | | | | | | |
| AN.1 | Announcement CRUD | High — communication | All (view), HR+ (create) | High | 🟡 Partial | 🟡 Partial | User FK (author) | M |
| AN.2 | Announcement card feed | High — awareness | All | High | 🟡 Partial | 🟡 Partial | None | S |
| **NOTIFICATIONS** | | | | | | | | |
| N.1 | Categorized notification feed | Critical — awareness | All | Critical | ❌ No | ❌ No | Notification model + all modules | L |
| N.2 | Notification mark read/unread | Critical — UX | All | Critical | ❌ No | ❌ No | Notification model | S |
| N.3 | Notification toggle preferences | Medium — control | All | Medium | ❌ No | ❌ No | Settings + Notification model | M |
| N.4 | Bell icon with unread count | Critical — entry point | All | Critical | 🟡 Partial | ❌ No | Notification count API | S |
| **ACTIVITY** | | | | | | | | |
| AC.1 | Entity-level activity feed | High — audit | All | High | 🟡 Partial | ❌ No | Activity model | M |
| AC.2 | Global activity timeline | High — system audit | Admin | High | 🟡 Partial | ❌ No | Activity model + filters | L |
| AC.3 | Activity filters (user, action, resource, date) | High — usability | All | High | 🟡 Partial | ❌ No | Activity query API | M |
| **ANALYTICS** | | | | | | | | |
| ANL.1 | Analytics Center landing page | High — insights | PM+ | High | ❌ No | ❌ No | Aggregation endpoints | XL |
| ANL.2 | Project Health report | High — risk identification | Exec, PM | High | ❌ No | ❌ No | Task + Milestone aggregation | L |
| ANL.3 | Team Velocity report | High — productivity | PM, TL | High | ❌ No | ❌ No | Task completion + time data | L |
| ANL.4 | Workload Distribution report | High — capacity | PM, TL | High | ❌ No | ❌ No | Task assignment + time data | L |
| ANL.5 | CSV/PDF export | Medium — offline | All | Medium | ❌ No | ❌ No | Report generation | M |
| **INTEGRATIONS** | | | | | | | | |
| I.1 | Integration CRUD | High — extensibility | Admin | High | ✅ Yes | ❌ No | None | M |
| I.2 | Integration sync trigger | High — data flow | Admin | High | ✅ Yes | ❌ No | External API calls | M |
| I.3 | Integration status + sync log | Medium — monitoring | Admin | Medium | ✅ Yes | ❌ No | None | S |
| **SETTINGS** | | | | | | | | |
| S.1 | Profile settings | Critical — personalization | All | Critical | ✅ Yes | ❌ No | None | S |
| S.2 | Account security (password, sessions) | High — security | All | High | ✅ Yes | ❌ No | Auth API | M |
| S.3 | Workspace settings | Medium — admin | Admin | Medium | ❌ No | ❌ No | Settings model | M |
| S.4 | Notification preferences | Medium — user control | All | Medium | ❌ No | ❌ No | Settings model | S |
| S.5 | Appearance (theme, density, locale) | Medium — personalization | All | Medium | ❌ No | ❌ No | LocalStorage + CSS vars | M |
| **INFRASTRUCTURE** | | | | | | | | |
| INF.1 | Role-adaptive sidebar | Critical — navigation | All | Critical | ✅ Yes | ❌ No | Auth + Role API | M |
| INF.2 | "New" quick-action menu | High — efficiency | All | High | ❌ No | ❌ No | All create endpoints | M |
| INF.3 | Breadcrumbs + context bar | Critical — orientation | All | Critical | ❌ No | ❌ No | Router + entity data | M |
| INF.4 | Health endpoints | Critical — operations | Ops | Critical | ✅ Yes | N/A | None | S |
| INF.5 | Rate limiting | High — stability | Ops | High | ✅ Yes | N/A | None | S |
| INF.6 | Structured logging | High — debugging | Dev | High | ✅ Yes | N/A | None | S |
| INF.7 | Redis caching | Medium — performance | Ops | Medium | ✅ Yes | N/A | Redis service | S |

**Complexity Key:** S = Small (hours), M = Medium (1-2 days), L = Large (3-5 days), XL = Extra Large (5-10 days)

---

## 25. Phased Implementation Roadmap

### Organizing Principle

Each phase delivers a **usable product increment** — a subset of the product that a real user can complete a meaningful workflow in. Phases are ordered by:

1. **Workflow dependency** — what must exist first
2. **Business value** — what delivers the most impact earliest
3. **Risk reduction** — validate core architecture before building advanced features

### Phase 1: Foundation & Daily Work (Weeks 1-4)

**Delivers Journey A (Employee Daily Workflow) end-to-end.**

| Week | Features | User Value |
|------|----------|------------|
| 1 | Design system (tokens, Button, Input, Select, Badge, Avatar, Modal, Drawer, Toast, Spinner, Skeleton) | Consistent foundation for all subsequent phases |
| 2 | App shell (Sidebar, Header, breadcrumbs, context bar), Auth (login, register, logout, JWT), Protected routes | Navigation + authentication — users can log in and see a working shell |
| 3 | Smart Home Dashboard (Employee variant), My Tasks widget, Continue Where You Left Off, KPI cards, Notifications bell with count | Employee sees personalized home — knows what to work on |
| 4 | Task CRUD, Task detail page (comments, attachments, status workflow), Task list (board + list views), Task filters | Employee can create, view, update, and complete tasks — core daily loop works |
| **Phase 1 outcome:** Employee can log in → see dashboard with their tasks → open a task → update status → log out. |

### Phase 2: Team Collaboration (Weeks 5-8)

**Delivers Journey B (Team Lead Workflow) end-to-end.**

| Week | Features | User Value |
|------|----------|------------|
| 5 | Task approval workflow, Task dependencies + subtasks, Watchers | Team Lead can review, approve, and track team work |
| 6 | Project CRUD, Project Workspace shell (Overview, Tasks, Members, Activity tabs), Project list with health dots | PM can create projects, add members, see project health |
| 7 | Meeting CRUD, Meeting Detail (agenda, notes, action items), Calendar (basic month view) | Teams can schedule meetings with agenda, take notes, track action items |
| 8 | "New" quick-action menu, Dashboard (PM variant), People directory, User profiles | PM sees their projects on dashboard, can create anything from anywhere |
| **Phase 2 outcome:** Team Lead can create project → assign tasks → review → approve → hold meeting → follow up on action items. |

### Phase 3: Communication & Awareness (Weeks 9-10)

**Delivers Journeys A & B with full communication support.**

| Week | Features | User Value |
|------|----------|------------|
| 9 | Categorized notification feed, Notification creation for all actions, Bulk mark read | Users see all important events in one categorized inbox |
| 10 | Announcements CRUD, Announcement card feed, Global activity timeline with filters | Company can broadcast updates; all changes are visible in timeline |
| **Phase 3 outcome:** All users stay informed through notifications and announcements; all changes are recorded in activity timeline. |

### Phase 4: Advanced Work Features (Weeks 11-13)

**Adds power-user capabilities.**

| Week | Features | User Value |
|------|----------|------------|
| 11 | Time tracking, Recurring tasks, Task bulk operations | Power users can log time, set recurring work, and batch-update tasks |
| 12 | Milestones CRUD, Cross-project milestone timeline, Project Timeline (Gantt) | PM can plan and track key dates across projects |
| 13 | Calendar (week/day views, click to entity, event creation), Project Calendar tab, Project Files tab | Calendar becomes unified view of all time-based work; files are accessible per project |
| **Phase 4 outcome:** Tasks support full enterprise needs — time tracking, recurring, bulk ops, milestones, Gantt, unified calendar. |

### Phase 5: Analytics & Administration (Weeks 14-16)

**Delivers Journey C (PM Planning), Journey D (Executive Review), and Journey F (Admin Configuration).**

| Week | Features | User Value |
|------|----------|------------|
| 14 | Analytics Center landing page, Project Health report, Team Velocity report | PM and Execs get data-driven insights |
| 15 | Workload Distribution report, Trends report, CSV/PDF export, Dashboard (Executive variant), Dashboard (Admin variant) | Full analytics suite; Exec and Admin dashboards show relevant KPIs |
| 16 | Roles management + permission editor, Permission matrix, Integration management, Settings (profile, account, workspace, notifications, appearance), Admin sidebar section | Admin can fully configure the system — roles, permissions, integrations, settings |
| **Phase 5 outcome:** Complete product — all journeys supported, all configurations possible from the UI. |

### Phase 6: Polish & Scale (Weeks 17-18)

| Week | Features | User Value |
|------|----------|------------|
| 17 | Responsive audit + fixes, Mobile bottom nav, Tablet sidebar, Gesture support | The product works well on any device |
| 18 | Accessibility audit + fixes, Performance optimization, End-to-end testing, Error state audit | The product is enterprise-grade — accessible, fast, reliable |
| **Phase 6 outcome:** Production-ready, accessible, responsive, performant enterprise application. |

### Summary Timeline

```
Phase 1: Foundation & Daily Work     Weeks 1-4   (Employee workflow complete)
Phase 2: Team Collaboration          Weeks 5-8   (Team Lead workflow complete)
Phase 3: Communication & Awareness   Weeks 9-10  (Notifications + Announcements + Activity)
Phase 4: Advanced Work Features      Weeks 11-13 (Time, Recurring, Milestones, Calendar)
Phase 5: Analytics & Administration  Weeks 14-16 (Analytics, Reports, Roles, Settings)
Phase 6: Polish & Scale             Weeks 17-18 (Responsive, a11y, perf, tests)

Total: ~18 weeks (~4.5 months with 1 developer, ~2.5 months with 2)
```

---

*End of PRD v2.2 — Ready for Implementation Planning*
