# Phase D — Interaction Specification

> **Status:** Complete
> **Pattern:** Standardized interactions for every component and gesture

---

## 1. Universal Interaction Rules

These rules apply to every interactive element in the application unless explicitly overridden:

```
Cursor:
  Default:    auto
  Text:       text (on inputs, text areas, content)
  Pointer:    pointer (on buttons, links, clickable items, avatars)
  Not-allowed: not-allowed (on disabled elements)
  Move:       move (on drag handles, resizable splitters)
  Grab:       grab (on kanban cards, draggable items)
  Grabbing:   grabbing (during active drag)

Focus:
  All interactive elements: visible focus ring (2px solid primary, 2px offset)
  Skip-to-content: first focusable element on every page
  Tab order: left-to-right, top-to-bottom
  Modals/Drawers: trap focus, Escape to close, restore focus on close
  Page transitions: focus <h1> of new page
  Inline errors: focus first errored field

Selection:
  Single click: select one item (row, card, checkbox)
  Shift+click: range select (table rows)
  Cmd/Ctrl+click: toggle individual items in selection
  Escape: clear current selection

Animation:
  Hover: 150ms ease (color, bg, border transitions)
  Focus: 150ms ease (ring appearance)
  Click/Active: 100ms ease (scale 0.98 on buttons)
  Slide: 250ms ease (drawers, panels)
  Fade: 200ms ease (modals, toasts)
  All: respects prefers-reduced-motion: reduce → 0ms
```

---

## 2. Component-Level Interactions

### Button

```
State       | Visual                          | Behavior
------------|---------------------------------|----------------------------
Default     | bg: primary, text: white        | Pointer cursor
Hover       | bg: primary-hover               | 150ms color transition
Active      | bg: primary-active, scale: 0.98 | 100ms scale
Disabled    | opacity: 0.5, cursor: not-allowed| No click events
Loading     | spinner icon replaces label      | No click events, 16px spinner
Focus       | 2px primary ring, 2px offset    | Tab key arrival
```

### Icon Button

```
State       | Visual                          | Behavior
------------|---------------------------------|----------------------------
Default     | icon color: text-secondary      | 44×44px touch target
Hover       | bg: tertiary, icon: text        | 
Active      | bg: border                       |
```

### Input & Textarea

```
State       | Visual                          | Behavior
------------|---------------------------------|----------------------------
Default     | border: border, bg: surface     | 
Focus       | border: primary, 2px ring primary| Cursor: text
Error       | border: danger, danger ring     | Error message below
Disabled    | bg: bg-tertiary, text: text-tertiary| No interaction
Read-only   | bg: bg-secondary                 | Selectable, not editable
Filled      | Label floats up (if placeholder) |
```

### Select

```
State       | Visual                          | Behavior
------------|---------------------------------|----------------------------
Closed      | Same as input                   | Click to open
Open        | Options list with shadow-sm     | Arrow keys navigate, Enter selects
Searchable  | Type to filter options           | Debounced 200ms
Error       | danger border + ring             |
Native      | On mobile: uses native <select>  |
```

### Checkbox & Radio

```
State       | Visual                          | Behavior
------------|---------------------------------|----------------------------
Unchecked   | Empty box/circle, border: border | Space to toggle
Checked     | Primary fill, white check/dot   | Space to toggle
Indeterminate| Primary fill, minus icon        | Space → checked
Disabled    | opacity: 0.4                     | No interaction
Focus       | 2px primary ring, 2px offset     |
```

### Toggle

```
State       | Visual                          | Behavior
------------|---------------------------------|----------------------------
Off         | bg: border, circle: white       | Space or click to toggle
On          | bg: primary, circle: white       | Space or click to toggle
Disabled    | opacity: 0.4                     | No interaction
Focus       | 2px primary ring                |
Animation   | Circle slides 200ms ease         |
```

### Table

```
Interaction | Behavior
------------|-----------------------------------------------
Row hover   | bg: surface-hover, 150ms transition
Row click   | Opens entity detail drawer (or navigates)
Header click| Sort column asc → desc → none (cycle)
Multi-select| Checkbox column, Shift+click for range
Column resize| Drag column border (if enabled)
Scroll      | Sticky header, optional sticky first column
Empty       | Empty state centered in table area
Loading     | Skeleton rows (5) with pulse animation
```

### Card

```
Interaction | Behavior
------------|-----------------------------------------------
Hover       | shadow-xs transition, slight translateY(-1px)
Click       | Navigate to entity detail (drawer or page)
Selection   | border: primary, bg: primary-soft (table view)
```

### Kanban Board

