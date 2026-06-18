# Design System Specification

> **Phase:** Visual Design Language (VDL) — Phase 2 of 10
> **Status:** In Progress
> **Base:** PRD v2.2 — Enterprise Design System (Section 21), Component Library (Section 22)

---

## Table of Contents

1. [Brand Personality & Voice](#1-brand-personality--voice)
2. [Color Palette & Semantics](#2-color-palette--semantics)
3. [Typography Scale](#3-typography-scale)
4. [Spacing System](#4-spacing-system)
5. [Elevation & Shadow System](#5-elevation--shadow-system)
6. [Motion & Animation](#6-motion--animation)
7. [Iconography](#7-iconography)
8. [Illustration Style](#8-illustration-style)
9. [Loading States](#9-loading-states)
10. [Empty States](#10-empty-states)
11. [Error States](#11-error-states)
12. [Toast & Confirmation Patterns](#12-toast--confirmation-patterns)
13. [Dark Mode](#13-dark-mode)
14. [Accessibility Integration](#14-accessibility-integration)
15. [Layout System — Page Rhythm](#15-layout-system--page-rhythm)
16. [Component Inventory](#16-component-inventory)

---

## 1. Brand Personality & Voice

### Design Personality

The visual personality of the Internal Task Manager is defined by five attributes, each with a clear "what we are" and "what we are not":

| Attribute | We Are | We Are Not |
|-----------|--------|------------|
| **Professional** | Serious tools for serious work. Respect the user's intelligence. | Playful, cartoonish, game-like, or cutesy. No mascots. |
| **Precise** | Every pixel intentional. Aligned grids. Predictable spacing. | Sloppy, asymmetrical, "artistic," or uneven layouts. No visual surprises. |
| **Calm** | Quiet confidence. Whitespace as structure. Low visual noise. | Loud, flashy, pulsing, or over-animated. No unnecessary motion. |
| **Fast** | Perception of speed. Instant skeletons. Optimistic updates. | Spinners everywhere. Delayed feedback. Slow transitions. |
| **Intelligent** | Shows what matters, hides what doesn't. Progressive disclosure. | Information dumping. Everything visible all at once. |

### Voice & Tone

| Context | Tone | Example |
|---------|------|---------|
| Empty states | Helpful, encouraging | "Create your first task to get started." |
| Errors | Direct, actionable | "Something went wrong. Please try again." |
| Success | Brief, confident | "Task updated." |
| Confirmations | Clear, specific | "Delete "Q4 Planning"? This cannot be undone." |
| Onboarding | Warm, guiding | "Welcome! Here's how to set up your workspace." |
| System messages | Neutral, informative | "3 tasks due today." |

### What We Never Say

- "Oops!", "Whoops!", "Uh oh!", "Yay!", "Hooray!" — too informal
- "Please" — unnecessary in UI; be direct
- "Sorry for the inconvenience" — corporate; be direct instead
- "Come back later" — frustrating; provide alternatives
- "Under construction" or "Coming soon" — either build it or hide it

---

## 2. Color Palette & Semantics

### Light Theme

#### Neutral Palette (Backgrounds, Text, Borders)

```
--color-white:          #ffffff
--color-bg:             #ffffff      Main background
--color-bg-secondary:   #f8f9fa      Sidebar, card backgrounds, section alt
--color-bg-tertiary:    #f0f1f3      Hover states, pressed states
--color-surface:        #ffffff      Cards, modals, dropdowns, drawers
--color-surface-hover:  #f8f9fa      Card/row hover
--color-border:         #e2e4e8      Default borders
--color-border-light:   #eef0f2      Subtle dividers, disabled borders
--color-divider:        #eef0f2      Section dividers, list separators

--color-text:           #1a1d23      Primary text (headings, body)
--color-text-secondary: #5f6570      Supporting text, metadata
--color-text-tertiary:  #8f95a0      Placeholder text, captions
--color-text-placeholder:#b0b5c0     Input placeholders
--color-text-inverse:   #ffffff      Text on dark/primary backgrounds
```

#### Primary (Interactive Elements)

```
--color-primary:         #4f6cf7      Buttons, links, active states, focus rings
--color-primary-hover:   #3b5ae8      Button hover, link hover
--color-primary-active:  #2f4ad4      Button pressed
--color-primary-soft:    #eef1fe      Soft background (selected filters, active nav)
--color-primary-soft-hover: #e0e5fd  Soft hover
--color-primary-subtle:  #dce3fd      Very subtle primary backgrounds
```

**Usage rules:**
- Primary for exactly one interactive element per view (primary CTA)
- Links use primary text color
- Focus rings always use primary (2px solid, 2px offset)
- Primary-soft for selected states in navigation, active filter pills, tag backgrounds

#### Semantic Colors (Status, Feedback)

```
--color-success:         #22c55e      Completed, approved, active, healthy
--color-success-soft:    #e8faf0      Success toast bg, success badges
--color-warning:         #f59e0b      In progress, pending, needs attention
--color-warning-soft:    #fef7e8      Warning toast bg, warning badges
--color-danger:          #ef4444      Overdue, rejected, blocked, errors
--color-danger-soft:     #fde8e8      Error toast bg, error badges
--color-info:            #3b82f6      Neutral information, system notifications
--color-info-soft:       #e8f0fe      Info toast bg, info badges
```

**Usage rules:**
- Semantic colors never used for primary CTAs
- Soft variants always as background containers only (never text)
- Icons inherit semantic color when representing status
- Semantic text uses full color, not soft

#### Data Visualization Palette

```
--chart-blue:            #4f6cf7
--chart-teal:            #14b8a6
--chart-green:           #22c55e
--chart-yellow:          #eab308
--chart-orange:          #f97316
--chart-red:             #ef4444
--chart-purple:          #a855f7
--chart-pink:            #ec4899
```

**Usage:** Charts use this palette in order. Maximum 4 colors per chart for readability. Successive colors used for grouped bars/lines.

#### Health Dot Scale

```
5 dots:   #22c55e (>=80% health)
4 dots:   #4f6cf7 (>=60% health)
3 dots:   #f59e0b (>=40% health)
2 dots:   #f97316 (>=20% health)
1 dot:    #ef4444 (<20% health)
```

### Color Accessibility

All text/background combinations meet WCAG 2.2 AA:
- Normal text (<18px): minimum 4.5:1 contrast ratio
- Large text (>=18px bold, >=24px regular): minimum 3:1 contrast ratio
- UI components and graphical objects: minimum 3:1 contrast ratio
- All semantic colors verified against both white (#ffffff) and surface (#ffffff) backgrounds
- Primary (#4f6cf7) on white: 4.7:1 ✓
- Text (#1a1d23) on white: 15.2:1 ✓
- Text-secondary (#5f6570) on white: 6.1:1 ✓

---

## 3. Typography Scale

### Font Family

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
```

Inter is the primary typeface. Load weights 400, 500, 600, 700. No variable font (subset to specific weights for performance). Monospace for code blocks, inline code, IDs, timestamps.

### Type Scale

```
--font-size-xs:     0.75rem   (12px) — Captions, metadata, timestamps, table cell secondary
--font-size-sm:     0.875rem  (14px) — Body small, table cells, navigation labels, badges
--font-size-base:   1rem      (16px) — Body text, paragraph content, form labels
--font-size-lg:     1.125rem  (18px) — Large body, card titles, modal titles
--font-size-xl:     1.25rem   (20px) — Section titles, drawer titles
--font-size-2xl:    1.5rem    (24px) — Page titles, h1
--font-size-3xl:    1.875rem  (30px) — Hero text, dashboard welcome
--font-size-4xl:    2.25rem   (36px) — Display text, 404 page, large KPIs
```

### Font Weights

```
--font-weight-normal:    400  — Body text, descriptions, metadata
--font-weight-medium:    500  — Buttons, active nav items, table headers
--font-weight-semibold:  600  — Section headings, card titles, KPI values
--font-weight-bold:      700  — Page titles, display text, emphasis
```

### Line Heights

```
--line-height-tight:    1.2   — Headings, KPIs, badges, single-line text
--line-height-normal:   1.5   — Body text, paragraphs, multi-line content
--line-height-relaxed:  1.7   — Long-form reading, descriptions, empty states
```

### Typography Rules

| Element | Size | Weight | Line Height | Letter Spacing |
|---------|------|--------|-------------|----------------|
| Page title (h1) | 2xl | 700 | tight | -0.02em |
| Section title (h2) | xl | 600 | tight | -0.01em |
| Card title (h3) | base | 600 | tight | normal |
| Body text | base | 400 | normal | normal |
| Body small | sm | 400 | normal | normal |
| Caption | xs | 400 | normal | +0.01em |
| Table header | sm | 500 | tight | +0.01em |
| Table cell | sm | 400 | normal | normal |
| Button label | sm | 500 | tight | +0.01em |
| KPI value | 3xl | 700 | tight | -0.02em |
| KPI label | xs | 500 | tight | +0.02em |
| Badge text | xs | 500 | tight | +0.02em |
| Navigation label | sm | 500 | normal | normal |

### Monospace Usage

- Task IDs (TSK-142): `font-mono`, `font-size-sm`, `font-weight-medium`
- Code blocks: `font-mono`, `font-size-sm`, `line-height-normal`
- Time durations: `font-mono`, `font-size-sm`
- Inline code: `font-mono`, `font-size-sm`, `bg-tertiary` background

---

## 4. Spacing System

### 8-Point Grid

All spacing values are multiples of 4px (4-point grid system):

```
--space-0:   0px
--space-1:   4px    — Micro spacing (icon to text, badge padding)
--space-2:   8px    — Tight spacing (input padding, chip padding)
--space-3:   12px   — Comfortable padding (button padding-h, card padding)
--space-4:   16px   — Standard spacing (page padding, gap between sections)
--space-5:   20px   — Generous padding (button padding-w, modal padding)
--space-6:   24px   — Section spacing (between cards, KPI to content)
--space-8:   32px   — Large section spacing (between major blocks)
--space-10:  40px   — Page section spacing (KPI row to filter bar)
--space-12:  48px   — Page padding (top/bottom of content areas)
--space-14:  56px   — Hero spacing (dashboard welcome)
--space-16:  64px   — Maximum section separation
--space-20:  80px   — Page-level padding
--space-24:  96px   — Only for full-screen empty/error states
```

### Spacing by Context

| Context | Horizontal | Vertical | Gap |
|---------|-----------|----------|-----|
| Page content (desktop) | space-8 (32px) | space-12 (48px) | — |
| Page content (tablet) | space-6 (24px) | space-10 (40px) | — |
| Page content (mobile) | space-4 (16px) | space-6 (24px) | — |
| Card padding | space-4 (16px) | space-4 (16px) | — |
| Modal padding | space-6 (24px) | space-5 (20px) | — |
| Drawer padding | space-6 (24px) | space-5 (20px) | — |
| Table cell padding | space-3 (12px) | space-2 (8px) | — |
| Form field stack | — | — | space-5 (20px) |
| Button padding | space-4 (16px) | space-2 (8px) | — |
| Small button padding | space-3 (12px) | space-1 (4px) | — |
| KPI row gap | — | — | space-4 (16px) |
| Filter bar gap | — | — | space-3 (12px) |
| Tab gap | — | — | space-1 (4px) |
| List item padding | space-4 (16px) | space-3 (12px) | — |
| Section heading to content | — | space-4 (16px) | — |
| Description to KPI row | — | space-6 (24px) | — |
| KPI row to filter bar | — | space-6 (24px) | — |
| Filter bar to content | — | space-4 (16px) | — |

---

## 5. Elevation & Shadow System

### Shadow Scale

```
--shadow-xs:      0 1px 2px rgba(0,0,0,0.04)            — Card hover, subtle separation
--shadow-sm:      0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)  — Dropdowns, popovers
--shadow-md:      0 4px 6px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)  — Sticky headers, sticky columns
--shadow-lg:      0 10px 15px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.04)  — Drawers, side panels
--shadow-xl:      0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04)  — Modals, dialogs
--shadow-drawer:  -4px 0 24px rgba(0,0,0,0.12)         — Detail drawer (left edge shadow)
--shadow-modal:   0 24px 48px rgba(0,0,0,0.16)          — Large modals
--shadow-sticky:  0 2px 8px rgba(0,0,0,0.08)            — Sticky elements, context bar
```

### Elevation Mapping

| Level | Token | Element | Z-Index |
|-------|-------|---------|---------|
| 0 (flat) | none | Page surfaces, default cards | auto |
| 1 (raised) | xs | Card hover, row hover | auto |
| 2 (elevated) | sm | Dropdowns, popovers, tooltips, date picker | 100 |
| 3 (floating) | md | Sticky headers, sticky table columns | 200 |
| 4 (overlay) | lg | Drawers, side panels | 310 |
| 5 (modal) | xl, modal | Modals, confirm dialogs | 410 |
| 6 (toast) | xl | Toasts (with backdrop blur) | 500 |
| 7 (tooltip) | sm | Tooltips | 600 |

### Dark Mode Shadows

```css
--dark-shadow-xs:   0 1px 2px rgba(0,0,0,0.2)
--dark-shadow-sm:   0 1px 3px rgba(0,0,0,0.3)
--dark-shadow-md:   0 4px 6px rgba(0,0,0,0.3)
--dark-shadow-lg:   0 10px 15px rgba(0,0,0,0.35)
--dark-shadow-xl:   0 20px 25px rgba(0,0,0,0.4)
```

Dark shadows use higher opacity but same blur/spread — the darkened background already provides depth perception, so shadows are more subtle relative to light mode.

---

## 6. Motion & Animation

### Duration Tokens

```css
--transition-fast:   150ms ease     — Micro-interactions (hover, focus, active)
--transition-normal: 200ms ease     — Standard transitions (color, bg, border)
--transition-slow:   300ms ease     — Layout shifts, panel open/close
--transition-spring: 200ms cubic-bezier(0.34, 1.56, 0.64, 1)  — Scale, bounce-appropriate
```

### Motion Categories

#### Micro-interactions (150ms, ease)
- Button hover → background color shift
- Link hover → text color shift
- Input focus → border color + ring
- Icon hover → subtle scale (1.05)
- Checkbox/toggle toggle → checked state
- Badge count update → quick pulse

#### Navigation & Layout (200-300ms, ease)
- Page transition → fade 150ms (no slide)
- Drawer open → slide from right 250ms
- Drawer close → slide to right 200ms
- Modal open → scale up (0.95→1) + fade 200ms
- Modal close → scale down (1→0.95) + fade 150ms
- Sidebar expand/collapse → width transition 200ms
- Accordion expand → max-height 250ms
- Tab switch → instant (pre-fetched)

#### Feedback & Notifications
- Toast slide in → from top-right, slide 200ms + fade
- Toast dismiss → fade out 200ms
- Skeleton pulse → shimmer 1.5s infinite
- Error shake → horizontal shake 300ms (used sparingly)
- Progress bar animate → width transition 300ms

#### What Never Animates
- Page titles — instant render
- Text content — instant render (no fade-in paragraphs)
- Table rows — no staggered entry or slide-in
- Icons (non-interactive) — no spin, pulse, or bounce
- Backgrounds — no moving gradients or particle effects

### Reduced Motion

When `prefers-reduced-motion: reduce` is detected:
- All animations set to 0ms duration
- Skeleton pulse → static gray blocks
- Drawer/modal open → instant (0ms)
- Toast appears without slide
- All hover transforms disabled
- Page transition → instant swap
- Progress bar → instant jump

---

## 7. Iconography

### Icon Library

Use **lucide-react** exclusively for all UI icons. No custom icon SVGs unless absolutely necessary (rare exceptions: custom auth provider logos, illustration icons).

### Icon Sizes

| Context | Size | Notes |
|---------|------|-------|
| Navigation sidebar | 20px | Consistent with label |
| Button icons | 16px | Left of label in buttons |
| KPI card icons | 20px | Left of value |
| Table row actions | 16px | Minimal footprint |
| Section headers | 16px | Left of title |
| Notification icons | 20px | Left of notification text |
| Empty state icons | 48px | Centered, in soft circle |
| Status badges | 12px | Inline with text |
| Data table sort | 14px | Arrow indicators |
| Modal/Drawer close | 20px | Top-right X icon |

### Icon Rules

- All icons are SVG (lucide-react components), never raster
- Icon color inherits from parent text color unless semantic
- Semantic icons (success/warning/danger/info) use their semantic color
- Icons never have backgrounds (except empty state icon background circle)
- Icons are always single-tone (no multi-color icons)
- Interactive icons get a 44x44px touch target (transparent padding)
- No animated icons (no spinning, pulsing, bouncing)

### Empty State Icon Backgrounds

```
--empty-state-circle: 48px icon + 80px circle background (color-primary-soft)
--empty-state-circle-color: var(--color-primary-soft)
```

---

## 8. Illustration Style

### Philosophy

No illustrations. The design uses icons and layout structure for visual communication, not illustrations. This decision:
- Eliminates a vector dependency
- Keeps the UI purely functional
- Avoids dating the UI (illustration trends change)
- Ensures perfect accessibility (icons have aria-labels)
- Reduces cognitive load — icons communicate faster than illustrations

### Exceptions

- **404 page**: A single large icon (lucide `search-x` or `file-x`) with text. No illustration.
- **Error boundary**: Same as 404 — icon + text + action buttons.
- **Onboarding**: Empty state pattern (icon + title + description + action) — no illustration.

### Visual Interest Without Illustrations

Visual interest comes from:
- Strong typography hierarchy (size, weight, color)
- Subtle background color shifts (bg-secondary, bg-tertiary)
- Card and surface separation via border + shadow
- Data visualization (charts, progress bars, health dots)
- Avatar photos and initials (real people)
- Organized whitespace as a structural element

---

## 9. Loading States

### Skeleton Screens

Every page renders skeleton screens matching exact layout immediately (no waiting for API):

```
KPI Row Skeleton:
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ ████         │ │ ████         │ │ ████         │ │ ████         │
│ ████████     │ │ ████████     │ │ ████████     │ │ ████████     │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
(4 gray rectangles with pulse shimmer, 1.5s cycle)

Table Skeleton:
┌────────────────────────────────────────────────────────────┐
│ ██████████ ██████ ████████████ ████ ████                   │  ← Header
├────────────────────────────────────────────────────────────┤
│ ██████████ ██████ ████████████ ████ ████                   │  ← Row 1
│ ██████████ ███    ████████████ ████ ████                   │  ← Row 2
│ ██████████ ██████ ████         ████ ████                   │  ← Row 3
│ ██████████ ██████ ████████████ ██   ████                   │  ← Row 4
│ ██████████ ██     ████████████ ████ ████                   │  ← Row 5
└────────────────────────────────────────────────────────────┘
(Header + 5 rows, alternating bar widths, pulse shimmer)
```

### Skeleton Rules

- Match exact layout dimensions (not generic placeholders)
- Animate with pulse gradient: `bg-tertiary` → `bg-secondary` → `bg-tertiary`
- Duration: 1.5s cycle, infinite until loaded
- Transition to real content: fade in 200ms (no jarring swap)
- Minimum skeleton display: 300ms (avoid flash for fast loads)
- Skeletons are `aria-hidden="true"` with `role="presentation"`

### Page Transitions

- Route changes: subtle fade (150ms). Skeleton screens render instantly.
- No spinner overlay for navigation — skeletons are the loading state
- Tabs within detail pages: instant switch (pre-fetch adjacent tabs)

### Action Loading

| Element | Loading State |
|---------|---------------|
| Button | Show spinner icon inside (16px), disable pointer events |
| Form submit | Button shows spinner + "Saving…" text |
| Dropdown/select | Show brief loading state (200ms minimum to avoid flicker) |
| Optimistic updates | Update UI immediately, show subtle indicator if failure |
| Search | Debounce 300ms, show spinner in search icon during query |
| File upload | Progress bar in upload area, percentage text |

---

## 10. Empty States

Every empty state follows this pattern and answers the three questions:

```
┌──────────────────────────────────────────────────┐
│                                                  │
│                    [icon]                        │
│                                                  │
│               [Title — 16px, 600]               │
│                                                  │
│   [Description — 14px, 400, text-secondary]     │
│   1-2 sentences explaining what this is for      │
│                                                  │
│          [Primary Action Button]                 │
│                                                  │
│   Q: What is happening? → Title + description    │
│   Q: What needs attention? → Nothing (empty)     │
│   Q: What can I do next? → Primary action        │
└──────────────────────────────────────────────────┘
```

### Empty State Specifications

| Page | Icon | Title | Description | Action |
|------|------|-------|-------------|--------|
| Dashboard (new user) | layout-dashboard | Welcome to Your Workspace | "Your workspace is empty. Create a project, invite your team, and start tracking work." | Create Project / Invite Team |
| Projects (no filter) | folder-open | No Projects Yet | "Projects organize tasks, milestones, and team members around a shared goal." | Create Project |
| Projects (filtered) | search | No Projects Match | "No projects match the current filters. Try adjusting them." | Clear Filters |
| Tasks (no filter) | check-square | No Tasks Yet | "Create your first task to get started. Tasks are the building blocks of your work." | Create Task |
| Tasks (filtered) | search | No Tasks Match | "No tasks match the current filters. Try adjusting them." | Clear Filters / Create Task |
| Calendar (empty period) | calendar | No Events This Period | "No events scheduled for this time frame." | Create Event |
| Milestones | flag | No Milestones | "Milestones mark important dates in your project timeline." | (Create from Project) |
| Meetings | target | No Meetings Scheduled | "Schedule a meeting to collaborate with your team or plan a project." | New Meeting |
| Announcements | megaphone | No Announcements Yet | "Announcements share updates with the company or specific teams." | New Announcement |
| Notifications | bell | All Caught Up! | "You'll be notified when someone mentions you, assigns you a task, or comments on your work." | — |
| Activity | history | No Activity Recorded | "Activity begins when someone creates, updates, or comments on something in the workspace." | — |
| Integrations | plug | No Integrations | "Connect your workspace to external tools like GitHub or Slack to automate workflows." | Add Integration |
| Analytics | bar-chart-3 | Insufficient Data | "Charts will populate as tasks are created and completed. Start tracking work to see insights." | — |
| Search | search | No Results Found | "No results match your search. Try different keywords or filters." | Clear Search |

### Empty State Rules

- Never show empty state on pages where data always exists (People, Dashboard after initial setup)
- All empty states centered in the content area (not full viewport)
- Icon is 48px, color-primary, on 80px `color-primary-soft` circle
- Action button only shown if user has permission to create
- Description never says "Coming soon" or "Under construction"
- Empty states are announced via `aria-live="polite"`

---

## 11. Error States

### Error Pattern Matrix

| Error | UI Pattern | Position | Behavior |
|-------|-----------|----------|----------|
| **401 Unauthorized** | Toast | Top-right | Show toast "Session expired", redirect to login after 2s |
| **403 Forbidden** | Inline banner | Above content | "You don't have permission to perform this action." + contact admin text |
| **404 Not Found** | Full-page | Center | Large icon + "Page not found" + Dashboard link |
| **422 Validation** | Inline | Per field | Red border + error message below each field |
| **500 Server Error** | Toast | Top-right | "Something went wrong. Please try again." + Retry |
| **Network Error** | Persistent banner | Top of page | "Connection lost. Retrying…" with live indicator. Auto-retry 3x |
| **Rate Limited** | Toast | Top-right | "Too many requests. Please wait a moment." |
| **Empty Response (200)** | Empty state | Content area | Standard empty state for module |

### 404 Page Specification

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                                                              │
│                         ┌──────┐                             │
│                         │  🔍  │  (80px icon circle)         │
│                         └──────┘                             │
│                                                              │
│                    Page Not Found                            │
│                                                              │
│    The page you're looking for doesn't exist or has been     │
│    moved. Check the URL or navigate back to your workspace.  │
│                                                              │
│              [Go to Dashboard]  [Go Back]                    │
│                                                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Error Boundary

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                         ┌──────┐                             │
│                         │  ⚠️  │                             │
│                         └──────┘                             │
│                                                              │
│                    Something Went Wrong                      │
│                                                              │
│    An unexpected error occurred in this section. Our team    │
│    has been notified automatically.                          │
│                                                              │
│    What can you do?                                          │
│              [Reload]  [Go to Dashboard]                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

- Error boundary wraps each major section independently (sidebar unaffected if content errors)
- "Reload" attempts to re-mount the section (not full page reload)
- Error details logged to console only (not displayed to user)

---

## 12. Toast & Confirmation Patterns

### Toast Specifications

| Property | Value |
|----------|-------|
| Position | Top-right, 24px from top and right |
| Width | 360px (fixed, not full-width except mobile) |
| Max height | Auto, collapses to fit |
| Border radius | lg (8px) |
| Shadow | shadow-xl with `backdrop-filter: blur(8px)` |
| Background | surface with subtle backdrop blur |
| Z-index | 500 |

### Toast Variants

```
Success Toast:
┌──────────────────────────────────────┐
│ ✅ Task updated successfully.    [x] │
└──────────────────────────────────────┘
  Background: #ffffff  Icon: #22c55e  Duration: 3s

Error Toast:
┌──────────────────────────────────────┐
│ ❌ Failed to update task.  [Retry][x]│
└──────────────────────────────────────┘
  Background: #ffffff  Icon: #ef4444  Duration: 5s  Action: Retry

Warning Toast:
┌──────────────────────────────────────┐
│ ⚠️ Task is overdue.               [x]│
└──────────────────────────────────────┘
  Background: #ffffff  Icon: #f59e0b  Duration: 5s

Info Toast:
┌──────────────────────────────────────┐
│ ℹ️ New updates available.  [Refresh][x]│
└──────────────────────────────────────┘
  Background: #ffffff  Icon: #3b82f6  Duration: 4s  Action: Refresh
```

### Toast Behavior

| Variant | Duration | Auto-dismiss | Action | Stacking |
|---------|----------|-------------|--------|----------|
| Success | 3s | Yes | Undo (when applicable) | Stacks upward, max 3 visible |
| Error | 5s | Yes | Retry (when applicable) | Stacks upward, max 3 visible |
| Warning | 5s | Yes | Optional action | Stacks upward, max 3 visible |
| Info | 4s | Yes | Optional action | Stacks upward, max 3 visible |

### Confirmation Dialog

```
┌────────────────────────────────────────────┐
│                                            │
│          Delete "Q4 Planning"?             │
│                                            │
│  This will permanently delete the project  │
│  and all 24 tasks within it. This action   │
│  cannot be undone.                         │
│                                            │
│         [Cancel]    [Delete Project]       │
│                        (danger button)      │
└────────────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Width | 480px (max) |
| Border radius | lg (8px) |
| Backdrop | `rgba(0,0,0,0.4)`, click to dismiss |
| Cancel button | Default (secondary) |
| Confirm button | Primary (for non-destructive) / Danger (for destructive) |
| Focus trap | Yes |
| Escape key | Dismisses (cancel) |
| Mobile | Fullscreen |

### Confirmation Triggers

| Action | Confirm Type | Button Label |
|--------|-------------|--------------|
| Delete entity | Danger | "Delete [entity]" |
| Archive entity | Primary | "Archive [entity]" |
| Remove member | Danger | "Remove [name]" |
| Leave project | Danger | "Leave Project" |
| Discard changes | Primary | "Discard" |
| Bulk delete | Danger | "Delete [n] items" |

---

## 13. Dark Mode

### Dark Theme Tokens

```
--dark-bg:              #0f1117      Main background
--dark-bg-secondary:    #1a1d28      Sidebar, card backgrounds
--dark-bg-tertiary:     #232738      Hover states, pressed
--dark-surface:         #1e2130      Cards, modals, dropdowns, drawers
--dark-surface-hover:   #262a3c      Card/row hover
--dark-border:          #2d3140      Default borders
--dark-border-light:    #262a3c      Subtle dividers
--dark-divider:         #262a3c      Section dividers

--dark-text:            #e8eaed      Primary text
--dark-text-secondary:  #9ca0ab      Supporting text
--dark-text-tertiary:   #6b7084      Placeholder text
```

### Dark Mode Rules

- Primary color remains the same (#4f6cf7) — maintains brand recognition
- Semantic colors remain the same — color meaning must be consistent across themes
- Shadows are darker but lower intensity (higher opacity, same spread)
- Surfaces are slightly lighter than background (not pure black cards on pure black bg)
- Borders are visible but subtle — the dark border is #2d3140 on #0f1117 bg
- Text contrast remains > 4.5:1 for all body text
- Skeleton shimmer uses dark-appropriate colors (dark-bg-tertiary → dark-surface-hover)
- No inverted colors — use dark theme tokens explicitly
- Theme toggle in Settings → Appearance

---

## 14. Accessibility Integration

### Color & Contrast

- All text/background combinations verified against WCAG 2.2 AA
- Semantic colors not relied upon as sole differentiator (always paired with text or icon)
- Focus indicator: 2px solid primary color, 2px offset from element
- Reduced motion respected via `prefers-reduced-motion`

### Focus Management

| Interaction | Focus Behavior |
|-------------|---------------|
| Modal/Drawer open | Trap focus inside; first focusable element focused |
| Modal/Drawer close | Restore focus to trigger element |
| Page transition | Focus the `<h1>` of the new page |
| Inline error | Focus the first errored field |
| Notification read | Keep focus on notification item |
| Bulk action after | Focus returns to "Select all" checkbox |
| Skip to content | First focusable element on every page |

### Screen Reader Support

| Element | ARIA |
|---------|------|
| Loading state | `aria-live="polite"` "Loading…" |
| Skeleton screens | `aria-hidden="true"` `role="presentation"` |
| Empty states | Announced as "No items" with description |
| KPI cards | `role="article"` `aria-label="{label}: {value}"` |
| Tables | `role="grid"`, `aria-sort` on columns |
| Charts | Data table (hidden) alongside visual chart |
| Notifications | `role="listitem"` `aria-label="{summary}"` |
| Toast | `role="alert"` `aria-live="assertive"` |
| Navigation | `<nav>` `aria-label="Main navigation"` |
| Sidebar | `<aside>` |
| Main content | `<main>` |
| Dialogs | `role="dialog"` `aria-modal="true"` `aria-labelledby` |

### Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Move to next focusable element |
| Shift+Tab | Move to previous |
| Enter/Space | Activate button, toggle, link |
| Escape | Close modal, drawer, dropdown, menu |
| Arrow Up/Down | Navigate list, dropdown, table rows |
| Arrow Left/Right | Navigate tabs, calendar days |
| N | Open "New" quick-action menu (when not in input) |
| / | Focus search/filter input |
| Ctrl+Enter | Submit form (comment, reply) |
| 1-5 | Switch notification category tabs |

---

## 15. Layout System — Page Rhythm

### Standardized Page Layout

Every content page follows this vertical rhythm. All measurements are in spacing tokens:

```
┌──────────────────────────────────────────────────┐
│                                                 │  ← space-12 (48px) from top of <main>
│  [Breadcrumbs]                                  │  ← space-4 below breadcrumbs
│                                                 │
│  [Page Title]         [New Button]              │  ← space-1 below title
│  [Page Description — optional]                  │  ← space-1 below description
│                                                 │
│  ┌──────────────────────────────────────────────┐│
│  │  KPI Card 1  │  KPI Card 2  │  ...           ││  ← space-6 below KPI row
│  └──────────────────────────────────────────────┘│
│                                                 │
│  Filter Bar [Search] [Dropdowns] [View Toggle]  │  ← space-4 below filter bar
│                                                 │
│  ┌──────────────────────────────────────────────┐│
│  │                                               ││
│  │             Content Area                      ││  ← Flexible, fills remaining height
│  │  (Table / Grid / Board / Calendar / etc.)     ││
│  │                                               ││
│  └──────────────────────────────────────────────┘│
│                                                 │
│  [Pagination / Load More]                       │  ← space-6 above footer
│                                                 │
└──────────────────────────────────────────────────┘
                                                 ← space-12 (48px) from bottom of <main>
```

### Page Types

#### 1. List Page (Projects, Tasks, People, Meetings, Announcements, Integrations)

```
[Breadcrumbs]
[Page Title]                     [New Button]
[Page Description]
[KPI Row — 4 cards]
[Filter Bar — Search + Filters + View Toggle]
[Content Area — Table / Grid / List]
[Pagination]
```

#### 2. Detail Page (Task Detail, Project Detail, Meeting Detail, User Profile)

```
[Back button / Breadcrumbs]
[Context Bar — metadata strip: entity name, status, dates, health]
[Content — split into sections or tabs]
  ├── Tab 1 | Tab 2 | Tab 3 | ...
  └── Active tab content (fades between tabs)
```

#### 3. Dashboard Page (Smart Home — role-adaptive)

```
[Welcome / Greeting — personalized, user name + time of day]
[KPI Row — 4 role-specific cards]
[Primary Widget Area — 2-column grid]
  ├── Column 1: Main widget (My Tasks, Project Health)
  └── Column 2: Supporting widget (Schedule, Activity)
[Secondary Widgets — single row, 3-4 cards]
  └── Announcements, Recent Activity, Quick Stats
```

#### 4. Workspace Page (Project Workspace — multi-tab)

```
[Breadcrumbs]
[Context Bar — project name, status, health dots, dates, PM]
[Tab Bar — Overview | Tasks | Timeline | Calendar | Members | Files | Meetings | Reports | Activity | Settings]
[Tab Content — fills below tab bar]
```

#### 5. Analytics Page (Reports, Charts)

```
[Breadcrumbs]
[Page Title]                     [Export Button]
[Page Description]
[KPI Row — 4 metric cards]
[Chart Grid — 2×2 or custom arrangement]
[Optional: Data table below charts]
```

#### 6. Settings Page (Multi-section)

```
[Breadcrumbs]
[Page Title]
[Settings Navigation — vertical sidebar or horizontal tabs]
[Settings Content — form sections with dividers]
```

#### 7. Auth Page (Login, Register, Forgot/Reset Password)

```
[Centered card layout]
  ├── App logo/name (top)
  ├── Title + description
  ├── Form fields
  └── Action button + links
[No sidebar. No navigation. No header.]
```

### Responsive Breakpoints

| Name | Width | Sidebar | Layout Adjustments |
|------|-------|---------|--------------------|
| Desktop | ≥1024px | Full (240px) | Standard layout |
| Tablet | 768-1023px | Collapsed (64px icons) | KPI: 2×2, hide optional table columns |
| Mobile | <768px | Hidden (bottom nav) | Stacked cards, full-width, bottom sheets |

### Page Width Constraints

| Layout | Max Content Width | Notes |
|--------|------------------|-------|
| List pages | 1200px | Centered with auto margins |
| Detail pages | 960px | Content column |
| Dashboard | 1400px | Wider for multi-column widgets |
| Analytics | 1400px | Charts need space |
| Auth pages | 400px | Centered card |
| Settings | 800px | Content column |

---

## 16. Component Inventory

### Core UI Components

| # | Component | Variants | States | Keyboard | Responsive |
|---|-----------|----------|--------|----------|------------|
| 1 | Button | Primary, Secondary, Danger, Ghost, Link | default, hover, active, disabled, loading, focus | Enter/Space | Full-width on mobile |
| 2 | IconButton | sm, md, lg | default, hover, active, disabled | Enter/Space | 44px touch min |
| 3 | ButtonGroup | horizontal, vertical | active, inactive | Arrow keys | Stack on mobile |
| 4 | Input | Default, Search, Error, Disabled, Read-only | default, focus, error, disabled | Tab, Enter | Full-width |
| 5 | InputGroup | Left icon, Right icon, Both | default, focus, error | Tab, Enter | Full-width |
| 6 | Textarea | Default, Error | default, focus, error, disabled | Tab | Full-width |
| 7 | Select | Default, Searchable, Multi, Error | default, focus, open, error, disabled | Arrow, Enter | Native on mobile |
| 8 | DatePicker | Single, Range, Time | default, focus, open, error | Arrow, Enter | Bottom sheet mobile |
| 9 | Checkbox | Default, Indeterminate | unchecked, checked, indeterminate, disabled, focus | Space | — |
| 10 | Radio | Default, Card | unchecked, checked, disabled, focus | Arrow keys | — |
| 11 | Toggle | Default | on, off, disabled | Space | — |
| 12 | Modal | Default, Fullscreen | open, closing | Escape, focus trap | Fullscreen mobile |
| 13 | Drawer | Right (480px), Full | open, closing | Escape, focus trap | Fullscreen slide-up mobile |
| 14 | Table | Default, Sortable, Selectable, Expandable | sorted, filtered, selected, loading, empty | Arrow rows, Enter | Stacked cards mobile |
| 15 | Card | Default, Interactive, Selected | default, hover, selected, disabled | Enter | Full-width |
| 16 | Badge | Default, Success, Warning, Danger, Info, Outline | — | — | — |
| 17 | Avatar | Image, Initials | default, online, offline, busy | — | sm(24)/md(32)/lg(40)/xl(48) |
| 18 | AvatarGroup | Stacked, Overflow | hover (show tooltip) | — | Collapse count |
| 19 | ProgressBar | Determinate, Indeterminate, Segmented | success, warning, danger | — | Full-width |
| 20 | Tabs | Underline, Pill, Vertical | active, hover, with badge, disabled | Arrow, Home/End, Tab | Scroll mobile |
| 21 | Breadcrumbs | Default, Truncated | clickable, current (non-clickable) | Tab, Enter | Last 2 levels mobile |
| 22 | DropdownMenu | Items, Dividers, Icons, Submenu, Checkbox items | open, closed, item hover, item active | Arrow, Enter, Escape | — |
| 23 | Pagination | Full, Compact, LoadMore | active, disabled | Arrow, Enter | Load more mobile |
| 24 | Toast | Success, Error, Warning, Info | enter, exit, stacking | — | Full-width mobile |
| 25 | Tooltip | Top, Bottom, Left, Right | show, hide (delay 300ms/100ms) | Focus + blur | — |
| 26 | Spinner | sm(16), md(24), lg(32) | primary, white | — | — |
| 27 | Skeleton | Text, Avatar, Card, TableRow, ChartBar, KPICard | pulse animation | — | Responsive dims |
| 28 | EmptyState | Default, Search | icon, title, description, action | Tab through action | Centered |
| 29 | ErrorState | Page, Section, Inline | icon, message, retry | Tab through actions | Centered |
| 30 | ConfirmDialog | Destructive, Non-destructive | open, confirming | Enter confirm, Escape cancel | Fullscreen mobile |

### Data Display Components

| # | Component | Variants | States | Keyboard | Notes |
|---|-----------|----------|--------|----------|-------|
| 31 | KpiCard | Default, Trend, Clickable | default, hover | Tab | 4→2→2 columns responsive |
| 32 | StatCard | Default, Colored | default | Tab | Full-width mobile |
| 33 | HealthDots | 5-dot scale | 5 green → 1 red | — | Tooltip on hover |
| 34 | TagInput | Default, Error | default, focus, tag-selected | Backspace remove, Enter add | Full-width |
| 35 | FileUpload | Default, DragZone | default, drag-over, uploading, uploaded, error | Tab, Enter | Full-width |
| 36 | MentionInput | Default, Error | default, focus, mention-list-open | Arrow select, Enter confirm | Full-width |
| 37 | RichTextEditor | Default, Simplified | default, focus | Tab toolbar | Simplified mobile toolbar |
| 38 | Timeline | Activity, Gantt | grouped by date | Arrow, Enter | Horizontal scroll gantt |
| 39 | Calendar | Month, Week, Day, Agenda | event dots, click entity | Arrow days, Enter | Swipe mobile |
| 40 | Chart | Bar, Line, Donut, Stacked | tooltip, legend, loading | Tab data points | Simplified mobile |
| 41 | KanbanBoard | Default, Compact | columns, cards, drag | Arrow cards, Enter | Single column mobile |
| 42 | TreeView | Default, Checkbox | expanded, collapsed, selected | Arrow, Enter | — |
| 43 | DataList | Default, Condensed | item hover, selected | Arrow, Enter | — |
| 44 | DescriptionList | Horizontal, Vertical | — | — | Stack mobile |
| 45 | MetricsGrid | 2-col, 3-col, 4-col | — | — | 2-col mobile |

### Navigation & Layout Components

| # | Component | Variants | States | Keyboard | Notes |
|---|-----------|----------|--------|----------|-------|
| 46 | AppShell | Default | — | Skip to content | Responsive sidebar |
| 47 | Sidebar | Expanded, Collapsed | active, hover, badge-count | Arrow, Tab | 240px/64px/bottom-nav |
| 48 | Header | Default | — | Tab | Breadcrumbs + actions |
| 49 | ContextBar | Project, Task, Meeting | — | — | Entity metadata strip |
| 50 | PageLayout | List, Detail, Dashboard, Workspace, Settings, Auth | — | — | Standardized rhythm |
| 51 | GridLayout | 12-col, 8-col, 4-col | — | — | Responsive columns |
| 52 | SplitPanel | Left/Right, Top/Bottom | resizable | — | Detail drawer alt |
| 53 | BottomNav | 5 items | active, badge-count | Tab | Mobile only |
| 54 | SectionHeader | With action, With count | — | — | Collapsible variant |

### Filter & Search Components

| # | Component | Variants | States | Keyboard | Notes |
|---|-----------|----------|--------|----------|-------|
| 55 | FilterBar | Default | collapsed (mobile) | Tab | Search + dropdowns |
| 56 | SearchInput | Default, Global | default, focus, has-results | / shortcut | Debounced 300ms |
| 57 | FilterChip | Default, Removable | default, active | Backspace remove | Active state primary-soft |
| 58 | ViewToggle | Grid, List, Board, Calendar | active | Arrow keys | Hide calendar mobile |
| 59 | SortDropdown | Asc, Desc | selected | Arrow, Enter | — |
| 60 | DateRangeFilter | Presets, Custom | selected | Tab, Enter | — |

### Feedback & Overlay Components

| # | Component | Variants | States | Keyboard | Notes |
|---|-----------|----------|--------|----------|-------|
| 61 | ToastContainer | Stacked top-right | max 3 visible | — | Full-width mobile |
| 62 | InlineError | Field, Banner | show, hide | Tab to first error | Red border + message |
| 63 | FormSummary | Error count, success banner | — | Focus first error | Above form |
| 64 | AlertBanner | Info, Success, Warning, Error | dismissible | Tab, Enter dismiss | Persistent until dismissed |
| 65 | LoadingOverlay | Full, Section | — | — | Only for legacy operations |
| 66 | Backdrop | Modal, Drawer | transparent overlay | — | Click dismiss for modal |

### Form Components

| # | Component | Variants | States | Keyboard | Notes |
|---|-----------|----------|--------|----------|-------|
| 67 | FormField | Default, Error | label, help-text, error | Tab | Consistent spacing |
| 68 | FormSection | Default, Collapsible | — | — | Divider + heading |
| 69 | FormActions | Left, Right | — | Tab | Submit + Cancel |
| 70 | SwitchGroup | Labeled, Unlabeled | — | Space | — |
| 71 | CheckboxGroup | Horizontal, Vertical | — | Tab, Space | — |
| 72 | RadioGroup | Horizontal, Vertical, Card | — | Arrow keys | — |
| 73 | ColorPicker | Default, Preset | — | Tab, Enter | — |
| 74 | Slider | Default, Range, Steps | — | Arrow keys | — |

### Entity-Specific Components

| # | Component | Used In | Notes |
|---|-----------|---------|-------|
| 75 | TaskCard | Kanban, Task List | Title, ID, assignee, priority, due date, status |
| 76 | TaskRow | Task Table | All task columns |
| 77 | TaskStatusSelect | Task forms, inline edit | Dropdown of statuses with color |
| 78 | PriorityBadge | Task, Kanban | Critical/High/Medium/Low with color |
| 79 | DueDateBadge | Task, Milestone | Relative + absolute date, overdue in red |
| 80 | AssigneeSelect | Task form, filter | User avatar + name dropdown |
| 81 | ProjectCard | Project grid | Name, health, progress, PM, dates |
| 82 | ProjectHealthBadge | Project card, context bar | Health dots or single status |
| 83 | MemberList | Project members, People | Avatar list with role labels |
| 84 | MeetingCard | Meeting list | Title, date, organizer, attendees count |
| 85 | AnnouncementCard | Announcement feed | Title, author, date, excerpt, pinned indicator |
| 86 | NotificationItem | Notification feed | Icon, message, time, read/unread dot |
| 87 | ActivityItem | Activity timeline | User avatar, action, target, timestamp |
| 88 | CommentItem | Task detail, Meeting notes | Author, avatar, time, content, reply, edit, delete |
| 89 | AttachmentRow | Task detail, File tab | Name, size, type icon, uploader, date, download |
| 90 | TimeEntry | Task detail, Time tracking | Duration, description, date, user |
| 91 | MilestoneCard | Timeline, Milestones | Name, date, progress, status |
| 92 | IntegrationCard | Integration list | Name, type, status, last sync, configure action |
| 93 | RoleCard | Roles list | Name, user count, permission count, actions |
| 94 | PermissionRow | Permission matrix | Resource, action, role checkboxes |
| 95 | UserRow | People list, User management | Avatar, name, email, role, status, actions |
| 96 | SettingsSection | Settings pages | Title, description, form content, divider |
| 97 | WelcomeHero | Dashboard (new user) | Greeting, role-specific welcome, quick actions |
| 98 | KpiTrend | Dashboard, Analytics | Value, percentage change, up/down arrow |
| 99 | SearchResultItem | Global search | Type icon, title, excerpt, breadcrumb |
| 100 | QuickActionMenu | "New" menu (N key) | Grouped create actions, keyboard shortcuts |

---

*End of Design System Specification v1.0 — Next: Layout System implementation, Component-by-component build order*
