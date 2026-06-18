# Phase B — Screen Blueprints

> **Status:** Complete
> **Total Blueprints:** 47
> **Pattern:** Above Fold | Content | Right Drawer | Bottom

---

## Blueprint Syntax

```
above_fold:
  breadcrumb: [Current → Path]
  context_bar: [entity metadata — optional]
  title: "Page Title"
  description: "Supporting description — optional"
  kpi_cards: [KPI 1] [KPI 2] [KPI 3] [KPI 4]  // 4 max
  primary_cta: [Button — highest priority action]
  secondary_cta: [Button — second priority]  // optional

content:
  filters: [filter_name: type]  // dropdown, search, date_range
  search: [yes/no] — global or scoped
  view_switcher: [grid | list | board | calendar]  // optional
  main_content: [Table | Card Grid | Kanban | Calendar | Chart | Form | Feed]
  empty_state: "Message shown when no data exists"
  loading_state: Skeleton type (KPI row + table/card skeleton)
  error_state: [Inline banner | Full page | Toast]

right_drawer:
  entity_detail: [opens when clicking a row/item]
  quick_edit: [inline fields in drawer]
  related_entities: [links to related items shown in drawer]

bottom:
  pagination: [page_numbers | load_more | none]
  bulk_actions: [Approve, Delete, Assign, etc. — shown on selection]
  export: [csv | pdf | none]
  audit: [last_updated, total_count, etc.]
```

---

### S01 — Login

```
above_fold:
  breadcrumb: none
  context_bar: none
  title: "Welcome Back"
  description: "Sign in to your account to continue."
  kpi_cards: none
  primary_cta: "Sign In"
  secondary_cta: "Create Account" (link)

content:
  filters: none
  search: no
  view_switcher: none
  main_content: Centered card form — email (input), password (input + toggle visibility),
                "Remember me" checkbox, "Forgot password?" link
  empty_state: N/A
  loading_state: Button spinner during submission
  error_state: Inline error below form: "Invalid email or password."
               Validation errors inline per field.

right_drawer: none

bottom:
  pagination: none
  bulk_actions: none
  export: none
  audit: none
```

### S02 — Register

```
above_fold:
  breadcrumb: none
  context_bar: none
  title: "Create Account"
  description: "Fill in the details below to create your account."
  kpi_cards: none
  primary_cta: "Create Account"
  secondary_cta: "Already have an account? Sign In" (link)

content:
  main_content: Centered card form — name (input), email (input), password (input),
                confirm password (input), terms acceptance (checkbox)
  error_state: Inline field validation, duplicate email error

right_drawer: none
bottom: none
```

### S03 — Forgot Password

```
above_fold:
  breadcrumb: none
  context_bar: none
  title: "Reset Password"
  description: "Enter your email address and we'll send you a reset link."
  kpi_cards: none
  primary_cta: "Send Reset Link"
  secondary_cta: "Back to Sign In" (link)

content:
  main_content: Centered card — email input, submit button
                Success state: "Check your email. We've sent a reset link to [email]."
  error_state: "No account found with this email address."

right_drawer: none
bottom: none
```

### S04 — Reset Password

```
above_fold:
  breadcrumb: none
  context_bar: none
  title: "Set New Password"
  description: "Enter your new password below."
  kpi_cards: none
  primary_cta: "Reset Password"

content:
  main_content: Centered card — new password (input), confirm password (input)
                Token validation check on page load
  error_state: "This reset link is invalid or has expired." + "Request new link"

right_drawer: none
bottom: none
```

### S05 — Smart Home Dashboard

```
above_fold:
  breadcrumb: "Home"
  context_bar: none
  title: "Welcome, {user}!" (personalized greeting)
  description: "Here's your {role} overview for today."
  kpi_cards:
    - role-adaptive (4 cards per role — see Layout System)
    - Employee: My Tasks | Due Today | Overdue | Completed This Week
    - Team Lead: Team Tasks | Pending Review | Overdue | Completed This Week
    - PM: Active Projects | Tasks In Progress | Overdue | Upcoming Milestones
    - Executive: Total Projects | Total Tasks | Overdue % | Team Size
    - HR: Team Size | New This Month | Upcoming Events | Announcements
    - Admin: Active Users | Active Integrations | System Health | Pending Invites
  primary_cta: "+ New" (header dropdown — "N" keyboard shortcut)
  secondary_cta: none (primary actions are widget-driven)

content:
  filters: none (dashboard is unfiltered by design)
  search: no (search is always available in header on all pages)
  view_switcher: none
  main_content:
    Primary widget row (2 columns):
      - Left: "My Tasks" widget (task list, top 5, sorted by priority/due date)
      - Right: "Today's Schedule" widget (meetings, deadlines)
    Secondary widget row:
      - Recent Activity (timeline, last 5)
      - Announcements (latest 2 cards)
      - (PM+): Project Health widget (4 project cards with health dots)
      - (Admin): Integration Status widget
  empty_state: "Welcome to Your Workspace — Create a project, invite your team, and start tracking work."
               Actions: [Create Project] [Invite Team] [Take a Tour]
  loading_state: Skeleton — KPI row (4 rectangles) + widget panels (2-column skeleton)
  error_state: Inline banner per widget section (dashboard fails gracefully — each widget independent)

right_drawer:
  Click task in My Tasks → Task detail drawer (S11 blueprint)
  Click meeting in Schedule → Meeting detail drawer (S20 blueprint)
  Click project health card → Project Workspace (full page, not drawer)

bottom:
  pagination: none (dashboard is summary view)
  bulk_actions: none
  export: none
  audit: "Last updated: {relative_time}"
```

