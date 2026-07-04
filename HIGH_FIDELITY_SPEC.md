# High-Fidelity Visual Specification

> For: Developer Handoff
> Status: Complete — Stages 1–6
> Philosophy: Premium · Enterprise · Calm · Typography-Driven

---

## Table of Contents

1. [Design Token System](#1-design-token-system)
2. [Component Visual Specifications](#2-component-visual-specifications)
3. [Dashboard Variants](#3-dashboard-variants)
4. [Module Families](#4-module-families)
5. [App Shell Anatomy](#5-app-shell-anatomy)
6. [Responsive Behavior](#6-responsive-behavior)
7. [Dark Mode](#7-dark-mode)
8. [Design QA Checklist](#8-design-qa-checklist)
9. [Developer Handoff Notes](#9-developer-handoff-notes)

---

## 1. Design Token System

Refer to `design-tokens.css` for the complete token system.

### Key Token Values for Implementation

```
Color distribution per screen: 85% neutral · 10% primary · 5% semantic

Neutral scale:
  --bg-app:          #f5f6f8    App canvas (not pure white)
  --bg-surface:      #ffffff    Cards, drawers, modals
  --bg-subtle:       #f0f1f3    Secondary surfaces
  --text-primary:    #101216    Body text
  --text-secondary:  #5a5f6b    Metadata

Primary (only for interaction):
  --primary:         #4f6cf7    CTAs, links, focus rings
  --primary-soft:    #eef1fe    Active nav, selected items

Semantic (status only):
  --success:         #16a34a    Done, approved
  --warning:         #d97706    In progress, attention
  --danger:          #dc2626    Overdue, errors
```

---

## 2. Component Visual Specifications

### 2.1 App Shell

```
AppShell
┌─────────────────────────────────────────────────────────┐
│ sidebar(240px)  │ content(flex-1)                        │
│ bg: bg-app      │                                        │
│                 │ Header(56px)                            │
│                 │   bg: bg-surface │ border-bottom: 1px   │
│                 │   px: space-6   │ sticky top-0         │
│                 │                                        │
│                 │ PageContent(scrollable, px: space-8)    │
│                 │   max-width: 1200px, mx: auto          │
│                 │   container-type: inline-size          │
│                 │                                        │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Sidebar

```
Sidebar
  Width: 240px (fixed)
  Background: var(--bg-app)
  Border-right: 1px solid var(--border-subtle)
  Padding: 0
  Display: flex, flex-direction: column

Logo Area (56px, aligns with header):
  padding: space-4 space-5
  border-bottom: 1px solid var(--border-divider)
  font: weight-semibold, text-base, letter-spacing: -0.01em

Navigation:
  flex: 1, overflow-y: auto, padding: space-3 0

  Section Label:
    padding: space-3 space-5 space-1
    font: text-xs, weight-medium, text-tertiary
    letter-spacing: 0.05em, text-transform: uppercase
    (Not clickable)

  Nav Item:
    display: flex, align-items: center, gap: space-3
    padding: space-1.5 space-5
    margin: 0 space-2
    border-radius: var(--radius-md)
    height: 36px
    font: text-sm, weight-medium, text-secondary
    transition: all var(--duration-fast) var(--ease-default)

    Icon: 18px, lucide, text-tertiary (inherits from parent)
    Label: flex: 1
    Badge: bg-danger(soft), text-xs, weight-semibold, rounding-full

    Hover:   bg: var(--bg-hover), text: var(--text-primary)
    Active:  bg: var(--primary-soft), text: var(--primary), icon: var(--primary)
    Current: bg: var(--primary-soft), text: var(--primary), font-weight: 600

  Collapsible Section (Admin):
    > .section-header (clickable): same as nav item
      Chevron icon rotates on expand
    > .section-children: padding-left: space-3

User Area (bottom-anchored):
  padding: space-3 space-5
  border-top: 1px solid var(--border-divider)
  display: flex, align-items: center, gap: space-3

  Avatar: 28px, rounding-full
  Name: text-sm, weight-medium, text-primary, flex: 1
  Settings Icon: 16px, text-tertiary, hover: text-primary

Collapsed (tablet, 768-1023px):
  Width: 64px
  Nav items: centered (justify-content: center)
  Labels: hidden (tooltip on hover)
  User area: centered, name hidden

Mobile (<768px):
  Hidden. Replaced by bottom nav (56px, 5 items).
```

### 2.3 Header

```
Header
  Height: 56px
  Background: var(--bg-surface)
  Border-bottom: 1px solid var(--border-subtle)
  Position: sticky, top: 0
  Z-index: var(--z-sticky)
  Padding: 0 var(--space-8)
  Display: flex, align-items: center, gap: var(--space-4)

  Breadcrumbs (flex: 1):
    font: text-sm, weight-normal
    Separator: "/" in text-tertiary, margin: 0 space-2
    Segment: text-secondary, hover: text-primary
    Current: text-tertiary (non-clickable)
    Overflow: "..." dropdown when >4 segments

  Actions (right, display: flex, gap: space-2):
    "New" Button (primary, text-sm, icon: plus):
      Dropdown on click: New Project | New Task | New Meeting | New Announcement
      Role-adaptive (HR sees Announcement, Employee sees only Task)
      Keyboard: "N" shortcut

    Notification Bell:
      Icon: 20px, lucide bell
      Badge: unread count, bg-danger, text-inverse, 8px font, -top-2px

    User Avatar:
      32px, rounding-full
      Dropdown: Profile | Settings | Sign Out
```

### 2.4 Buttons

```
Primary Button:
  height: 36px (default) / 28px (small) / 44px (large)
  padding: 0 space-4 (default) / 0 space-3 (sm)
  border-radius: var(--radius-md)
  bg: var(--primary)
  text: white, weight-medium, text-sm
  border: none
  gap: space-2 (icon + label)

  Hover:   bg: var(--primary-hover)
  Active:  bg: var(--primary-active), transform: scale(0.98)
  Focus:   ring: 3px var(--primary-ring)
  Disabled: opacity: 0.45, cursor: not-allowed
  Loading: spinner replaces icon, label stays

Secondary Button:
  bg: transparent
  border: 1px solid var(--border-default)
  text: text-primary, weight-medium, text-sm

  Hover: bg: var(--bg-hover)
  Active: bg: var(--bg-active)

Ghost Button:
  bg: transparent, border: none
  text: text-secondary, weight-medium, text-sm

  Hover: bg: var(--bg-hover), text: text-primary

Danger Button:
  bg: var(--danger)
  text: white

  Hover: bg: #b91c1c

Link Button:
  bg: transparent, border: none
  text: var(--text-link), weight-medium, text-sm
  padding: 0

  Hover: underline
```

### 2.5 Cards

```
Card
  bg: var(--bg-surface)
  border: 1px solid var(--border-default)
  border-radius: var(--radius-lg)  (12px)
  box-shadow: var(--shadow-card)
  padding: var(--space-5)
  transition: all var(--duration-fast) var(--ease-default)

  Interactive Hover:
    box-shadow: var(--shadow-elevated)
    border-color: var(--border-hover)
    transform: translateY(-1px)

  Card Title: text-lg, weight-semibold, text-primary, mb: space-2
  Card Body: text-sm, weight-normal, text-secondary

  KPI Card:
    padding: space-5
    display: flex, flex-direction: column, gap: space-1

    Value:    text-xxl (28px), weight-bold, text-primary, tracking-tight
    Label:    text-xs, weight-medium, text-tertiary, tracking-wide
    Trend:    text-xs, weight-medium
      Up:   color: var(--success)
      Down: color: var(--danger)
    Sparkline: 60px × 20px, in trend area

  Project Card:
    display: flex, flex-direction: column, gap: space-3

    Header: name(weight-semibold) + health dots(right)
    Progress: bar(4px, rounding-full, bg-subtle, fill: primary/success/warning/danger)
    Metadata: PM avatar + name, due date, task count (text-xs)
```

### 2.6 Tables

```
Table
  border-collapse: separate
  border-spacing: 0
  width: 100%

  Thead:
    th: text-xs, weight-semibold, text-tertiary, tracking-wide, uppercase
        padding: space-3 space-4, border-bottom: 2px solid border-default
        white-space: nowrap, user-select: none
        Sortable: cursor: pointer, hover: text-primary
    Sort indicator: 12px arrow, text-tertiary

  Tbody:
    tr:
      transition: bg var(--duration-fast)
      Hover: bg: var(--bg-hover)
      Selected: bg: var(--bg-selected)
      Click: cursor: pointer

    td:
      padding: space-3 space-4
      border-bottom: 1px solid var(--border-subtle)
      font: text-sm, weight-normal, text-primary
      vertical-align: middle

  Row Height: 52px (comfortable) / 40px (dense)

  Status Pills:
    display: inline-flex, align-items: center, gap: space-1
    padding: 2px space-2
    border-radius: var(--radius-full)
    font: text-xs, weight-medium
    Todo:        bg: bg-subtle,      text: text-secondary
    In Progress: bg: warning-soft,   text: warning
    In Review:   bg: info-soft,      text: info,          pulse animation
    Done:        bg: success-soft,   text: success

  Priority Chips:
    Critical:  🔴 text: danger
    High:      🟡 text: warning
    Medium:    🟢 text: success
    Low:       ⚪ text: tertiary

  Selection Checkboxes:
    width: 18px, height: 18px, border-radius: 4px, accent-color: primary

  Empty State: centered in table area, with icon + message + action
  Loading: 5 skeleton rows with shimmer

  Bulk Action Bar:
    position: fixed, bottom: 0, left: 240px, right: 0
    height: 56px, bg: bg-surface, border-top: 1px solid
    padding: space-4 space-8
    display: flex, align-items: center, gap: space-4
    Animate: slide up 200ms
    "3 selected" + [Assign] [Status] [Delete] [Cancel]
```

### 2.7 Drawer

```
Detail Drawer
  Position: fixed, right: 0, top: 0
  Width: 560px (desktop) / full (tablet) / full (mobile slide-up)
  Height: 100vh
  Background: var(--bg-surface)
  Box-shadow: var(--shadow-drawer)
  Z-index: var(--z-drawer)
  Animation: slide-right var(--duration-slow) var(--ease-default)
  Display: flex, flex-direction: column

  Header:
    padding: space-5 space-6
    border-bottom: 1px solid var(--border-subtle)
    display: flex, align-items: flex-start, gap: space-3

    Back button: ghost, 16px icon
    Content: flex: 1
      Entity ID: text-xs, weight-medium, text-tertiary (e.g., TSK-142)
      Title: text-xl (22px), weight-semibold, text-primary, leading-tight
      Status bar: flex, gap: space-2, mt: space-1
        Status pill + Priority chip + Due date
    Close: ghost icon button (x icon), 20px

  Body:
    flex: 1, overflow-y: auto
    padding: space-6
    display: flex, flex-direction: column, gap: space-6

  Footer (for comment input):
    padding: space-4 space-6
    border-top: 1px solid var(--border-subtle)
    Comment input with rich text toolbar
```

### 2.8 Modals

```
Modal Backdrop:
  Position: fixed, inset: 0
  Background: rgba(0,0,0,0.45)
  Z-index: var(--z-modal-bg)
  Animation: fade-in var(--duration-normal)

Modal:
  Position: fixed, top: 50%, left: 50%, transform: translate(-50%, -50%)
  Width: 520px (max: 90vw on tablet, full on mobile)
  Max-height: 85vh
  Background: var(--bg-surface)
  Border-radius: var(--radius-lg) (12px)
  Box-shadow: var(--shadow-modal)
  Z-index: var(--z-modal)
  Animation: scale-in (0.96→1) + fade-in, var(--duration-normal)

  Header:
    padding: space-5 space-6
    border-bottom: 1px solid var(--border-subtle)
    display: flex, align-items: center

    Title: text-lg, weight-semibold, flex: 1
    Close: ghost icon button, 20px

  Body:
    padding: space-6
    overflow-y: auto

  Footer:
    padding: space-4 space-6
    border-top: 1px solid var(--border-subtle)
    display: flex, justify-content: flex-end, gap: space-3
```

### 2.9 Inputs & Forms

```
Input:
  height: 40px, padding: 0 space-3
  border: 1px solid var(--border-default)
  border-radius: var(--radius-md) (8px)
  background: var(--bg-surface)
  font: text-sm, weight-normal, text-primary
  transition: all var(--duration-fast)

  Placeholder: text-tertiary
  Focus: border-color: var(--primary), ring: 3px var(--primary-ring)
  Error:  border-color: var(--danger), ring: 3px rgba(220,38,38,0.15)
  Disabled: bg: var(--bg-subtle), text: text-tertiary, cursor: not-allowed

  Label:
    font: text-sm, weight-medium, text-primary, mb: space-1.5
  Helper:
    font: text-xs, weight-normal, text-tertiary, mt: space-1
  Error Message:
    font: text-xs, weight-medium, danger, mt: space-1

Select:
  Same as input with custom dropdown chevron
  Dropdown: bg-surface, border, shadow-dropdown, border-radius: md
  Option: padding: space-2 space-3, hover: bg-hover
  Selected: bg-primary-soft, text-primary

Checkbox:
  width: 18px, height: 18px, border-radius: 4px
  border: 2px solid border-default
  Checked: bg-primary, border-primary, white checkmark
  Indeterminate: bg-primary, border-primary, white minus

Toggle:
  width: 36px, height: 20px, rounding-full
  Off: bg border-default, circle: white (16px)
  On: bg primary, circle: white (16px), translateX(16px)
  Transition: 200ms ease

Textarea:
  Same as input but multi-line, padding: space-3
  min-height: 80px, resize: vertical
```

### 2.10 Filter Bar

```
FilterBar:
  display: flex, align-items: center, gap: space-3
  padding: space-3 0, flex-wrap: wrap

  SearchInput:
    width: 280px, height: 36px
    icon: search (16px, text-tertiary, left)
    placeholder: "Search..."

  FilterDropdown:
    height: 36px, padding: 0 space-3
    bg: bg-surface, border: border-default, radius: md
    text: text-sm, text-secondary
    icon: chevron-down (14px, right)

  ViewToggle:
    display: flex, border: border-default, radius: md, overflow: hidden
    Button: 36px, border-right: 1px solid border-default
    Active: bg-primary-soft, text-primary, icon: primary
    Inactive: bg-transparent, text-tertiary
    Icons: 16px (layout-list, layout-grid, columns, calendar)

  Active Filters:
    FilterChip:
      display: inline-flex, align-items: center, gap: space-1
      padding: 2px space-2, bg-primary-soft, radius: full
      text: text-xs, weight-medium, primary
      Remove: x icon, 12px, hover: primary-hover

  Mobile:
    Collapses to single "Filter" button → bottom sheet with all options
```

### 2.11 Tabs

```
Tabs (Underline variant):
  display: flex, gap: 0
  border-bottom: 1px solid var(--border-subtle)

  Tab:
    padding: space-3 space-4
    font: text-sm, weight-medium, text-secondary
    border-bottom: 2px solid transparent
    margin-bottom: -1px
    cursor: pointer, transition: all var(--duration-fast)
    white-space: nowrap

    Hover: text-primary
    Active: text-primary, weight-semibold, border-bottom-color: primary
    Badge: text-xs, ml: space-1.5, bg-bg-subtle, padding: 1px space-1.5, radius: full
    Active Badge: bg-primary-soft, text-primary

  Tab Content:
    padding-top: space-6
    Animation: fade-in var(--duration-fast)
```

### 2.12 Pagination

```
Pagination:
  display: flex, align-items: center, justify-content: space-between
  padding: space-4 0
  font: text-sm

  Info: text-tertiary ("Showing 1-20 of 142")
  Controls: display: flex, gap: space-1

  PageButton:
    width: 32px, height: 32px, radius: md
    font: text-sm, weight-medium
    Default: text-secondary, hover: bg-hover
    Active: bg-primary, text-white
    Disabled: text-tertiary, cursor: not-allowed

  Mobile: "Load More" button instead
```

### 2.13 Empty States

```
EmptyState:
  display: flex, flex-direction: column, align-items: center
  justify-content: center
  padding: space-16 space-8
  text-align: center

  Icon:
    48px icon in 88px circle (bg: primary-soft)
    Icon color: primary

  Title:
    text-lg, weight-semibold, text-primary
    mt: space-5, mb: space-2

  Description:
    text-sm, weight-normal, text-secondary
    max-width: 400px, mx: auto
    mb: space-6

  Action:
    primary button (or multiple actions)

Empty state for search:
  Icon: search, in circle
  Title: "No results found"
  Description: "No results match "{query}". Try different keywords."
  Action: "Clear Search" (ghost button)
```

### 2.14 Loading Skeletons

```
Skeleton Base:
  bg: linear-gradient(90deg, bg-subtle 25%, bg-hover 50%, bg-subtle 75%)
  background-size: 200% 100%
  animation: shimmer 1.5s infinite
  border-radius: var(--radius-sm)

  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

KPI Skeleton:
  4 cards, each: height: 80px, radius: lg
  Inner: 2 bars (one wide for value, one narrow for label)

Table Skeleton:
  Header: single bar, 100% width, height: 40px
  Rows: 5 rows, each height: 52px
    Columns: bars of varying width (30%, 20%, 15%, 15%, 10%, 10%)

Card Skeleton:
  height: 200px, radius: lg
  Inner: title bar (60%), body bars (3 lines, 90%, 80%, 60%)

Skeleton reduces to solid bg-subtle when prefers-reduced-motion
```

### 2.15 Progress Bar

```
ProgressBar:
  height: 6px, bg: bg-subtle, radius: full, overflow: hidden

  Fill:
    height: 100%, radius: full
    bg: primary (default) / success (>80%) / warning (40-80%) / danger (<40%)
    transition: width var(--duration-slow) var(--ease-default)

  Determinate: width: N% (actual progress)
  Indeterminate: animated stripe (loading state)
  Label: text-xs, weight-medium, text-secondary, mt: space-1
```

### 2.16 Health Dots

```
HealthDots:
  display: flex, gap: 3px

  Dot:
    width: 8px, height: 8px, radius: full
    border: 1px solid transparent

  Scale (5 dots, filled left to right):
    5/5: all success (#16a34a)
    4/5: 4 success, 1 border-default
    3/5: 3 warning (#d97706), 2 border-default
    2/5: 2 warning (#d97706), 3 border-default
    1/5: 1 danger (#dc2626), 4 border-default
```

### 2.17 Avatars

```
Avatar:
  radius: full, object-fit: cover
  Sizes: 20px(team list) / 24px(table) / 32px(header) / 40px(profile) / 48px(page)
  
  With Image: <img> with object-fit: cover
  Initials: display: flex, align-items: center, justify-content: center
    bg: primary-soft, text: primary, weight-semibold
    font-size proportional to size (e.g., 24px avatar → 12px font)

  Status Dot:
    position: absolute, bottom: 0, right: 0
    width: 8px, height: 8px, radius: full
    border: 2px solid bg-surface
    Online: bg-success
    Busy: bg-warning
    Offline: bg-border-default

AvatarGroup:
  display: flex
  Avatars overlap: margin-left: -8px
  Overflow: +N circle, bg-bg-subtle, text-xs, weight-medium, text-secondary
```

### 2.18 Badges

```
Badge:
  display: inline-flex, align-items: center
  padding: 1px space-2
  border-radius: var(--radius-full)
  font: text-xs, weight-medium
  gap: space-1

  Default:   bg: bg-subtle,   text: text-secondary
  Success:   bg: success-soft, text: success
  Warning:   bg: warning-soft, text: warning
  Danger:    bg: danger-soft,  text: danger
  Info:      bg: info-soft,    text: info
  Outline:   bg: transparent,  text: text-secondary, border: border-default
```

### 2.19 KPI Cards

```
KpiCard:
  bg: var(--bg-surface)
  border: 1px solid var(--border-default)
  border-radius: var(--radius-lg)
  padding: var(--space-5)
  display: flex, flex-direction: column, gap: var(--space-1)
  
  Clickable:
    cursor: pointer
    Hover: border-color: var(--border-hover), shadow: var(--shadow-elevated)

  Label Row:
    display: flex, align-items: center, justify-content: space-between
    Label: text-xs, weight-medium, text-tertiary, tracking-wide

  Value Row:
    display: flex, align-items: baseline, gap: space-3
    Value: var(--text-xxl), weight-bold, text-primary, tracking-tight
    Trend: text-xs, weight-medium, with arrow icon (12px)
      Positive: color: success
      Negative: color: danger
      Neutral:  color: text-tertiary

  Sparkline:
    height: 24px
    svg path: stroke: primary (2px), fill: none

  Mini Footer:
    text-xs, text-tertiary
    "vs. last week" or comparison text
```

### 2.20 Dropdown Menu

```
DropdownMenu:
  Position: absolute, top: 100%, right: 0 (or left)
  min-width: 200px
  bg: var(--bg-surface)
  border: 1px solid var(--border-default)
  border-radius: var(--radius-md)
  box-shadow: var(--shadow-dropdown)
  padding: space-1.5 0
  z-index: var(--z-dropdown)

  Item:
    display: flex, align-items: center, gap: space-3
    padding: space-2 space-3
    font: text-sm, weight-normal, text-primary
    cursor: pointer
    Hover: bg: var(--bg-hover)

    Icon: 16px, text-tertiary
    Shortcut: text-xs, text-tertiary, ml: auto

  Divider:
    height: 1px, bg: border-subtle
    margin: space-1 0

  Header:
    padding: space-2 space-3
    font: text-xs, weight-semibold, text-tertiary, tracking-wide
```

### 2.21 Activity Timeline

```
ActivityItem:
  display: flex, gap: space-3
  padding: space-3 0

  Icon/Avatar:
    28px avatar or 20px icon in circle (bg: bg-subtle)

  Content:
    flex: 1, min-width: 0
    Line 1: text-sm, text-primary
      Actor: weight-medium
      Action: weight-normal ("completed task")
      Target: weight-medium, text-link ("TSK-142")
    Line 2: text-xs, text-tertiary (relative timestamp)

  Timeline Connector:
    position: absolute, left: 14px, top: 40px
    width: 1px, height: calc(100% - 40px)
    bg: border-subtle
```

### 2.22 Kanban Board

```
KanbanBoard:
  display: flex, gap: space-4
  overflow-x: auto
  padding: space-4 0
  height: 100%

  Column:
    min-width: 280px, max-width: 340px
    flex: 1
    bg: var(--bg-subtle)
    border-radius: var(--radius-lg)
    padding: space-4
    display: flex, flex-direction: column
    max-height: 100%

    Header:
      display: flex, align-items: center, justify-content: space-between
      mb: space-3
      Title: text-sm, weight-semibold, text-primary
      Count: text-xs, weight-medium, text-tertiary, bg-bg-surface, padding: 1px space-2, radius: full

    Drop Zone:
      flex: 1, min-height: 100px
      Drag Over: bg: primary-soft, border: 2px dashed primary, radius: md

  Card:
    bg: var(--bg-surface)
    border: 1px solid var(--border-default)
    border-radius: var(--radius-md)
    padding: space-3 space-4
    mb: space-2
    cursor: grab
    transition: all var(--duration-fast)

    Hover: border-color: var(--border-hover), shadow: var(--shadow-elevated)
    Dragging: shadow: var(--shadow-dropdown), transform: rotate(2deg), opacity: 0.9
    Drag Handle: none (whole card is handle)

    Title: text-sm, weight-medium, text-primary, mb: space-2
    Meta:  text-xs, text-tertiary, flex, gap: space-3
      Assignee avatar (20px) + ID + Priority indicator

  Empty Column:
    display: flex, align-items: center, justify-content: center
    text-xs, text-tertiary
    "No tasks"
```

### 2.23 Charts

```
Chart Container:
  bg: var(--bg-surface)
  border: 1px solid var(--border-default)
  border-radius: var(--radius-lg)
  padding: var(--space-5)

  Title: text-sm, weight-semibold, text-primary, mb: space-4
  ChartArea: position: relative, min-height: 200px

  Tooltip:
    bg: var(--bg-elevated)
    border: 1px solid var(--border-default)
    border-radius: var(--radius-md)
    padding: space-2 space-3
    font: text-xs
    box-shadow: var(--shadow-dropdown)

  Legend:
    display: flex, gap: space-4, mt: space-3
    Item: display: flex, align-items: center, gap: space-1.5
      Dot: 8px, radius: full
      Label: text-xs, text-secondary

  Loading:
    Skeleton bars (for bar chart) or skeleton line (for line chart)
    Gray pill shapes matching chart dimensions

  Empty:
    Centered text: "Insufficient data"
    text-sm, text-tertiary

Chart Color Stack:
  --chart-1: #4f6cf7  (primary)
  --chart-2: #14b8a6  (teal)
  --chart-3: #f59e0b  (amber)
  --chart-4: #8b5cf6  (violet)
  --chart-5: #ef4444  (red)
  --chart-6: #22c55e  (green)
```

### 2.24 Context Bar

```
ContextBar:
  height: 48px
  bg: var(--bg-app)  (matches sidebar, different from header)
  border-bottom: 1px solid var(--border-subtle)
  padding: 0 var(--space-8)
  display: flex, align-items: center
  gap: space-4
  position: sticky, top: 56px
  z-index: calc(var(--z-sticky) - 1)

  Left:
    display: flex, align-items: center, gap: space-3
    Back button: ghost, 16px icon
    Entity Name: text-sm, weight-semibold, text-primary
    Health Dots / Status Badge
    Meta: text-xs, text-tertiary

  Right:
    margin-left: auto
    display: flex, align-items: center, gap: space-2
    Actions: [Share] [Watch] [More ▾]
```

---

## 3. Dashboard Variants

### 3.1 Employee Dashboard

```
First 800px Viewport:
┌─────────────────────────────────────────────────────────────────┐
│ Welcome back, Alex! Here's your overview for today.              │
│                                                                   │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│ │My Tasks  │ │Due Today │ │Overdue   │ │Completed │             │
│ │    8     │ │    3     │ │    1     │ │    5     │             │
│ │   +2 wk  │ │   🔴     │ │   vs 2   │ │   this wk│             │
│ │  ╶────╴  │ │  ╶────╴  │ │  ╶────╴  │ │  ╶────╴  │             │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘             │
│                                                                   │
│ ┌──────────────────────────┐ ┌──────────────────────────┐        │
│ │ My Tasks                 │ │ Today's Schedule         │        │
│ │                          │ │                          │        │
│ │ TSK-142 Update Q4 fcst   │ │ 10:00 Daily Standup     │        │
│ │   🔴 Critical · Dec 15  │ │   15min · Zoom           │        │
│ │   ● In Progress          │ │                          │        │
│ │                          │ │ 14:00 Design Review     │        │
│ │ TSK-143 Review PR #42    │ │   1hr · Conf Room B     │        │
│ │   🟡 Medium · Dec 18     │ │                          │        │
│ │   ○ Todo                 │ │ > View full calendar    │        │
│ │                          │ │                          │        │
│ │ > View all tasks          │ │                          │        │
│ └──────────────────────────┘ └──────────────────────────┘        │
│                                                                   │
│ ┌────────────────────┐ ┌────────────────────┐                    │
│ │ Recent Activity    │ │ Announcements      │                    │
│ │ Sarah completed    │ │ Office Holiday     │                    │
│ │   TSK-140 (2m ago) │ │   Schedule (2h)    │                    │
│ │ John updated TSK.. │ │ New Hire: Maria    │                    │
│ │ You commented on.. │ │   (Yesterday)      │                    │
│ └────────────────────┘ └────────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘

KPI cards: border-radius: 12px, sparkline in each, trend arrow
Widgets: bg-surface, border, radius: 12px, padding: 20px
  Task items: 44px height, border-bottom, hover: bg-hover
  Schedule items: same
```

### 3.2 Project Manager Dashboard

```
First 800px:
┌─────────────────────────────────────────────────────────────────┐
│ Welcome, Sarah! Here's your PM overview.                         │
│                                                                   │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│ │Active    │ │In Progress│ │Overdue   │ │Upcoming  │             │
│ │Proj: 4   │ │Tasks: 18  │ │    2     │ │Milestone:│             │
│ │   +1 wk  │ │   +3 wk  │ │   🔴     │ │    3     │             │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘             │
│                                                                   │
│ ┌──────────────────────────┐ ┌──────────────────────────┐        │
│ │ Project Health           │ │ Overdue Tasks            │        │
│ │                          │ │                          │        │
│ │ [Q4 Plan ●●●●● 80%]     │ │ TSK-145 Setup CI/CD     │        │
│ │ [Website  ●●●●○ 42%]    │ │   John · Due Dec 1 🔴   │        │
│ │ [Mobile   ●●●○○ 38%]    │ │                          │        │
│ │ [API Mig  ●●○○○ 22%]   │ │ TSK-132 Write API docs  │        │
│ │                          │ │   Priya · Due Dec 5 🔴  │        │
│ │ > View all projects      │ │                          │        │
│ └──────────────────────────┘ └──────────────────────────┘        │
│                                                                   │
│ ┌────────────────────┐ ┌────────────────────┐                    │
│ │ Recent Activity    │ │ My Tasks           │                    │
│ │ ...                │ │ TSK-142 Update Q4  │                    │
│ └────────────────────┘ └────────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Executive Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│ Welcome, David! Here's your executive overview.                  │
│                                                                   │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│ │Projects  │ │Total     │ │Overdue   │ │Team Size │             │
│ │    8     │ │Tasks: 145│ │   12%    │ │   24     │             │
│ │   +2 qtr │ │   +8%    │ │   🔴     │ │   +2     │             │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘             │
│                                                                   │
│ ┌─────────────────────────────────┐ ┌─────────────────────────┐  │
│ │ Project Health Overview         │ │ Completion Trend        │  │
│ │ [Bar chart: 8 projects]        │ │ [Line chart: weekly]    │  │
│ │ 5 green, 2 yellow, 1 red       │ │ Up 12% from last month │  │
│ └─────────────────────────────────┘ └─────────────────────────┘  │
│                                                                   │
│ ┌────────────────────┐ ┌────────────────────┐                    │
│ │ At-Risk Projects   │ │ Key Metrics        │                    │
│ │ API Migration 🔴   │ │ Avg cycle: 4.2d   │                    │
│ │   (22% health)     │ │ On-time: 72%      │                    │
│ └────────────────────┘ └────────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

### 3.4 Team Lead Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│ Welcome, Priya! Here's your team overview.                       │
│                                                                   │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│ │Team Tasks│ │Pending   │ │Overdue   │ │Completed │             │
│ │    24    │ │Review: 3 │ │    1     │ │This Week │             │
│ │   +5 wk  │ │   🔵     │ │   🔴     │ │   12     │             │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘             │
│                                                                   │
│ ┌──────────────────────────┐ ┌──────────────────────────┐        │
│ │ Approval Queue (3)       │ │ Team Activity            │        │
│ │                          │ │                          │        │
│ │ TSK-138 Design Review    │ │ John completed TSK-140  │        │
│ │   Alex · Submitted 2h ago│ │   (30m ago)             │        │
│ │   [Review →]             │ │                          │        │
│ │                          │ │ Priya created TSK-146   │        │
│ │ TSK-135 QA Pass         │ │   (1h ago)              │        │
│ │   Maria · Submitted 5h   │ │                          │        │
│ │   [Review →]             │ │ Alex updated TSK-142    │        │
│ │                          │ │   (2h ago)              │        │
│ │ > View all pending       │ │                          │        │
│ └──────────────────────────┘ └──────────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

### 3.5 HR Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│ Welcome, Maria! Here's your HR overview.                         │
│                                                                   │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│ │Team Size │ │New This  │ │Upcoming  │ │Announce- │             │
│ │   24     │ │Month: 2  │ │Events: 3 │ │ments: 5  │             │
│ │         │ │          │ │          │ │          │             │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘             │
│                                                                   │
│ ┌──────────────────────────┐ ┌──────────────────────────┐        │
│ │ Recent Joiners           │ │ Upcoming Events          │        │
│ │                          │ │                          │        │
│ │ 👤 Maria Lopez           │ │ Dec 20 Holiday Party    │        │
│ │   Design Team · Dec 10   │ │   5PM · Main Office     │        │
│ │                          │ │                          │        │
│ │ 👤 James Wilson          │ │ Jan 5 All-Hands Meeting │        │
│ │   Engineering · Dec 8    │ │   10AM · Auditorium     │        │
│ │                          │ │                          │        │
│ │ > View all people         │ │ > View full calendar    │        │
│ └──────────────────────────┘ └──────────────────────────┘        │
│                                                                   │
│ ┌────────────────────┐ ┌────────────────────┐                    │
│ │ Recent Announcement│ │ Quick Actions      │                    │
│ │ Office Holiday ... │ │ [+ Announcement]   │                    │
│ └────────────────────┘ └────────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

### 3.6 Admin Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│ Welcome, Admin! Here's your system overview.                     │
│                                                                   │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│ │Active    │ │Active    │ │System    │ │Pending   │             │
│ │Users: 24 │ │Integ: 3  │ │Health    │ │Invites: 0│             │
│ │   +2 wk  │ │   all ok │ │   ✅     │ │          │             │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘             │
│                                                                   │
│ ┌──────────────────────────┐ ┌──────────────────────────┐        │
│ │ System Status            │ │ Recent Activity          │        │
│ │ ✅ All services healthy  │ │ Admin updated PM role   │        │
│ │ ✅ Database: 0.2ms      │ │   permissions (30m ago)  │        │
│ │ ✅ Redis: connected     │ │                          │        │
│ │ ✅ Queue: idle          │ │ Sarah created new proj   │        │
│ │                          │ │   (1h ago)              │        │
│ └──────────────────────────┘ └──────────────────────────┘        │
│                                                                   │
│ ┌────────────────────┐ ┌────────────────────┐                    │
│ │ Quick Actions      │ │ Integration Status │                    │
│ │ [+New User]        │ │ GitHub ✅ · Slack ✅│                    │
│ │ [View Roles]       │ │ Webhook ⚪         │                    │
│ └────────────────────┘ └────────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Module Families

### 4.1 Project Family (List + Workspace + Settings)

```
Project List → grid of ProjectCards (4-col on wide, 3-col on desktop, 2-col on tablet, 1-col on mobile)
  Each card: 280px min, flex: 1, grow

Project Workspace → context bar + 10 tabs + tab content
  Overview: progress ring (large, center) + 4 mini KPI cards + overdue list + activity feed
  Tasks: embedded task list with project-scoped filters
  Timeline: Gantt chart with months on x-axis, task bars + milestone diamonds
  Calendar: project-scoped calendar (month view)
  Members: avatar list with role badges + [Remove] action
  Files: attachment list with file type icons + download
  Meetings: meeting list scoped to project
  Reports: 2× chart grid (health trend + velocity)
  Activity: scoped activity timeline
  Settings: name, description, dates, status, danger zone

Project Settings → form sections with divider lines
  No card containers — form fields on bg-surface with section dividers
```

### 4.2 Task Family (List + Board + Detail + Create)

```
Task List (table view):
  Sticky header with sortable columns
  Columns: [✓] ID(mono) Title(status) Priority(icon) Assignee(avatar+name) Due(date) Project
  Row height: 48px
  Status column: color-coded pill
  Priority: icon-only column (🔴🟡🟢⚪)

Task Board (kanban):
  4 columns: Todo → In Progress → In Review → Done
  Column min-width: 240px, equal flex
  Drag and drop with optimistic update

Task Detail (drawer):
  Header: Back + ID + Title + Status + Priority + Due + Close
  Body columns (2-column on wide drawer):
    Left (flex: 1): Description + Activity feed
    Right (280px): Details panel
      Assignee, Due date, Priority, Project, Watchers, Subtasks, Dependencies
  Footer: Comment input (rich text, always visible)

Task Create (drawer or page):
  Title + Description (rich text) + Details panel (right side)
  Details: Status, Priority, Assignee, Project, Due date, Parent task
```

### 4.3 Meeting Family (List + Detail + Create)

```
Meeting List → card feed with date grouping
  Cards: title, time, duration, organizer avatar, attendee count, [Join] button
  Past meetings: lower opacity, no [Join]

Meeting Detail (drawer):
  Header: Back + Title + Date/Time + [Join]
  Tabs: Agenda & Notes | Action Items | Attendees
  Notes: rich text area (inline edit)
  Action Items: table with [Convert to Task] per row

Meeting Create (page/drawer):
  Title + Date/Time/Duration row + Location + Agenda items (repeating) + Attendees + Project link
```

### 4.4 People Family (Directory + Profile + User Admin)

```
People Directory:
  Grid view: avatar cards (6-col → 4-col → 2-col)
  Table view: Avatar + Name + Email + Role + Department + Status + Tasks count

User Profile:
  Header: Large avatar + Name + Role + Department + [Edit]
  Tabs: Overview | Assigned Tasks | Activity
  Overview: Bio + KPI row (tasks, meetings, completed, overdue)

User Edit (admin page):
  Form sections: Profile, Account, Role & Permissions, Danger Zone
```

### 4.5 Analytics Family (Center + Reports)

```
Analytics Center:
  2×2 chart grid (Project Health, Completion Trend, Team Velocity, Workload)
  Each chart: card container, title, "View Full Report" link bottom-right

Reports:
  KPI row + Large chart (primary visualization) + Data table below
  Filters: date range, project, team member
  Export: [CSV] [PDF] buttons top-right
```

### 4.6 Settings Family (Profile + Account + Workspace + Notifications + Appearance)

```
Settings:
  Two-column layout: sidebar nav (240px) + content (flex: 1)
  Nav: vertical list of setting groups
  Content: form sections with dividers
  Save button: sticky bottom or inline per section
```

---

## 5. App Shell Anatomy

```
Desktop (≥1024px)
┌──────────────┬──────────────────────────────────────────────────────┐
│              │  Header (56px)                                       │
│  Sidebar     │  Breadcrumbs                          [+N] [🔔] [👤] │
│  (240px)     ├──────────────────────────────────────────────────────┤
│  bg: bg-app  │  Context Bar (48px, optional)                        │
│  fixed       │  ← Back · Entity Name · Status · Meta    [Actions]  │
│  z: sticky   ├──────────────────────────────────────────────────────┤
│              │                                                       │
│              │  Page Content (scrollable)                           │
│              │  max-width: 1200px, mx: auto                         │
│              │  padding: space-8                                    │
│              │                                                       │
│              │  [Title + Description]                               │
│              │  [KPI Row — 4 cards]                                 │
│              │  [Filter Bar]                                        │
│              │  [Content Area — table/grid/kanban/calendar]         │
│              │  [Pagination]                                        │
│              │                                                       │
│              │                                                       │
│              │                                                       │
└──────────────┴──────────────────────────────────────────────────────┘

Tablet (768-1023px)
┌──────────────┬──────────────────────────────────────────────────────┐
│ Sidebar(64px)│  Header (56px)                                       │
│ icon-only    │  Breadcrumbs                        [+N] [🔔] [👤]   │
│              ├──────────────────────────────────────────────────────┤
│              │  Page Content (px: space-6)                          │
│              │  KPI: 2×2                                            │
│              │  Table: hide optional columns                        │
│              │  Drawer: full width                                  │
└──────────────┴──────────────────────────────────────────────────────┘

Mobile (<768px)
┌────────────────────────────────────────────────────────────────────┐
│  Header (56px)                                                      │
│  Title                         [🔔] [👤]                            │
├────────────────────────────────────────────────────────────────────┤
│  Page Content (px: space-4)                                        │
│  KPI: 2 columns                                                     │
│  Table → stacked cards                                              │
│  Filter → "Filter" button → bottom sheet                            │
│  Pagination → "Load more"                                           │
│  Drawer → fullscreen, slide-up                                      │
│  Modal → fullscreen                                                 │
├────────────────────────────────────────────────────────────────────┤
│  Bottom Nav (56px, 5 items)                                        │
│  [🏠] [📋] [✅] [🔔] [☰]                                            │
│  Home  Proj  Tasks  Notif  More                                     │
└────────────────────────────────────────────────────────────────────┘
```

---

## 6. Responsive Behavior

```
All components implement container queries where possible:

.page-content {
  container-type: inline-size;
  container-name: content;
}

Card grid:
  @container content (max-width: 600px) { 1 column }
  @container content (601-900px) { 2 columns }
  @container content (901-1200px) { 3 columns }
  @container content (min-width: 1201px) { 4 columns }

Tables:
  @container content (max-width: 768px) → stacked card layout
  Hide columns: last_updated, created_at on tablet
  Hide columns: description, project on mobile

Drawer:
  Desktop: 560px, slide from right
  Tablet: full width overlay, slide from right
  Mobile: fullscreen, slide from bottom (90% height)

Modal:
  Desktop: 520px centered
  Tablet: 90vw max
  Mobile: fullscreen

KPI Row:
  Desktop: 4 columns
  Tablet: 2×2
  Mobile: 2 columns

Touch targets: minimum 44×44px on mobile
```

---

## 7. Dark Mode

```
All components have [data-theme="dark"] variants defined in design-tokens.css.

Additional dark mode rules:
  - Charts: darker backgrounds, lighter grid lines, brighter chart colors
  - Shadows: higher opacity but same blur (dark bg provides depth)
  - Skeleton shimmer: dark-bg-tertiary → dark-surface-hover cycle
  - Avatars: border uses dark-border on status dots
  - Modals: dark-surface, dark-border
  - Drawer: dark-surface, dark-border
  - Tables: dark-bg-subtle for row hover, dark-border for lines

Theme toggle in Settings → Appearance (applies immediately, persists in localStorage)
System preference: respects prefers-color-scheme on first visit
```

---

## 8. Design QA Checklist

### Pre-Implementation Verification

```
□ Every page answers: What's happening? | Needs attention? | What's next?
□ No unnecessary whitespace — every section has purpose
□ Information hierarchy is typography-driven (not color-driven)
□ Primary actions are prominent and predictable
□ Page can be scanned in under 5 seconds
□ Every component is reusable (no one-off designs)
□ Layout follows the Universal Module Pattern
□ Skeleton screens match final layout exactly
□ Empty states are meaningful with CTAs
□ Error states are informative with recovery actions
□ All interactive elements have hover/focus/active states
□ Keyboard navigation works for all actions
□ WCAG 2.2 AA contrast ratios met (4.5:1 body, 3:1 large)
□ Touch targets ≥ 44px on mobile
□ Reduced motion respected
□ Dark mode implemented for all components
□ Responsive behavior at all 3 breakpoints
□ No layout shifts during loading
□ Optimistic updates with graceful rollback
□ Toast confirmations for all mutations
□ Confirmation dialogs for destructive actions
```

---

## 9. Developer Handoff Notes

### Implementation Priority

```
Phase 1 (Foundation):
  Design tokens → CSS custom properties
  AppShell → Sidebar + Header + PageLayout
  Core components: Button, Input, Card, Badge, Avatar, Skeleton
  Auth screens (S01-S04)
  Smart Home Dashboard (S05 — Employee variant)

Phase 2 (Daily Work):
  Task List (S10) + Task Detail drawer (S11) + Task Create (S12)
  Table component with all states
  FilterBar, Pagination, Drawer
  Notifications (S25) + Notification bell integration

Phase 3 (Team):
  Project List (S06) + Project Workspace (S08)
  Project Settings (S09)
  Meeting List/Detail/Create (S19-S21)
  People Directory + User Profile (S15-S16)

Phase 4 (Admin):
  Roles + Permissions (S33-S36)
  Integrations (S37-S39)
  Settings (S40-S44)
  Activity Timeline (S26)

Phase 5 (Analytics):
  Analytics Center (S27)
  Reports (S28-S31)
  Exports (S32)

Phase 6 (Polish):
  Calendar (S13)
  Milestones (S14)
  Admin variants (User Create/Edit S17-S18)
  Announcements (S22-S24)
  Onboarding (S47)
```

### File Structure Recommendation

```
src/
  design-system/
    tokens.css              (CSS custom properties)
    components/
      Button/               (Button.tsx + styles)
      Input/
      Card/
      Table/
      Drawer/
      Modal/
      ...
    layouts/
      AppShell.tsx
      PageLayout.tsx
      Sidebar.tsx
      Header.tsx
    hooks/
      useToast.ts
      useDrawer.ts
      useModal.ts
      usePagination.ts
      useBreakpoint.ts
      useTheme.ts

  features/
    auth/                    (Login, Register, Forgot, Reset)
    dashboard/               (6 role variants)
    projects/                (List, Workspace tabs, Settings)
    tasks/                   (List, Board, Detail, Create)
    meetings/                (List, Detail, Create)
    people/                  (Directory, Profile, Edit)
    announcements/           (List, Detail, Create)
    notifications/           (Feed, Bell)
    activity/                (Timeline)
    analytics/               (Center, Reports, Exports)
    admin/
      roles/                 (List, Detail, Create)
      permissions/           (Matrix)
      integrations/          (List, Detail, Create)
      settings/              (Profile, Account, Workspace, Notifications, Appearance)
      users/                 (Create, Edit)
    calendar/                (Month, Week, Day views)
    milestones/              (Timeline, List)
    system/                  (404, ErrorBoundary, Onboarding)
```

### CSS Strategy

```
Use CSS Modules or Tailwind CSS for component styling.
All design tokens via CSS custom properties (theme-able).
Component styles reference tokens only (no hardcoded values).
Dark mode toggle: [data-theme="dark"] on <html>.
Responsive: container queries + media query breakpoints.

Preferred: Tailwind CSS with custom theme extending tokens:
  theme.extend: {
    colors: {
      bg: { app, surface, subtle, hover, active, ... }
      text: { primary, secondary, tertiary, ... }
      border: { default, subtle, hover, ... }
      ...
    },
    borderRadius: { ...tokens },
    spacing: { ...tokens },
    fontFamily: { sans: 'Inter', mono: 'JetBrains Mono' },
    boxShadow: { ...tokens },
  }
```

---

*End of High-Fidelity Visual Specification — Ready for React Implementation*
