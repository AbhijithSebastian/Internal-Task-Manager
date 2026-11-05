# React Query Guide

## Query Keys

All query keys are centralized in `services/queryKeys.ts`:

```typescript
import { queryKeys } from "@/services/queryKeys";

// Use centralized keys everywhere
useQuery({ queryKey: queryKeys.projects.detail(id) });
useQuery({ queryKey: queryKeys.tasks.list(params) });
```

### Key Structure
```typescript
queryKeys = {
  projects: {
    all: ["projects"],
    list: (params) => ["projects", params],
    detail: (id) => ["project", id],
    // ...
  },
  tasks: { ... },
  // ...
}
```

## Cache Strategy

### Global Defaults (main.tsx)
- `staleTime: 30_000` (30 seconds)
- `retry: 1`
- `refetchOnWindowFocus: false`

### Feature-Specific Overrides
```typescript
useQuery({
  queryKey: queryKeys.admin.settings,
  queryFn: fetchSettings,
  staleTime: 5 * 60 * 1000, // 5 minutes for settings
});
```

## Invalidation Helpers

```typescript
import { invalidateProject, invalidateTask } from "@/services/queryKeys";

// Invalidate all project-related queries
invalidateProject(queryClient, projectId);

// Invalidate all task-related queries
invalidateTask(queryClient, taskId);
```

## Common Patterns

### List Query
```typescript
const { data, isLoading } = useQuery({
  queryKey: queryKeys.tasks.list({ status, page }),
  queryFn: () => tasksService.list({ status, page }),
});
```

### Detail Query
```typescript
const { data: project, isLoading } = useQuery({
  queryKey: queryKeys.projects.detail(id),
  queryFn: () => projectService.getProject(id),
  enabled: !!id,
});
```

### Mutation
```typescript
const queryClient = useQueryClient();

const createMutation = useMutation({
  mutationFn: (data) => tasksService.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
  },
});
```

### Optimistic Update
```typescript
const updateMutation = useMutation({
  mutationFn: (data) => tasksService.update(id, data),
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: queryKeys.tasks.detail(id) });
    const previous = queryClient.getQueryData(queryKeys.tasks.detail(id));
    queryClient.setQueryData(queryKeys.tasks.detail(id), newData);
    return { previous };
  },
  onError: (err, newData, context) => {
    queryClient.setQueryData(queryKeys.tasks.detail(id), context.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(id) });
  },
});
```

## Best Practices

1. **Always use centralized query keys** - Never use raw string arrays
2. **Use invalidation helpers** - `invalidateProject()`, `invalidateTask()`
3. **Set appropriate staleTime** - Short for volatile data, long for stable data
4. **Use `enabled` for dependent queries** - `enabled: !!id`
5. **Handle loading/error states** - Always check `isLoading` and `error`