### S06 — Project List

```
above_fold:
  breadcrumb: "Work / Projects"
  context_bar: none
  title: "Projects"
  description: "Manage and monitor all projects across your workspace."
  kpi_cards: Active Projects | At Risk | On Track | Archived
  primary_cta: "+ New Project" (super-admin, project-manager)
  secondary_cta: none

content:
  filters:
    status: dropdown (Active, Archived, All)
    health: dropdown (All, At Risk, On Track)
    date_range: date picker (created or due date)
  search: yes — search by project name, description
  view_switcher: grid / table
  main_content:
    Grid view: Project cards (4-col grid) — name, health dots, progress bar, PM avatar,
               due date, task counts
    Table view: Name, Health, PM, Progress, Tasks, Due Date, Status — sortable columns
  empty_state: "No Projects Yet" — "Projects organize tasks, milestones, and team members."
               Action: [+ Create Project] (if has permission)
  loading_state: Skeleton — KPI row + 6 card skeletons (grid) or table skeleton (list)
  error_state: Inline banner: "Failed to load projects. [Retry]"

right_drawer:
  Click project card/row → Project Workspace (S08 — full page, not drawer)
  {Project list opens full page, not drawer — project workspace is too complex for a drawer}
  Hover on avatar → User tooltip (name, role)

bottom:
  pagination: page_numbers (desktop) / load_more (mobile)
  bulk_actions: Archive, Change Status (selection checkbox on table view only)
  export: CSV export of project list
  audit: "{n} projects total"
```

### S07 — Project Create

```
above_fold:
  breadcrumb: "Work / Projects / New Project"
  context_bar: none
  title: "New Project"
  description: "Create a new project to organize tasks, milestones, and team members."
  kpi_cards: none
  primary_cta: "Create Project"
  secondary_cta: "Cancel"

content:
  main_content: Full-page form —
    Section 1: Project Name (input), Description (textarea)
    Section 2: PM (user picker), Status (dropdown), Priority (select)
    Section 3: Start Date (datepicker), End Date (datepicker)
    Section 4: Members (user multi-select with avatar chips)
  empty_state: N/A
  loading_state: Form skeleton (5 field placeholders)
  error_state: Inline field validation errors, 422 summary at top

right_drawer: none
bottom: none (submit/cancel in sticky footer)
```

### S08 — Project Workspace

```
above_fold:
  breadcrumb: "Work / Projects / {Project Name}"
  context_bar:
    left: [← Back to Projects] Project Name ●●●●○ Health Status
    right: PM Name | Due: {date} | [Share] [Bookmark] [More ▾]
  title: (context bar replaces title)
  description: (context bar provides metadata)
  kpi_cards: (in Overview tab only) — Tasks | Done | Overdue | Days Remaining
  primary_cta: "+ New Task" (Tasks tab) / "+ Add Member" (Members tab) — tab-contextual
  secondary_cta: varies by active tab

content:
  filters: none at workspace level (filters inside task/member tabs)
  search: yes — scoped search within workspace content
  view_switcher: tabs
  main_content: 10-tab workspace —
    Overview: Progress bar + KPI row + Overdue list (5) + Recent Activity (5)
    Tasks: Task list scoped to project (S10 behavior, pre-filtered)
    Timeline: Gantt chart with milestones + task bars
    Calendar: Project-scoped calendar
    Members: Member list with role, avatar, task count, remove action
    Files: Attachment list scoped to project
    Meetings: Meeting list scoped to project
    Reports: Report preview (S28/S29 snippets)
    Activity: Activity feed scoped to project
    Settings: Project configuration form (S09)
  empty_state: Per tab:
    Tasks: "No tasks in this project yet."
    Members: "No members added yet."
    Timeline: "No milestones set yet."
  loading_state: Skeleton — context bar + tab bar + tab content skeleton
  error_state: Inline banner per tab (tab failure doesn't break other tabs)

right_drawer:
  Click task row → Task detail drawer (S11)
  Click member → User profile drawer (S16 quick view)
  Click meeting → Meeting detail drawer (S20)
  Click comment/activity item → Entity detail drawer

bottom:
  pagination: per-tab (task list has its own pagination)
  bulk_actions: per-tab (task bulk actions in Tasks tab)
  export: per-tab (Tasks: CSV, Reports: PDF)
  audit: "Project created {relative_time} by {user}"
```

