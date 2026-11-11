# Interactive Prototype Specification

> **Status:** Complete
> **Bridges:** Phase A–F → Implementation
> **Purpose:** Navigation flows, screen transitions, interaction sequences, and keyboard walkthroughs for all 47 screens

---

## Table of Contents

1. [Navigation Flow Map](#1-navigation-flow-map)
2. [Drawer Sequence Maps](#2-drawer-sequence-maps)
3. [Drag & Drop Interaction Flows](#3-drag--drop-interaction-flows)
4. [Calendar Interaction Flows](#4-calendar-interaction-flows)
5. [Filter/Sort/Navigation Flows](#5-filtersortnavigation-flows)
6. [Notification-to-Entity Navigation Chains](#6-notification-to-entity-navigation-chains)
7. [Mobile Gesture Sequences](#7-mobile-gesture-sequences)
8. [Keyboard Shortcut Walkthroughs](#8-keyboard-shortcut-walkthroughs)
9. [Error Recovery Navigation](#9-error-recovery-navigation)
10. [Screen Transition Timing Map](#10-screen-transition-timing-map)

---

## 1. Navigation Flow Map

### Global Shell
```
AppShell
├── Sidebar (fixed 240px)
│   └── Navigation links → route change (no page reload)
├── Header (sticky 56px)
│   ├── Breadcrumbs → click navigates to ancestor
│   ├── "New" button → dropdown → [Project | Task | Meeting | Announcement]
│   └── Bell icon → notification panel
└── PageContent (scrollable, container query)
    └── Route renders here
```

### Auth Flow (S01–S04)
```
/auth/login ──┬── success ──→ /dashboard (replaceState, no back to login)
              ├── forgot ──→ /auth/forgot-password
              └── register ──→ /auth/register
/auth/forgot-password ──→ /auth/reset-password (email link)
/auth/reset-password ──→ /auth/login (success → toast "Password reset")
```

### Primary Navigation Chains
```
Dashboard → KPI click → list page (pre-filtered)
Dashboard → widget item click → entity detail drawer (NOT full page)
Dashboard → "View all" → full list page

List page → row click → entity detail drawer (480px slide-right)
List page → "Create" → full-page create form
List page → "View" toggle → [list | board | calendar | grid]

Detail drawer → related entity link → different entity detail drawer (replaces current)
Detail drawer → "Open full page" → full detail page (deeper navigation)

Full detail page → tab switch → content replaces within page
Full detail page → "Edit" → full-page edit or drawer (depends on entity type: settings-style uses full page, task edit uses drawer)
```

### Cross-Module Navigation Map
```
S05 Dashboard ──────────┬──→ S06 Project List (click KPI "Active Projects")
                        ├──→ S10 Task List (click KPI "My Tasks" or "Overdue")
                        ├──→ S19 Meeting List (click "Upcoming" widget)
                        ├──→ S15 People (click "Team" mention)
                        ├──→ S25 Notifications (bell icon)
                        └──→ S27 Analytics (click "Reports" link)

S06 Project List ───────┬──→ S07 Project Create ("+ New Project")
                        ├──→ S08 Project Workspace (click row)
                        └──→ S09 Project Settings (if PM/admin)

S08 Project Workspace ──┬──→ S10 Task List (Tasks tab, pre-filtered by project)
                        ├──→ S11 Task Detail (drawer, click task row)
                        ├──→ S21 Meeting Create (Meetings tab)
                        ├──→ S14 Milestones (Timeline tab)
                        ├──→ S15 People (Members tab → click member)
                        └──→ S09 Project Settings (Settings tab)

S10 Task List ──────────┬──→ S11 Task Detail (drawer, click row)
                        ├──→ S12 Task Create ("+ New Task")
                        ├──→ S13 Calendar (view toggle → Calendar view)
                        └──→ S09 Project Settings (if scoped to project)

S11 Task Detail (drawer) ─┬──→ S08 Project Workspace (click project name)
                          ├──→ S16 User Profile (click assignee avatar)
                          └──→ S14 Milestones (click milestone link)

S25 Notifications ──────┬──→ Entity detail (click entity-linked notification)
                        ├──→ Filtered list (click summary notification)
                        └──→ S26 Activity (click "View all activity")

S27 Analytics ──────────┬──→ S28 Project Health Report (click chart)
                        ├──→ S29 Team Velocity Report
                        ├──→ S30 Workload Report
                        ├──→ S31 Trends Report
                        └──→ S32 Exports (click "Export" button)

S33 Roles List ─────────┬──→ S34 Role Detail (drawer, click row)
                        ├──→ S35 Role Create ("+ New Role")
                        └──→ S36 Permission Matrix (click "Permissions" tab)

S37 Integration List ───┬──→ S38 Integration Detail (drawer, click row)
                        └──→ S39 Integration Create ("+ Add Integration")
```

### Sidebar Navigation (per role)
```
Employee:      Dashboard | Tasks | Projects | Calendar | Meetings | People
Team Lead:     Dashboard | Tasks | Projects | Calendar | Meetings | People | Activity
PM:            Dashboard | Tasks | Projects | Calendar | Meetings | People | Milestones | Analytics
Executive:     Dashboard | Analytics | Projects | People
HR:            Dashboard | Announcements | Calendar | People | Administration
Admin:         Dashboard | Tasks | Projects | Calendar | Meetings | People | Announcements | Activity | Analytics | Administration
```

### Back Button Behavior
```
Drawer open:           browser back → close drawer (stay on same page)
Drawer + history:      replaceState — one back press = previous page
Modal open:            browser back → close modal
Full page navigation:  standard browser back
Tab switch:            no history entry — back = previous page, not previous tab
Mobile back gesture:   confirm dialog if form has unsaved changes
```

---

## 2. Drawer Sequence Maps

### Drawer as Primary Interaction Pattern

```
Trigger → Entity click on list/table/board/card
       ⇒ Drawer opens (480px, slide-right, 250ms)
       ⇒ Page content dims (rgba(0,0,0,0.3))
       ⇒ Focus trapped in drawer
       ⇒ Skeleton renders immediately
       ⇒ Real content loads via API

Within Drawer:
  ├── View related entity → replace drawer content (slide-right again)
  ├── Quick edit field → inline input replaces label
  ├── Tab switch (within drawer) → instant content switch
  └── Close via Escape/Backdrop/X
```

### Drawer Content Sequences

#### Task Detail Drawer (S11)
```
Drawer opens
├── [Header] Task ID + Status badge + Priority chip + [Actions menu ⋮]
├── [Title] Editable heading
├── [Metadata row] Assignee | Due | Project | Labels
├── [Description] Expandable/collapsible rich text (collapsed default, max 3 lines)
├── [Checklist] Progress + items (expandable)
├── [Comments] Thread list + input box (bottom of drawer)
├── [Activity] Collapsed timeline (click to expand)
│
└── Related entity deep-links:
    → Click project name → replace drawer: Project Quick View (not full page)
    → Click assignee → replace drawer: User Quick View (not full page)
    → Click milestone → replace drawer: Milestone Quick View
```

#### Project Quick View Drawer (S08 preview)
```
Drawer replaces current
├── [Header] Project name + Health dot + Status
├── [KPI mini] Tasks: 12/24 | Overdue: 2 | Members: 6
├── [Progress bar] 62% complete
├── [Recent tasks] Last 5 updated tasks (click → Task Detail drawer)
└── [Actions] [Open Project] [Archive] [Share]
```

#### User Profile Quick View Drawer (S16 preview)
```
Drawer replaces current
├── [Header] Avatar + Name + Role + Status dot
├── [Contact] Email (clickable mailto)
├── [KPI mini] Active: 4 | Overdue: 1 | Completed this week: 7
├── [Quick actions] [Message] [Assign Task] [View Full Profile]
└── [Recent activity] Last 5 actions
```

#### Meeting Detail Drawer (S20 preview)
```
Drawer opens
├── [Header] Meeting title + Date/Time + Duration
├── [Join button] Prominent CTA (opens link in new tab)
├── [Attendees] Avatar row + count
├── [Notes] Rich text, editable inline
├── [Action items] List with "Convert to Task" per item
└── [Attachments] File list
```

#### Role Detail Drawer (S34)
```
Drawer opens
├── [Header] Role name + User count
├── [Description] Editable
├── [Permissions summary] Count per resource group
├── [Members list] User avatars + names
└── [Actions] [Edit Permissions] [Duplicate Role]
```

### Drawer Stacking Rules
```
Maximum 1 drawer open at a time
Replacing content: new content slides in (250ms), old slides out (200ms)
Drawer replaces current — closing returns to underlying page directly
No nested drawers (drawer within drawer)
Exception: notifications panel is a dropdown/panel, not a drawer
```

---

## 3. Drag & Drop Interaction Flows

### Kanban Board (Task List → Board View)

```
Initial state:
┌──────────┐  ┌─────────────┐  ┌───────────┐  ┌──────────┐
│  To Do   │  │ In Progress  │  │ In Review  │  │   Done   │
│  ┌─────┐ │  │  ┌───────┐   │  │ ┌───────┐  │  │ ┌──────┐ │
│  │TSK-1│ │  │  │TSK-142│   │  │ │TSK-143│  │  │ │TSK-10│ │
│  │TSK-2│ │  │  └───────┘   │  │ └───────┘  │  │ └──────┘ │
│  │TSK-3│ │  │  ┌───────┐   │  │             │  │ ┌──────┐ │
│  │     │ │  │  │TSK-144│   │  │             │  │ │TSK-12│ │
│  └─────┘ │  │  └───────┘   │  │             │  │ └──────┘ │
└──────────┘  └─────────────┘  └───────────┘  └──────────┘

Flow: Card drag from "In Progress" to "Done"
→ User grabs TSK-142 card
⇒ Cursor: grabbing, card lifts (shadow-lg, scale 1.02)
⇒ Source column shows reduced opacity on remaining cards
⇒ Drop zones: all column bodies highlight (bg: primary-soft)
→ User drags over "Done" column
⇒ "Done" column highlights more prominently (bg: primary-soft, border: primary dashed)
→ User releases
⇒ Card moves to "Done" column (200ms spring animation)
⇒ Optimistic status update (PATCH /tasks/{id}/status)
⇒ Toast: "Task moved to Done" (3s)
⇒ If API fails: card returns to "In Progress", toast: "Failed to update status" (5s)
⇒ If dragging back within 5s: card snaps back (undo)

Mobile equivalent:
→ Long press (500ms) on card
⇒ Card enters drag mode (haptic feedback)
⇒ Column headers become drop targets (tap to move)
→ Tap target column header
⇒ Card moves to selected column

Edge cases:
  - Drop on same column: no-op (card returns to original position)
  - Drag during API call: disable further drags on that card
  - Offline: card stays in new column, banner shows "Changes will sync when connected"
```

### Table Column Reorder

```
Flow: Drag column header to reorder
→ User grabs column header "Due Date"
⇒ Cursor: move, column lifts slightly (shadow-sm)
⇒ Ghost column (outline, no text) shows insertion point
→ User drops at position between "Status" and "Assignee"
⇒ Columns reorder: task, title, status, due_date, assignee, priority
⇒ Preference saved to user settings (persists across sessions)
⇒ Table header shows shimmer on column positions

Restrictions:
  - First column (checkbox/ID) not draggable
  - Last column (actions) not draggable
  - Cannot reorder while sorting is active
```

### File Upload Drag Zone

```
Flow: Drag file onto upload zone
→ User drags file from desktop over the upload zone
⇒ Zone border turns primary (2px dashed #4f6cf7)
⇒ Zone bg: primary-soft (#eef1fe)
⇒ "Drop files here" text animates slightly
→ User drops file
⇒ File type + size validation
⇒ If valid: progress bar appears (0→100%), file name shown
⇒ If invalid: zone flashes danger border, error message "File type not supported"
⇒ Upload completes: file appears in attachment list with thumbnail
⇒ Toast: "File uploaded" (3s)

Multiple files:
  - Each file shows individual progress bar
  - Files upload in parallel (max 3 concurrent)
  - Queue remaining files
```

---

## 4. Calendar Interaction Flows

### Calendar View Navigation (S13)

```
Initial load: Month view, current month
├── View toggle: Month | Week | Day
├── Today button: scrolls to today's date
├── < > arrows: navigate previous/next period
└── "+" button on date cells: quick-create event

Month view:
→ Click date number → select day (highlighted)
→ Click event dot → event tooltip (title + time + location)
→ Click event in tooltip → Meeting detail drawer
→ Drag on empty cell → create time selection (new event)

Week view:
→ Day columns with hourly slots (8am–6pm)
→ Click hour slot → create meeting at that time
→ Drag across hours → multi-hour event creation
→ Click event block → Meeting Detail drawer

Day view:
→ Single day with hourly breakdown
→ Each event as colored block (width: full, height: duration)
→ Click → Meeting Detail drawer

Keyboard:
  → j/k or ↑/↓  Navigate weeks (month) or hours (day)
  → n            Create new event
  → t            Go to today
  → Escape       Close tooltip/drawer
```

### Meeting Creation from Calendar

```
Calendar → Click "+" on Dec 15
⇒ Modal (520px): Create Event
├── Title (input)
├── Date (pre-filled: Dec 15)
├── Start Time / End Time (selects)
├── All Day (toggle)
├── Location (input, optional)
├── Description (textarea, optional)
├── Attendees (multi-select user picker)
└── [Cancel] [Create]

→ Fill in → Click "Create"
⇒ Modal closes (200ms fade)
⇒ Event appears on calendar (optimistic)
⇒ Toast: "Meeting scheduled" (3s) [View] [Add Notes]
⇒ Attendees receive notifications
```

### Calendar ↔ Task Integration

```
Calendar → Week view → See "Standup (10-10:30)" and "TSK-142 due Dec 15"
→ Click TSK-142 due indicator
⇒ Task detail drawer opens (within calendar context)
⇒ Shows: Title, Status (In Progress), Assignee, Project
→ Close drawer → still on calendar

Calendar → Create event → Type "Review Q4 forecast @TSK-142"
⇒ @TSK-142 resolves to linked task
⇒ Event is linked to task
⇒ On meeting detail: "Related Task: TSK-142" with link
```

---

## 5. Filter/Sort/Navigation Flows

### Universal Filter Bar

```
Appears on: Project List, Task List, Meeting List, Announcement List,
            People Directory, Activity Timeline, Reports

Layout: [Search input] [Dropdown filters] [View toggle] [Chip row]

Initial state (all filters default):
  - Search: empty, placeholder "Search..." or scoped placeholder
  - Dropdowns: "All" or first option selected
  - Chips: hidden (no active filters)
  - View: last used view

Interaction:
  → Type in search (debounced 300ms)
  ⇒ Table/List re-filters as user types
  ⇒ "Clear" (×) appears in search input when text present

  → Select filter from dropdown
  ⇒ Chip appears in chip row: "Status: In Progress ×"
  ⇒ List updates immediately
  ⇒ URL updates with query params (shareable/bookmarkable)

  → Click chip ×
  ⇒ Filter removed, chip disappears
  ⇒ List updates
  ⇒ Dropdown resets to "All"

  → Click "Clear All" (appears when ≥1 chip active)
  ⇒ All filters reset
  ⇒ All chips removed
  ⇒ Search cleared

Query param sync:
  /work/tasks?status=in-progress&assignee=me&q=forecast
  → Filters restore on page load
  → Share URL preserves filter state
```

### View Switcher

```
Interaction: Click icon button group [List | Board | Calendar | Grid]
⇒ Active view: primary color icon with bg: primary-soft
⇒ Content transitions: fade out (100ms) → switch → fade in (150ms)
⇒ View preference saved to localStorage
⇒ View options vary by module:
  - Tasks: List | Board | Calendar
  - Projects: List | Grid
  - Meetings: List | Calendar
  - People: List | Grid
```

### Sort Interaction

```
Table header click:
  First click  → ascending (▲)
  Second click → descending (▼)
  Third click  → remove sort (no arrow)

Active sort indicator:
  ┌──────────────────────────┐
  │ Task Name ▲ │ Status │ … │
  └──────────────────────────┘

Multi-column sort: Hold Shift + click second header
⇒ Both columns show sort indicators
⇒ Primary sort has bold arrow, secondary has muted arrow
```

### Pagination Flow

```
Standard: Page numbers at bottom of table
[<] [1] [2] [3] [4] [5] […] [12] [>]
Showing 1-20 of 240

Interaction:
  → Click page number → table updates, scrolls to top (smooth, 200ms)
  → Click [>] → next page
  → Click [<] → previous page (disabled at page 1)
  → Ellipsis […] → hover shows "Jump to page..." tooltip
  → Enter page number → optional direct input for large pagination

Compact (tablet):
  [<] Page 3 of 12 [>]

Load More (mobile):
  [Load More] button at bottom (adds next page to existing list)
  ⇒ Infinite scroll: auto-load when scrolled to bottom (with 200px threshold)
```

---

## 6. Notification-to-Entity Navigation Chains

### Notification Bell Panel

```
Header bell icon:
  No unread:    outline bell icon (text-secondary)
  Has unread:   filled bell icon (primary) + red dot badge (12px, absolute positioned)

Click → Panel drops down (320px width, shadow-dropdown)
├── Header: "Notifications" + "Mark all read" link
├── Tabs: All | Unread | Mentions | Approvals
├── List of notifications (max 10, scrollable)
│   └── Each item: Icon (contextual) + Title + Timestamp + Unread indicator
└── Footer: "View all notifications" → /workspace/notifications

Close: Click outside, Escape, or click bell again
```

### Navigation Chains from Notification Click

```
Chain A: Mention in task comment
S25 Notification → "Sarah mentioned you in TSK-142"
→ Click → Navigate to /work/tasks/142 (full page, not drawer)
⇒ Task detail page loads, scrolled to the comment
⇒ Mentioned comment has highlight animation (bg: primary-soft, fade out over 2s)
⇒ Toast: none — direct navigation

Chain B: Status change notification
S25 Notification → "TSK-142 status changed to Done"
→ Click → Navigate to /work/tasks/142
⇒ Task detail page loads, shows current state
⇒ No highlight — just normal task view

Chain C: Task assignment
S25 Notification → "Task TSK-150 assigned to you"
→ Click → Navigate to /work/tasks/150
⇒ Task detail drawer opens (from any page context)
⇒ Drawer shows full task detail
⇒ Focus: none specifically

Chain D: Meeting reminder
S25 Notification → "Standup in 15 minutes"
→ Click → Navigate to /workspace/meetings/{id}
⇒ Meeting detail page or drawer (depending on entry point)
⇒ If from bell: full page. If from calendar widget: drawer.

Chain E: Bulk notification
S25 Notification → "3 tasks were updated in Q4 Planning"
→ Click → Navigate to /work/projects/{id}/tasks?updated=today
⇒ Project-scoped task list, filtered by recently updated

Chain F: Approval request
S25 Notification (Approvals tab) → "Task TSK-142 submitted for review"
→ Click → Navigate to /work/tasks/142
⇒ Task detail page with "Approve/Reject" buttons prominent
⇒ If in approvals tab context: modal confirm on approve
```

### Notification Read Behavior

```
Mark single as read:
  → Hover notification item → "Mark read" icon appears on right
  → Click icon → optimistic: item loses bold/bg, badge decrements

Mark all as read:
  → Click "Mark all read" in header
  ⇒ Confirm: "Mark all 5 notifications as read?" [Cancel] [Mark All]
  ⇒ Optimistic: all unread items show as read, badge clears
  ⇒ If API fails: revert, toast "Failed to mark as read"

Auto-read:
  → Click notification to navigate to entity
  ⇒ Notification marked as read on navigation
  ⇒ Badge decremented optimistically
```

---

## 7. Mobile Gesture Sequences

### Touch Gesture Map

```
┌────────────────┬─────────────────┬─────────────────────┬────────────────┐
│   Gesture      │   Element       │   Action             │   Feedback     │
├────────────────┼─────────────────┼─────────────────────┼────────────────┤
│ Swipe left     │ Task row        │ Complete task        │ Green button   │
│ Swipe right    │ Notification    │ Mark as read         │ Primary bg     │
│ Swipe down     │ Any list        │ Refresh (pull)       │ Spinner + bounce│
│ Tap top bar    │ Any page        │ Scroll to top        │ Smooth scroll  │
│ Long press     │ Table row       │ Select mode          │ Checkbox appear│
│ Long press     │ Kanban card     │ Begin drag           │ Card lifts     │
│ Pinch          │ Calendar        │ Zoom month/week/day  │ Smooth zoom    │
│ Tap (2 finger) │ Any            │ Context menu         │ Bottom sheet   │
│ Swipe down     │ Drawer          │ Close drawer         │ Slides down    │
│ Swipe right    │ Sidebar (edge)  │ Open sidebar         │ Slides in      │
│ Swipe left     │ Opened sidebar  │ Close sidebar        │ Slides out     │
└────────────────┴─────────────────┴─────────────────────┴────────────────┘
```

### Mobile Task Completion Flow

```
Bottom nav → Tasks → Task List (stacked card view)
┌─────────────────────────────────┐
│ ○ TSK-142  Update Q4 forecast   │
│   ● In Progress  Due: Dec 18    │
├─────────────────────────────────┤
│ ○ TSK-143  Review PR #42        │
│   ● Done        Due: Dec 15     │
└─────────────────────────────────┘

→ Swipe left on TSK-142 row
⇒ Row slides left, revealing green button: [Complete]
⇒ Haptic feedback on swipe threshold (30px)
→ Tap [Complete]
⇒ Optimistic: task status changes to Done
⇒ Row shows strikethrough animation (300ms)
⇒ Toast: "Task completed" (bottom of screen, 3s) [Undo]
⇒ KPI updates on dashboard tab
→ Tap [Undo] on toast
⇒ Task reverts to In Progress
⇒ Row animation reverses
```

### Mobile Notification Management

```
Bottom nav → Notifications
┌─────────────────────────────────┐
│ ● Sarah mentioned you in TSK-142│ 2m ago
│ ● TSK-150 assigned to you      │ 15m ago
│ ○ Standup in 15 minutes         │ 30m ago
└─────────────────────────────────┘

→ Swipe right on "Sarah mentioned you"
⇒ Notification slides right, reveals primary button: [Mark Read]
⇒ If already read: swipe reveals no action
→ Tap notification body (not action)
⇒ Navigate to task detail page
⇒ Back button returns to notification list

→ Tap "..." menu on notification
⇒ Bottom sheet: [Mark Read] [Go to Task] [Mute this type] [Report]
```

### Mobile Drawer/Modal Behavior

```
Drawer on mobile (<768px):
  Opens: slides from bottom (90% height), 300ms ease
  Header: drag handle (3 horizontal lines) at top
  Close: swipe down on drag handle, or tap backdrop (10% visible)
  Content: scrollable within drawer

Modal on mobile:
  Opens: slides from bottom (full height), 250ms ease
  Close: swipe down on backdrop, or tap "×", or Escape
  Backdrop: rgba(0,0,0,0.5)

Bottom sheet:
  Opens: slides up from bottom (60% height), 300ms ease
  Trigger: any "Filter" button, "Actions" button, or "Share" button
  Drag handle: swipe to expand (100%) or collapse (closed)
  Close: swipe down past threshold (30% height)
```

### Mobile Navigation (Bottom Nav)

```
Layout when <768px:
┌─────────────────────────────────┐
│                                 │
│         Page Content            │
│                                 │
├─────────────────────────────────┤
│ 📋│ 🔍│ ⬜│ 🔔│ 👤│
│Tasks│Search│Home│Notifs│Profile │
└─────────────────────────────────┘
  (56px height, bg: surface, border-top)

Active tab: icon filled, text: primary
Inactive: icon outline, text: text-secondary

→ Tap "Home" → Dashboard (S05)
→ Tap "Tasks" → Task List (S10)
→ Tap "Search" → Global search (input focused, keyboard opens)
→ Tap "Notifs" → Notification feed (S25)
→ Tap "Profile" → User profile (S16)
```

---

## 8. Keyboard Shortcut Walkthroughs

### Global Shortcuts (All Pages)

```
Key      | Action                    | Visual Feedback
─────────|───────────────────────────|────────────────────────────────
/        | Focus search/global search| Search input gets focus ring
N        | Open "New" menu           | Dropdown appears below header
?        | Show shortcuts help       | Modal: "Keyboard Shortcuts"
Escape   | Close drawer/modal/menu   | Active overlay closes
g then d | Dashboard navigation      | (No visual, route changes)
g then p | Projects navigation       | (No visual, route changes)
g then t | Tasks navigation          | (No visual, route changes)
g then c | Calendar navigation       | (No visual, route changes)
g then a | Analytics navigation      | (No visual, route changes)
b        | Browser back              | Route changes
```

### Walkthrough: Power User Morning Scan

```
Starting at: Dashboard (S05)

→ Press  /   → Search input focused → Type "Q4" → see results → Escape to close
→ Press  g then d  → Confirms at Dashboard (no-op, already there)
→ Press  g then t  → Navigates to /work/tasks
→ Press  ↓  ↓  ↓  → Navigate through task list rows (focus moves per row)
→ Press  Enter     → Opens Task Detail drawer for selected task
→ Press  s         → Focuses status dropdown in drawer
→ Press  ↓  Enter  → Changes status to next option
→ Press  .         → Toggle task complete
→ Press  Escape    → Close drawer
→ Press  N         → Open "New" dropdown
→ Press  ↓  Enter  → Select "New Task" → navigates to create form
```

### Per-Page Shortcuts

```
Task List (S10):
  ↑ ↓           Navigate rows
  Enter         Open selected task (drawer)
  Space         Toggle select on current row
  Ctrl+A        Select all visible
  Ctrl+Shift+A  Deselect all
  /             Focus scoped search

Task Detail — Drawer (S11):
  Ctrl+Enter    Submit comment
  s             Focus status dropdown
  a             Open assignee change
  p             Open priority change
  e             Toggle edit mode (title)
  .             Toggle mark as complete
  j/k           Next/previous task (when navigated from list context)
  Escape        Close drawer

Task Create (S12):
  Ctrl+Enter    Submit form
  Escape        Cancel (with confirm if dirty)

Project List (S06):
  /             Focus search
  n             New project (from "New" menu context)

Project Workspace (S08):
  Tab           Navigate between workspace tabs (Overview, Tasks, Timeline, Members, Settings)
  Ctrl+Enter    Add comment (on activity tab)

Calendar (S13):
  n             New event
  t             Go to today
  j             Next week/month
  k             Previous week/month
  m             Toggle month view
  w             Toggle week view
  d             Toggle day view
  /             Focus search/date jump

Meeting Detail (S20):
  j             Join meeting
  n             Add note
  Ctrl+Enter    Save note

Notifications (S25):
  ↑ ↓           Navigate notification list
  Enter         Open selected notification
  m             Mark selected as read
  Shift+A       Mark all as read
  Escape        Close panel (if dropdown) or exit

Analytics (S27–S31):
  e             Export current view
  r             Refresh data
  p             Toggle chart period (month/quarter/year)

Settings (S40–S44):
  Ctrl+S        Save current settings panel
  Escape        Discard and go back
```

### Keyboard Shortcuts Help Modal

```
Trigger: Press ?
⇒ Modal (560px): "Keyboard Shortcuts"

┌──────────────────────────────────────────┐
│  Keyboard Shortcuts                      │
│                                          │
│  Global                                  │
│  ───────                                 │
│  /              Search                    │
│  N              New                       │
│  ?              This menu                 │
│  Escape         Close panel               │
│  g then d       Go to Dashboard           │
│  g then p       Go to Projects            │
│  g then t       Go to Tasks               │
│  g then c       Go to Calendar            │
│  g then a       Go to Analytics           │
│                                          │
│  Navigation                              │
│  ──────────                              │
│  ↑ ↓            Navigate list            │
│  Enter           Open selected            │
│  b              Back                      │
│                                          │
│  [Close]                                 │
└──────────────────────────────────────────┘

Dismiss: Escape, click [Close], or click outside
```

---

## 9. Error Recovery Navigation

### 401 — Session Expired

```
Any page → API returns 401
⇒ Toast: "Session expired. Please log in again." (5s, top-right)
⇒ After 2s delay: redirect to /auth/login (replaceState)
⇒ Previous route saved in sessionStorage: redirect_to
⇒ After login: redirect back to original route
⇒ Form data (if any): saved in sessionStorage per-route, restored on return
```

### 403 — Forbidden

```
Any page → API returns 403
⇒ Inline banner: "You don't have permission to access this."
  ┌──────────────────────────────────────────────┐
  │ ⚠ You don't have permission to view this.    │
  │   Contact your admin to request access.       │
  │                                    [Go Back]  │
  └──────────────────────────────────────────────┘
⇒ Tab level: content area shows banner, other tabs accessible
⇒ Page level: full-page forbidden state with "Go to Dashboard" button
⇒ Toast: none — banner is sufficient
```

### 404 — Not Found (Entity Deleted)

```
Deep link to deleted entity:
⇒ Full-page error:
  ┌──────────────────────────────────────┐
  │                                      │
  │          🔍 (64px icon)              │
  │                                      │
  │    This task has been deleted.       │
  │                                      │
  │    TSK-142 was deleted by Sarah Chen │
  │    on Dec 15, 2025 at 2:30 PM.       │
  │                                      │
  │    [Go to Tasks] [Go to Dashboard]   │
  │                                      │
  └──────────────────────────────────────┘
⇒ Toast: "Task TSK-142 was deleted" (5s)
⇒ If user has a notification for this entity: notification stays visible
  but clicking it shows this error page
```

### 404 — Route Not Found

```
Any unrecognized route:
⇒ Full-page 404:
  ┌──────────────────────────────────────┐
  │                                      │
  │          🔍 (64px icon)              │
  │                                      │
  │    Page not found                    │
  │                                      │
  │    The page you're looking for       │
  │    doesn't exist or has been moved.  │
  │                                      │
  │    [Go to Dashboard]                 │
  │                                      │
  └──────────────────────────────────────┘
```

### 409 — Concurrent Edit Conflict

```
Task detail drawer → Save description
⇒ API returns 409
⇒ Toast: "This task was updated by someone else." (5s)
⇒ Drawer content refreshes with latest data
⇒ User's edits preserved in draft banner:
  ┌──────────────────────────────────────────┐
  │ 📝 Your edits saved locally.             │
  │                              [Apply] [X] │
  └──────────────────────────────────────────┘
→ Click "Apply" → re-submit edits
→ Click × → discard draft
```

### 422 — Validation Error

```
Form → Submit
⇒ API returns 422 with field errors
⇒ Each errored field: danger border + ring + error message below
⇒ First errored field receives focus (scroll into view)
⇒ Form stays intact with all filled values
⇒ Toast: none — inline errors are sufficient
⇒ Error icon (exclamation circle) appears in field with danger color
```

### 429 — Rate Limited

```
Any action → API returns 429
⇒ Toast: "Too many requests. Please wait a moment." (5s)
⇒ All interactive buttons disabled for rate limit window
⇒ Countdown: buttons show "Wait {n}s" instead of label
⇒ After window: buttons re-enable, toast dismissed
```

### 500 — Server Error

```
Any API call → 5xx response
⇒ Toast: "Something went wrong. Please try again." (5s) [Retry]
⇒ Current page state preserved (no reload)
⇒ Previous optimistic updates reverted if mutation
→ Click "Retry" → re-attempt failed request
⇒ If retry success: toast disappears, state updated
⇒ If retry fails again: toast changes to "Still having issues. [Contact Support]"
```

### Network Offline

```
Any action → navigator.onLine === false
⇒ Persistent banner across top of page:
  ┌──────────────────────────────────────────────┐
  │ ⚠ Connection lost. Retrying automatically…   │
  └──────────────────────────────────────────────┘
⇒ Auto-retry at: 2s, 4s, 8s intervals
⇒ Each retry attempt: banner shows pulse animation
⇒ After 3 failures:
  ┌──────────────────────────────────────────────┐
  │ ⚠ Connection lost.                [Retry] [×]│
  └──────────────────────────────────────────────┘
→ Click [Retry] → manual retry
→ Click [×] → dismiss banner, continue offline
⇒ Offline reads allowed (cached data)
⇒ Offline writes queued (localStorage), synced on reconnect
⇒ On reconnect: queued writes execute, banner shows "Syncing {n} changes…"
```

### Empty States (First-Time User / No Data)

```
No projects:
  ┌──────────────────────────────────────┐
  │                                      │
  │      📁 (48px icon, text-tertiary)   │
  │                                      │
  │    No projects yet                   │
  │                                      │
  │    Create your first project to      │
  │    start tracking work.              │
  │                                      │
  │    [Create Project]                  │
  │                                      │
  └──────────────────────────────────────┘

No tasks (filtered too narrowly):
  ┌──────────────────────────────────────┐
  │                                      │
  │      🔍 (48px icon, text-tertiary)   │
  │                                      │
  │    No tasks match these filters      │
  │                                      │
  │    Try adjusting or clearing your    │
  │    filters to see more results.      │
  │                                      │
  │    [Clear All Filters]               │
  │                                      │
  └──────────────────────────────────────┘

First-time empty dashboard (S47 Onboarding):
  ┌────────────────────────────────────────────┐
  │                                            │
  │    📊 (48px)                               │
  │    Welcome to Your Workspace               │
  │                                            │
  │    Your workspace is empty. Create a       │
  │    project, invite your team, and start    │
  │    tracking work together.                 │
  │                                            │
  │    [Create Project] [Invite Team] [Tour]   │
  │                                            │
  └────────────────────────────────────────────┘
```

---

## 10. Screen Transition Timing Map

### Transition Durations

```
Transition              | Duration | Easing          | Trigger
────────────────────────|──────────|─────────────────|──────────────────
Route change (fade out) | 100ms    | ease-in         | Click link, sidebar
Route change (fade in)  | 200ms    | ease-out        | New page mount
Page shell render       | 0ms      | instant         | Route change (skeleton immediately)
Content replace (data)  | 200ms    | ease-out        | Data loaded from API
Tab switch              | 0ms      | instant         | Click tab
Tab underline slide     | 200ms    | ease            | Tab switch
Drawer slide in         | 250ms    | ease-out        | Click entity
Drawer slide out        | 200ms    | ease-in         | Close/Escape
Modal open              | 200ms    | ease-out        | Trigger action
Modal close             | 150ms    | ease-in         | Confirm/Escape
Toast slide in          | 200ms    | ease-out        | Action completes
Toast slide out         | 200ms    | ease-in         | Dismiss/timeout
Banner slide in         | 150ms    | ease-out        | Error/offline
Dropdown open           | 100ms    | ease-out        | Click trigger
Dropdown close          | 80ms     | ease-in         | Select/Escape
Button press            | 100ms    | ease            | Click (scale 0.98)
Row hover               | 150ms    | ease            | Mouse enter
Card hover              | 150ms    | ease            | Mouse enter
Checkbox toggle         | 100ms    | ease            | Click/Space
Toggle switch           | 200ms    | ease            | Click
Skeleton pulse          | 1500ms   | ease-in-out     | Loading (loop)
Empty state fade        | 200ms    | ease            | No data
Error state fade        | 150ms    | ease            | API error
Notification badge      | 200ms    | spring          | New notification
Drag card lift          | 100ms    | ease            | Drag start
Drag card drop          | 200ms    | spring          | Drop
```

### Page Load Sequence (Timing)

```
0ms       → Route change triggered
0ms       → Previous page fades out (100ms)
0ms       → Page shell renders: sidebar active, breadcrumbs, page title, skeleton zones
20ms      → Skeleton KPI row visible
40ms      → Skeleton table/card grid visible
100ms     → API calls dispatched (parallel)
200ms     → Previous page fully gone
200–800ms → API responses received progressively
  ├── KPI data (fast, 200ms) → KPI skeleton replaced with real values
  ├── List data (medium, 400ms) → Table skeleton replaced with rows
  └── Detail data (slow, 800ms) → Content skeleton replaced
500ms     → All primary content loaded
800ms     → All secondary content loaded (activity, related items)
```

### Animation Performance Rules

```
- All animations use compositor-only properties: transform, opacity
- No animating width, height, top, left (causes layout thrash)
- No animating box-shadow (expensive) — use pseudo-elements or filters
- GPU-accelerated: translate3d(0,0,0) on animated elements
- prefers-reduced-motion: reduce → all animations 0ms duration
  (exceptions: skeleton pulse becomes static gray, drag feedback becomes instant)
- Animations on mobile: reduce complexity (no shadows during drag, less parallax)
```

### Loading State Architecture

```
No full-page loaders. Never.
No blocking spinners. Never.

Pattern per page type:
  List:        Skeleton table (5 rows, 6 columns) + KPI row skeleton (4 cards)
  Board:       Skeleton columns (3 columns × 3 cards each)
  Calendar:    Skeleton calendar grid (6 weeks × 7 days, gray blocks)
  Detail:      Skeleton header + metadata skeleton + content skeleton
  Dashboard:   KPI row skeletons (4 cards) → widget skeleton (grid)
  Form:        Skeleton form fields (matching final layout)
  Settings:    Skeleton form fields
  Analytics:   Skeleton KPIs + chart skeleton (gray rectangles with grid lines)
  Drawer:      Skeleton header + metadata skeleton + content skeleton

Each skeleton exactly matches final component layout (same spacing, same structure).
```

---

## Appendix A: Full Navigation Path Reference

```
Auth:
  /auth/login                       S01
  /auth/register                    S02
  /auth/forgot-password             S03
  /auth/reset-password              S04

Dashboard:
  /dashboard                        S05  (6 role variants)

Work — Projects:
  /work/projects                    S06
  /work/projects/new                S07
  /work/projects/{id}               S08  (5 tabs: Overview/Tasks/Timeline/Members/Settings)
  /work/projects/{id}/settings      S09

Work — Tasks:
  /work/tasks                       S10  (3 views: List/Board/Calendar)
  /work/tasks/{id}                  S11
  /work/tasks/new                   S12

Work — Calendar:
  /work/calendar                    S13  (3 views: Month/Week/Day)

Work — Milestones:
  /work/milestones                  S14

Team:
  /team/people                      S15
  /team/people/{id}                 S16

Administration — Users:
  /administration/users/new         S17
  /administration/users/{id}        S18

Workspace — Meetings:
  /workspace/meetings               S19
  /workspace/meetings/{id}          S20
  /workspace/meetings/new           S21

Workspace — Announcements:
  /workspace/announcements          S22
  /workspace/announcements/{id}     S23
  /workspace/announcements/new      S24

Workspace — Notifications:
  /workspace/notifications          S25

Workspace — Activity:
  /workspace/activity               S26

Analytics:
  /analytics                        S27
  /analytics/project-health         S28
  /analytics/team-velocity          S29
  /analytics/workload               S30
  /analytics/trends                 S31
  /analytics/exports                S32

Administration — Roles & Permissions:
  /administration/roles             S33
  /administration/roles/{id}        S34
  /administration/roles/new         S35
  /administration/permissions       S36

Administration — Integrations:
  /administration/integrations      S37
  /administration/integrations/{id} S38
  /administration/integrations/new  S39

Administration — Settings:
  /settings/profile                 S40
  /settings/account                 S41
  /settings/workspace               S42
  /settings/notifications           S43
  /settings/appearance              S44

System:
  /404                              S45
  /error                            S46
  /onboarding                       S47
```

---

*End of Interactive Prototype Specification — Ready for Implementation*
