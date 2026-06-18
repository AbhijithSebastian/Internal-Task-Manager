# Phase E — Design Review

> **Status:** Complete
> **Method:** Systematic review of all 47 screens against 7 principles
> **Result:** 3 screens flagged for revision, 44 approved

---

## Review Criteria

Every screen is evaluated against these 7 questions:

| # | Principle | Pass Condition |
|---|-----------|----------------|
| 1 | What is happening? | Title + description + KPI cards provide instant context. User understands current state within 2 seconds. |
| 2 | What needs attention? | Visual indicators (red badges, overdue counts, warning colors, priority markers) direct attention immediately. |
| 3 | What can I do next? | Primary CTA is obvious without hunting. Secondary actions are discoverable. |
| 4 | No unnecessary whitespace? | Content fills available space. No large empty regions between sections. Whitespace is structural, not decorative. |
| 5 | Obvious information hierarchy? | Visual weight matches importance. Scanning order: title → KPI → content → actions. No competing focal points. |
| 6 | Primary actions visible? | Primary CTA is within the first 800px viewport, high-contrast, in a predictable location (top-right or inline with content). |
| 7 | Scannable in under 5 seconds? | A quick scan reveals: page purpose, current status, action items, primary next step. No dense paragraphs, no walls of text. |
| 8 | Components reusable? | Every visual element maps to a Component Inventory item. No one-off designs. |
| 9 | Layout System compliant? | Follows the standardized page rhythm: breadcrumbs → title → KPI → filters → content → pagination. |

---

## Screen-by-Screen Review

### S01 — Login

| # | Result | Notes |
|---|--------|-------|
| 1 | ✅ PASS | "Welcome Back" title + description immediately tells user what this page is |
| 2 | ✅ PASS | No attention items needed (not authenticated yet) |
| 3 | ✅ PASS | Primary CTA "Sign In" is the most prominent element |
| 4 | ✅ PASS | Centered card uses whitespace structurally — not empty |
| 5 | ✅ PASS | Clear hierarchy: Logo → Title → Form → CTA → Links |
| 6 | ✅ PASS | "Sign In" button is high-contrast primary, right below form fields |
| 7 | ✅ PASS | 3 fields, 1 button — scannable in under 1 second |
| 8 | ✅ PASS | Uses: Button, Input, Checkbox, Link — all from inventory |
| 9 | ✅ PASS | Auth page layout per Layout System spec |

### S02 — Register

| # | Result | Notes |
|---|--------|-------|
| 1-9 | ✅ PASS | Same pattern as Login. 4 fields + checkbox + button. No issues. |

### S03 — Forgot Password

| # | Result | Notes |
|---|--------|-------|
| 1-9 | ✅ PASS | Minimal page — 1 field + 1 button. Clean and direct. |

### S04 — Reset Password

| # | Result | Notes |
|---|--------|-------|
| 1-9 | ✅ PASS | Token validation on load, 2 fields + button. Clear flow. |

### S05 — Smart Home Dashboard

| # | Result | Notes |
|---|--------|-------|
| 1 | ✅ PASS | Personalized greeting + role-adaptive KPI cards. What's happening is immediately clear. |
| 2 | ✅ PASS | Overdue KPI in red, approval queue count (TL+), at-risk projects (PM+). Attention is directed. |
| 3 | ✅ PASS | My Tasks widget + "+ New" in header. What to do next is obvious. |
| 4 | ✅ PASS | Widgets fill 2-column grid + bottom row. No empty gaps. Whitespace is between widgets = structural. |
| 5 | ✅ PASS | KPI row (highest weight) → Widget row → Secondary row. Perfect hierarchy. |
| 6 | ✅ PASS | "+ New" in header, widget primary actions (click task, click create) are everywhere. |
| 7 | ✅ PASS | KPI cards are scannable in 2 seconds, widget titles in 3 more. 5-second total for full context. |
| 8 | ✅ PASS | Uses: KpiCard (×4), TaskCard, MeetingCard, AnnouncementCard, ActivityItem, ProjectCard — all inventory components |
| 9 | ✅ PASS | Follows Dashboard layout per Layout System |

