# Folder Structure Guide

## Feature Module Structure

Every feature follows this identical structure:

```
features/[feature]/
├── components/       # UI components specific to this feature
│   ├── [Component].tsx
│   └── index.ts      # Barrel export (optional)
├── hooks/            # Custom hooks for this feature
│   └── use[Feature].ts
├── pages/            # Page components (route targets)
│   └── [Feature]Page.tsx
├── services/         # API service functions
│   └── [feature].ts
└── types/            # TypeScript interfaces (optional)
    └── index.ts
```

## Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| Page component | `[Feature]Page` | `TaskListPage` |
| Detail component | `[Feature]Detail` | `TaskDetailDrawer` |
| Form component | `[Feature]Form` | `TaskFormPage` |
| Service object | `[feature]Service` | `tasksService` |
| Hook | `use[Feature]` | `useProject` |
| Query key | `queryKeys.[feature]` | `queryKeys.tasks` |

## Feature Examples

### Well-Structured Features
- `endpoints/` - Has components, hooks, services
- `resources/` - Has components, hooks, services
- `projects/` - Has components, hooks, layouts, pages, services

### Features Needing Structure
- `dashboard/` - Only has pages (609 lines)
- `roles/` - Only has components and pages (1042 lines)
- `admin/` - Only has pages

## Creating a New Feature

1. Create directory structure:
```bash
mkdir -p src/features/myfeature/{components,hooks,pages,services}
```

2. Create service file:
```typescript
// features/myfeature/services/myfeature.ts
import { api } from "@/services/api";

export const myfeatureService = {
  list: (params) => api.get("/myfeature", { params }).then(r => r.data),
  get: (id) => api.get(`/myfeature/${id}`).then(r => r.data),
  create: (data) => api.post("/myfeature", data).then(r => r.data),
  update: (id, data) => api.put(`/myfeature/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/myfeature/${id}`),
};
```

3. Create hook file:
```typescript
// features/myfeature/hooks/useMyfeature.ts
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/services/queryKeys";
import { myfeatureService } from "../services/myfeature";

export function useMyfeature(id: number) {
  return useQuery({
    queryKey: queryKeys.myfeature.detail(id),
    queryFn: () => myfeatureService.get(id),
  });
}
```

4. Create page:
```typescript
// features/myfeature/pages/MyfeatureListPage.tsx
export default function MyfeatureListPage() {
  return <div>...</div>;
}
```

5. Add route in App.tsx