### S09 — Project Settings

```
above_fold:
  breadcrumb: "Work / Projects / {Project} / Settings"
  context_bar: inherited from S08 context bar
  title: "Project Settings"
  description: "Manage project configuration, status, and team."
  kpi_cards: none
  primary_cta: "Save Changes"
  secondary_cta: "Cancel"

content:
  main_content: Settings form —
    Section 1: Name, Description, Status (dropdown), Priority
    Section 2: Dates (start, end, fields)
    Section 3: Danger Zone — Archive Project, Delete Project
  empty_state: N/A
  loading_state: Form skeleton
  error_state: Inline validation + 422 summary

right_drawer: none
bottom: none
```

### S10 — Task List

```
above_fold:
  breadcrumb: "Work / Tasks"
  context_bar: none
  title: "Tasks"
  description: "View and manage all tasks across your projects."
  kpi_cards: Total Tasks | Due Today | Overdue | Completed This Week
  primary_cta: "+ New Task"
  secondary_cta: none

content:
  filters:
    status: multi-select (Todo, In Progress, In Review, Done)
    priority: multi-select (Critical, High, Medium, Low)
    assignee: user picker (searchable)
    project: project picker (searchable)
    due_date: preset ranges (Today, This Week, Overdue, Custom)
  search: yes — search by task ID (TSK-xxx), title
  view_switcher: list / board / calendar
  main_content:
    List view: Table — ID, Title, Status, Priority, Assignee, Due Date, Project — sortable
    Board view: Kanban — columns Todo, In Progress, In Review, Done — drag & drop
    Calendar view: Month grid with task dots — click to open
  empty_state:
    No filter: "No Tasks Yet" — Action: [+ Create Task]
    Filtered: "No Tasks Match" — Action: [Clear Filters] [+ Create Task]
  loading_state: Skeleton — KPI row + filtered table/Kanban skeleton
  error_state: Inline banner: "Failed to load tasks. [Retry]"

right_drawer:
  Click task row/card → Task detail drawer (S11) — 480px slide from right
  Hover on status → quick status change dropdown (status actions: In Review → Done, etc.)
  Drag to Kanban column → inline status update with optimistic UI

bottom:
  pagination: page_numbers (desktop) / load_more (mobile)
  bulk_actions:
    Selection mode: checkboxes on rows
    Actions: [Assign] [Change Status] [Delete] [Export Selected]
    Bulk action bar appears at bottom when ≥1 selected
  export: CSV export of current filtered view
  audit: "{n} tasks • Showing {n} of {total}"
```

### S11 — Task Detail

```
above_fold:
  breadcrumb: "Work / Tasks / TSK-{id}" (drawer: no breadcrumb)
  context_bar:
    left: [← Back to Tasks] TSK-{id} • {Status Badge} • {Priority Badge}
    right: [Watch] [Share] [More ▾]
  title: "{Task Title}" (h2 in drawer, h1 in full page)
  description: none (description content is in the body)
  kpi_cards: none
  primary_cta: varies by state:
    "Submit for Review" (In Progress) | "Approve" (In Review, TL+) | "Mark Complete" (Todo/In Progress)
  secondary_cta: "Log Time" | "Add Subtask" | "Add Dependency"

content:
  tabs:
    Activity (default): Timeline of task changes + comments
    Comments: Threaded comment feed with @mention
    Attachments: File list with preview
    Time Log: Time entries with running total
  main_content:
    Tab: Activity —
      Description section (collapsible, rich text)
      Details section — Assignee, Due Date, Priority, Project, Watchers, Status
      Activity feed — user actions + comments in chronological order
    Tab: Comments — full threaded comment feed, rich text editor at bottom
    Tab: Attachments — file list with download, upload button
    Tab: Time Log — time entries list, total hours, log time button
  empty_state:
    Comments: "No comments yet. Start the discussion."
    Attachments: "No files attached."
    Time Log: "No time logged yet."
  loading_state: Skeleton — context bar + 2-column content skeleton
  error_state: Inline banner: "Task not found." (full page error for 404)

right_drawer: (this screen IS the drawer — no nested drawer)
  N/A — Task detail is the drawer itself

bottom:
  Comment input: Rich text editor with @mention, always visible at bottom of drawer/page
```

### S12 — Task Create

```
above_fold:
  breadcrumb: "Work / Tasks / New Task" (full page) / drawer title: "New Task"
  context_bar: none (when drawer) / standard (when full page)
  title: "New Task"
  description: none
  kpi_cards: none
  primary_cta: "Create Task"
  secondary_cta: "Cancel"

content:
  main_content: Form —
    Title (input), Description (rich textarea)
    Status (dropdown), Priority (dropdown)
    Assignee (user picker, searchable)
    Project (project picker, searchable)
    Due Date (datepicker)
    Attachments (file upload drag zone)
  empty_state: N/A
  loading_state: None (form renders immediately)
  error_state: Inline field validation, 422 summary at top

right_drawer: (when opened from task list as drawer)
  Same form content compressed into 480px width

bottom: none
```