### S06 — Project List

| # | Result | Notes |
|---|--------|-------|
| 1 | ✅ PASS | KPI cards show project count + health breakdown. "What's happening" is clear. |
| 2 | ✅ PASS | At Risk count in KPI is attention-directing. Health dots on cards provide visual triage. |
| 3 | ✅ PASS | "+ New Project" button (if permission). Click any card to open project. |
| 4 | ✅ PASS | Grid/table fills content area evenly. No large empty regions. |
| 5 | ✅ PASS | KPI > Filter > Content hierarchy. Health dots on cards = immediate visual scan. |
| 6 | ✅ PASS | "New Project" is top-right, primary-colored, obvious. |
| 7 | ✅ PASS | Counts in KPI, health dots on cards — scannable in 3 seconds. |
| 8 | ✅ PASS | Uses: KpiCard, FilterBar, ProjectCard, DataTable, Pagination, SearchInput, ViewToggle |
| 9 | ✅ PASS | List page layout per spec |

### S07 — Project Create

| # | Result | Notes |
|---|--------|-------|
| 1 | ✅ PASS | Form title + breadcrumb show context. "New Project" is unambiguous. |
| 2 | ✅ PASS | N/A — form page has no attention items |
| 3 | ✅ PASS | "Create Project" button is prominent, bottom-right of form |
| 4 | ✅ PASS | Form sections fill space with fields. No wasted space. |
| 5 | ✅ PASS | Sections group related fields (Details, Dates, Members). Clear grouping. |
| 6 | ✅ PASS | Primary CTA is sticky at bottom on scroll. |
| 7 | ✅ PASS | Form is broken into labeled sections — scannable in 3 seconds |
| 8 | ✅ PASS | Uses: FormField, FormSection, Input, Select, DatePicker, UserPicker, Button |
| 9 | ✅ PASS | Detail page layout per spec |

### S08 — Project Workspace

| # | Result | Notes |
|---|--------|-------|
| 1 | ✅ PASS | Context bar + Overview tab KPIs = instant project health awareness |
| 2 | ✅ PASS | Overview tab shows overdue count + at-risk indicators. Red badges on overdue tasks. |
| 3 | ✅ PASS | Tab-contextual CTAs ("+ New Task" in Tasks tab, "+ Add Member" in Members). |
| 4 | ✅ PASS | Tab content fills workspace area. No gaps. 10 tabs are visible in scrollable bar. |
| 5 | ✅ PASS | Context bar (entity identity) → Tab bar (navigation) → Tab content. Clear. |
| 6 | ✅ PASS | Tab-specific CTAs are in the tab header area — predictable location. |
| 7 | ✅ PASS | Overview tab: progress bar + KPI + overdue list = scanned in 4 seconds. |
| 8 | ✅ PASS | Uses: ContextBar, Tabs, KpiCard, ProgressBar, DataTable, GanttChart, Calendar, MemberList, AttachmentList, ActivityTimeline, SettingsForm |
| 9 | ✅ PASS | Workspace page layout per spec |

### S09 — Project Settings

| # | Result | Notes |
|---|--------|-------|
| 1-9 | ✅ PASS | Standard settings form. Sections: General, Dates, Danger Zone. Clear hierarchy. |

### S10 — Task List

| # | Result | Notes |
|---|--------|-------|
| 1 | ✅ PASS | KPI cards show task counts. View switcher shows current view mode. |
| 2 | ✅ PASS | Overdue KPI in red. Overdue filter is one click away. Overdue items in red in table. |
| 3 | ✅ PASS | "+ New Task" button. Click any row to open detail drawer. Inline status change. |
| 4 | ✅ PASS | Table/board/calendar fills content area. Filters at the top are compact. No gaps. |
| 5 | ✅ PASS | KPI > Filter > Content. Status column is first for visual triage. |
| 6 | ✅ PASS | "New Task" top-right. "Clear Filters" in filter bar when active. |
| 7 | ✅ PASS | KPI numbers, status badges, priority indicators — scannable in 3 seconds. |
| 8 | ✅ PASS | Uses: KpiCard, FilterBar, SearchInput, DataTable, KanbanBoard, Calendar, Pagination, ViewToggle, BulkActionBar |
| 9 | ✅ PASS | List page layout per spec |

