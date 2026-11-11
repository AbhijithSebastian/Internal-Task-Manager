# Information Architecture Verification

> **Phase:** Information Architecture — Phase 6 of 10
> **Status:** Verified
> **Base:** PRD v2.2 — Information Architecture (Section 6), Roles & Permissions (Section 4)

---

## 1. Verified IA Map

### Full Site Tree with Permission Gates

```
app.example.com/
│
├── /dashboard                        # Smart Home — All roles (role-adaptive content)
│   ├── Employee variant              # employee
│   ├── Team Lead variant             # team-lead
│   ├── Project Manager variant       # project-manager
│   ├── Executive variant             # super-admin, project-manager view
│   ├── HR variant                    # hr
│   └── Admin variant                 # super-admin
│
├── /work/                            # Work section — Restricted by module
│   ├── /projects                     # Project hub — super-admin, project-manager, team-lead (view)
│   ├── /projects/{id}                # Project workspace — members + super-admin
│   │   ├── Overview                  # All project members
│   │   ├── Tasks                     # All project members (own tasks) + PM (all)
│   │   ├── Timeline                  # super-admin, project-manager
│   │   ├── Calendar                  # All project members
│   │   ├── Members                   # super-admin, project-manager
│   │   ├── Files                     # All project members
│   │   ├── Meetings                  # All project members
│   │   ├── Reports                   # super-admin, project-manager, team-lead
│   │   ├── Activity                  # All project members
│   │   └── Settings                  # super-admin, project-manager only
│   │
│   ├── /tasks                        # Task hub — All roles (filtered view)
│   │   ├── My Tasks                  # employee (own tasks only)
│   │   ├── Team Tasks                # team-lead, project-manager
│   │   ├── All Tasks                 # super-admin, project-manager
│   │   └── /tasks/{id}              # Task detail — assigned/watcher/member + super-admin
│   │
│   ├── /calendar                     # Unified calendar — All roles
│   └── /milestones                   # Milestone timeline — super-admin, project-manager
│
├── /team/                            # Team section
│   ├── /people                       # User directory — All roles
│   │   └── /people/{id}             # User profile — All roles (public info)
│
├── /analytics                        # Analytics Center
│   ├── /analytics/project-health     # super-admin, project-manager, team-lead
│   ├── /analytics/team-velocity      # super-admin, project-manager, team-lead
│   ├── /analytics/workload           # super-admin, project-manager, team-lead
│   ├── /analytics/trends            # super-admin, project-manager
│   └── /analytics/exports           # super-admin, project-manager, team-lead
│
├── /workspace/                       # Collaboration section
│   ├── /meetings                     # Meeting hub — All roles
│   │   └── /meetings/{id}           # Meeting detail — organizer + attendees
│   ├── /announcements                # Announcements — All roles (view)
│   │   └── /announcements/{id}       # Announcement detail — All roles
│   ├── /notifications                # Personal notification inbox — All roles (own)
│   └── /activity                     # Global timeline — All roles (filtered)
│
└── /administration/                  # Admin section — super-admin only (non-admin: hidden entirely)
    ├── /administration/roles         # Roles list — super-admin
    │   └── /administration/roles/{id}
    ├── /administration/permissions   # Permission matrix — super-admin
    ├── /administration/integrations  # Integration hub — super-admin
    │   └── /administration/integrations/{id}
    └── /administration/settings      # System settings — super-admin
        ├── profile                   # All roles (own profile)
        ├── account                   # All roles (own account)
        ├── workspace                 # super-admin
        ├── notifications             # All roles (own preferences)
        └── appearance                # All roles (own theme)
```

---

## 2. Permission Mapping

### Route-Action Matrix