### S13 — Calendar

```
above_fold:
  breadcrumb: "Work / Calendar"
  context_bar: none
  title: "Calendar"
  description: "Unified view of tasks, meetings, and milestones."
  kpi_cards: none (calendar IS the primary view)
  primary_cta: "+ New Event" (opens create dropdown: Meeting / Milestone / Task)
  secondary_cta: "Today" (jump to current date)

content:
  filters:
    type: multi-select (Tasks, Meetings, Milestones)
    project: project picker
    assignee: user picker
  search: no (calendar is visual browse)
  view_switcher: month / week / day / agenda
  main_content: Calendar grid —
    Month view: Large grid with event dots, click date to see events
    Week view: 7-column time grid with event blocks
    Day view: Hour-by-hour timeline
    Agenda view: Scrollable event list
    Color coding: Blue=Tasks, Green=Meetings, Orange=Milestones
  empty_state: "No events scheduled for this period."
  loading_state: Skeleton — calendar grid with gray event placeholders
  error_state: Inline banner: "Failed to load calendar. [Retry]"

right_drawer:
  Click event → Entity detail drawer (Task S11, Meeting S20, Milestone quick view)
  Click date → Quick-create event modal

bottom:
  pagination: none (month/week navigation)
  bulk_actions: none
  export: none
  audit: none
```

### S14 — Milestones

```
above_fold:
  breadcrumb: "Work / Milestones"
  context_bar: none
  title: "Milestones"
  description: "Cross-project milestone timeline."
  kpi_cards: Total Milestones | Completed | At Risk | Upcoming
  primary_cta: none (milestones created from project workspace)
  secondary_cta: none

content:
  filters:
    project: project picker
    status: dropdown (All, Completed, At Risk, Upcoming)
    date_range: date picker
  search: no
  view_switcher: timeline / list
  main_content:
    Timeline view: Horizontal timeline with milestone diamonds, grouped by project
    List view: Table — Name, Project, Due Date, Status, Progress
  empty_state: "No Milestones" — "Milestones mark important dates in your project timeline."
  loading_state: Timeline skeleton
  error_state: Inline banner

right_drawer:
  Click milestone → Project workspace (S08) scrolled to Timeline tab

bottom:
  pagination: load_more (if many milestones)
  bulk_actions: none
  export: none
  audit: none
```

### S15 — People Directory

```
above_fold:
  breadcrumb: "Team / People"
  context_bar: none
  title: "People"
  description: "Find and connect with your team members."
  kpi_cards: Total Active | Recently Joined | Departments | (admin: Pending Invites)
  primary_cta: "+ Invite People" (admin: shows invite form / modal)
  secondary_cta: none

content:
  filters:
    department: dropdown (or text search)
    role: dropdown (super-admin, project-manager, team-lead, employee, hr)
    status: dropdown (Active, Inactive)
  search: yes — search by name, email, department
  view_switcher: grid / list
  main_content:
    Grid view: Avatar cards — avatar, name, role, department, email
    Table view: Avatar, Name, Email, Role, Department, Status, Tasks — sortable
  empty_state: (never empty — at least the current user exists)
  loading_state: Skeleton — table/grid skeleton
  error_state: Inline banner

right_drawer:
  Click user → User profile drawer (S16 quick view)
  Click email → mailto: link
  Hover on avatar → User tooltip

bottom:
  pagination: page_numbers
  bulk_actions: none (people management is in admin section)
  export: CSV export
  audit: "{n} people total"
```

### S16 — User Profile

```
above_fold:
  breadcrumb: "Team / People / {User Name}" (drawer: no breadcrumb)
  context_bar:
    left: [← Back to People] {User Name}
    right: [Message] [More ▾] (admin: [Edit])
  title: (context bar replaces title)
  kpi_cards: Active Tasks | Completed This Week | Upcoming Meetings | Overdue Tasks
  primary_cta: none (profile is informational)

content:
  tabs:
    Overview (default): Avatar (large), name, email, role, department, bio
    Assigned Tasks: Task list scoped to user (S10, pre-filtered by assignee)
    Activity: Activity feed scoped to user
  main_content:
    Tab: Overview — profile info card + KPI row + recent activity snippet
    Tab: Tasks — task table filtered by assignee
    Tab: Activity — activity feed filtered by actor
  empty_state:
    Tasks: "{User} has no assigned tasks."
    Activity: "{User} has no recorded activity."
  loading_state: Skeleton — avatar + metadata + tab skeleton
  error_state: "User not found." (full page)
  right_drawer: (this screen IS the drawer when opened from list)
  bottom: none
```

### S17 — User Create (Admin)

