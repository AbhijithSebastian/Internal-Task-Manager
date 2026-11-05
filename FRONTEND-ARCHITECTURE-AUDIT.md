# Frontend Architecture Audit

**Date:** 2026-07-08
**Scope:** All 95 source files across 41 directories
**Analyzed:** 20 key files (6,809 lines), 8 detail drawers, 6 forms, 7 list pages, 12 UI components, 3 shared components

---

## 1. Duplicate Component Report

### 1.1 Detail Drawers (8 implementations)

| File | Lines | Loading | Error | Sections | Actions |
|---|---|---|---|---|---|
| TaskDetailDrawer | 1,092 | Custom skeletons | Centered icon+text | Tabs (6) | 9 mutations |
| UserDetailDrawer | 539 | Avatar + text skeleton | Centered icon+text | 6 sections | 3 mutations |
| MeetingDetailDrawer | 142 | 3 rect skeletons | Plain text | 4 sections | 1 mutation |
| AnnouncementDetailDrawer | 231 | 3 rect skeletons | Centered icon+text | 4 sections | 3 mutations |
| RoleDetailDrawer | 204 | 4 rect skeletons | Centered icon+text | 4 sections | 0 mutations |
| ProjectDetailDrawer | ~120 | 4 rect skeletons | Centered icon+text | 3 sections | 0 mutations |
| EndpointDetailDrawer | ~200 | 4 rect skeletons | Plain text | 9 tabs | Callbacks |
| ResourceDetailDrawer | ~180 | 4 rect skeletons | Plain text | 4 tabs | Callbacks |

**Duplicated patterns:**

- **Error state:** `flex flex-col items-center py-12 text-center > icon + p.text-secondary` duplicated in 5/8 drawers
- **Section label:** `text-xs font-{medium|semibold} uppercase tracking-wide text-tertiary` duplicated in 7/8
- **Footer metadata:** `pt-3 border-t border-subtle space-y-1 text-xs text-tertiary` duplicated in 4/8
- **Loading skeleton:** Custom `Skeleton` configuration duplicated uniquely in all 8
- **Props interface:** `{ xxxId: number|null, onClose: () => void }` duplicated in 6/8 (Meeting adds redundant `open`)

### 1.2 Form Pages (6 implementations)

| File | Lines | Type | Validation | Loading Button | Cancel Variant |
|---|---|---|---|---|---|
| TaskFormPage | 295 | Full-page | None (banner) | `loading` prop | `ghost` |
| MeetingFormPage | 239 | Full-page | Per-field errors | `loading` prop | `secondary` |
| AnnouncementFormPage | 250 | Full-page | `validate()` fn | `loading` prop | `ghost` |
| ProjectFormPage | 223 | Full-page | Per-field errors | `loading` prop | `secondary` |
| EndpointForm | 177 | Modal | Guard clause | `disabled` + text | `secondary` |
| ResourceUploadDialog | 209 | Modal | Guard clause | `disabled` + text | `secondary` |

**Duplicated patterns:**

- **Textarea style block:** Identical 9-line Tailwind class sequence in 4 full-page forms
- **Server error flattening:** Identical 7-line loop in Meeting, Announcement, Project forms
- **File upload after create:** Identical 25-line FormData + uploading state in Task, Meeting, Project forms
- **Header/back button:** Identical `flex items-center gap-3` + `ArrowLeft` + `h1` in 4 full-page forms
- **Modal wrapper:** `fixed inset-0 z-modal flex items-center justify-center bg-black/50` in 2 modal forms
- **Loading approach:** Inconsistent — full-page forms use `<Button loading>` (shows spinner), modal forms use `disabled` + "Saving..." text

### 1.3 List Pages (7 implementations)

