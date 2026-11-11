# Design System

Single source of truth for colour, type, spacing, radii, elevation and every
reusable UI component in the Internal Task Manager.

Everything in the product imports from one place:

```tsx
import { Button, Card, StatusBadge, PageHeader } from "@/design-system";
```

Values come from the Figma file **New One** (`wO6VElTpJrcQOG0j1GiyDJ`), frame
`1:1313` (“Design System”). Tokens are named to match the Figma variables, so a
designer and a developer always refer to the same thing.

---

## The one rule

> **Feature code never contains a colour, size, radius or shadow literal.**

If a value is not already a token, add it to the token layer first. This is
enforced in CI:

| Check             | Command                | Fails when                                 |
| ----------------- | ---------------------- | ------------------------------------------ |
| Types             | `npm run typecheck`    | any TypeScript error                       |
| Lint              | `npm run lint`         | ESLint error, including raw hex/rgb/hsl    |
| Token boundary    | `npm run check:tokens` | a colour literal outside `tokens/`         |
| Build             | `npm run build`        | Vite / bundling failure                    |

Run all four at once with `npm run check`.

---

## Structure

```
src/design-system/
├── tokens/                  ← values only, no components
│   ├── primitives.css       L1 · raw palette from Figma + radii + brand marks
│   ├── semantic.css         L2 · named roles (bg-surface, text-primary, …)
│   ├── typography.css       font family, sizes, weights, leading, tracking
│   ├── motion.css           durations + easing
│   ├── fonts.css            self-hosted Outfit @font-face
│   ├── index.css            import order for the four files above
│   └── palette.ts           literal hex for the few JS-only cases
├── primitives/              ← atoms: Button, Input, Card, Table, Drawer, …
├── components/              ← Figma-derived composites: Navbar, KanbanCard, …
├── patterns/                ← page-level arrangements: FilterBar, PageHeader
└── index.ts                 ← the only public import surface
```

### Three token layers

```
L1 primitive          L2 semantic                L3 derived
--color-grey-100  →   --border-default       →   color-mix() hover/active
#ececec               var(--color-grey-100)      var(--border-strong)
```

1. **L1 primitives** mirror the Figma palette exactly (`--color-grey-*`,
   `--color-primary-*`, `--color-success-*`, …). Never used directly in
   components.
2. **L2 semantic** aliases answer *where* a colour is used, not *what* it is:
   `--bg-surface`, `--text-secondary`, `--border-focus`, `--danger-soft`.
   Components use these, or their Tailwind equivalents.
3. **L3 derived** states are computed with `color-mix()` so a palette change
   propagates to hover, active and focus states automatically.

### Why `color-mix()` instead of opacity modifiers

Tailwind cannot apply `/50` to a CSS-variable colour — the value is not known at
build time, so the alpha suffix is ignored. Anything that needs a translucent
tint uses either:

- an explicit L2 token (`--bg-overlay`, `--primary-ring`), or
- the `.brand-tint` utility, which tints with the element’s own text colour:

```tsx
<div className="brand-tint text-brand-figma">
  <Figma className="h-5 w-5" />
</div>
```

---

## Tokens

### Colour

| Figma scale | CSS variable          | Tailwind               | Steps                              |
| ----------- | --------------------- | ---------------------- | ---------------------------------- |
| Grey        | `--color-grey-N`      | `bg-grey-N`            | 50–900                             |
| Primary     | `--color-primary-N`   | `bg-primary-N`         | 100–1000                           |
| Secondary   | `--color-secondary-N` | `bg-secondary-N`       | 100–1000                           |
| Sky         | `--color-sky-N`       | `bg-sky-N`             | 100–1000                           |
| Success     | `--color-success-N`   | `bg-success-N`         | 50–1000                            |
| Warning     | `--color-warning-N`   | `bg-warning-N`         | 50–1000                            |
| Error       | `--color-error-N`     | `bg-error-N`           | 50–1000                            |
| Charts      | `--chart-1…8`         | `bg-chart-1`           | categorical series                 |
| Languages   | `--lang-1…12`         | `bg-lang-1`            | GitHub linguist palette            |
| Brand marks | `--brand-*`           | `text-brand-figma`     | third-party logos, never recoloured |

Semantic utilities are the ones screens should use:

| Purpose    | Utilities                                                                     |
| ---------- | ----------------------------------------------------------------------------- |
| Surfaces   | `bg-app` `bg-surface` `bg-subtle` `bg-inset` `bg-hover` `bg-active` `bg-overlay` |
| Text       | `text-primary` `text-secondary` `text-tertiary` `text-disabled` `text-link` `text-inverse` |
| Borders    | `border-default` `border-subtle` `border-hover` `border-strong` `border-focus` |
| Status     | `bg-success-soft` `bg-warning-soft` `bg-danger-soft` `bg-info-soft` `bg-primary-soft` |
| Focus ring | `ring-primary-ring`                                                           |

**Contrast rule.** Steps 500–600 are for fills, icons and borders. Text on light
surfaces uses 700–800. Grey-500 (`#9e9e9e`) is 2.68:1 and fails AA, so it is a
tertiary *icon* colour only — `text-tertiary` maps to grey-700 instead.

### Typography

Outfit, self-hosted in `public/fonts/`. No Google Fonts request at runtime.