```
above_fold:
  breadcrumb: "Administration / Users / New User"
  context_bar: none
  title: "New User"
  description: "Create a new user account."
  kpi_cards: none
  primary_cta: "Create User"
  secondary_cta: "Cancel"

content:
  main_content: Form —
    Name (input), Email (input)
    Password (input), Confirm Password (input)
    Role (dropdown from roles list)
    Department (input), Title (input)
    Send invite email (toggle)
  empty_state: N/A
  loading_state: Form skeleton
  error_state: Inline field validation, duplicate email error

right_drawer: none
bottom: none
```

### S18 — User Edit (Admin)

```
above_fold:
  breadcrumb: "Administration / Users / {User} / Edit"
  context_bar: none
  title: "Edit User"
  description: "Update user information and manage account status."
  kpi_cards: none
  primary_cta: "Save Changes"
  secondary_cta: "Cancel" | "Deactivate User" (toggle)

content:
  main_content: Form —
    Name (input), Email (input)
    Role (dropdown), Department (input), Title (input)
    Account Status (toggle: Active/Inactive)
    Created at (read-only), Last login (read-only)
    Danger Zone: Delete User (confirm dialog)
  empty_state: N/A
  loading_state: Form skeleton (pre-filled with current data)
  error_state: Inline field validation

right_drawer: none
bottom: none
```

### S19 — Meeting List

```
above_fold:
  breadcrumb: "Workspace / Meetings"
  context_bar: none
  title: "Meetings"
  description: "View and manage all scheduled meetings."
  kpi_cards: Upcoming Today | This Week | Past This Month | Total
  primary_cta: "+ New Meeting"

content:
  filters:
    date_range: preset (Today, Tomorrow, This Week, Past)
    organizer: user picker
    project: project picker (if meetings linked to projects)
  search: yes — search by meeting title
  view_switcher: list / calendar (mini-calendar sidebar)
  main_content:
    List view: Meeting cards — Title, Date, Time, Duration, Organizer, Attendee avatars, [Join] button
    Calendar view: Mini-calendar on left + selected day's meetings on right
  empty_state: "No Meetings Scheduled" — Action: [+ New Meeting]
  loading_state: Skeleton — KPI + meeting card skeletons
  error_state: Inline banner

right_drawer:
  Click meeting card → Meeting detail drawer (S20)

bottom:
  pagination: load_more
  bulk_actions: none
  export: none
  audit: none
```

### S20 — Meeting Detail

```
above_fold:
  breadcrumb: "Workspace / Meetings / {Meeting Title}" (drawer: none)
  context_bar:
    left: [← Back to Meetings] {Title} • {Status} • {Date}
    right: [Join] [Share] [Edit] [More ▾]
  title: (context bar replaces title)
  kpi_cards: none
  primary_cta: "Join Meeting" (if in progress or upcoming)
  secondary_cta: "Add to Calendar" | "Edit"

content:
  tabs:
    Agenda & Notes (default): Agenda items list + Notes section (rich text inline edit)
    Action Items: Action items table — item, assignee, status, convert-to-task button
    Attendees: Attendee list with RSVP status (Accepted, Pending, Declined)
  main_content:
    Tab: Agenda & Notes — agenda items (numbered, collapsible) + notes textarea
    Tab: Action Items — table with [Convert to Task] action per row
    Tab: Attendees — avatar list with status badges
  empty_state:
    Notes: "No notes recorded yet. Start typing during the meeting."
    Action Items: "No action items yet. @mention someone in notes to create one."
    Attendees: "No attendees added."
  loading_state: Skeleton — context bar + tab skeleton
  error_state: "Meeting not found." (full page)

right_drawer: (this screen IS the drawer when opened from list)
bottom: none
```

### S21 — Meeting Create

```
above_fold:
  breadcrumb: "Workspace / Meetings / New Meeting"
  context_bar: none
  title: "New Meeting"
  description: "Schedule a meeting with your team."
  kpi_cards: none
  primary_cta: "Schedule Meeting"
  secondary_cta: "Cancel"

content:
  main_content: Form —
    Title (input), Description (textarea)
    Date (datepicker), Start Time (timepicker), Duration (duration select)
    Location/Video Link (input)
    Agenda (repeating textarea — add/remove agenda items)
    Attendees (user multi-select with avatar chips)
    Project (project picker — optional)
  empty_state: N/A
  loading_state: Form skeleton
  error_state: Inline field validation

right_drawer: none
bottom: none
```

### S22 — Announcement List