### S11 — Task Detail

| # | Result | Notes |
|---|--------|-------|
| 1 | ✅ PASS | Context bar shows TSK ID + status + priority. Title is the task name. |
| 2 | ✅ PASS | Overdue badge in red (if applicable). Status indicates if needs review. |
| 3 | ✅ PASS | Status-adaptive primary CTA ("Submit for Review" / "Approve" / "Mark Complete") |
| 4 | ✅ PASS | Tabs organize content. No empty space. Description + details fill the content area. |
| 5 | ✅ PASS | Context bar (identity) → Tabs (navigation) → Tab content (detail). Clear. |
| 6 | ✅ PASS | Primary CTA is in context bar area, high-contrast, always visible. |
| 7 | ✅ PASS | Status, priority, assignee, due date are all visible at a glance in the header. |
| 8 | ✅ PASS | Uses: ContextBar, Tabs, Badge, Avatar, CommentItem, AttachmentRow, ActivityItem, RichTextEditor, Button |
| 9 | ✅ PASS | Detail page layout per spec |

### S12 — Task Create

| # | Result | Notes |
|---|--------|-------|
| 1-9 | ✅ PASS | Standard create form. Fields organized in logical order. Primary CTA at bottom. |

### S13 — Calendar

| # | Result | Notes |
|---|--------|-------|
| 1 | ✅ PASS | Month/week/day indicator + event dots show current state. |
| 2 | ✅ PASS | Overdue tasks shown in red on calendar. Event dots + count show volume. |
| 3 | ✅ PASS | Click event → detail drawer. Click "+" to create. "Today" button to jump. |
| 4 | ✅ PASS | Calendar grid fills the content area. Mini-calendar on left (optional) for list view. |
| 5 | ✅ PASS | Calendar is the primary visual — maximum information density. Color coding aids scan. |
| 6 | ✅ PASS | "+ New Event" + "Today" button in header area. |
| 7 | ✅ PASS | Month grid with event dots + color coding = scannable in 2 seconds for busiest days. |
| 8 | ✅ PASS | Uses: Calendar (month/week/day), FilterChip, ColorDot, Badge, Button |
| 9 | ✅ PASS | Calendar layout per spec (special case — no KPI row, no pagination) |

### S14 — Milestones

| # | Result | Notes |
|---|--------|-------|
| 1 | ✅ PASS | KPI shows total/completed/at-risk/upcoming counts |
| 2 | ✅ PASS | At-risk milestones in orange/red. Overdue dates highlighted. |
| 3 | ✅ PASS | Click milestone → navigate to project workspace timeline tab |
| 4 | ✅ PASS | Timeline/list fills content area |
| 5-9 | ✅ PASS | Standard list page |

### S15 — People Directory

| # | Result | Notes |
|---|--------|-------|
| 1 | ✅ PASS | Total active count + recently joined in KPI |
| 2 | ✅ PASS | N/A (people directory has no "attention" items — everyone is listed equally) |
| 3 | ✅ PASS | Click user → profile. Search to find. Filter by role/department. |
| 4 | ✅ PASS | Grid/table fills content area. No gaps. |
| 5 | ✅ PASS | Grid: avatars arranged in rows. Table: sortable columns. Both scannable. |
| 6 | ✅ PASS | Search is the primary interaction — always focused in filter bar. |
| 7 | ✅ PASS | Avatars + names + roles = scannable in 2 seconds per row/card. |
| 8 | ✅ PASS | Uses: DataTable, Avatar (grid), Pagination, SearchInput, FilterBar, ViewToggle, KpiCard |
| 9 | ✅ PASS | List page layout per spec |

