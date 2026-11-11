# Design System Reference

Engineering reference for the token architecture and its link to the Figma
source. For day-to-day usage (imports, component props, how to add something),
read [`frontend/src/design-system/README.md`](../frontend/src/design-system/README.md).

- **Figma file:** New One — `wO6VElTpJrcQOG0j1GiyDJ`
- **Design System frame:** `1:1313`
- **In-app style guide:** `/design-system`
- **Token source:** `frontend/src/design-system/tokens/`
- **Tailwind mapping:** `frontend/tailwind.config.js`

---

## 1. Architecture

Three layers, one direction of dependency:

```
Figma variables
      │
      ▼
L1  primitives.css      raw values, exact Figma names      --color-grey-100
      │
      ▼
L2  semantic.css        roles, stable public API           --border-default
      │
      ▼
L3  derived             color-mix() states                 --border-strong
      │
      ▼
tailwind.config.js      utility names                      border-default
      │
      ▼
components              never reference L1 directly
```

Rules:

1. Components may reference L2 tokens (directly or through Tailwind utilities)
   and L3 derived tokens. They may **not** reference L1 primitives.
2. A primitive is only ever consumed by `semantic.css`.
3. Changing an L1 value must not require a component change. If it does, the
   semantic layer is missing a role.
4. `palette.ts` exists only for values that cannot be expressed as a CSS custom
   property: native `<input type="color">`, string concatenation for alpha, and
   canvas/SVG attributes.

---

## 2. Figma variable → token mapping

### 2.1 Palette

| Figma variable | CSS custom property | Tailwind class prefix |
| -------------- | ------------------- | --------------------- |
| `grey/50 … grey/900` | `--color-grey-50 … --color-grey-900` | `grey-50 … grey-900` |
| `primary/100 … primary/1000` | `--color-primary-100 … --color-primary-1000` | `primary-100 … primary-1000` |
| `secondary/100 … secondary/1000` | `--color-secondary-100 … --color-secondary-1000` | `secondary-100 … secondary-1000` |
| `sky/100 … sky/1000` | `--color-sky-100 … --color-sky-1000` | `sky-100 … sky-1000` |
| `success/50 … success/1000` | `--color-success-50 … --color-success-1000` | `success-50 … success-1000` |
| `warning/50 … warning/1000` | `--color-warning-50 … --color-warning-1000` | `warning-50 … warning-1000` |
| `error/50 … error/1000` | `--color-error-50 … --color-error-1000` | `error-50 … error-1000` |

Exact values live in `tokens/primitives.css`; they are copied verbatim from
Figma and must not be rounded or “tidied”.

### 2.2 Radii and spacing

| Figma variable | CSS custom property | Tailwind |
| -------------- | ------------------- | -------- |
| `radius/0` | `--radius-0` | `rounded-none` |
| `radius/5` | `--radius-5` | — (`rounded-button` aliases it) |
| `radius/6` | `--radius-6` | — (`rounded-control` aliases it) |
| `radius/8` | `--radius-8` | `rounded-md` |
| `radius/12` | `--radius-12` | `rounded-lg` |
| `radius/50` | `--radius-50` | — |
| `radius/60` | `--radius-60` | `rounded-pill` |
| `gap/16`, `gap/20` | `--space-4`, `--space-5` | `gap-4`, `gap-5` |

### 2.3 Semantic roles

| Role | CSS variable | Tailwind utility | Value |
| ---- | ------------ | ---------------- | ----- |
| App background | `--bg-app` | `bg-app` | grey-50 |
| Card surface | `--bg-surface` | `bg-surface` | white |
| Subtle surface | `--bg-subtle` | `bg-subtle` | grey-50 |
| Hover surface | `--bg-hover` | `bg-hover` | grey-50 |
| Active / selected | `--bg-active`, `--bg-selected` | `bg-active`, `bg-selected` | primary-100 |
| Inverse surface | `--bg-inverse` | `bg-inverse` | grey-900 |
| Overlay scrim | `--bg-overlay` | `bg-overlay` | grey-900 @ 48% |
| Default border | `--border-default` | `border-default` | grey-100 |
| Strong border | `--border-strong` | `border-strong` | grey-300 |
| Focus border | `--border-focus` | `border-focus` | primary-1000 |
| Primary text | `--text-primary` | `text-primary` | grey-900 |
| Secondary text | `--text-secondary` | `text-secondary` | grey-700 |
| Tertiary text | `--text-tertiary` | `text-tertiary` | grey-700 |
| Disabled text | `--text-disabled` | `text-disabled` | grey-400 |
| Link text | `--text-link` | `text-link` | primary-1000 |
| Success | `--success` / `--success-soft` | `text-success` / `bg-success-soft` | success-800 / 100 |
| Warning | `--warning` / `--warning-soft` | `text-warning` / `bg-warning-soft` | warning-800 / 100 |
| Danger | `--danger` / `--danger-soft` | `text-danger` / `bg-danger-soft` | error-800 / 100 |
| Info | `--info` / `--info-soft` | `text-info` / `bg-info-soft` | primary-1000 / 100 |
| Focus ring | `--primary-ring` | `ring-primary-ring` | primary-1000 @ 30% |