```
above_fold:
  breadcrumb: "Workspace / Announcements"
  context_bar: none
  title: "Announcements"
  description: "Company announcements and updates."
  kpi_cards: Total | This Month | Pinned | (HR+: Drafts)
  primary_cta: "+ New Announcement" (HR+, super-admin)

content:
  filters:
    date_range: preset (Today, This Week, This Month)
    author: user picker
    priority: dropdown (All, High, Normal)
  search: yes — search by title, content
  view_switcher: feed / list
  main_content:
    Feed view: Card feed — Title, excerpt, author avatar, date, pinned indicator, priority badge
    List view: Table — Title, Author, Date, Priority, Status
  empty_state: "No Announcements Yet" — Action: [+ New Announcement]
  loading_state: Skeleton — card feed skeleton
  error_state: Inline banner

right_drawer:
  Click announcement → Announcement detail feed (S23 — scroll page, not drawer)

bottom:
  pagination: load_more
  bulk_actions: none (announcements are individual)
  export: none
  audit: none
```

### S23 — Announcement Detail

```
above_fold:
  breadcrumb: "Workspace / Announcements / {Title}"
  context_bar: none
  title: "{Announcement Title}"
  description: "By {Author} • {Date} • {Priority Badge}"
  kpi_cards: none
  primary_cta: none
  secondary_cta: [Edit] [Delete] (author + admin)

content:
  main_content: Full announcement content —
    Rich text body
    Author avatar + name + date footer
    (No comments — announcements are broadcast, not conversational)
  empty_state: N/A
  loading_state: Content skeleton
  error_state: "Announcement not found."

right_drawer: none
bottom: none
```

### S24 — Announcement Create

```
above_fold:
  breadcrumb: "Workspace / Announcements / New Announcement"
  context_bar: none
  title: "New Announcement"
  description: "Share an update with your team or the entire company."
  kpi_cards: none
  primary_cta: "Publish Announcement"
  secondary_cta: "Save as Draft" | "Cancel"

content:
  main_content: Form —
    Title (input)
    Content (rich text editor — full toolbar)
    Audience (dropdown: All / Department / Team)
    Priority (dropdown: High / Normal)
    Pin announcement (toggle)
  empty_state: N/A
  loading_state: Form skeleton
  error_state: Inline field validation

right_drawer: none
bottom: none
```

### S25 — Notifications

```
above_fold:
  breadcrumb: "Workspace / Notifications"
  context_bar: none
  title: "Notifications"
  description: "Stay informed about mentions, assignments, and updates."
  kpi_cards: Total Unread | Mentions | Approvals Pending | Updates
  primary_cta: "Mark All as Read"
  secondary_cta: none

content:
  filters:
    category: tabs (All | Unread | Mentions | Approvals)
    date: preset (Today, This Week, Older)
  search: no (notifications are scoped by nature)
  view_switcher: none
  main_content: Notification feed —
    Grouped by date (Today, Yesterday, This Week, Older)
    Each item: Type icon, message text, relative time, read/unread dot
    Hover: "Mark as Read" button appears
  empty_state: "All Caught Up!" — "You'll be notified when someone mentions you, assigns
               you a task, or comments on your work."
  loading_state: Skeleton — notification item placeholders
  error_state: Inline banner

right_drawer:
  Click notification → Navigate to source entity (Task S11 / Meeting S20 /
  Announcement S23 — full page navigation, not drawer)

bottom:
  pagination: load_more
  bulk_actions: "Mark Selected as Read" (via checkboxes)
  export: none
  audit: none
```

### S26 — Activity Timeline

```
above_fold:
  breadcrumb: "Workspace / Activity"
  context_bar: none
  title: "Activity"
  description: "Track all changes across your workspace."
  kpi_cards: Actions Today | This Week | Unique Users | Entities Changed
  primary_cta: none
  secondary_cta: none

content:
  filters:
    date_range: preset (Today, This Week, This Month, Custom)
    user: user picker
    action: multi-select (Created, Updated, Deleted, Commented, Status Change)
    resource: multi-select (Project, Task, Meeting, Milestone, Announcement)
  search: yes — search by entity name, user name
  view_switcher: timeline / list
  main_content:
    Timeline view: Chronological feed grouped by date
      Each entry: [User avatar] [User name] [action] [resource type] "[resource name]" — [relative time]
    List view: Table — Timestamp, User, Action, Resource, Details
  empty_state: "No Activity Recorded" — "Activity begins when someone creates, updates,
               or comments on something."
  loading_state: Skeleton — timeline item placeholders
  error_state: Inline banner

right_drawer:
  Click user → User profile drawer (S16)
  Click entity name → Entity detail drawer (S11/S20/S23)

bottom:
  pagination: load_more
  bulk_actions: none
  export: CSV export of activity log (admin)
  audit: none
```

### S27 — Analytics Center