### S16 — User Profile

| # | Result | Notes |
|---|--------|-------|
| 1 | ✅ PASS | Avatar + name + role in context bar. KPI shows their task status. |
| 2 | ✅ PASS | Overdue task count in red if >0. |
| 3 | ✅ PASS | Click task → task detail. Click meeting → meeting detail. |
| 4-9 | ✅ PASS | Standard detail page. |

### S17 — User Create

| # | Result | Notes |
|---|--------|-------|
| 1-9 | ✅ PASS | Standard admin create form. No issues. |

### S18 — User Edit

| # | Result | Notes |
|---|--------|-------|
| 1-9 | ✅ PASS | Standard admin edit form with danger zone. |

### S19 — Meeting List

| # | Result | Notes |
|---|--------|-------|
| 1 | ✅ PASS | KPI: upcoming today/this week/past month. Cards show meeting details. |
| 2 | ✅ PASS | Meeting happening now highlighted. Overdue/expired meetings shown as past. |
| 3 | ✅ PASS | [Join] button on current/upcoming meetings. "+ New Meeting" CTA. |
| 4 | ✅ PASS | Card list with consistent layout. No gaps. |
| 5 | ✅ PASS | Date/time are prominent on cards. Organizer + attendees visible. |
| 6 | ✅ PASS | [Join] button on cards is primary-colored. "+ New" in header. |
| 7 | ✅ PASS | Meeting cards: title, time, join button = scannable in 2 seconds. |
| 8 | ✅ PASS | Uses: KpiCard, FilterBar, SearchInput, MeetingCard, Calendar (sidebar), Button, Pagination |
| 9 | ✅ PASS | List page layout per spec |

### S20 — Meeting Detail

| # | Result | Notes |
|---|--------|-------|
| 1 | ✅ PASS | Context bar: title, date, status. |
| 2 | ✅ PASS | N/A — meeting detail is informational. (Canceled = red status badge.) |
| 3 | ✅ PASS | [Join] button for upcoming meetings. [Edit] for organizers. |
| 4-9 | ✅ PASS | Standard detail page with tabs. |

### S21 — Meeting Create

| # | Result | Notes |
|---|--------|-------|
| 1-9 | ✅ PASS | Standard create form. |

### S22 — Announcement List

| # | Result | Notes |
|---|--------|-------|
| 1 | ✅ PASS | KPI: total/pinned/this month. Card feed with title + excerpt. |
| 2 | ✅ PASS | Pinned announcements highlighted. High priority marked. |
| 3 | ✅ PASS | Click to read. "+ New" for HR+. |
| 4 | ✅ PASS | Card feed fills content area. No gaps. |
| 5 | ✅ PASS | Pinned items first, then reverse chronological. Priority badge + date visible. |
| 6 | ✅ PASS | "New Announcement" visible to HR+. |
| 7 | ✅ PASS | Card: title + excerpt + date = scannable in 2 seconds. |
| 8 | ✅ PASS | Uses: KpiCard, AnnouncementCard, FilterBar, SearchInput, Pagination |
| 9 | ✅ PASS | List page layout per spec |

### S23 — Announcement Detail

| # | Result | Notes |
|---|--------|-------|
| 1 | ✅ PASS | Title + author + date + priority badge at top |
| 2 | ✅ PASS | N/A — single content page |
| 3 | ✅ PASS | [Edit] [Delete] for author/admin |
| 4-9 | ✅ PASS | Standard detail page (single scroll, no tabs) |

### S24 — Announcement Create

| # | Result | Notes |
|---|--------|-------|
| 1-9 | ✅ PASS | Standard create form with rich text editor. |

### S25 — Notifications