```
Interaction | Behavior
------------|-----------------------------------------------
Card hover  | shadow-sm, slight lift
Card click  | Opens task detail drawer
Drag start  | Card lifts (shadow-lg, scale 1.02), cursor: grabbing
Drag over   | Column highlights drop zone (bg: primary-soft)
Drop        | Optimistic status update, 200ms spring animation
Column collapse| Click column header to collapse/expand
```

### Modal

```
Interaction | Behavior
------------|-----------------------------------------------
Open        | Scale up (0.95→1) + fade in, 200ms
Close       | Scale down (1→0.95) + fade out, 150ms
Backdrop    | rgba(0,0,0,0.4), click to close (unless confirm)
Escape      | Close (cancel)
Tab cycle   | Focus trap: Tab cycles within modal
Restore     | Focus returns to trigger element on close
```

### Drawer

```
Interaction | Behavior
------------|-----------------------------------------------
Open        | Slide from right (250ms, ease)
Close       | Slide to right (200ms, ease)
Width       | 480px (desktop), full (tablet), fullscreen (mobile)
Backdrop    | rgba(0,0,0,0.3), click to close
Escape      | Close
Tab cycle   | Focus trap when open
Restore     | Focus returns to trigger element on close
History     | Uses replaceState (not pushState) — back button closes drawer
```

### Tooltip

```
Interaction | Behavior
------------|-----------------------------------------------
Show delay  | 300ms (hover) / 0ms (focus)
Hide delay  | 100ms
Trigger     | Hover (mouse) / Focus (keyboard)
Content     | Text only, max 200px width, line-height tight
Position    | Top by default, auto-flips to bottom/left/right if out of bounds
Mobile      | Disabled on touch devices (use tap instead)
```

### Toast

```
Interaction | Behavior
------------|-----------------------------------------------
Show        | Slide from top-right, 200ms
Auto-dismiss| Success 3s, Error/Warning 5s, Info 4s
Manual      | Click X button to dismiss
Action      | Some toasts have [Undo] [Retry] [Refresh] actions
Stack       | Max 3 visible, new toasts stack above
Mobile      | Full width, bottom position
Pause       | Hover pauses auto-dismiss timer
```

### Dropdown Menu

```
Interaction | Behavior
------------|-----------------------------------------------
Open        | Click trigger or hover (context menus)
Close       | Click outside, Escape, or select item
Navigation  | Arrow keys, Enter to select
Item hover  | bg: tertiary
Divider     | 1px border-light, no interaction
Icon        | 16px, text-secondary color
Submenu     | Right arrow indicator, hover or click to open
```

### Pagination

```
Interaction | Behavior
------------|-----------------------------------------------
Page click  | Navigate to page, table refreshes
Prev/Next   | Navigate, disabled at boundaries
First/Last  | Navigate to extremes (if many pages)
Compact     | Show: current page + 2 neighbors + first + last + "..."
Mobile      | "Load more" button instead of page numbers
```

### Breadcrumbs

```
Interaction | Behavior
------------|-----------------------------------------------
Click       | Navigate to that level
Hover       | text: primary
Current     | text-secondary, not clickable
Overflow    | "..." shows hidden levels in dropdown on click
Mobile      | Show last 2 levels only
```

### Tabs

```
Interaction | Behavior
------------|-----------------------------------------------
Click       | Switch tab (instant, pre-fetched content)
Hover       | No hover state on inactive tabs (text color only)
Active      | Underline/pill indicator, primary text
Badge       | Count badge on tab label (e.g., "Tasks (12)")
Arrow keys  | Left/Right to navigate between tabs (when focused on tab bar)
Home/End    | Jump to first/last tab
Mobile      | Horizontal scroll with overflow fade indicators
```

---

## 3. Page Transitions

### Route Navigation

```
Transition  | Fade (150ms)
Skeleton    | Render immediately on route change (no spinner)
Content     | Real content fades in (200ms) when data loads
Error       | Error state replaces skeleton (no fade)
```

### Tab Switching (within detail pages)

```
Content     | Instant switch (pre-fetched adjacent tabs)
Indicator   | Tab underline slides to active tab (200ms)
Data        | If not pre-fetched: show inline skeleton for tab content
```

### Drawer Open/Close

```
Open        | Page content dims slightly, drawer slides in (250ms)
Close       | Drawer slides out (200ms), page content undims
Data        | Drawer content skeleton renders immediately, real data loads
```

---

## 4. Inline Editing

### Editable Fields (Table cells, Kanban cards)

```
Trigger     | Click on field value OR click edit icon
Mode        | Field transforms to input/select in-place
Save        | Enter (text) / Blur (select, toggle) / Escape cancels
Feedback    | Optimistic update immediately
Error       | Field reverts to previous value, toast: "Failed to update"
```