```
above_fold:
  breadcrumb: "Analytics"
  context_bar: none
  title: "Analytics Center"
  description: "Data-driven insights into projects, teams, and performance."
  kpi_cards: Projects Tracked | Tasks Completed | On-Time Rate | Avg Cycle Time
  primary_cta: "Export Overview" (dropdown: CSV / PDF)
  secondary_cta: none

content:
  filters:
    date_range: preset (This Quarter, Last Quarter, This Year, Custom)
    project: project picker (optional, for scoping)
  search: no
  view_switcher: none
  main_content: Dashboard grid (2×2) —
    Top-left: Project Health chart (bar + health dots)
    Top-right: Completion Trend (line chart)
    Bottom-left: Team Velocity (line chart)
    Bottom-right: Workload Distribution (horizontal bar chart)
    Each chart has: Title, "View Full Report" link → specific report screen
  empty_state: "Insufficient Data" — "Charts will populate as tasks are created and completed."
  loading_state: Skeleton — 4 chart placeholders (gray pill shapes)
  error_state: Inline banner per chart (each chart fails independently)

right_drawer:
  Click chart → Full report page (S28/S29/S30/S31)

bottom:
  pagination: none
  bulk_actions: none
  export: "Export Overview" button (dropdown: CSV / PDF)
  audit: none
```

### S28 — Project Health Report

```
above_fold:
  breadcrumb: "Analytics / Project Health"
  context_bar: none
  title: "Project Health"
  description: "Visual health assessment of all projects with trend data."
  kpi_cards: Healthy | At Risk | Critical | Not Rated
  primary_cta: "Export" (dropdown: CSV / PDF)
  secondary_cta: none

content:
  filters:
    date_range: date picker
    health: dropdown (All, Healthy, At Risk, Critical)
  main_content:
    Chart: Bar chart — each project as bar, colored by health (green→red gradient)
    Below: Health dot grid — all projects with 5-dot scale, click to drill down
    Below: Data table — Project, Health Score, Trend (up/down), Tasks, Overdue, Last Activity
  empty_state: "Insufficient Data"
  loading_state: Chart skeleton + table skeleton

right_drawer:
  Click project bar/dot → Project Workspace (S08)

bottom:
  pagination: none (all projects shown)
  export: CSV / PDF
```

### S29 — Team Velocity Report

```
above_fold:
  breadcrumb: "Analytics / Team Velocity"
  title: "Team Velocity"
  description: "Track team productivity over time."
  kpi_cards: Avg Velocity | Best Week | Lowest Week | Trend
  primary_cta: "Export"
  content:
    Chart: Line chart — weekly completion counts, multi-team comparison
    Below: Data table — Week, Tasks Completed, Team, Velocity Change
```

### S30 — Workload Distribution Report

```
above_fold:
  breadcrumb: "Analytics / Workload"
  title: "Workload Distribution"
  description: "Visualize workload balance across team members."
  kpi_cards: Avg Tasks/Person | Heaviest Load | Lightest Load | Unassigned
  primary_cta: "Export"
  content:
    Chart: Horizontal bar chart — each person, sorted by task count
    Below: User workload cards — avatar, name, task count, overdue indicator
```

### S31 — Trends Report

```
above_fold:
  breadcrumb: "Analytics / Trends"
  title: "Trends"
  description: "Long-term trends across quarters and years."
  kpi_cards: QoQ Change | YoY Change | Best Quarter | Avg Completion Rate
  primary_cta: "Export"
  content:
    Chart: Multi-line chart — completion rate, cycle time, project count per quarter
    Below: Summary stats table per quarter
```

### S32 — Exports

```
above_fold:
  breadcrumb: "Analytics / Exports"
  title: "Export Data"
  description: "Export analytics data for offline analysis."
  primary_cta: "Download"
  content:
    Report type (dropdown: Project Health, Team Velocity, Workload, Trends)
    Date range (date picker)
    Format (radio: CSV / PDF)
    Columns (checkbox group — select which columns to include)
```

### S33 — Roles List

```
above_fold:
  breadcrumb: "Administration / Roles"
  title: "Roles"
  description: "Manage user roles and their permissions."
  kpi_cards: Total Roles | Users Managed | Last Modified
  primary_cta: "+ New Role"
  content:
    Table: Role Name, Description, User Count, Permissions Count, Last Modified, [Actions]
    Actions per row: [Edit Permissions] [View Members] [Delete]
  empty_state: "No roles defined." (should not happen — seeded roles exist)
```

### S34 — Role Detail

```
above_fold:
  breadcrumb: "Administration / Roles / {Role Name}"
  context_bar: {Role Name} — {User Count} users
  primary_cta: "Save Permissions"
  content:
    Tab: Overview — name, description, member count, created date
    Tab: Permissions — grouped by resource (Projects, Tasks, Users, etc.)
           Each permission: resource.action — toggle / checkbox
    Tab: Members — user list with this role
```

### S35 — Role Create

```
above_fold:
  breadcrumb: "Administration / Roles / New Role"
  title: "New Role"
  primary_cta: "Create Role"
  content:
    Form: Name (input), Description (textarea)
    Base permissions from existing role (dropdown: copy from)
    Permission checkboxes (optional — can set after creation)
```

### S36 — Permission Matrix

