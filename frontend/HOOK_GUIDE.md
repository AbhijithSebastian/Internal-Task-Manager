# Hook Guide

## Shared Hooks (hooks/)

### useClipboard
Copy text to clipboard with feedback state.

```tsx
const { copied, copy } = useClipboard(2000);
copy("text");
// copied === true for 2000ms
```

### usePagination
Page navigation state.

```tsx
const { page, setPage, nextPage, prevPage, totalPages, hasNext, hasPrev } = usePagination({
  initialPage: 1,
  totalItems: 100,
  perPage: 20,
});
```

### usePermissions
Fetch and group permissions.

```tsx
const { permissionGroups, allPermissions, isLoading } = usePermissions();
```

### useDrawer / useEntityDrawer
Drawer state management with URL-based routing.

```tsx
import { openDrawer, closeDrawer } from "@/hooks/useDrawer";

// Open a drawer
openDrawer("task", taskId);

// Close current drawer
closeDrawer();
```

## Feature Hooks

### useProject (features/projects/)
Project data fetching and mutations.

```tsx
const { data: project, isLoading } = useProject(projectId);
const { data: tasks } = useProjectTasks(projectId);
const { data: members } = useProjectMembers(projectId);
```

### useEndpoints (features/endpoints/)
Endpoint CRUD operations.

```tsx
const { data, isLoading } = useEndpoints(projectId);
const createMutation = useCreateEndpoint();
```

### useResources (features/resources/)
Resource management.

```tsx
const { data, isLoading } = useResources(projectId, { per_page: 20 });
```

## React Query Patterns

### Standard Query
```tsx
const { data, isLoading, error } = useQuery({
  queryKey: queryKeys.projects.detail(id),
  queryFn: () => projectService.getProject(id),
});
```

### Mutation with Invalidation
```tsx
const queryClient = useQueryClient();
const mutation = useMutation({
  mutationFn: (data) => projectService.updateProject(id, data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(id) });
  },
});
```

### Optimistic Update
```tsx
const mutation = useMutation({
  mutationFn: updateTodo,
  onMutate: async (newTodo) => {
    await queryClient.cancelQueries({ queryKey: ["todos"] });
    const previous = queryClient.getQueryData(["todos"]);
    queryClient.setQueryData(["todos"], (old) => [...old, newTodo]);
    return { previous };
  },
  onError: (err, newTodo, context) => {
    queryClient.setQueryData(["todos"], context.previous);
  },
});
```