### 2.4 Figma component nodes

| Figma component | Node | Implementation |
| --------------- | ---- | -------------- |
| Button | `2:6121` | `primitives/Button.tsx` |
| Input Fields | `4:1401` | `primitives/Input.tsx`, `Textarea.tsx`, `Select.tsx` |
| Table | `14:10425` | `primitives/Table.tsx` |
| Navbar | `9:1835` | `components/Navbar.tsx` |
| Summary Card | `14:6573` | `components/SummaryCard.tsx` |
| Kanban Card | `10:1106` | `components/KanbanCard.tsx` |
| Attachments | `16:12125` | `components/AttachmentCard.tsx` |
| Template | `15:10040` | `components/TemplateCard.tsx` |
| Analytics widgets | `14:7206`–`14:7211` | `components/ChartCard.tsx` + Recharts |
| Marketing Card | `2:9246` | `components/CategoryCard.tsx` |

Screens: Home `24:16635`, Project Dashboard `24:14932`, Components page
`24:14929`, Design System page `2:6005`.

> `2:6025` (“Navigation”) is a marketing hero in the file, not app navigation.
> The app nav is built from `components/Navigation.tsx` instead.

### 2.5 Figma component specs (authoritative values)

**Button** — heights 27 / 34 / 40 (`sm` / `md` / `lg`); icon-only 32 / 38 / 44;
label 12 / 14 / 16; radius 5 (pill = 50); padding x20 y6.

**Input** — label 12 medium grey-700, 6px gap; field radius 6, padding x20 y12;
placeholder 16 regular grey-500; border grey-100.

**Summary Card** — radius 8, border grey-100, padding 20, gap 20; icon circle
55px on grey-100; title 24 medium grey-700; subtitle 16 regular.

**Kanban Card** — surface grey-50, padding 12, radius 8, width 270; status pill
bg secondary-200, radius 5, text 10 semibold secondary-800.

**Navbar** — height 52, white, 1px bottom border grey-100, padding x22; items 14
medium secondary-700; active primary-1000; menu gap 16.

---

## 3. Accessibility

Contrast was measured against WCAG AA (4.5:1 body, 3:1 large text and UI
borders):

| Token | Value | Ratio | Verdict |
| ----- | ----- | ----- | ------- |
| grey-500 | `#9e9e9e` | 2.68:1 | fails — icons/borders only |
| warning-600 | `#f79009` | 2.36:1 | fails — use warning-800 for text |
| primary-1000 | `#0a65e4` | 5.31:1 | passes |

Therefore `--text-tertiary` maps to grey-700, and every status role maps to the
800 step for text and the 100 step for fills. Focus states always pair a colour
change with a 2px ring, never colour alone.

---

## 4. Governance

### CI gates

```bash
cd frontend
npm run check     # typecheck + lint + token boundary
npm run build
```

`.github/workflows/ci.yml` runs type check, lint, token boundary and build for
every push to `main`/`develop` and every PR to `main`.

### Enforcement

| Guard | Mechanism |
| ----- | --------- |
| No raw colours in TS/TSX | ESLint `no-restricted-syntax` on hex/rgb/hsl literals |
| No raw colours in CSS | `scripts/check-tokens.mjs` |
| No primitive leakage | code review; primitives are not exported from the barrel |
| No arbitrary values | code review; replace with scale values when one exists |
| No dynamic class names | Tailwind only emits classes present as literal text |

### Change procedure

1. Change the value in Figma first (single source of truth).
2. Update `tokens/primitives.css` with the exact new value.
3. If a semantic role changed meaning, update `tokens/semantic.css`.
4. Update `tailwind.config.js` only if a new *name* was introduced.
5. Add or update the sample on `/design-system`.
6. Run `npm run check && npm run build`.
7. Ask design to sign off on the `/design-system` page.

### Known deviations from Figma

| Deviation | Reason |
| --------- | ------ |
| Tertiary text = grey-700 | grey-500 fails AA on white |
| Warning text = warning-800 | warning-600 fails AA |
| `--radius-sm` aliases 8px | Figma has no 4px radius; cards use 8 |
| Brand and language palettes tokenised | avoids raw hex in feature code |
| `Navbar` not adopted in the shell yet | shell recolour only; nav adoption is a later phase |