### Inline Status Change (Table dropdown, Board drag)

```
Trigger     | Click status badge → dropdown appears
Select      | Dropdown with available statuses for workflow
Save        | Click option → optimistic update
Error       | Revert to previous status, toast error
Kanban drag | Drop on column → same optimistic + revert pattern
```

### Rich Text Editing (Comments, Notes)

```
Trigger     | Click "Add comment" / "Edit notes"
Mode        | Rich text editor appears (not inline, dedicated editing area)
Toolbar     | Bold, italic, heading, list, link, @mention — on focus
Save        | Ctrl+Enter / Cmd+Enter to submit
Cancel      | Escape blurs, content preserved as draft (per-session localStorage)
```

---

## 5. Drag & Drop

### Kanban Cards

```
Source      | Card in column
Handle      | Entire card (no separate handle)
Drop zones  | Columns (Todo, In Progress, In Review, Done)
Visual      | Card lifts (shadow-lg, scale 1.02), column highlights
Behavior    | Optimistic update, POST to update status
Error       | Card returns to original column, toast error
Touch       | Long press to start drag on mobile
```

### Table Column Reorder (if implemented)

```
Trigger     | Drag column header
Visual      | Column lifts, ghost column shows insertion point
Drop        | Reorder triggers table refresh
```

### File Upload Drag Zone

```
Trigger     | Drag file over zone
Visual      | Zone border turns primary, bg: primary-soft, dashed border
Drop        | File uploads immediately with progress
Multiple    | Stack multiple files in upload queue
Types       | Validate file type + size on drop, show error for invalid
```

---

## 6. Multi-Select & Bulk Edit

### Selection Model

```
Single      | Click row/card
Range       | Click row, Shift+click target row
Toggle      | Cmd/Ctrl+click toggles individual in selection
Select all  | Header checkbox selects/deselects all visible rows
Clear       | Escape clears selection
```

### Bulk Action Bar

```
Appearance  | Slides up from bottom (200ms), bg: surface, shadow-sticky
Content     | "{n} selected" + action buttons
Actions     | Contextual: [Assign] [Change Status] [Delete] [Export Selected]
Flow        | Click action → confirm dialog (for destructive) → execute → toast
Deselect    | Click "Clear selection" or Escape
```

---

## 7. Keyboard Shortcuts

### Global Shortcuts (all pages)

```
/           Focus search input
N           Open "New" quick-action menu
?           Show keyboard shortcuts help (modal overlay)
Escape      Close drawer/modal/dropdown/menu
```

### Navigation Shortcuts

```
g then d    Go to Dashboard
g then p    Go to Projects
g then t    Go to Tasks
g then c    Go to Calendar
g then a    Go to Analytics
b           Go back (browser history back)
```

### Task List Shortcuts

```
↑ ↓         Navigate rows
Enter       Open selected task (drawer)
Space       Toggle select on current row
Ctrl+a      Select all visible
Ctrl+Shift+a Deselect all
```

### Task Detail Shortcuts

```
Ctrl+Enter  Submit comment
s           Focus status dropdown
a           Open assignee change
p           Open priority change
e           Toggle edit mode
.           Mark as complete (toggle)
j/k         Next/previous task (when navigating from list)
```

### Modal/Drawer Shortcuts

```
Escape      Close
Tab         Cycle through focusable elements
Enter       Confirm (primary action)
```

---

## 8. Confirmation Dialogs

### Trigger Rules

```
Show confirm dialog when:
  - Deleting any entity
  - Archiving a project
  - Removing a team member
  - Leaving a project
  - Discarding unsaved form changes
  - Bulk delete operations
  - Deactivating a user account

No confirm dialog when:
  - Changing task status
  - Adding a comment
  - Saving form changes
  - Toggling notifications on/off
  - Marking notifications as read
```

### Dialog Format

```
Delete Entity:
  Title: "Delete \"{Entity Name}\"?"
  Body: "This will permanently delete the {entity type} [and {n} related items]. This action cannot be undone."
  Buttons: [Cancel] [Delete] (danger)

Archive Project:
  Title: "Archive \"{Project Name}\"?"
  Body: "The project and all its tasks will be archived. Archived projects can be restored later."
  Buttons: [Cancel] [Archive] (primary)

Discard Changes:
  Title: "Discard changes?"
  Body: "You have unsaved changes that will be lost."
  Buttons: [Keep Editing] [Discard] (primary)
```

---

## 9. Toast Notifications

### Trigger Matrix