```
above_fold:
  breadcrumb: "Administration / Permissions"
  title: "Permission Matrix"
  description: "Full view of all permissions across all roles."
  primary_cta: none (read-only with inline edit)
  content:
    Matrix table: Rows = Resources (Projects, Tasks, Users, etc.)
                  Columns = Roles
                  Cells = Checkboxes or indicators — click to toggle (with confirm)
    Filter: Search to highlight specific permission
    Legend: Color coded (granted/denied/partial)
```

### S37 — Integration List

```
above_fold:
  breadcrumb: "Administration / Integrations"
  title: "Integrations"
  description: "Connect external tools to automate workflows."
  kpi_cards: Active | Inactive | Failed Syncs | Total
  primary_cta: "+ Add Integration"
  content:
    Card grid: Integration cards — icon/logo, name, type, status badge (Active/Inactive),
               last sync time, [Configure] [Sync Now] [Delete]
    Status colors: Green=Active, Yellow=Warning, Red=Error
  empty_state: "No Integrations" — Action: [+ Add Integration]
```

### S38 — Integration Detail

```
above_fold:
  breadcrumb: "Administration / Integrations / {Name}"
  context_bar: {Name} — {Type} — {Status Badge}
  primary_cta: "Sync Now"
  secondary_cta: [Edit] [Delete]
  content:
    Tab: Overview — name, type, status, created date, last sync
    Tab: Sync Log — table of sync attempts: Timestamp, Status, Items Synced, Error
    Tab: Settings — configuration fields (varies by type)
```

### S39 — Integration Create

```
above_fold:
  breadcrumb: "Administration / Integrations / New Integration"
  title: "New Integration"
  primary_cta: "Save & Test Connection"
  secondary_cta: "Save" | "Cancel"
  content:
    Form: Type (dropdown: GitHub, Slack, Webhook, Custom)
          Name (input)
          Configuration fields (dynamic based on type)
          [Test Connection] button
```

### S40 — Settings — Profile

```
above_fold:
  breadcrumb: "Administration / Settings / Profile"
  title: "Profile Settings"
  description: "Manage your personal profile information."
  primary_cta: "Save Changes"
  content:
    Sidebar nav: Profile | Account | Workspace | Notifications | Appearance
    Form: Avatar (upload + crop), Name, Email (read-only), Bio, Department, Title
```

### S41 — Settings — Account

```
above_fold:
  breadcrumb: "Administration / Settings / Account"
  title: "Account Settings"
  primary_cta: "Update Password"
  content:
    Section: Password — Current password, New password, Confirm password
    Section: Sessions — Active sessions list (current device, last active, [Revoke])
```

### S42 — Settings — Workspace

```
above_fold:
  breadcrumb: "Administration / Settings / Workspace"
  title: "Workspace Settings"
  primary_cta: "Save"
  content:
    Form: Workspace Name, Workspace Logo, Default Project Visibility,
          Date Format (dropdown), Time Format (dropdown), First Day of Week
    (Admin only, hidden from non-admin sidebar)
```

### S43 — Settings — Notifications

```
above_fold:
  breadcrumb: "Administration / Settings / Notifications"
  title: "Notification Preferences"
  primary_cta: "Save Preferences"
  content:
    Preference list: Grouped by type (Tasks, Meetings, Announcements, System)
      Each: Notification event (e.g., "Task assigned to me") — toggle on/off
             Email notification — toggle on/off
             In-app notification — toggle on/off
```

### S44 — Settings — Appearance

```
above_fold:
  breadcrumb: "Administration / Settings / Appearance"
  title: "Appearance"
  description: "Customize your visual experience."
  primary_cta: none (changes apply immediately)
  content:
    Theme: radio card group — Light / Dark / System
    Density: radio — Comfortable / Compact
    Language: dropdown (English only v1, extensible)
```

### S45 — 404 Not Found

```
above_fold:
  breadcrumb: none
  title: "Page Not Found"
  description: "The page you're looking for doesn't exist or has been moved."
  primary_cta: "Go to Dashboard"
  secondary_cta: "Go Back"
  content:
    Centered: Large icon (80px) + Title + Description + Actions
    No sidebar/header (minimal chrome)
```

### S46 — Error Boundary

```
above_fold:
  breadcrumb: none
  title: "Something Went Wrong"
  description: "An unexpected error occurred. Our team has been notified."
  primary_cta: "Reload"
  secondary_cta: "Go to Dashboard"
  content:
    Centered: Warning icon + Title + Description + Actions
    Full page: replaces the errored content area
```

### S47 — Onboarding

```
above_fold:
  breadcrumb: none
  title: "Welcome to Your Workspace!"
  description: "Let's get you set up in just a few steps."
  primary_cta: "Create Your First Project"
  secondary_cta: "Skip Tour"
  content:
    Step indicator (1-3): Progress dots
    Step 1: Create project — form inline
    Step 2: Invite team — email input + [Send Invite]
    Step 3: Create your first task — inline task creation
    Or: Quick action cards — [Take a Tour] [Explore on My Own] [Invite Team]
```

---

*End of Phase B — 47 Screen Blueprints Complete*