| File | Lines | Table | FilterBar | KPI Row | Pagination |
|---|---|---|---|---|---|
| TaskListPage | 415 | `<Table>` | Yes | 4 KPIs | Table built-in |
| UsersListPage | 180 | Raw `<table>` | Yes | 3 KPIs | Raw pagination |
| MeetingListPage | 120 | `<Table>` | Yes | 3 KPIs | Table built-in |
| AnnouncementListPage | 338 | Card list | Yes | 5 KPIs | Custom pagination |
| ProjectListPage | 264 | `<Table>` | Yes | 4 KPIs | Table built-in |
| ReportsPage | 399 | None | Custom filters | None | Custom |
| AdminSettingsPage | ~80 | None | None | None | None |

**Duplicated patterns:**

- **Page shell:** `page-container py-6 space-y-5` + header row duplicated in 5 pages
- **KPI card row:** `isLoading ? <SkeletonKpiRow /> : <div.grid>` duplicated in 4 pages
- **Empty state div:** `flex flex-col items-center py-16 text-center bg-surface border border-default rounded-lg` duplicated in 4 pages
- **FilterBar wiring:** `(v) => { setState(v); setPage(1); }` duplicated ~15 times across onChange handlers
- **UsersListPage** uses raw `<table>` (50 lines) instead of shared `<Table>` component
- **AnnouncementListPage** has custom pagination (40 lines) instead of using `<Table>`
- **ReportsPage** has custom filter UI (60 lines) instead of using `<FilterBar>`

### 1.4 Card Menus (2+ implementations)

**ResourceCard** (118 lines) and **EndpointCard** (94 lines) implement near-identical kebab menus:
- `useState<boolean>` for menu visibility
- `useRef` for the menu container DOM node
- `useEffect` with `document.addEventListener("mousedown", handleClickOutside)`
- `opacity-0 group-hover:opacity-100` for reveal on hover
- Same absolute-positioned dropdown with same Tailwind classes

### 1.5 Modal Implementations (5+ variants)

No shared `<Modal>` component exists. Each implementation is unique:

| Component | Portaled? | Wrapper Classes | Close Mechanism |
|---|---|---|---|
| ConfirmDialog | Yes `createPortal` | `fixed inset-0 z-modal flex items-center justify-center bg-black/30` | Escape key + backdrop click |
| EndpointForm | Yes `createPortal` | `fixed inset-0 z-modal flex items-center justify-center bg-black/50` | Backdrop click |
| ResourceUploadDialog | Yes `createPortal` | `fixed inset-0 z-modal flex items-center justify-center bg-black/50` | Backdrop click |
| ReportPreviewModal | Yes `createPortal` | `fixed inset-0 z-modal flex items-start justify-center pt-[5vh] bg-black/50` | Escape + backdrop |
| SearchModal | **No portal** | `fixed inset-0 z-modal flex items-start justify-center pt-[12vh]` | Escape + backdrop |
| SubtaskListPage modal | Yes `createPortal` | `fixed inset-0 z-modal flex items-center justify-center bg-black/30` | Escape |
| RoleListPage modal | **No portal** | `fixed inset-0 z-modal flex items-center justify-center bg-black/30` | Backdrop click |

### 1.6 Attachments Section (2 implementations)

- Shared `AttachmentsSection.tsx` handles file uploads with drag-and-drop
- `ProjectOverviewPage.tsx` (lines 134-252) has a local `ResourcesSection` duplicating the same upload/list/delete pattern with richer file-type icons

### 1.7 Confirm Dialog Usage

| Location | Implementation | Status |
|---|---|---|
| AnnouncementListPage | Shared `ConfirmDialog` | Correct |
| ProjectResourcesPage | Shared `ConfirmDialog` | Correct |
| ProjectEndpointsPage | Shared `ConfirmDialog` | Correct |
| RoleListPage | **Inline manual modal** | Duplicate — should use `ConfirmDialog` |
| AttachmentsSection | `window.confirm()` | Inconsistent — should use `ConfirmDialog` |
| TaskDetailDrawer | `window.confirm()` | Inconsistent — should use `ConfirmDialog` |

### 1.8 Button Loading Patterns