```
Action              | Toast Type | Message                     | Duration | Action
--------------------|------------|------------------------------|----------|---------
Task created        | Success    | "Task created"               | 3s       | [Undo]
Task updated        | Success    | "Task updated"               | 3s       | —
Task deleted        | Success    | "Task deleted"               | 5s       | [Undo]
Task status changed | Success    | "Task moved to {status}"     | 3s       | —
Comment added       | Success    | "Comment added"              | 3s       | [Edit]
Comment deleted     | Success    | "Comment deleted"            | 3s       | [Undo]
Project created     | Success    | "Project created"            | 3s       | [View]
Project archived    | Success    | "Project archived"           | 3s       | [Undo]
Meeting created     | Success    | "Meeting scheduled"          | 3s       | [View]
Announcement posted | Success    | "Announcement published"     | 3s       | [View]
User created        | Success    | "User created"               | 3s       | —
Role updated        | Success    | "Permissions updated"        | 3s       | —
Integration synced  | Success    | "Sync complete"              | 3s       | [View Log]
Bulk action done    | Success    | "{n} tasks updated"          | 3s       | [Undo]
API error           | Error      | "Something went wrong"       | 5s       | [Retry]
Network error       | Error      | "Connection lost"            | 5s       | [Retry]
Validation error    | Error      | "{field}: {message}"         | 5s       | —
Rate limited        | Warning    | "Too many requests"          | 5s       | —
Session expired     | Warning    | "Session expired"            | 5s       | [Login]
```

### Undo Patterns

```
Undo window: 5 seconds
Undo action: Reverse the mutation (delete → restore, create → delete, etc.)
UI feedback: Toast shows [Undo] button, clicking it executes reverse action
             Progress bar on toast shows remaining undo window
```

---

## 10. Right-Click Context Menus

### When Right-Click Has Behavior

```
Table rows:
  [Edit] [Duplicate] [Delete] [Copy Link] [Open in New Tab]

Kanban cards:
  [Edit] [Assign To] [Change Status] [Delete] [Copy ID]

Sidebar items:
  [Open in New Tab] [Copy Link] (browser default for most)

Text inputs:
  Browser default (cut, copy, paste)
```

### Context Menu Behavior

```
Open:      Right-click on element
Position:  Cursor position, auto-flips if near viewport edge
Close:     Click outside, Escape, or select item
Item hover: bg: tertiary
Divider:   1px border-light
```

---

## 11. Mobile-Specific Interactions

### Touch Gestures

```
Swipe left on task    → Reveal action: "Complete" (green button)
Swipe right on notif  → "Mark read" (primary button)
Pull down on list     → Refresh (with pull indicator)
Tap top of screen     → Scroll to top
Long press on row     → Enter selection/multi-select mode
Long press on card    → Begin drag (Kanban)
Two-finger pinch      → Calendar zoom (month/week/day)
```

### Bottom Sheet

```
Trigger     Tap "Filter" button or any expandable action bar
Open        Slides up from bottom, 300ms ease
Height      60% by default, draggable to full
Close       Swipe down, tap backdrop, or Escape
Content     Filters, action lists, date pickers
```

### Bottom Nav (mobile only)

```
Tap         Navigate to section
Active      Primary color, icon filled
Badge       Unread count dot on Notifications
Long press  Show quick actions (if applicable)
```

---

## 12. Auto-Save & Drafts

### Form Auto-Save

```
Trigger     Form field change (debounced 2s after last change)
Scope       Long forms only (task create, project create, meeting create)
Storage     localStorage keyed by route + entity type
Restore     On navigate back: "You have a saved draft. [Restore] [Discard]"
Expire      Drafts expire after 24 hours
```

### Comment Drafts

```
Trigger     User types in comment box
Save        Debounced 1s, stored in localStorage per entity
Restore     On reopen: "Draft restored" (subtle indicator)
Clear       On successful submit
```

---

## 13. Optimistic Updates

### When to Use

```
✅ Task status change (drag to Kanban column)
✅ Task completion toggle
✅ Comment submission
✅ Notification mark read
✅ Toggle switch changes (settings)
✅ Add/remove tags
✅ Follow/unfollow

❌ Entity creation (need server-generated ID)
❌ Entity deletion (need server confirmation for rollback)
❌ File upload (progress is meaningful)
❌ Payment/subscription actions
❌ Permission changes
```

### Optimistic Update Pattern

```
1. Apply change to local state immediately
2. Send API request
3a. Success → confirm state (no visual change)
3b. Failure → revert to previous state + toast error
4. Timeout (10s) → revert + toast "Request timed out"
```

---

*End of Phase D — Standardized Interaction Specification Complete*
