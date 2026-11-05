# Component Guide

## UI Primitives (components/ui/)

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `Button` | Action button | `variant`, `size`, `loading` |
| `Input` | Text input | `label`, `error`, `helperText` |
| `Textarea` | Multi-line input | `label`, `error`, `helperText` |
| `Select` | Dropdown select | `label`, `options`, `value` |
| `Badge` | Status indicator | `variant`, `size`, `dot` |
| `Card` | Container | `variant`, `onClick` |
| `Avatar` | User avatar | `name`, `size`, `src` |
| `Skeleton` | Loading placeholder | `variant`, `className` |
| `Modal` | Dialog overlay | `open`, `onClose`, `title` |
| `Drawer` | Side panel | `open`, `onClose`, `title` |
| `Pagination` | Page navigation | `page`, `totalPages`, `onPageChange` |
| `FilterBar` | Search & filters | `search`, `filters`, `activeChips` |
| `SearchInput` | Search field | `value`, `onChange`, `placeholder` |
| `Toggle` | Switch control | `enabled`, `onToggle` |
| `Table` | Data table | `columns`, `data`, `loading` |

## Shared Components (components/shared/)

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `StatCard` | Metric display | `icon`, `label`, `value` |
| `KpiBlock` | KPI metric | `label`, `value`, `sub`, `color` |
| `ConfirmDialog` | Confirmation | `open`, `title`, `message`, `onConfirm` |
| `EnterpriseEmptyState` | Empty state | `icon`, `title`, `description`, `action` |
| `AttachmentsSection` | File attachments | `modelType`, `modelId` |
| `ErrorBoundary` | Error fallback | `children` |

## Form Components

| Component | Purpose |
|-----------|---------|
| `FormSection` | Group related fields |
| `FormActions` | Submit/cancel buttons |

## Drawer Components

| Component | Purpose |
|-----------|---------|
| `DrawerHeader` | Title + close button |
| `DrawerBody` | Scrollable content |
| `DrawerFooter` | Action buttons |

## Preview Components (components/previews/)

| Component | File Type |
|-----------|-----------|
| `ImagePreview` | Images |
| `MediaPreview` | Video/Audio |
| `DocumentPreview` | PDF, Office |
| `FigmaPreview` | Figma files |
| `GitHubPreview` | GitHub links |
| `UrlPreview` | Web pages |
| `FallbackPreview` | Unknown types |

## Usage Examples

```tsx
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/shared/StatCard";

// Button variants
<Button variant="primary" size="sm">Save</Button>
<Button variant="ghost" loading={isSaving}>Cancel</Button>

// Badge with status
<Badge variant="success" dot>Active</Badge>
<Badge variant="danger">Urgent</Badge>

// Stat card
<StatCard icon={Users} label="Members" value="12" />
```