| Approach | Used By | Behavior |
|---|---|---|
| `<Button loading={isPending}>` | All full-page forms + list pages | Shows spinner, disables click |
| `<Button disabled={true}>` + text change | EndpointForm, ResourceUploadDialog | Shows "Saving..." text, no spinner |

---

## 2. Refactoring Opportunities

### 2.1 Extract Shared Drawer Components

| Component | Description | Lines Saved | Consumers |
|---|---|---|---|
| `<DrawerError>` | Centered error state (icon + text) | ~25 | 5 drawers |
| `<DrawerSection>` | Section label + content wrapper | ~80 | 7 drawers |
| `<DrawerFooter>` | Timestamp metadata footer | ~20 | 4 drawers |
| `<DrawerSkeleton>` | Configurable skeleton rows | ~70 | 8 drawers |
| **Total** | | **~195** | |

### 2.2 Extract Shared UI Components

| Component | Description | Lines Saved | Consumers |
|---|---|---|---|
| `<Modal>` | Portaled modal with backdrop, Escape, transitions | ~60 | 5+ modals |
| `<KebabMenu>` | Click-outside dropdown with hover-reveal | ~100 | 4+ cards |
| `<Textarea>` | Textarea with label + error (extend `<Input>`) | ~27 | 4 forms |
| `<PageShell>` | Page container + header + action button | ~60 | 6 pages |
| `<KpiCards>` | KPI stat card grid with loading skeleton | ~60 | 5 pages |
| **Total** | | **~307** | |

### 2.3 Extract Shared Utilities

| Utility | Description | Lines Saved | Consumers |
|---|---|---|---|
| `parseServerErrors` | Flatten `{ field: string[] }` to `{ field: string }` | ~14 | 3 forms |
| `uploadAfterCreate` | File upload loop after entity creation | ~50 | 3 forms |
| `createMutation` helper | Standard mutation factory with invalidation | ~30 | 8+ components |
| Standard icon sizing | `h-3.5 w-3.3 text-tertiary` applied repeatedly | ~20 | All components |
| **Total** | | **~114** | |

### 2.4 Decompose Large Files

| File | Lines | Recommendation |
|---|---|---|
| TaskDetailDrawer.tsx | 1,092 | Extract tab panels into separate components |
| RoleListPage.tsx | 1,042 | Extract 3 mode panels into separate components |
| UserDetailDrawer.tsx | 539 | Extract section components |
| ReportPreviewModal.tsx | 442 | Extract report view sections |
| ReportsPage.tsx | 399 | Use shared FilterBar, extract tab views |

### 2.5 Audit Fixes

| Fix | Description | Lines Saved |
|---|---|---|
| UsersListPage → shared `<Table>` | Replace raw `<table>` with shared component | ~50 |
| AnnouncementListPage → `<Table>` | Replace custom Card list + pagination with `<Table>` | ~40 |
| ReportsPage → `<FilterBar>` | Replace custom filters with shared component | ~60 |
| RoleListPage modal → `<ConfirmDialog>` | Replace inline modal | ~15 |
| `window.confirm()` → `<ConfirmDialog>` | In AttachmentsSection, TaskDetailDrawer | ~2 |
| **Total** | | **~167** |

---

## 3. Components to Extract (New Shared Components)

### Priority: High

| Component | File | Reason |
|---|---|---|
| `<Modal>` | `components/ui/Modal.tsx` | 5+ duplicate portal implementations |
| `<KebabMenu>` / `<DropdownMenu>` | `components/ui/KebabMenu.tsx` | ResourceCard + EndpointCard + 2+ other menus |
| `<Textarea>` | `components/ui/Textarea.tsx` | 4 copy-pasted 9-line style blocks |

### Priority: Medium

| Component | File | Reason |
|---|---|---|
| `<PageShell>` | `components/ui/PageShell.tsx` | 6 duplicate page header layouts |
| `<KpiCards>` | `components/ui/KpiCards.tsx` | 4 duplicate KPI card row patterns |
| `<DrawerError>` | `components/shared/DrawerError.tsx` | 5 duplicate error state blocks |
| `<DrawerSection>` | `components/shared/DrawerSection.tsx` | 7 duplicate section label patterns |
| `<DrawerFooter>` | `components/shared/DrawerFooter.tsx` | 4 duplicate footer patterns |
| `<DrawerSkeleton>` | `components/shared/DrawerSkeleton.tsx` | 8 unique but similar skeleton layouts |

