# Architecture Guide

## Overview

This is a modern React TypeScript application built with Vite, Tailwind CSS, and React Query.

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build**: Vite
- **Styling**: Tailwind CSS with CSS custom properties
- **State**: React Query (server), React hooks (client)
- **Routing**: React Router v6
- **HTTP**: Axios with interceptors
- **Testing**: Playwright

## Project Structure

```
src/
├── components/           # Shared UI components
│   ├── ui/              # Primitive UI components
│   ├── shared/          # Composite shared components
│   └── previews/        # File preview components
├── features/            # Feature modules
│   └── [feature]/
│       ├── components/  # Feature-specific components
│       ├── hooks/       # Feature-specific hooks
│       ├── pages/       # Page components
│       ├── services/    # API service functions
│       └── types/       # Feature-specific types
├── hooks/               # Shared hooks
├── services/            # Core services (API, auth, query keys)
├── styles/              # CSS and design tokens
├── types/               # Shared TypeScript types
├── utils/               # Utility functions
└── constants/           # Application constants
```

## Key Patterns

### API Layer
- `api` - JWT-authenticated client (auto-refresh)
- `proxyApi` - External API proxy (GitHub, Figma)

### Query Management
- Centralized query keys in `services/queryKeys.ts`
- Cache invalidation helpers
- Global 30s staleTime default

### Component Hierarchy
```
Page → Feature Components → Shared Components → UI Primitives
```

### Feature Module Structure
Each feature follows identical structure for consistency:
```
feature/
├── components/    # UI components
├── hooks/         # Custom hooks
├── pages/         # Route pages
├── services/      # API calls
└── types/         # TypeScript types
```

## Design System

### Tokens
- CSS custom properties in `styles/design-tokens.css`
- Tailwind extensions in `tailwind.config.js`
- Light/dark theme support

### Component Variants
- Button: primary, secondary, ghost, danger
- Badge: default, success, warning, danger, info, neutral
- Input: default, error states
- Card: default, interactive

### Animation
- CSS animations via Tailwind
- `prefers-reduced-motion` support
- Duration tokens: fast (150ms), normal (200ms), slow (300ms)