```
Permission           Routes Covered
─────────────────────────────────────────────────────────────
users.list           /team/people
users.read           /team/people/{id}
users.create         /administration/users (new — not in current IA)
users.update        /administration/users/{id} (not in current IA)
users.delete        /administration/users/{id} (not in current IA)

projects.list        /work/projects
projects.create     /work/projects/new
projects.read       /work/projects/{id} (all tabs)
projects.update     /work/projects/{id} → Settings tab
projects.delete     /work/projects/{id} → Settings tab
projects.manage_members /work/projects/{id}/members

tasks.list           /work/tasks
tasks.create        /work/tasks/new
tasks.read          /work/tasks/{id}
tasks.update        /work/tasks/{id}
tasks.delete        /work/tasks/{id}
tasks.approve       /work/tasks/{id}
tasks.assign        /work/tasks/{id}

meetings.list        /workspace/meetings
meetings.create     /workspace/meetings/new
meetings.read       /workspace/meetings/{id}
meetings.update     /workspace/meetings/{id}
meetings.delete     /workspace/meetings/{id}

announcements.list       /workspace/announcements
announcements.create    /workspace/announcements/new
announcements.read      /workspace/announcements/{id}
announcements.update    /workspace/announcements/{id}
announcements.delete    /workspace/announcements/{id}

roles.list           /administration/roles
roles.create        /administration/roles/new
roles.read          /administration/roles/{id}
roles.update        /administration/roles/{id}
roles.delete        /administration/roles/{id}

integrations.list    /administration/integrations
integrations.create /administration/integrations/new
integrations.read   /administration/integrations/{id}
integrations.update /administration/integrations/{id}
integrations.delete /administration/integrations/{id}
integrations.sync   /administration/integrations/{id}/sync

settings.read        /administration/settings/*
settings.update     /administration/settings/*
```

### Role-Permissions Mapping

```
super-admin:
  └── All permissions (is_super_admin bypass)

project-manager:
  ├── projects: list, create, read, update, delete, manage_members
  ├── tasks: list, create, read, update, delete, approve, assign
  ├── meetings: list, create, read, update, delete
  ├── announcements: list, read
  ├── users: list, read
  ├── roles: list, read
  └── settings: read (own profile)

team-lead:
  ├── projects: list, read
  ├── tasks: list, create, read, update, approve, assign
  ├── meetings: list, create, read, update, delete
  ├── announcements: list, read
  ├── users: list, read
  └── settings: read (own profile, own account)

employee:
  ├── tasks: list, create, read, update (own only)
  ├── meetings: list, read
  ├── announcements: list, read
  ├── users: list, read
  └── settings: read (own profile, own account)

hr:
  ├── announcements: list, create, read, update, delete
  ├── meetings: list, create, read, update, delete
  ├── users: list, read
  └── settings: read (own profile, own account)
```

---

## 3. Navigation Structure by Role

### Employee
```
Sidebar:
  🏠 Dashboard
  ✅ Tasks
  📅 Calendar
  👥 People
  ───────
  🎯 Meetings
  📢 Announcements
  ───────
  [User name] ⚙️

No Administration section.
Task hub defaults to "My Tasks".
```

### Team Lead
```
Sidebar:
  🏠 Dashboard
  📋 Projects
  ✅ Tasks
  📅 Calendar
  📊 Analytics
  ───────
  🎯 Meetings
  📢 Announcements
  👥 People
  ───────
  [User name] ⚙️

No Administration section.
Task hub shows "Team Tasks" as default.
Analytics limited to team-velocity and workload.
```

### Project Manager
```
Sidebar:
  🏠 Dashboard
  📋 Projects
  ✅ Tasks
  📅 Calendar
  📊 Analytics
  ───────
  🎯 Meetings
  📢 Announcements
  👥 People
  ───────
  [User name] ⚙️

No Administration section.
Analytics: all reports available.
Task hub: "All Tasks" + filters.
```

### Executive (super-admin)
```
Sidebar:
  🏠 Dashboard
  📋 Projects
  ✅ Tasks
  📅 Calendar
  📊 Analytics
  ───────
  🎯 Meetings
  📢 Announcements
  👥 People
  ───────
  🛠️ Administration
    ├ Roles
    ├ Permissions
    ├ Integrations
    └ Settings
  ───────
  [User name] ⚙️

Administration section expanded by default (admin).
Dashboard uses Executive variant.
```

### HR
```
Sidebar:
  🏠 Dashboard
  📅 Calendar
  👥 People
  ───────
  🎯 Meetings
  📢 Announcements
  ───────
  [User name] ⚙️

No Projects, Tasks, or Analytics in sidebar.
Dashboard uses HR variant.
```

### Administrator (super-admin user)
```
Same as Executive sidebar.
Dashboard uses Admin variant.
```

---

## 4. Cross-Module Relationships

### Relationship Map

