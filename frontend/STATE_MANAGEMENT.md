# State Management Guide

## Overview

This application uses a hybrid state management approach:

1. **React Query** - Server state (API data)
2. **React hooks** - Client state (UI state)
3. **URL state** - Navigation state (route params, query strings)
4. **localStorage** - Persistent state (auth tokens)

## Server State (React Query)

### When to Use
- Data from API endpoints
- Data that needs caching
- Data that needs background refetching

### Pattern
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: queryKeys.projects.list(params),
  queryFn: () => projectService.getProjects(params),
});
```

## Client State (React Hooks)

### When to Use
- UI-only state (modals, drawers, form inputs)
- Temporary state (selected items, expanded rows)
- Local component state

### Pattern
```typescript
const [isOpen, setIsOpen] = useState(false);
const [selectedItem, setSelectedItem] = useState<Item | null>(null);
```

### Global Client State
For state shared across components, use React Context:

```typescript
// store/auth.tsx
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState<User | null>(null);
  // ...
  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
```

## URL State

### When to Use
- Filter/sort state that should be shareable
- Pagination state
- Tab selection
- Search queries

### Pattern
```typescript
const [searchParams, setSearchParams] = useSearchParams();

const page = parseInt(searchParams.get("page") || "1");
const status = searchParams.get("status") || "";

const setPage = (p: number) => {
  searchParams.set("page", String(p));
  setSearchParams(searchParams);
};
```

## Persistent State

### When to Use
- Authentication tokens
- User preferences
- Theme selection

### Pattern
```typescript
// Save
localStorage.setItem("access_token", token);

// Load
const token = localStorage.getItem("access_token");

// Remove
localStorage.removeItem("access_token");
```

## State Flow

```
URL State → Page Component → React Query → Server
                ↓
         Client State → UI Updates
                ↓
         localStorage ← Persistent Data
```

## Best Practices

1. **Keep server state in React Query** - Don't duplicate API data in local state
2. **Use URL state for shareable state** - Filters, pagination, search
3. **Minimize global client state** - Most state should be local
4. **Use localStorage sparingly** - Only for persistence needs
5. **Avoid prop drilling** - Use Context or URL state instead