| # | Result | Notes |
|---|--------|-------|
| 1 | ✅ PASS | Unread count in KPI + category tabs show distribution. |
| 2 | ⚠️ **REVISE** | Need better visual attention direction. Currently unread dot is small. **Fix:** Unread items should have stronger visual treatment (primary-soft bg + bold text + blue dot). Category tab with most unread should be auto-selected. |
| 3 | ✅ PASS | Click notification → entity. "Mark All Read." |
| 4 | ✅ PASS | List fills content area. No gaps between grouped items. |
| 5 | ✅ PASS | Grouped by date. Read/unread differentiation. Category tabs at top. |
| 6 | ✅ PASS | "Mark All Read" is visible when unread exist. |
| 7 | ✅ PASS | Notification items: icon + message + time = scannable in 1 second each. |
| 8 | ✅ PASS | Uses: Tabs, NotificationItem, Badge, Button, FilterChip |
| 9 | ✅ PASS | List page layout per spec |

### S26 — Activity Timeline

| # | Result | Notes |
|---|--------|-------|
| 1 | ✅ PASS | KPI: actions today/this week — shows volume |
| 2 | ✅ PASS | N/A — activity is informational (audit log) |
| 3 | ✅ PASS | Click entity → detail. Click user → profile. Filters to scope. |
| 4 | ✅ PASS | Timeline/list fills content area. Filters above are compact. |
| 5 | ✅ PASS | Chronological grouping. User avatar + action + entity name. |
| 6 | ✅ PASS | Filters are the primary interaction — always visible. |
| 7 | ✅ PASS | Each entry: avatar + name + action + time = scannable in 1 second. |
| 8 | ✅ PASS | Uses: KpiCard, ActivityItem, FilterBar, Pagination, DateRangeFilter |
| 9 | ✅ PASS | List page layout per spec |

### S27 — Analytics Center

| # | Result | Notes |
|---|--------|-------|
| 1 | ✅ PASS | KPI row + 4 charts = instant data overview |
| 2 | ✅ PASS | Charts with declining trends or low health draw attention via color. |
| 3 | ✅ PASS | Click chart → full report. "Export" in header. |
| 4 | ✅ PASS | 2×2 chart grid fills content area. No gaps. |
| 5 | ✅ PASS | KPI (summary) → Charts (detail) → "View Full Report" (drill-down). |
| 6 | ✅ PASS | Each chart has a visible "View Full Report" link. Export is in header. |
| 7 | ✅ PASS | 4 charts with colored bars/lines = scannable in 3 seconds for trends. |
| 8 | ✅ PASS | Uses: KpiCard, Chart (bar/line/donut), GridLayout, Button |
| 9 | ✅ PASS | Analytics page layout per spec |

### S28-S31 — Reports (Project Health, Velocity, Workload, Trends)

| # | Result | Notes |
|---|--------|-------|
| 1-9 | ✅ PASS | All follow the analytics report pattern: KPI → Chart → Data Table. Consistent. |

### S32 — Exports

| # | Result | Notes |
|---|--------|-------|
| 1 | ✅ PASS | Title + description set context |
| 2 | ✅ PASS | N/A — configuration page |
| 3 | ✅ PASS | "Download" CTA is prominent |
| 4-9 | ✅ PASS | Standard configuration form |

### S33 — Roles List

| # | Result | Notes |
|---|--------|-------|
| 1 | ✅ PASS | KPI: total roles, users managed. Table shows role details. |
| 2 | ✅ PASS | N/A — admin page. (But last modified can indicate stale roles.) |
| 3 | ✅ PASS | Click role → detail. "+ New Role" for admin. |
| 4 | ✅ PASS | Table fills content area. |
| 5 | ✅ PASS | Table columns: Role Name, Users, Permissions, Last Modified, Actions. |
| 6 | ✅ PASS | "New Role" + action buttons per row visible. |
| 7 | ✅ PASS | Sortable table = scannable by column. |
| 8 | ✅ PASS | Uses: DataTable, KpiCard, Pagination, Button |
| 9 | ✅ PASS | List page layout per spec |