```
Project ──has──> Tasks (1:N)
Project ──has──> Milestones (1:N)
Project ──has──> Members (N:N via project_members)
Project ──has──> Files (1:N via task attachments, scoped)
Project ──has──> Meetings (N:N via calendar)
Project ──has──> Activity (1:N)

Task ──has──> Subtasks (self-referential FK)
Task ──has──> Comments (1:N)
Task ──has──> Attachments (1:N)
Task ──has──> Time Entries (1:N)
Task ──has──> Dependencies (N:N via task_dependencies)
Task ──has──> Watchers (N:N via task_watchers)
Task ──belongs_to──> Project
Task ──belongs_to──> Assignee (User)
Task ──belongs_to──> Creator (User)

Meeting ──has──> Action Items (1:N → can convert to Task)
Meeting ──has──> Attendees (N:N via meeting_attendees)
Meeting ──belongs_to──> Organizer (User)

User ──has──> Tasks (as assignee, 1:N)
User ──has──> Tasks (as creator, 1:N)
User ──has──> Meetings (as organizer, 1:N)
User ──has──> Meetings (as attendee, N:N)
User ──has──> Comments (1:N)
User ──has──> Activity (1:N)
User ──has──> Notifications (1:N)

Notification ──belongs_to──> User
Notification ──polymorphic──> Entity (Task, Meeting, Comment, etc.)

Activity ──belongs_to──> Actor (User)
Activity ──polymorphic──> Entity

Role ──has──> Permissions (N:N)
Role ──has──> Users (1:N)

Integration ──belongs_to──> Creator (User)
```

### Navigation Cross-References

| From Entity | To Entity | Component |
|-------------|-----------|-----------|
| Task | Project | Project name link in task detail → opens project drawer/page |
| Task | Assignee | Avatar/name link → opens user profile |
| Task | Comments author | Avatar/name link → opens user profile |
| Meeting | Organizer | Avatar/name link → opens user profile |
| Meeting | Action Item | Action item text → if converted to task, opens task |
| Meeting | Attendees | Avatar list → click opens user profile |
| Project | PM | Avatar/name link → opens user profile |
| Project | Member list | Avatar list → click opens user profile |
| Activity | Actor | Avatar/name link → opens user profile |
| Activity | Entity | Entity name link → opens entity detail |
| Notification | Entity | Click notification → opens linked entity |
| User | Tasks | Task count link → filtered task list |
| User | Meetings | Meeting count link → filtered meeting list |
| Comment | Task | Comment context → opens parent task |

---

## 5. Concerns & Resolutions

### Concern 1: Administration route access for non-admin users
**Resolution:** Routes under `/administration/` check `is_super_admin` at the route level. Non-admin users visiting `/administration/roles` directly are redirected to dashboard with a toast. The sidebar simply does not render the Administration section for non-admin users (not greyed out — fully removed).

### Concern 2: Project read access vs tab access
**Resolution:** Project read access controls the entire project workspace. Individual tabs within the workspace do not have separate permissions at the route level. Tab content adapts — a team lead on the Settings tab sees a "read-only" indicator rather than edit fields. An employee on the Reports tab sees a "no access" inline banner.

### Concern 3: Task ownership vs task access
**Resolution:** The task list page adapts its default view based on role:
- Employee: "My Tasks" (only tasks where assignee = current user)
- Team Lead: "Team Tasks" (tasks where project in user's managed projects + own tasks)
- PM: "All Tasks" (with filters to scope down)
- Exec/Admin: "All Tasks" (with filters)

The task detail page checks: user is assignee, watcher, creator, project member, or super-admin. If none, show 403 inline banner.

### Concern 4: Navigation depth
**Resolution:** Maximum navigation depth is 4 levels from root (e.g., `/work/projects/{id}/tasks`). Deeper nesting causes usability issues. Entity detail pages use tabs to flatten the hierarchy.

### Concern 5: Direct URL access vs sidebar visibility
**Resolution:** Route guards handle authorization regardless of sidebar visibility. A user can still access a page if they know the URL, but the authorization check will reject them. This is intentional — it supports bookmarking and direct links from notifications.

---

## 6. Missing Routes Identified

| Missing Route | Needed For | Priority |
|---------------|-----------|----------|
| `/work/projects/new` | Project creation form | Critical |
| `/work/tasks/new` | Task creation form | Critical |
| `/workspace/meetings/new` | Meeting creation form | High |
| `/workspace/announcements/new` | Announcement creation form | High |
| `/administration/roles/new` | Role creation form | High |
| `/administration/integrations/new` | Integration creation form | High |
| `/administration/users` | User management (CRUD) | High |
| `/administration/users/{id}` | User edit | High |
| `/administration/users/new` | User creation | Medium |
| `/administration/settings/{section}` | Individual settings pages | Medium |
| `/search` (modal-based, not route) | Global search | Medium |
| `/onboarding` | First-time user wizard | Medium |

**Action:** Add these routes to the IA and routing configuration.

---

*End of Information Architecture Verification — Ready for User Flows*