| Token           | Size | Typical use                     |
| --------------- | ---- | ------------------------------- |
| `text-display`  | 40   | page title                      |
| `text-hero`     | 32   | welcome header                  |
| `text-2xl`      | 24   | section title                   |
| `text-xl`       | 20   | card title                      |
| `text-lg`       | 18   | lead paragraph                  |
| `text-base`     | 16   | body                            |
| `text-sm`       | 14   | table body, secondary copy      |
| `text-xs`       | 12   | labels, captions                |
| `text-2xs`      | 10   | overlines, status pills         |

Weights: `font-normal` 400, `font-medium` 500, `font-semibold` 600,
`font-bold` 700. Leading: `leading-tight` 1.2, `leading-normal` 1.5,
`leading-relaxed` 1.7.

### Space, radius, controls

- Spacing is a 4px grid: `space-1` = 4px … `space-24` = 96px.
- Radii: `rounded-control` 6px (inputs), `rounded-button` 5px (buttons),
  `rounded-md` 8px (cards), `rounded-lg` 12px (panels), `rounded-pill` 60px.
- Control heights: `h-control-sm` 28px, `h-control-md` 34px, `h-control-lg` 40px.
- Icon-only controls: `w-control-icon-sm` 32px, `-md` 38px, `-lg` 44px.

### Elevation

`shadow-card` (Figma `0 1px 4.5px rgba(0,0,0,0.09)`), `shadow-elevated`,
`shadow-dropdown`, `shadow-modal`, `shadow-drawer`.

### Motion

`duration-fast` 120ms, `duration-normal` 180ms, `duration-slow` 260ms;
`ease-default`, `ease-spring`.

---

## Components

Import everything from the barrel. Do not reach into sub-folders.

```tsx
import { Button, Card, Input, StatusBadge } from "@/design-system";
```

### Primitives

| Component                | Variants / notes                                                   |
| ------------------------ | ------------------------------------------------------------------ |
| `Button`                 | `primary` `secondary` `outline` `ghost` `soft` `danger`; `sm md lg`; `shape="pill"`; `iconOnly`; `leftIcon` `rightIcon`; `loading` |
| `Input` `Textarea`       | `label` `error` `helperText` `leftIcon` `rightIcon`                |
| `Select`                 | Radix-based, `options`, `placeholder`, `error`                     |
| `Toggle`                 | `sm md`, labelled, `role="switch"`                                 |
| `Badge`                  | `default` `success` `warning` `danger` `info` `neutral` `outline` `secondary`; `dot`; `sm md` |
| `Avatar`                 | `sm md lg xl`, `src`, initials fallback, presence dot              |
| `Card`                   | `default` `interactive` `highlight` `subtle` `ghost`; `padding`    |
| `Table`                  | column defs, sorting, pagination, CSV export                       |
| `Pagination`             | page window with `getPageNumbers`                                  |
| `SearchInput`            | debounce-friendly, clear button                                    |
| `PermissionChip`         | togglable capability chip                                          |
| `Drawer` + `Header/Body/Footer` | right-hand panel, focus trap, Escape to close               |
| `Modal`                  | centred dialog with `title` `description` `footer`                 |
| `Skeleton` + `Card/Table/KpiRow/Form` | loading placeholders                                  |
| `EmptyState`             | icon, title, description, action                                   |

### Figma-derived components

| Component         | Figma node | Notes                                        |
| ----------------- | ---------- | -------------------------------------------- |
| `Navbar`          | `9:1835`   | 52px bar, 22px gutters, 14px medium items    |
| `Navigation`      | —          | sectioned side nav, active + badge support   |
| `SummaryCard`     | `14:6573`  | 55px icon circle, 24px metric                |
| `KanbanCard`      | `10:1106`  | 270px wide, grey-50 surface, status pill     |
| `StatusBadge`     | —          | maps any status string to a badge variant    |
| `AttachmentCard`  | `16:12125` | preview + metadata + actions                 |
| `TemplateCard`    | `15:10040` | icon, title, description, dismiss            |
| `CategoryCard`    | —          | eyebrow + title + content slot               |
| `ChartCard`       | `14:7206`  | titled frame for any Recharts figure         |

### Patterns

| Pattern                       | Use                                            |
| ----------------------------- | ---------------------------------------------- |
| `PageHeader`                  | title, description, primary action             |
| `FilterBar`                   | search + selects + view switch + active chips   |
| `FormSection` / `FormActions` | labelled field group, sticky footer buttons     |

---

## Adding something new

1. **Need a new colour?** Check Figma first. If it exists, add it to
   `primitives.css` and alias it in `semantic.css`. If it does not exist, raise
   it with design — do not invent a shade.
2. **Need a new size?** Reuse the 4px grid. Only add a token if the value
   repeats in at least three places.
3. **Need a new component?** Compose it from primitives. Put single-purpose
   atoms in `primitives/`, Figma-matching composites in `components/`, and
   screen-level arrangements in `patterns/`.
4. **Export it** from the folder’s `index.ts`; the barrel re-exports it.
5. **Prove it** on `/design-system` — every token and component must be visible
   there before it ships.

## Style guide

`/design-system` renders the whole system in the running app (public route, no
login). Use it for visual QA and as the reference when reviewing a PR. It
documents colour, typography, spacing, elevation, all component states,
patterns and overlays.

## Formatting

Prettier owns formatting; ESLint owns correctness.

```bash
npm run format        # write
npm run format:check  # verify (CI-ready)
```

Tailwind class order is sorted automatically by `prettier-plugin-tailwindcss`
using `cn()` / `cva()` as class functions.
