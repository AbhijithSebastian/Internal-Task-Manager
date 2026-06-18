# User Flows Specification

> **Phase:** User Flows — Phase 7 of 10
> **Status:** Complete
> **Base:** PRD v2.2 — User Journeys (Section 5), User Personas (Section 3)

---

## Table of Contents

1. [Flow Notation Key](#1-flow-notation-key)
2. [Persona A: Employee Daily Workflow](#2-persona-a-employee-daily-workflow)
3. [Persona B: Team Lead Management Workflow](#3-persona-b-team-lead-management-workflow)
4. [Persona C: Project Manager Planning & Monitoring](#4-persona-c-project-manager-planning--monitoring)
5. [Persona D: Executive Weekly Review](#5-persona-d-executive-weekly-review)
6. [Persona E: HR Operations Workflow](#6-persona-e-hr-operations-workflow)
7. [Persona F: Administrator Configuration](#7-persona-f-administrator-configuration)
8. [Cross-Cutting Flows](#8-cross-cutting-flows)
9. [Edge Cases & Error Flows](#9-edge-cases--error-flows)

---

## 1. Flow Notation Key

```
PAGE                     Full-page view
DRAWER                   Slide-from-right detail drawer
MODAL                    Centered dialog
TOAST                    Top-right notification
BANNER                   Inline content banner
BOTTOM_SHEET             Mobile filter/action sheet

→                        User action / click
⇒                        System response
│                        Concurrent branch
├──                      Branch start
└──                      Branch end

[Condition]              Decision point
{Note}                   Design note / behavior
```

---

## 2. Persona A: Employee Daily Workflow

### Flow A1: Morning Login & Dashboard Scan

```
Login Page
→ Enter email + password
⇒ Form validation [422 → inline field errors]
⇒ Success → JWT stored, redirect to /dashboard
│
Smart Home Dashboard (Employee variant)
⇒ [Skeleton: KPI row → widget panels → full content]
⇒ KPI cards populate: My Tasks (5) | Due Today (2) | Overdue (0) | Completed (4)
⇒ My Tasks widget loads: list of 5 tasks, sorted by due date
⇒ Schedule widget loads: 1 meeting at 10am
⇒ Recent Activity loads: last 5 actions on user's tasks
│
→ Scan KPI cards
→ See "Due Today (2)" — attention drawn
→ See "Overdue (0)" — relief
│
Three questions answered:
  What's happening? → KPI cards show task status
  Needs attention? → 2 tasks due today (not overdue, but imminent)
  What next? → My Tasks widget shows exactly what to work on
```

### Flow A2: Open & Complete a Task

```
Smart Home Dashboard
→ Click task in My Tasks widget
⇒ Task detail drawer opens (480px, slide from right)
⇒ [Skeleton: metadata skeleton → content]
⇒ Drawer shows: TSK-142, "Update Q4 forecast", ● In Progress
│
→ Read description
→ Click Status dropdown → change from "In Progress" to "Done"
⇒ Optimistic update → status changes immediately
⇒ Toast: "Task completed" (3s auto-dismiss)
⇒ KPI card on dashboard updates (if visible) — "Due Today" decrements
│
→ Click "Add comment" at bottom of drawer
→ Type: "Forecast updated with latest numbers. Ready for review."
→ Press Ctrl+Enter (or click Post)
⇒ Comment appears optimistically
⇒ Notification sent to watchers
│
→ Click X or press Escape to close drawer
⇒ Drawer slides out, focus returns to dashboard
```

### Flow A3: Check Notifications & Respond

```
Header → Click notification bell
⇒ Notification panel drops down (or drawer opens — design decision: drawer)
⇒ Categorized tabs: All | Unread | Mentions | Approvals
⇒ Unread tab has red badge: 3
│
→ See notification: "@mentioned you in TSK-142"
→ Click notification
⇒ Navigate to Task TSK-142 detail (full page, since from notification)
⇒ [Skeleton: header → tabs → content]
⇒ Focus on the comment mentioning the user
│
→ Reply to comment
→ Read second notification: "Meeting reminder: Standup in 15 min"
→ Third: "Task TSK-143 assigned to you"
│
→ Press Escape → back to context {Or click notification center close}
```

### Flow A4: Join Meeting via Calendar

```
Dashboard → Schedule widget shows "Standup at 10:00 AM"
→ Click meeting
⇒ Meeting drawer opens: "Daily Standup" — 10:00-10:15 — Zoom link
→ Click "Join" link {opens in new tab}
→ Meeting completed → Click "Add notes" in drawer
⇒ Inline edit mode activates for notes textarea
→ Type notes, @mention if needed {action items created automatically}
→ Close drawer
```

### Flow A5: Log Time on Task

```
Task detail drawer
→ Click "Log Time" section (collapse/expand)
⇒ Time entry form: Duration (input) + Description (textarea) + Date (today default)
→ Enter "2h" and "Worked on Q4 forecast updates"
→ Click "Log Time" button
⇒ Optimistic add to time entries list
⇒ Running total updates in task header
⇒ Toast: "2h logged" (3s)
→ Close drawer
```

### Flow A6: Submit Task for Approval

```
Task detail drawer
→ Task status is "In Review"
→ Click "Submit for Review" button
⇒ Status changes to "In Review"
⇒ Notification sent to reviewer (team lead)
⇒ Toast: "Submitted for review"
→ Reviewer sees in their dashboard approval queue
```

---

## 3. Persona B: Team Lead Management Workflow

### Flow B1: Dashboard Scan & Approval Queue

```
Login → Smart Home Dashboard (Team Lead variant)
⇒ KPI: Team Tasks (24) | Pending Review (3) | Overdue (1) | Completed This Week (12)
⇒ Approval Queue widget shows 3 tasks pending review, sorted by submission date
│
→ See "Pending Review (3)" — primary attention driver
→ See "Overdue (1)" — secondary concern
│
→ Click on approval queue widget
⇒ Navigate to /work/tasks?filter=pending-review
⇒ [Skeleton: KPI row → filter bar → table]
⇒ Table shows 3 tasks: ID, Title, Assignee, Submitted, Priority
│
→ Review first task → click row
⇒ Task detail drawer opens
→ Read description, check attachments
→ Click "Approve" button
⇒ Status changes to "Done"
⇒ Toast: "Task approved" (3s)
⇒ KPI updates on dashboard {if navigating back}
│
→ Press Escape → back to task list
→ Repeat for remaining 2 tasks
```

### Flow B2: Bulk Approve Tasks

```
Task list (filtered: pending-review)
→ Click checkbox on 2 of 3 tasks
⇒ Checkbox selected, bulk action bar appears at bottom:
  "2 selected" [Approve] [Reject] [Assign]
→ Click "Approve"
⇒ Confirm dialog: "Approve 2 tasks?" [Cancel] [Approve]
→ Click "Approve"
⇒ Both tasks updated to "Done"
⇒ Toast: "2 tasks approved" (3s)
⇒ Bulk action bar disappears
```

### Flow B3: Check Team Workload

```
Dashboard → Click "Team Tasks" KPI card
⇒ Navigate to /work/tasks (default: team scope)
→ Click View Toggle → "Board" view
⇒ Kanban board: Todo | In Progress | In Review | Done
→ See "In Progress" column has 5 tasks, 3 assigned to one person
→ Click on overloaded assignee filter → filter by that team member
⇒ Shows all tasks assigned to John — 8 active, 2 overdue
→ Click John's name → User profile drawer
⇒ Shows: active tasks, completed this week, upcoming meetings
```

---

## 4. Persona C: Project Manager Planning & Monitoring

### Flow C1: Create a Project

```
Header → Click "+ New" button (or press N key)
⇒ Dropdown menu: New Project | New Task | New Meeting | New Announcement
→ Select "New Project"
⇒ Navigate to /work/projects/new
⇒ [Form page — full page, not drawer]
→ Fill in: Project Name, Description, PM (self), Start/End dates, Members
→ Click "Create Project"
⇒ Validation [422 → inline errors]
⇒ Success → Navigate to /work/projects/{id} — Overview tab
⇒ Toast: "Project created" (3s)
│
On Project Workspace:
→ Switch to Tasks tab
→ Create 3 initial tasks (via inline create or "+ New Task")
→ Switch to Timeline tab
→ Add Milestones: "Phase 1 Complete", "Launch"
→ Switch to Members tab
→ Verify team members added
→ Switch to Settings tab
→ Set project status to "Active"
```

### Flow C2: Project Health Monitoring

```
Dashboard (PM variant)
⇒ KPI: Active Projects (4) | Tasks In Progress (18) | Overdue (2) | Milestones (6)
⇒ Project Health widget shows 4 project cards with health dots:
  Project A: ●●●●● (green) | Project B: ●●●●○ (green)
  Project C: ●●●○○ (yellow) | Project D: ●●○○○ (orange)
│
→ See Project D at orange health — click
⇒ Navigate to /work/projects/{id} — Overview tab
⇒ Overview shows:
  - Progress bar: 30% (behind schedule)
  - Overdue tasks list: 2 overdue, 3 due this week
  - Recent activity: no updates in 5 days
→ Switch to Tasks tab → filter by overdue
⇒ Shows 2 overdue tasks
→ Reassign overdue tasks to available member
→ Switch to Members tab
→ Check workload distribution
→ Send message to PM: "Need to discuss Project D blockers"
```

### Flow C3: Generate & Export Report

```
Analytics Center → /analytics
⇒ KPI: Projects (4) | Tasks (48) | On-Time (72%) | Cycle (4.2d)
⇒ Chart grid: Completion Trend + Project Health + Team Velocity + Workload
│
→ Click Project Health chart
⇒ Navigate to /analytics/project-health
⇒ Full report: bar chart + health dot grid + data table
→ Click "Export"
⇒ Export dropdown: CSV | PDF
→ Select "PDF"
⇒ PDF generation progress indicator
⇒ Download starts
```

### Flow C4: Schedule Meeting from Project

```
Project Workspace → Meetings tab
⇒ Tab shows "No meetings yet" empty state (for new project)
→ Click "+ New Meeting"
⇒ Create meeting form (full page or drawer — full page for rich creation)
→ Fill: Title, Date, Time, Duration, Agenda, Attendees
→ Click "Schedule"
⇒ Meeting created, added to calendar
⇒ Attendees receive notifications
⇒ Meetings tab now shows 1 upcoming meeting
```

---

## 5. Persona D: Executive Weekly Review

### Flow D1: High-Level Health Scan

```
Login → Smart Home Dashboard (Executive variant)
⇒ KPI: Projects (8) | Total Tasks (145) | Overdue (12 — red) | Team Size (24)
⇒ Project Health widget: grid of 8 project cards with health dots
  - 5 green, 2 yellow, 1 red
⇒ At-Risk Projects section highlights Project D (red health)
│
Three questions answered:
  What's happening? → KPI: 145 tasks across 8 projects, 24 people
  Needs attention? → 12 overdue tasks, 1 at-risk project (red dot)
  What next? → Click at-risk project → investigate
│
→ Click red health project card
⇒ Navigate to /work/projects/{id} — read-only context
⇒ Overview tab shows: 30% progress, 5 overdue, 4 blocked tasks
→ Check Activity tab for recent changes
→ Switch to Reports tab → view health trend
```

### Flow D2: Quarterly Trend Review

```
Analytics Center → /analytics/trends
⇒ Line chart showing task completion rate over last 6 months
→ Adjust date range to last quarter
⇒ Chart updates
→ See Q3 dip, Q4 recovery
→ Click data point for Q4 peak
⇒ Tooltip: "142 tasks completed in December"
→ Switch to Team Velocity report
→ See velocity trend by team
→ Export CSV for board presentation
```

---

## 6. Persona E: HR Operations Workflow

### Flow E1: Company Announcement

```
Dashboard (HR variant)
⇒ KPI: Team Size (24) | New This Month (2) | Upcoming Events (3) | Announcements (5)
│
→ Click "Create Announcement" (from dashboard quick action or sidebar)
⇒ Navigate to /workspace/announcements/new
⇒ Form: Title, Content (rich text), Audience (All / Department / Team), Priority
→ Fill in: "Office Holiday Schedule", body with dates, audience: All, priority: Normal
→ Click "Publish"
⇒ Announcement created, appears in everyone's feed
⇒ Notification sent to all users: "New announcement: Office Holiday Schedule"
⇒ Toast: "Announcement published" (3s)
```

### Flow E2: Schedule Company Event

```
Sidebar → Calendar
⇒ Calendar view (month by default)
→ Click "+" on Dec 20
⇒ Create event modal: Title, Time, Location, Description, Attendees
→ Fill in: "Holiday Party", 5:00 PM, "Main Office", description
→ Click "Create"
⇒ Event added to calendar
⇒ Invitation sent to all attendees
```

---

## 7. Persona F: Administrator Configuration

### Flow F1: User Role Management

```
Administration → Roles
⇒ Role list: super-admin (1), project-manager (5), team-lead (8), employee (42), hr (2)
→ Click "project-manager" role
⇒ Role detail drawer: name, description, permissions, member count
→ Click "Permissions" tab
⇒ Permission matrix: resources × actions with checkboxes
→ See "projects.delete" is checked for PM — uncheck it
⇒ Confirm: "Remove Delete Project permission from project-manager?" [Cancel] [Remove]
→ Click "Remove"
⇒ Permission updated
⇒ All PM users lose delete project access immediately
```

### Flow F2: Integration Configuration

```
Administration → Integrations
⇒ Integration list: GitHub (active, synced 2h ago), Slack (inactive)
→ Click "Add Integration"
⇒ Navigate to /administration/integrations/new
⇒ Form: Type (GitHub / Slack / Webhook), Name, Configuration fields
→ Select "Slack", enter webhook URL, name "Engineering Channel"
→ Click "Test Connection"
⇒ Test executes → success indicator
→ Click "Save"
⇒ Integration created, active
→ Back to integrations list → see new integration with green status
→ Click "Sync Now"
⇒ Sync executes, last_synced_at updates, sync log shows result
```

### Flow F3: System Audit via Activity

```
Administration → Settings → Activity tab (or sidebar → Activity)
⇒ Global activity timeline
→ Filter: date range = "This Week", action = "Deleted"
⇒ Shows all delete operations this week
→ See: "Admin deleted user jdoe" — investigate
→ Click user activity → user profile shows account disabled
→ Cross-reference with audit log
```

---

## 8. Cross-Cutting Flows

### Flow X1: Global Search

```
Any page → Press "/" key
⇒ Focus jumps to search input (in header or filter bar)
⇒ Dropdown shows recent searches (if any)
→ Type "Q4"
⇒ Debounced 300ms → results appear in dropdown overlay
  Results grouped: Projects (2) | Tasks (5) | Meetings (1) | People (3)
→ See "Q4 Planning" project — click
⇒ Navigate to project workspace
→ Press Escape to close search dropdown
```

### Flow X2: "New" Quick-Action Menu

```
Any page → Press "N" key (not in input field)
⇒ Dropdown menu appears below header: New Project | New Task | New Meeting | New Announcement
→ Use arrow keys to navigate, Enter to select
⇒ Navigate to create page for selected entity type
→ Press Escape to dismiss without selecting
```

{Items shown are permission-aware: HR sees New Announcement, PM sees all, Employee sees only New Task.}

### Flow X3: Cross-Entity Link — Meeting Action to Task

```
Meeting detail → Notes section
→ Type: "@John please update the Q4 forecast"
⇒ @mention triggers user picker, selects John
→ Press Enter after typing
⇒ Action item created: "Update the Q4 forecast" → assigned to John
→ See action item appear in meeting notes with "Convert to Task" button
→ Click "Convert to Task"
⇒ Task drawer opens, pre-filled: title = action item text, assignee = John, project = linked project
→ Click "Create Task"
⇒ Task created, linked in meeting notes
⇒ John receives notification: "Task TSK-150 assigned to you"
⇒ Action item in meeting shows "✓ Converted to TSK-150"
```

### Flow X4: Notification → Entity Navigation

```
Header → Click notification bell
⇒ Notification panel opens
→ Click notification: "TSK-142 status changed to Done"
⇒ {If notification has direct entity}: Navigate to TSK-142 detail
⇒ {If notification is summary}: Navigate to filtered list
⇒ Notification marked as read
```

### Flow X5: Recurring Task Creation

```
Task detail drawer
→ Click "Make Recurring"
⇒ Recurrence options appear: Daily | Weekly (day) | Monthly (date) | Custom (cron)
→ Select "Weekly on Monday"
⇒ Preview: "Repeats every Monday until cancelled"
→ Click "Save"
⇒ Task now shows recurrence badge
⇒ On completion: new instance auto-created with +1 week due date
⇒ Activity log: "Recurrence set: Weekly on Monday"
```

### Flow X6: Mobile — Quick Task Complete

```
Mobile app (<768px)
→ Bottom nav → Tasks
⇒ Tasks list (stacked cards view)
→ Swipe left on task "Update Q4 forecast"
⇒ Reveals action: green "Complete" button
→ Tap
⇒ Optimistic update: task shows completed state (strikethrough, fade)
⇒ Toast: "Task completed" (bottom of screen, not top)
⇒ KPI updates on dashboard (if navigated back)
```

### Flow X7: Mobile — Meeting Check-in

```
Mobile → Bottom nav → Calendar
⇒ Month view with event dots
→ Tap Dec 15
⇒ Day view with 2 events
→ Tap "Daily Standup 10:00 AM"
⇒ Meeting detail: bottom sheet slides up (90% height)
→ Tap "Join" → Zoom opens
→ Tap "Notes" → textarea expands inline
```

---

## 9. Edge Cases & Error Flows

### Flow E1: Session Expired Mid-Action

```
User is editing a task form
→ Session expires
⇒ Next API call returns 401
⇒ Toast: "Session expired. Please log in again." (3s)
⇒ After toast: redirect to /auth/login
⇒ Form data lost — show warning before redirect? {Design decision: no warning — save drafts if time permits}
```

### Flow E2: Network Offline

```
User clicks "Update Status" on task
⇒ API call fails — network error detected
⇒ Persistent banner at top of page: "Connection lost. Retrying automatically…" with pulse indicator
⇒ Auto-retry up to 3 times (2s, 4s, 8s intervals)
→ If retry 3 fails:
  ⇒ Banner changes: "Connection lost. [Retry Now] [Dismiss]"
→ User clicks "Retry Now"
⇒ Manual retry attempt
→ If success: banner dismissed, toast: "Task updated" (3s)
→ If fail: banner remains
```

### Flow E3: 403 on Tab Access

```
PM opens Project Workspace for a project they don't manage
→ Overview tab loads (read access granted)
→ Switch to Settings tab
⇒ API returns 403
⇒ Inline banner in tab content:
  "You don't have permission to modify this project's settings.
   Contact the project manager to request access."
⇒ Settings fields are not rendered
→ Switch back to Tasks tab — functions normally
```

### Flow E4: Concurrent Edit Conflict

```
User A opens Task TSK-142 detail
User B updates TSK-142 title
User A clicks "Save" on description edit
⇒ API returns 409 Conflict
⇒ Toast: "This task was updated by someone else. Please refresh."
⇒ {Avoid overwriting} Task detail refreshes with latest data
⇒ User A's description edit is preserved in a draft banner:
  "Your edits are saved locally. [Apply Again] [Discard]"
```

### Flow E5: Rate Limited

```
User submits form rapidly (e.g., double-click)
⇒ API returns 429 Too Many Requests
⇒ Toast: "Too many requests. Please wait a moment." (5s)
⇒ Button re-enables after rate limit window
```

### Flow E6: Deleted Entity via Deep Link

```
User clicks notification for now-deleted task
⇒ API returns 404
⇒ Full-page error: icon + "This task has been deleted." + "Go to Tasks"
⇒ Toast background: "Task TSK-142 was deleted by its creator."
```

### Flow E7: Empty Search Results

```
User types "zzzz" in search
⇒ Results dropdown: "No results found"
⇒ Dropdown persists to show the message (doesn't auto-close)
⇒ Text: "No results match "zzzz". Try different keywords or filters."
⇒ [Clear Search] button
→ User presses Escape → dropdown closes, search input cleared
```

### Flow E8: Browser Back Button after Drawer

```
User navigates: Dashboard → Tasks list → clicks task → drawer opens
→ User presses browser Back
⇒ Expected: navigate to previous page (Dashboard)
⇒ Actual (without handling): history entry was pushed for drawer
{Resolution: Drawer opens use history.replaceState, not pushState.
 Browser Back from an open drawer closes the drawer and goes back to the previous page.}
```

### Flow E9: Mobile — Accidental Back Gesture on Form

```
User on mobile, filling in a long task creation form
→ Swipes back accidentally (or presses hardware back)
⇒ {Form data not saved yet}
⇒ Confirm dialog: "Discard this task? Your changes will be lost." [Keep Editing] [Discard]
→ "Keep Editing" → returns to form with all data intact
→ "Discard" → navigates back, form data lost
```

### Flow E10: First-Time User — Empty Dashboard

```
New employee logs in for the first time
⇒ No projects, no tasks, no meetings
⇒ Dashboard shows Welcome empty state:
  Icon: layout-dashboard (48px)
  Title: "Welcome to Your Workspace"
  Description: "Your workspace is empty. Create a project, invite your team, and start tracking work."
  Actions: [Create Project] [Invite Team] [Take a Tour]
→ Click "Take a Tour"
⇒ Onboarding overlay highlights: Sidebar, New menu, Notifications, Profile
⇒ Each step: "Here's how to get started…" with dismiss/next
```

---

*End of User Flows Specification — Ready for Low-Fidelity Wireframes*
