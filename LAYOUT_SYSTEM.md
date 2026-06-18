# Layout System Specification

> **Phase:** Layout System — Phase 3 of 10
> **Status:** Complete
> **Base:** PRD v2.2 — Standardized Module Pattern (Section 9), Information Architecture (Section 6)

---

## Table of Contents

1. [Container & Breakpoint System](#1-container--breakpoint-system)
2. [Grid System](#2-grid-system)
3. [Standard Page Rhythm](#3-standard-page-rhythm)
4. [Module Type Layouts](#4-module-type-layouts)
5. [App Shell Anatomy](#5-app-shell-anatomy)
6. [Sidebar](#6-sidebar)
7. [Header](#7-header)
8. [Context Bar](#8-context-bar)
9. [Detail Drawer](#9-detail-drawer)
10. [Modal System](#10-modal-system)
11. [Mobile Adaptations](#11-mobile-adaptations)
12. [Z-Index Map](#12-z-index-map)

---

## 1. Container & Breakpoint System

### Breakpoints

```
Mobile:       < 768px        — Single column, stacked layouts
Tablet:       768–1023px     — 2-column, collapsed sidebar
Desktop:      1024–1439px    — Full layout, 12-col grid
Wide:         >= 1440px      — Max content widths applied
```

### Content Width Constraints

| Layout Type | Max Width | Alignment | Gutters |
|-------------|-----------|-----------|---------|
| List pages | 1200px | Center | 32px |
| Detail pages | 960px | Center | 32px |
| Dashboard | 1400px | Center | 32px |
| Analytics | 1400px | Center | 32px |
| Auth pages | 400px | Center | 24px |
| Settings | 800px | Center | 32px |
| Full-bleed (empty states) | 100% | — | 32px |

### Container Queries

Use container queries for component-level responsiveness within the grid:

```css
.page-content {
  container-type: inline-size;
  container-name: content;
}
```

---

## 2. Grid System

### 12-Column Grid

```
Desktop (≥1024px):
┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐
│1 │2 │3 │4 │5 │6 │7 │8 │9 │10│11│12│
└──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘
  Gap: 16px (space-4)
```

### Column Patterns

| Pattern | Columns | Container | Use Case |
|---------|---------|-----------|----------|
| Full | 12/12 | 100% | Tables, forms, single-column content |
| Two-col | 6/6 | 50% each | Side-by-side forms, widget pairs |
| Three-col | 4/4/4 | 33% each | KPI row, stat cards |
| Four-col | 3/3/3/3 | 25% each | Dense stat grid, quick links |
| Sidebar-content | 3/9 | 25% + 75% | Settings, detail pages with nav |
| Main-detail | 8/4 | 66% + 33% | Detail drawer alternative |
| Chart grid | 6/6 | — | Analytics charts pair |
| Chart full | 12/12 | — | Single large chart |

### Responsive Column Collapse

```
Desktop:  12 columns
Tablet:   8 columns
Mobile:   4 columns (but effectively single column stack)
```

---

## 3. Standard Page Rhythm

### The Universal Pattern

Every content page follows this vertical rhythm. This is the single most important layout rule — it must never be violated:

```
┌──────────────────────────────────────────────────────┐
│                                                        │
│  === PAGE HEADER (space-12 from <main> top) ===       │
│                                                        │
│  [Breadcrumbs]                                         │  h: 20px
│  space-4                                               │
│  [Page Title]                    [Primary Action]      │  h: 36px (title + btn)
│  space-1                                               │
│  [Page Description — optional, text-secondary]         │  h: 20px
│                                                        │
│  space-6                                               │
│                                                        │
│  === KPI ROW (optional) ===                           │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                  │  h: 80px
│  │ KPI  │ │ KPI  │ │ KPI  │ │ KPI  │                  │
│  └──────┘ └──────┘ └──────┘ └──────┘                  │
│                                                        │
│  space-6                                               │
│                                                        │
│  === FILTER BAR (if content needs filtering) ===      │
│  [Search Input] [Filter Dropdown] [View Toggle]        │  h: 40px
│                                                        │
│  space-4                                               │
│                                                        │
│  === CONTENT AREA ===                                  │
│  ┌──────────────────────────────────────────────────┐  │
│  │                                                    │  │  Flexible —
│  │  Table / Grid / Board / Calendar / Chart / Form    │  │  fills remaining
│  │                                                    │  │  viewport height
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  space-6                                               │
│                                                        │
│  [Pagination / Load More]                              │  h: 40px
│                                                        │
│  === (space-12 from <main> bottom) ===                │
└──────────────────────────────────────────────────────┘
```

### When to Omit Sections

| Section | Omit When |
|---------|-----------|
| Breadcrumbs | Auth pages, full-screen empty/error states |
| Page description | Title is self-explanatory (e.g., "Notifications") |
| KPI Row | Detail pages, settings, forms, auth |
| Filter Bar | Content is already filtered (e.g., project tasks), settings, forms |
| Pagination | Content fits in one view, under 20 items |

---

## 4. Module Type Layouts

### 4.1 List Page

**Used by:** Projects, Tasks (list view), People, Meetings, Announcements, Integrations, Roles

```
┌──────────────────────────────────────────────────────┐
│  [Breadcrumbs]                                        │
│  [Page Title]                    [+ New Button]       │
│  [Page Description]                                   │
│                                                        │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                 │
│  │ KPI  │ │ KPI  │ │ KPI  │ │ KPI  │                 │
│  └──────┘ └──────┘ └──────┘ └──────┘                 │
│                                                        │
│  [Search] [Filter 1] [Filter 2] [View Toggle]          │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Table / Grid / List                            │  │
│  │                                                  │  │
│  │  [Items with selection, sorting, pagination]    │  │
│  │                                                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  [Pagination]                                          │
└──────────────────────────────────────────────────────┘
```

**Responsive:**
- Tablet: KPI → 2×2, hide optional table columns
- Mobile: Table → stacked cards, filter → bottom sheet, pagination → load more

### 4.2 Detail Page

**Used by:** Task Detail, Meeting Detail, User Profile, Announcement Detail, Integration Detail, Role Detail

```
┌──────────────────────────────────────────────────────┐
│  [← Back / Breadcrumbs]                               │
│  [Context Bar — entity name, status, badge, actions]  │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  [Tab 1] [Tab 2] [Tab 3] [Tab 4]                │  │
│  ├──────────────────────────────────────────────────┤  │
│  │                                                   │  │
│  │  Active Tab Content                               │  │
│  │  (scoped to the entity)                           │  │
│  │                                                   │  │
│  └──────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

**Tab configurations per entity:**

| Entity | Tabs |
|--------|------|
| Task Detail | Activity (default), Comments, Attachments, Time Log |
| Project Workspace | Overview, Tasks, Timeline, Calendar, Members, Files, Meetings, Reports, Activity, Settings |
| Meeting Detail | Agenda, Notes & Action Items, Attendees, Recordings |
| User Profile | Overview, Assigned Tasks, Activity, Settings |
| Announcement Detail | (Single scroll page — no tabs) |
| Integration Detail | Overview, Sync Log, Settings |
| Role Detail | Overview, Permissions, Members |

### 4.3 Dashboard Page

**Used by:** Smart Home (all role variants)

```
┌──────────────────────────────────────────────────────┐
│  [Welcome, {user}! Here's your {role} overview.]     │
│                                                        │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                 │
│  │ KPI  │ │ KPI  │ │ KPI  │ │ KPI  │                 │
│  └──────┘ └──────┘ └──────┘ └──────┘                 │
│                                                        │
│  ┌──────────────────────┐ ┌──────────────────────┐     │
│  │  Primary Widget      │ │  Secondary Widget    │     │
│  │  (My Tasks /         │ │  (Schedule /         │     │
│  │   Project Health)    │ │   Activity)          │     │
│  └──────────────────────┘ └──────────────────────┘     │
│                                                        │
│  ┌──────────────────────┐ ┌──────────────────────┐     │
│  │  Tertiary Widget     │ │  Quick Actions       │     │
│  └──────────────────────┘ └──────────────────────┘     │
└──────────────────────────────────────────────────────┘
```

**Widget configuration per role:**

| Role | KPI Cards | Primary Widget | Secondary Widget | Bottom Row |
|------|-----------|----------------|-------------------|------------|
| Employee | My Tasks, Due Today, Overdue, Completed This Week | My Task List | Today's Schedule | Recent Activity + Announcements |
| Team Lead | Team Tasks, Pending Review, Overdue, Completed This Week | Approval Queue | Team Activity | Schedule + Quick Actions |
| Project Manager | Active Projects, Tasks In Progress, Overdue, Upcoming Milestones | Project Health (grid) | My Tasks | Recent Activity + Schedule |
| Executive | Total Projects, Total Tasks, Overdue %, Team Size | Project Health (risk chart) | Org Activity | Quick Stats + At-Risk Projects |
| HR | Team Size, Open Positions, Upcoming Events, Announcements | People Activity | Schedule | Announcements + Quick Actions |
| Admin | Active Users, Active Integrations, System Health, Pending Invites | System Status | Recent Activity | Quick Actions + Integration Status |

### 4.4 Workspace Page

**Used by:** Project Workspace (the most complex page in the app)

```
┌──────────────────────────────────────────────────────┐
│  [Breadcrumbs: Workspace / Projects / Project Name]  │
│                                                        │
│  [Context Bar — health dots, dates, PM name, status]  │
│                                                        │
│  [Overview] [Tasks] [Timeline] [Calendar] [Members]    │
│  [Files] [Meetings] [Reports] [Activity] [Settings]    │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │                                                   │  │
│  │  Tab Content (fills remaining viewport)          │  │
│  │                                                   │  │
│  │  Overview tab:                                    │  │
│  │    ┌────────────────────────────────────────┐     │  │
│  │    │ Progress Bar: ████████████░░░ 65%      │     │  │
│  │    └────────────────────────────────────────┘     │  │
│  │    ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │  │
│  │    │ Tasks│ │ Done │ │ Over │ │ Days │          │  │
│  │    └──────┘ └──────┘ └──────┘ └──────┘          │  │
│  │    ┌────────────────────────────────────────┐     │  │
│  │    │ Overdue Tasks (list, max 5)            │     │  │
│  │    └────────────────────────────────────────┘     │  │
│  │    ┌────────────────────────────────────────┐     │  │
│  │    │ Recent Activity (list, max 5)          │     │  │
│  │    └────────────────────────────────────────┘     │  │
│  │                                                   │  │
│  └──────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### 4.5 Analytics Page

**Used by:** Analytics Center, Reports

```
┌──────────────────────────────────────────────────────┐
│  [Breadcrumbs]                                        │
│  [Page Title]                           [Export CSV]  │
│  [Page Description]                                   │
│                                                        │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                 │
│  │ KPI  │ │ KPI  │ │ KPI  │ │ KPI  │                 │
│  └──────┘ └──────┘ └──────┘ └──────┘                 │
│                                                        │
│  ┌────────────────────────┐ ┌────────────────────────┐ │
│  │                        │ │                        │ │
│  │   Chart 1              │ │   Chart 2              │ │
│  │   (Bar / Line)         │ │   (Donut / Bar)        │ │
│  │                        │ │                        │ │
│  └────────────────────────┘ └────────────────────────┘ │
│                                                        │
│  ┌────────────────────────┐ ┌────────────────────────┐ │
│  │                        │ │                        │ │
│  │   Chart 3              │ │   Chart 4              │ │
│  │   (Line / Bar)         │ │   (Bar / Table)        │ │
│  │                        │ │                        │ │
│  └────────────────────────┘ └────────────────────────┘ │
│                                                        │
│  [Data Table — expandable below charts]                │
└──────────────────────────────────────────────────────┘
```

### 4.6 Settings Page

**Used by:** Profile Settings, Account Security, Workspace Settings, Notification Preferences, Appearance

```
┌──────────────────────────────────────────────────────┐
│  [Breadcrumbs]                                        │
│  [Page Title]                                         │
│                                                        │
│  ┌──────────┐ ┌────────────────────────────────────┐  │
│  │ Settings │ │                                     │  │
│  │ Nav      │ │  Settings Content                   │  │
│  │          │ │                                     │  │
│  │ Profile  │ │  ┌──────────────────────────────┐   │  │
│  │ Account  │ │  │ Section Title                │   │  │
│  │ Workspace│ │  │ ┌── Field ─────────────────┐ │   │  │
│  │ Notifs   │ │  │ │ [Input]                  │ │   │  │
│  │ Appear   │ │  │ └──────────────────────────┘ │   │  │
│  │          │ │  │ ┌── Field ─────────────────┐ │   │  │
│  │          │ │  │ │ [Input]                  │ │   │  │
│  │          │ │  │ └──────────────────────────┘ │   │  │
│  │          │ │  │ [Save Changes]              │   │  │
│  │          │ │  └──────────────────────────────┘   │  │
│  └──────────┘ └────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### 4.7 Auth Page

**Used by:** Login, Register, Forgot Password, Reset Password

```
┌──────────────────────────────────────────────────────┐
│                                                        │
│                                                        │
│              ┌────────────────────────┐                 │
│              │                        │                 │
│              │      [App Logo]        │                 │
│              │                        │                 │
│              │    Welcome Back        │                 │
│              │    Sign in to continue  │                 │
│              │                        │                 │
│              │    ┌────────────────┐  │                 │
│              │    │ Email          │  │                 │
│              │    └────────────────┘  │                 │
│              │    ┌────────────────┐  │                 │
│              │    │ Password       │  │                 │
│              │    └────────────────┘  │                 │
│              │                        │                 │
│              │    [Sign In]           │                 │
│              │                        │                 │
│              │    Forgot password?    │                 │
│              │    Don't have account? │                 │
│              │                        │                 │
│              └────────────────────────┘                 │
│                                                        │
│                                                        │
└──────────────────────────────────────────────────────┘
```

**Rules:**
- Card width: 400px max, centered vertically and horizontally
- No sidebar, no header, no navigation
- Background: `bg-secondary` (light) or `dark-bg` (dark)
- Card: `surface` with `shadow-modal`

---

## 5. App Shell Anatomy

```
┌─────────────┬─────────────────────────────────────────────┐
│             │  Header                                      │
│             │  [Breadcrumbs]              [New] [🔔] [👤]  │  h: 56px
│             ├─────────────────────────────────────────────┤
│  Sidebar    │  Context Bar (optional)                      │  h: 40px
│             │  [Health dots] [Project name] [Dates] [PM]   │
│  (240px)    ├─────────────────────────────────────────────┤
│             │                                              │
│             │  Page Content (scrollable)                   │
│             │                                              │
│             │  (Standard page rhythm applies here)         │
│             │                                              │
│             │                                              │
│             │                                              │
│             │                                              │
│             └─────────────────────────────────────────────┘
│             │  Footer (optional, minimal)                  │  h: 32px
│             │  [App version]                               │
└─────────────┴─────────────────────────────────────────────┘
```

### Shell Measurements

| Element | Height (Desktop) | Notes |
|---------|-----------------|-------|
| Header | 56px | Fixed. Contains breadcrumbs + actions |
| Context Bar | 40px | Optional. Fixed below header. Contains entity metadata |
| Sidebar | 100vh - 0 | Full height. Fixed. 240px expanded, 64px collapsed |
| Page content | calc(100vh - 56px - optional 40px) | Scrollable area |
| Footer | 0 (hidden) | Only shown on dedicated pages |

---

## 6. Sidebar

### Expanded State (Desktop ≥1024px)

```
┌────────────────────┐
│                    │
│  [App Logo]        │  h: 56px (aligns with header)
│                    │
│  ─────────────     │  divider
│                    │
│  🏠 Dashboard      │  active state: primary-soft bg
│  📋 Projects       │  badge: unread count
│  ✅ Tasks          │
│  📅 Calendar       │
│  📊 Analytics      │
│                    │
│  ─────────────     │  divider
│                    │
│  🎯 Meetings       │
│  📢 Announcements  │
│  👥 People         │
│                    │
│  ─────────────     │  divider (admin only)
│                    │
│  🛠️ Administration │  (collapsible section)
│    ├ Roles         │
│    ├ Permissions   │
│    ├ Integrations  │
│    └ Settings      │
│                    │
│  ═══════════════   │  spacer (pushes to bottom)
│                    │
│  [User avatar]     │  bottom-anchored
│  [User name]       │  current user info
│  [⚙️ Settings]     │  gear icon → profile settings
│                    │
└────────────────────┘
  Width: 240px
  Background: bg-secondary
  Border-right: 1px solid border-light
```

### Collapsed State (Tablet 768-1023px)

```
┌────────┐
│        │
│ [Logo] │  h: 56px
│        │
│ ───────│
│        │
│ 🏠     │  active: primary-soft circle bg
│ 📋     │  tooltip on hover: "Projects"
│ ✅     │
│ 📅     │
│ 📊     │
│        │
│ ───────│
│        │
│ 🎯     │
│ 📢     │
│ 👥     │
│        │
│ ───────│
│        │
│ 🛠️    │
│        │
│ ───────│
│        │
│ [User] │
│ [⚙️]  │
│        │
└────────┘
  Width: 64px
  Icons only, centered
  Tooltip on hover shows label
```

### Mobile Bottom Nav (<768px)

```
┌────────┬────────┬────────┬────────┬────────┐
│ 🏠     │ 📋     │ ✅     │ 🔔     │ ☰      │
│ Home   │ Proj   │ Tasks  │ Notifs │ More   │
└────────┴────────┴────────┴────────┴────────┘
  Height: 56px
  Fixed bottom
  5 items max
  "More" opens full nav drawer
```

### Sidebar Rules

- Non-admin users do not see the Administration section at all (removed entirely, not greyed out)
- Icon-only navigation items: 44×44px minimum touch target
- Active state: `primary-soft` background, `primary` text, `font-weight-medium`
- Badge counts: `bg-danger` text-white, `12px` size, positioned top-right of icon
- Hover state: `bg-tertiary` background
- Section dividers: 1px `border-light`, 8px margin top/bottom
- Sections can be collapsed (admin section default collapsed, others expanded)

---

## 7. Header

### Desktop Header

```
┌────────────────────────────────────────────────────┐
│  [Breadcrumbs]                                     │
│  Dashboard / Projects / Project Name               │
│                                      [+ New] [🔔] [👤]│
└────────────────────────────────────────────────────┘
  Height: 56px
  Background: surface
  Border-bottom: 1px solid border-light
  Padding: 0 space-8 (32px)
  Sticky: top-0, z-index: sticky (200)
```

### Header Elements

| Element | Position | Description |
|---------|----------|-------------|
| Breadcrumbs | Left | Navigation path. Current page is non-clickable text. |
| New button | Right | Quick-action menu. "N" keyboard shortcut. |
| Notification bell | Right | Icon with unread count badge. Opens notification panel. |
| User avatar | Right | Dropdown: Profile, Settings, Sign out. |

### Breadcrumb Format

```
Home / Parent / Current Page
```

- Each segment is a clickable link (except current page — plain text, `text-secondary`)
- Max 4 segments shown; overflow truncated with "…"
- On mobile: show last 2 segments only

---

## 8. Context Bar

### Appearance

```
┌────────────────────────────────────────────────────┐
│  [◄ Back to Projects]                              │
│  Project: Q4 Planning    ●●●●○ 80% health          │
│  PM: Sarah Chen          Due: Dec 31, 2025         │
│  [Share] [Bookmark] [More Actions ▾]               │
└────────────────────────────────────────────────────┘
  Height: 40px
  Background: bg-secondary (slightly different from header and content)
  Border-bottom: 1px solid border-light
  Padding: 0 space-8
  Sticky: below header, z-index: sticky (200)
```

### Context Bar Contents by Entity

| Entity | Left Content | Right Actions |
|--------|-------------|---------------|
| Project | Back button, Name, Health dots, PM, Due date | Share, Bookmark, More |
| Task | Back button, Task ID, Title, Status badge | Watch, Share, More |
| Meeting | Back button, Title, Date, Organizer | Share, Add to Calendar, More |
| User | User name, Role, Department | Message, More |

---

## 9. Detail Drawer

### The Unified Detail Drawer

The detail drawer is the primary interaction pattern. Most entities open in a slide-from-right drawer rather than full-page navigation, reducing context switching.

```
┌─────────────────────────────────────┤
│  [Task Title]                    [x] │
│  TSK-142  ● In Progress             │
│  ───────────────────────────────── │
│                                     │
│  Description                        │
│  ┌────────────────────────────────┐ │
│  │ Content text here             │ │
│  └────────────────────────────────┘ │
│                                     │
│  Details                            │
│  Assignee:    [Avatar + Name]      │
│  Due date:    Dec 15, 2025         │
│  Priority:    🔴 High              │
│  Project:     Q4 Planning          │
│  Watchers:    3                    │
│                                     │
│  Activity                           │
│  [User] updated status → 2h ago     │
│  [User] added comment → 3h ago      │
│                                     │
│  [Add comment...]                   │
│                                     │
└─────────────────────────────────────┘
  Width: 480px (desktop)
  Full width (tablet)
  Full screen slide-up (mobile)
  Shadow: shadow-drawer (left edge shadow)
  Backdrop: rgba(0,0,0,0.3)
  Animation: slide right 250ms ease
  Z-index: drawer (310), backdrop (300)
```

### When to Use Drawer vs Full Page

| Open In Drawer | Open Full Page |
|---------------|----------------|
| Task from list/board | Task from notification (direct link) |
| Meeting from list | Project Workspace |
| User quick view from people | User profile from @mention |
| Notification detail | Settings pages |
| Quick preview of any entity | New entity creation (form page) |
| — | Auth pages |
| — | Full-screen empty/error states |

### Drawer Content Types

| Entity | Drawer Content |
|--------|---------------|
| Task | Title, ID, status, description, details, activity, comments |
| Meeting | Title, date, time, organizer, agenda preview, attendees |
| User | Avatar, name, role, department, task count, quick actions |
| Notification | Full notification message, linked entity preview |
| Integration | Name, type, status, last sync, quick actions |

---

## 10. Modal System

### Modal Dimensions

| Type | Width | Height | Mobile |
|------|-------|--------|--------|
| Default modal | 480px | auto (max 80vh) | Fullscreen |
| Large modal | 640px | auto (max 80vh) | Fullscreen |
| Confirm dialog | 400px | auto | Fullscreen |
| Fullscreen modal | 100% | 100% | Fullscreen (default) |

### Modal Anatomy

```
┌──────────────────────────────────┐
│  [Title]                     [x] │
│  ─────────────────────────────── │
│                                  │
│  Content                         │
│                                  │
│  ─────────────────────────────── │
│  [Cancel]          [Confirm]     │
└──────────────────────────────────┘
  Backdrop: rgba(0,0,0,0.4), click to dismiss
  Animation: scale 0.95→1 + fade 200ms
  Focus trap: yes
  Escape key: dismiss
  Z-index: modal (410), backdrop (400)
```

---

## 11. Mobile Adaptations

### Navigation

| Feature | Desktop (≥1024) | Tablet (768-1023) | Mobile (<768) |
|---------|-----------------|-------------------|---------------|
| Sidebar | Full 240px | Icons 64px | Hidden |
| Navigation | Sidebar | Sidebar + tooltips | Bottom nav (5 items) |
| More nav | — | — | Hamburger → drawer overlay |

### Content

| Feature | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Tables | Full columns | Hide optional cols | Stacked cards |
| KPI row | 4 columns | 2×2 | 2 columns |
| Detail drawer | 480px slide-right | Full width overlay | Slide-up fullscreen |
| Modals | Centered | 90% width | Fullscreen |
| Filter bar | Inline | Inline | "Filter" button → bottom sheet |
| Pagination | Page numbers | Compact | "Load more" |
| Breadcrumbs | Full | Last 3 | Last 2 |
| Tabs | All visible | Horizontal scroll | Scroll + swipe |
| Charts | Full tooltips | Touch tooltips | Tap to select |

### Touch Targets

All interactive elements must have minimum 44×44px touch target on mobile.

---

## 12. Z-Index Map

```
Z-Index Scale (global CSS variables):

--z-dropdown:          100  — Dropdowns, popovers, date pickers
--z-sticky:            200  — Sticky headers, sticky columns, context bar
--z-drawer-backdrop:   300  — Drawer backdrop overlay
--z-drawer:            310  — Drawer panel
--z-modal-backdrop:    400  — Modal backdrop overlay
--z-modal:             410  — Modal / confirm dialog
--z-toast:             500  — Toast notifications
--z-tooltip:           600  — Tooltips

Layer stacking order (bottom to top):

  0:   Page content, sidebar, header (static)
  100: Dropdowns, popovers
  200: Sticky elements
  300: Drawer backdrop
  310: Drawer
  400: Modal backdrop
  410: Modal
  500: Toast
  600: Tooltip
```

### Rules

- Never use z-index values outside the defined scale
- New overlays must be assigned the next available level in their category
- Backdrops always sit exactly 10 below their associated overlay
- Multiple modals stack (second modal at 420, etc.)
- Multiple toasts stack with no z-index conflict (positioned differently)

---

*End of Layout System Specification — Ready for Low-Fidelity Wireframes*