### S34 — Role Detail

| # | Result | Notes |
|---|--------|-------|
| 1 | ✅ PASS | Context bar + tabs = clear context |
| 2 | ✅ PASS | N/A |
| 3 | ✅ PASS | "Save Permissions" in Permissions tab |
| 4 | ✅ PASS | Tab content fills area. Permission groups organized by resource. |
| 5-9 | ✅ PASS | Standard detail page with tabs |

### S35 — Role Create

| # | Result | Notes |
|---|--------|-------|
| 1-9 | ✅ PASS | Standard simple form. Name + description + copy-from dropdown. |

### S36 — Permission Matrix

| # | Result | Notes |
|---|--------|-------|
| 1 | ✅ PASS | Matrix title + legend = immediate understanding |
| 2 | ✅ PASS | N/A — audit tool |
| 3 | ✅ PASS | Click cell → toggle (with confirm). Search to highlight. |
| 4 | ✅ PASS | Matrix fills content. Scrollable horizontally. |
| 5 | ✅ PASS | Rows = resources, columns = roles. Cell = check/empty. Legend explains. |
| 6 | ✅ PASS | Search highlights matching cells. Click to toggle. |
| 7 | ✅ PASS | Matrix with color coding = scannable for permission gaps. |
| 8 | ✅ PASS | Uses: Table (matrix), SearchInput, Badge, ConfirmDialog |
| 9 | ✅ PASS | Custom layout (list page variant with matrix instead of list) |

### S37 — Integration List

| # | Result | Notes |
|---|--------|-------|
| 1 | ✅ PASS | KPI: active/inactive/failed. Cards show integration status. |
| 2 | ✅ PASS | Failed syncs in red. Inactive integrations in gray. |
| 3 | ✅ PASS | Click → detail. [Sync Now] on active cards. "+ New" for admin. |
| 4 | ✅ PASS | Card grid fills content. Each card has consistent layout. |
| 5 | ✅ PASS | Status badge color is primary visual indicator. Name + type + last sync. |
| 6 | ✅ PASS | "Add Integration" + "Sync Now" per card. |
| 7 | ✅ PASS | Cards: status dot + name + type = scannable in 2 seconds. |
| 8 | ✅ PASS | Uses: KpiCard, IntegrationCard, FilterBar, Button |
| 9 | ✅ PASS | List page layout per spec |

### S38 — Integration Detail

| # | Result | Notes |
|---|--------|-------|
| 1-9 | ✅ PASS | Standard detail page with tabs (Overview, Sync Log, Settings). |

### S39 — Integration Create

| # | Result | Notes |
|---|--------|-------|
| 1-9 | ✅ PASS | Standard create form with dynamic fields + test connection. |

### S40 — Settings — Profile

| # | Result | Notes |
|---|--------|-------|
| 1-9 | ✅ PASS | Standard settings form with sidebar nav. |

### S41 — Settings — Account

| # | Result | Notes |
|---|--------|-------|
| 1-9 | ✅ PASS | Standard settings: password change + sessions. |

### S42 — Settings — Workspace

| # | Result | Notes |
|---|--------|-------|
| 1-9 | ✅ PASS | Standard admin settings form. |

### S43 — Settings — Notifications

| # | Result | Notes |
|---|--------|-------|
| 1 | ⚠️ **REVISE** | Currently a flat list of toggles. **Fix:** Group by category (Tasks, Meetings, Announcements, System) with category headings. Each item: event name + in-app toggle + email toggle. Show total count of enabled notifications. |
| 2-9 | ✅ PASS | Otherwise standard settings form. |

### S44 — Settings — Appearance

| # | Result | Notes |
|---|--------|-------|
| 1-9 | ✅ PASS | Simple preference page. Theme + Density + Language. |

### S45 — 404 Not Found