### Priority: Low

| Component | Description |
|---|---|
| `parseServerErrors()` | Extract server error flattening to utils |
| `uploadAfterCreate()` | Extract post-creation file upload |
| `createMutation()` | Mutation factory with invalidation |

---

## 4. Estimated Code Reduction

| Category | Current Lines | After Refactor | Estimated Saved | % Reduction |
|---|---|---|---|---|
| 8 detail drawers | ~2,700 | ~2,505 | ~195 | 7% |
| 6 form components | ~1,393 | ~1,202 | ~191 | 14% |
| 7 list pages | ~1,716 | ~1,499 | ~217 | 13% |
| 2 card components | ~212 | ~112 | ~100 | 47% |
| Other (SearchModal, Sidebar, etc.) | ~788 | ~738 | ~50 | 6% |
| **Total** | **~6,809** | **~6,056** | **~753** | **11%** |

---

## 5. Maintainability Improvements

### 5.1 Architectural

1. **Modal abstraction:** A single `<Modal>` component eliminates 5+ duplicate portal implementations, standardizes Escape/backdrop behavior, and prevents z-index stacking context bugs
2. **Drawer pattern standardization:** Shared skeleton/error/section/footer components reduce the 8 unique drawer implementations to ~3 lines of configuration each
3. **Page shell uniformity:** A `<PageShell>` component forces consistent spacing and layout across all list pages

### 5.2 File Size Reduction

4 files exceed 400 lines and should be decomposed:

| File | Lines | Strategy |
|---|---|---|
| TaskDetailDrawer | 1,092 | Extract 6 tab panels into separate files |
| RoleListPage | 1,042 | Extract 3 mode panels into separate files |
| UserDetailDrawer | 539 | Extract sections into separate components |
| ReportPreviewModal | 442 | Extract report view components |

### 5.3 Consistency Fixes

| Issue | Current | Recommended |
|---|---|---|
| Cancel button variant | `ghost` (2 pages) vs `secondary` (4 pages) | Standardize on `secondary` |
| KPI card padding | `p-4` (1 page) vs `p-3.5` (4 pages) | Standardize on `p-4` |
| Form submit button | `loading` prop (full-page) vs `disabled`+text (modals) | Use `loading` prop everywhere |
| Success feedback | Toast (Endpoint/Resource) vs silent navigation (Task/Meeting/Announcement/Project) | Use toast everywhere |
| Portal strategy | In-tree (SearchModal, RoleListPage, Sidebar) vs portaled (all others) | Portal all overlays |
| Delete confirmation | ConfirmDialog (3 pages) vs `window.confirm()` (2 places) vs inline modal (1 page) vs none (SubtaskListPage) | Use ConfirmDialog everywhere |

### 5.4 Bug Fixes from Audit

- **AnnouncementListPage KPI bug:** `isLoading` guards only the SkeletonKpiRow, not the real KPI grid — both show during loading
- **UsersListPage raw table:** Bypasses the shared `<Table>` component's selection, export, and sorting features
- **SubtaskListPage delete:** No confirmation dialog (only page without delete confirmation)
- **SearchModal:** Renders in-tree `fixed inset-0` without `createPortal` — vulnerable to stacking context issues

---

## Summary

**Total technical debt identified: ~753 lines of duplication across 20 files (11% of analyzed codebase)**

The primary architectural deficiency is the absence of:
1. A shared `<Modal>` component (forces 5+ duplicate portal implementations)
2. Drawer pattern components (forces 8 unique but similar drawer implementations)
3. Form page utilities (forces copy-pasted error/flattening/upload code)

Fixing these three gaps would eliminate the majority of duplication and standardize the overlay architecture across the entire frontend.