| # | Result | Notes |
|---|--------|-------|
| 1 | ✅ PASS | "Page Not Found" title + description explains state |
| 2 | ✅ PASS | N/A (error page) |
| 3 | ✅ PASS | "Go to Dashboard" + "Go Back" buttons |
| 4 | ✅ PASS | Centered content — intentional empty space communicates "this page is empty" |
| 5 | ✅ PASS | Icon > Title > Description > Actions — clear hierarchy |
| 6 | ✅ PASS | Both actions are visible without scrolling |
| 7 | ✅ PASS | Scannable in 1 second |
| 8 | ✅ PASS | Uses: ErrorState component |
| 9 | ✅ PASS | Auth page layout per spec (minimal chrome) |

### S46 — Error Boundary

| # | Result | Notes |
|---|--------|-------|
| 1-9 | ✅ PASS | Same as 404 pattern. Clear and actionable. |

### S47 — Onboarding

| # | Result | Notes |
|---|--------|-------|
| 1 | ✅ PASS | "Welcome to Your Workspace!" title + step indicator |
| 2 | ✅ PASS | N/A — onboarding is proactive, not reactive |
| 3 | ✅ PASS | "Create Your First Project" + "Skip Tour" — clear choices |
| 4 | ⚠️ **REVISE** | Steps could have large empty regions if content is sparse. **Fix:** Each step should show a preview/illustration of what the user is creating (e.g., step 1: show a sample project card). Fill the space with visual guidance. |
| 5 | ✅ PASS | Step indicator (progress dots) + step content + action buttons |
| 6 | ✅ PASS | Primary CTA is clearly visible |
| 7 | ✅ PASS | 3-step wizard with clear labels. Scannable in 3 seconds. |
| 8 | ✅ PASS | Uses: Stepper, FormField, Button, Card |
| 9 | ✅ PASS | Auth page layout per spec (minimal chrome) |

---

## Summary

| Result | Count | Screens |
|--------|-------|---------|
| ✅ PASS | 44 | All except S25, S43, S47 |
| ⚠️ REVISE | 3 | S25 (Notifications — strengthen unread visual), S43 (Notifications Settings — group by category), S47 (Onboarding — fill empty space with previews) |

---

## Revision Actions

### S25 — Notifications (strengthen unread visual)

```
Before:
  Unread item: small blue dot (12px), normal text weight
  Read item: no dot, text-tertiary text

After:
  Unread item: primary-soft background, font-weight-medium text,
               filled blue dot (12px), semi-bold timestamp
  Read item: no background, font-weight-normal, text-secondary,
               empty dot or no dot
  Auto-select: Tab with most unread items is opened by default
```

### S43 — Notification Settings (group by category)

```
Before:
  Flat list of 12+ toggle rows

After:
  Task Notifications (section header + count badge)
    ├─ Task assigned         [In-app ✓] [Email ✓]
    ├─ Task mentioned        [In-app ✓] [Email ✓]
    ├─ Task status changed   [In-app ✓] [Email ✗]
    └─ Task due in 24h       [In-app ✓] [Email ✓]

  Meeting Notifications
    ├─ Meeting invitation    [In-app ✓] [Email ✓]
    └─ Meeting reminder      [In-app ✓] [Email ✓]

  Announcement Notifications
    └─ New announcement      [In-app ✓] [Email ✓]

  System Notifications
    ├─ Role changed          [In-app ✓] [Email ✗]
    └─ Weekly digest         [In-app ✗] [Email ✓]
```

### S47 — Onboarding (fill space)

```
Before:
  Step 1: Name your first project [input]
  Step 2: Invite your team [email input]
  Step 3: Create your first task [input]
  (Large empty regions around each step)

After:
  Step 1: "Name your first project" + sample project card preview (gray box showing
          what the result will look like) + name input
  Step 2: "Invite your team" + sample people grid preview + email input + [Send]
  Step 3: "Create your first task" + sample task card preview + title input + [Create]
```

---

All 44 passed screens are cleared for wireframing. The 3 revised screens must update their blueprints before Phase F.

---

*End of Phase E — Design Review Complete*
