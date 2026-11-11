import { useState } from "react";
import {
  Bell,
  CalendarDays,
  Check,
  ClipboardList,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Plus,
  Settings,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import {
  AttachmentCard,
  AttachmentList,
  Avatar,
  Badge,
  Button,
  Card,
  CategoryCard,
  ChartCard,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  EmptyState,
  FilterBar,
  FormActions,
  FormSection,
  Input,
  KanbanCard,
  Modal,
  Navbar,
  Navigation,
  PageHeader,
  Pagination,
  PermissionChip,
  SearchInput,
  Select,
  Skeleton,
  SkeletonCard,
  SkeletonKpiRow,
  SkeletonTable,
  StatusBadge,
  SummaryCard,
  Table,
  TemplateCard,
  Textarea,
  Toggle,
  type TableColumn,
} from "@/design-system";
import { cn } from "@/lib/utils";

/* ─── Page scaffolding ────────────────────────────────────────────── */

const SECTIONS = [
  { id: "colour", label: "Colour" },
  { id: "typography", label: "Typography" },
  { id: "space", label: "Space & radius" },
  { id: "elevation", label: "Elevation" },
  { id: "buttons", label: "Buttons" },
  { id: "inputs", label: "Inputs" },
  { id: "data-display", label: "Data display" },
  { id: "components", label: "Components" },
  { id: "patterns", label: "Patterns" },
  { id: "overlays", label: "Overlays" },
  { id: "feedback", label: "Feedback" },
];

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-6">
      <header className="border-default space-y-1 border-b pb-4">
        <h2 className="text-2xl font-semibold text-primary">{title}</h2>
        <p className="max-w-2xl text-sm text-secondary">{description}</p>
      </header>
      {children}
    </section>
  );
}

function Subsection({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-2xs font-semibold uppercase tracking-wide text-tertiary">{title}</h3>
      <div className={className}>{children}</div>
    </div>
  );
}

/* ─── Colour data ─────────────────────────────────────────────────── */

const SCALES = [
  {
    name: "grey",
    steps: [
      { token: "grey-50", className: "bg-grey-50" },
      { token: "grey-100", className: "bg-grey-100" },
      { token: "grey-200", className: "bg-grey-200" },
      { token: "grey-300", className: "bg-grey-300" },
      { token: "grey-400", className: "bg-grey-400" },
      { token: "grey-500", className: "bg-grey-500" },
      { token: "grey-600", className: "bg-grey-600" },
      { token: "grey-700", className: "bg-grey-700" },
      { token: "grey-800", className: "bg-grey-800" },
      { token: "grey-900", className: "bg-grey-900" },
    ],
  },
  {
    name: "primary",
    steps: [
      { token: "primary-100", className: "bg-primary-100" },
      { token: "primary-200", className: "bg-primary-200" },
      { token: "primary-300", className: "bg-primary-300" },
      { token: "primary-400", className: "bg-primary-400" },
      { token: "primary-500", className: "bg-primary-500" },
      { token: "primary-600", className: "bg-primary-600" },
      { token: "primary-700", className: "bg-primary-700" },
      { token: "primary-800", className: "bg-primary-800" },
      { token: "primary-900", className: "bg-primary-900" },
      { token: "primary-1000", className: "bg-primary-1000" },
    ],
  },
  {
    name: "secondary",
    steps: [
      { token: "secondary-100", className: "bg-secondary-100" },
      { token: "secondary-200", className: "bg-secondary-200" },
      { token: "secondary-300", className: "bg-secondary-300" },
      { token: "secondary-400", className: "bg-secondary-400" },
      { token: "secondary-500", className: "bg-secondary-500" },
      { token: "secondary-600", className: "bg-secondary-600" },
      { token: "secondary-700", className: "bg-secondary-700" },
      { token: "secondary-800", className: "bg-secondary-800" },
      { token: "secondary-900", className: "bg-secondary-900" },
      { token: "secondary-1000", className: "bg-secondary-1000" },
    ],
  },
  {
    name: "sky",
    steps: [
      { token: "sky-100", className: "bg-sky-100" },
      { token: "sky-200", className: "bg-sky-200" },
      { token: "sky-300", className: "bg-sky-300" },
      { token: "sky-400", className: "bg-sky-400" },
      { token: "sky-500", className: "bg-sky-500" },
      { token: "sky-600", className: "bg-sky-600" },
      { token: "sky-700", className: "bg-sky-700" },
      { token: "sky-800", className: "bg-sky-800" },
      { token: "sky-900", className: "bg-sky-900" },
      { token: "sky-1000", className: "bg-sky-1000" },
    ],
  },
  {
    name: "success",
    steps: [
      { token: "success-50", className: "bg-success-50" },
      { token: "success-100", className: "bg-success-100" },
      { token: "success-200", className: "bg-success-200" },
      { token: "success-300", className: "bg-success-300" },
      { token: "success-400", className: "bg-success-400" },
      { token: "success-500", className: "bg-success-500" },
      { token: "success-600", className: "bg-success-600" },
      { token: "success-700", className: "bg-success-700" },
      { token: "success-800", className: "bg-success-800" },
      { token: "success-900", className: "bg-success-900" },
      { token: "success-1000", className: "bg-success-1000" },
    ],
  },
  {
    name: "warning",
    steps: [
      { token: "warning-50", className: "bg-warning-50" },
      { token: "warning-100", className: "bg-warning-100" },
      { token: "warning-200", className: "bg-warning-200" },
      { token: "warning-300", className: "bg-warning-300" },
      { token: "warning-400", className: "bg-warning-400" },
      { token: "warning-500", className: "bg-warning-500" },
      { token: "warning-600", className: "bg-warning-600" },
      { token: "warning-700", className: "bg-warning-700" },
      { token: "warning-800", className: "bg-warning-800" },
      { token: "warning-900", className: "bg-warning-900" },
      { token: "warning-1000", className: "bg-warning-1000" },
    ],
  },
  {
    name: "error",
    steps: [
      { token: "error-50", className: "bg-error-50" },
      { token: "error-100", className: "bg-error-100" },
      { token: "error-200", className: "bg-error-200" },
      { token: "error-300", className: "bg-error-300" },
      { token: "error-400", className: "bg-error-400" },
      { token: "error-500", className: "bg-error-500" },
      { token: "error-600", className: "bg-error-600" },
      { token: "error-700", className: "bg-error-700" },
      { token: "error-800", className: "bg-error-800" },
      { token: "error-900", className: "bg-error-900" },
      { token: "error-1000", className: "bg-error-1000" },
    ],
  },
];

const SEMANTIC_GROUPS = [
  {
    title: "Surfaces",
    kind: "surface" as const,
    tokens: [
      { token: "bg-app", className: "bg-app" },
      { token: "bg-subtle", className: "bg-subtle" },
      { token: "bg-surface", className: "bg-surface" },
      { token: "bg-inset", className: "bg-inset" },
      { token: "bg-hover", className: "bg-hover" },
      { token: "bg-active", className: "bg-active" },
      { token: "bg-inverse", className: "bg-inverse" },
    ],
  },
  {
    title: "Text",
    kind: "text" as const,
    tokens: [
      { token: "text-primary", className: "text-primary" },
      { token: "text-secondary", className: "text-secondary" },
      { token: "text-tertiary", className: "text-tertiary" },
      { token: "text-disabled", className: "text-disabled" },
      { token: "text-link", className: "text-link" },
      { token: "text-inverse", className: "text-inverse" },
    ],
  },
  {
    title: "Borders",
    kind: "border" as const,
    tokens: [
      { token: "border-default", className: "border-default" },
      { token: "border-subtle", className: "border-subtle" },
      { token: "border-hover", className: "border-hover" },
      { token: "border-strong", className: "border-strong" },
      { token: "border-focus", className: "border-focus" },
    ],
  },
  {
    title: "Status",
    kind: "surface" as const,
    tokens: [
      { token: "success-soft", className: "bg-success-soft" },
      { token: "warning-soft", className: "bg-warning-soft" },
      { token: "danger-soft", className: "bg-danger-soft" },
      { token: "info-soft", className: "bg-info-soft" },
      { token: "primary-soft", className: "bg-primary-soft" },
    ],
  },
];

const CHART_SWATCHES = [
  { token: "chart-1", className: "bg-chart-1" },
  { token: "chart-2", className: "bg-chart-2" },
  { token: "chart-3", className: "bg-chart-3" },
  { token: "chart-4", className: "bg-chart-4" },
  { token: "chart-5", className: "bg-chart-5" },
  { token: "chart-6", className: "bg-chart-6" },
  { token: "chart-7", className: "bg-chart-7" },
  { token: "chart-8", className: "bg-chart-8" },
];

const SPACING_STEPS = [
  { token: "space-1", className: "w-1" },
  { token: "space-2", className: "w-2" },
  { token: "space-3", className: "w-3" },
  { token: "space-4", className: "w-4" },
  { token: "space-5", className: "w-5" },
  { token: "space-6", className: "w-6" },
  { token: "space-8", className: "w-8" },
  { token: "space-10", className: "w-10" },
  { token: "space-12", className: "w-12" },
  { token: "space-16", className: "w-16" },
];

function Swatch({ token, className }: { token: string; className: string }) {
  return (
    <div className="space-y-1.5">
      <div className={cn("border-default h-12 w-full rounded-md border", className)} />
      <p className="font-mono text-2xs text-secondary">{token}</p>
    </div>
  );
}

/* ─── Demo data ───────────────────────────────────────────────────── */

interface DemoRow {
  id: number;
  name: string;
  owner: string;
  status: string;
  due: string;
}

const TABLE_ROWS: DemoRow[] = [
  {
    id: 1,
    name: "Design system audit",
    owner: "Amelia Chen",
    status: "In Progress",
    due: "12 Nov",
  },
  { id: 2, name: "Token migration", owner: "Rahul Menon", status: "Done", due: "08 Nov" },
  { id: 3, name: "Shell recolour", owner: "Sofia Almeida", status: "In Review", due: "14 Nov" },
  { id: 4, name: "Reports charts", owner: "Tom Becker", status: "Blocked", due: "18 Nov" },
];

const TABLE_COLUMNS: TableColumn<DemoRow>[] = [
  { key: "name", label: "Task", sortable: true },
  { key: "owner", label: "Owner", sortable: true },
  {
    key: "status",
    label: "Status",
    render: (row) => <StatusBadge status={row.status} />,
  },
  { key: "due", label: "Due" },
];

/* ─── Page ────────────────────────────────────────────────────────── */

export default function DesignSystemPage() {
  const [toggleOn, setToggleOn] = useState(true);
  const [page, setPage] = useState(2);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [view, setView] = useState<"list" | "board">("list");
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({
    read: true,
    write: true,
    admin: false,
  });

  return (
    <div className="mx-auto flex max-w-container gap-10 px-6 py-10">
      {/* Side navigation */}
      <aside className="sticky top-10 hidden h-fit w-52 shrink-0 lg:block">
        <p className="mb-4 text-2xs font-semibold uppercase tracking-wide text-tertiary">
          Design system
        </p>
        <nav className="flex flex-col gap-0.5">
          {SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="rounded-md px-3 py-1.5 text-sm text-secondary transition-colors duration-fast hover:bg-hover hover:text-primary"
            >
              {section.label}
            </a>
          ))}
        </nav>
      </aside>

      <main className="min-w-0 flex-1 space-y-16">
        <PageHeader
          title="Design system"
          description="Every token, primitive and component used across the Internal Task Manager. Values are mirrored from the Figma file “New One” (frame 1:1313)."
          actions={
            <Badge variant="secondary" size="md">
              v1.0
            </Badge>
          }
        />

        {/* ── Colour ───────────────────────────────────────────────── */}
        <Section
          id="colour"
          title="Colour"
          description="Primitive scales come straight from Figma. Semantic tokens alias them and are the only colours components may reference."
        >
          <div className="space-y-8">
            {SCALES.map((scale) => (
              <Subsection key={scale.name} title={`${scale.name} scale`}>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-11">
                  {scale.steps.map((step) => (
                    <Swatch key={step.token} token={step.token} className={step.className} />
                  ))}
                </div>
              </Subsection>
            ))}

            {SEMANTIC_GROUPS.map((group) => (
              <Subsection key={group.title} title={group.title}>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {group.tokens.map((item) =>
                    group.kind === "text" ? (
                      <div key={item.token} className="space-y-1.5">
                        <div className="border-default flex h-12 items-center rounded-md border bg-surface px-3">
                          <span className={cn("text-lg font-medium", item.className)}>Aa</span>
                        </div>
                        <p className="font-mono text-2xs text-secondary">{item.token}</p>
                      </div>
                    ) : (
                      <div key={item.token} className="space-y-1.5">
                        <div
                          className={cn(
                            "h-12 w-full rounded-md",
                            group.kind === "border"
                              ? cn("border-2 bg-surface", item.className)
                              : item.className,
                          )}
                        />
                        <p className="font-mono text-2xs text-secondary">{item.token}</p>
                      </div>
                    ),
                  )}
                </div>
              </Subsection>
            ))}

            <Subsection title="Charts">
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-11">
                {CHART_SWATCHES.map((item) => (
                  <Swatch key={item.token} token={item.token} className={item.className} />
                ))}
              </div>
            </Subsection>
          </div>
        </Section>

        {/* ── Typography ───────────────────────────────────────────── */}
        <Section
          id="typography"
          title="Typography"
          description="Outfit, self-hosted. Five working steps cover the product UI; the larger steps are reserved for page titles."
        >
          <Card className="space-y-5">
            {[
              { token: "text-display", label: "Display · 40 / 700" },
              { token: "text-hero", label: "Hero · 32 / 600" },
              { token: "text-2xl", label: "Section · 24 / 600" },
              { token: "text-xl", label: "Card title · 20 / 600" },
              { token: "text-lg", label: "Lead · 18 / 400" },
              { token: "text-base", label: "Body · 16 / 400" },
              { token: "text-sm", label: "Small · 14 / 400" },
              { token: "text-xs", label: "Caption · 12 / 500" },
              { token: "text-2xs", label: "Overline · 10 / 600" },
            ].map((row) => (
              <div
                key={row.token}
                className="flex flex-wrap items-baseline justify-between gap-3 border-b border-subtle pb-4 last:border-0 last:pb-0"
              >
                <p className={cn(row.token, "text-primary")}>
                  The quick brown fox jumps over the lazy dog
                </p>
                <span className="font-mono text-2xs text-tertiary">{row.label}</span>
              </div>
            ))}
          </Card>
        </Section>

        {/* ── Space & radius ──────────────────────────────────────── */}
        <Section
          id="space"
          title="Space & radius"
          description="A 4px spacing grid, three control radii and two control heights. Every layout value resolves to one of these."
        >
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="space-y-4">
              <Subsection title="Spacing">
                <div className="space-y-2">
                  {SPACING_STEPS.map((step) => (
                    <div key={step.token} className="flex items-center gap-3">
                      <span className="w-16 font-mono text-2xs text-tertiary">{step.token}</span>
                      <div className={cn("h-3 rounded-sm bg-primary-200", step.className)} />
                    </div>
                  ))}
                </div>
              </Subsection>
            </Card>

            <Card className="space-y-4">
              <Subsection title="Radius">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { token: "rounded-control", label: "control · 6" },
                    { token: "rounded-button", label: "button · 5" },
                    { token: "rounded-md", label: "card · 8" },
                    { token: "rounded-lg", label: "panel · 12" },
                    { token: "rounded-pill", label: "pill · 60" },
                    { token: "rounded-full", label: "full" },
                  ].map((item) => (
                    <div key={item.token} className="space-y-1.5">
                      <div
                        className={cn("h-14 w-full border border-strong bg-subtle", item.token)}
                      />
                      <p className="font-mono text-2xs text-tertiary">{item.label}</p>
                    </div>
                  ))}
                </div>
              </Subsection>
            </Card>
          </div>
        </Section>

        {/* ── Elevation ───────────────────────────────────────────── */}
        <Section
          id="elevation"
          title="Elevation"
          description="Four shadow levels, all derived from black at low opacity. Cards use a single hairline shadow; overlays step up from there."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { token: "shadow-card", label: "card" },
              { token: "shadow-elevated", label: "elevated" },
              { token: "shadow-dropdown", label: "dropdown" },
              { token: "shadow-modal", label: "modal" },
            ].map((item) => (
              <div
                key={item.token}
                className={cn(
                  "flex h-24 items-center justify-center rounded-md bg-surface text-sm text-secondary",
                  item.token,
                )}
              >
                {item.label}
              </div>
            ))}
          </div>
        </Section>

        {/* ── Buttons ─────────────────────────────────────────────── */}
        <Section
          id="buttons"
          title="Buttons"
          description="Six variants, three sizes, two shapes. Icon-only buttons use the square control size."
        >
          <Card className="space-y-6">
            <Subsection title="Variants">
              <div className="flex flex-wrap items-center gap-3">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="soft">Soft</Button>
                <Button variant="danger">Danger</Button>
              </div>
            </Subsection>

            <Subsection title="Sizes">
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
            </Subsection>

            <Subsection title="Shapes & icons">
              <div className="flex flex-wrap items-center gap-3">
                <Button shape="pill">Pill</Button>
                <Button leftIcon={<Plus className="h-4 w-4" />}>New task</Button>
                <Button variant="secondary" rightIcon={<Check className="h-4 w-4" />}>
                  Approve
                </Button>
                <Button iconOnly aria-label="Add" leftIcon={<Plus className="h-4 w-4" />} />
                <Button
                  iconOnly
                  variant="secondary"
                  aria-label="Settings"
                  leftIcon={<Settings className="h-4 w-4" />}
                />
                <Button loading>Loading</Button>
                <Button disabled>Disabled</Button>
              </div>
            </Subsection>
          </Card>
        </Section>

        {/* ── Inputs ──────────────────────────────────────────────── */}
        <Section
          id="inputs"
          title="Inputs"
          description="Labels sit 12px above the field. Focus uses a 2px primary ring; errors swap both border and ring."
        >
          <Card className="grid gap-6 md:grid-cols-2">
            <Input label="Task name" placeholder="e.g. Review sprint scope" />
            <Input
              label="Assignee"
              placeholder="Search people"
              helperText="Type at least two characters."
            />
            <Input label="Due date" type="date" error="A due date is required." />
            <Select
              label="Priority"
              placeholder="Select priority"
              options={[
                { value: "low", label: "Low" },
                { value: "medium", label: "Medium" },
                { value: "high", label: "High" },
              ]}
            />
            <Textarea
              label="Description"
              placeholder="Add context for the team…"
              className="md:col-span-2"
            />
            <div className="space-y-3 md:col-span-2">
              <p className="text-2xs font-semibold uppercase tracking-wide text-tertiary">
                Search & toggles
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <SearchInput value={search} onChange={setSearch} className="w-64" />
                <Toggle
                  enabled={toggleOn}
                  onToggle={() => setToggleOn((value) => !value)}
                  label="Notifications"
                />
                <Toggle
                  size="sm"
                  enabled={!toggleOn}
                  onToggle={() => setToggleOn((value) => !value)}
                  label="Compact"
                />
              </div>
            </div>
          </Card>
        </Section>

        {/* ── Data display ────────────────────────────────────────── */}
        <Section
          id="data-display"
          title="Data display"
          description="Badges, avatars and status pills share the same neutral, status and accent vocabulary."
        >
          <Card className="space-y-6">
            <Subsection title="Badges">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>Default</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="danger">Danger</Badge>
                <Badge variant="info">Info</Badge>
                <Badge variant="neutral">Neutral</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="success" dot>
                  With dot
                </Badge>
              </div>
            </Subsection>

            <Subsection title="Status">
              <div className="flex flex-wrap items-center gap-2">
                {["To Do", "In Progress", "In Review", "Done", "Blocked"].map((status) => (
                  <StatusBadge key={status} status={status} />
                ))}
              </div>
            </Subsection>

            <Subsection title="Avatars">
              <div className="flex items-center gap-4">
                <Avatar name="Amelia Chen" size="sm" />
                <Avatar name="Rahul Menon" size="md" status="online" />
                <Avatar name="Sofia Almeida" size="lg" status="away" />
                <Avatar name="Tom Becker" size="xl" status="busy" />
              </div>
            </Subsection>

            <Subsection title="Permissions">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  ["read", "Read"],
                  ["write", "Write"],
                  ["admin", "Admin"],
                ].map(([key, label]) => (
                  <PermissionChip
                    key={key}
                    label={label}
                    enabled={permissions[key]}
                    onClick={() => setPermissions((prev) => ({ ...prev, [key]: !prev[key] }))}
                  />
                ))}
              </div>
            </Subsection>

            <Subsection title="Table">
              <Table
                columns={TABLE_COLUMNS}
                data={TABLE_ROWS}
                keyExtractor={(row) => row.id}
                page={page}
                totalPages={4}
                total={64}
                perPage={20}
                onPageChange={setPage}
                exportable
                exportFilename="design-system-demo"
              />
            </Subsection>

            <Subsection title="Pagination">
              <Pagination page={page} totalPages={9} onPageChange={setPage} />
            </Subsection>
          </Card>
        </Section>

        {/* ── Components ──────────────────────────────────────────── */}
        <Section
          id="components"
          title="Components"
          description="Composites built from the primitives, each traced to a Figma component node."
        >
          <div className="space-y-8">
            <Subsection title="Navbar (Figma 9:1835)">
              <Card padding="none" className="overflow-hidden">
                <Navbar
                  brand="Internal Task Manager"
                  items={[
                    { label: "Dashboard", active: true },
                    { label: "Projects" },
                    { label: "Reports" },
                  ]}
                  actions={
                    <>
                      <Button
                        variant="ghost"
                        iconOnly
                        aria-label="Notifications"
                        leftIcon={<Bell className="h-4 w-4" />}
                      />
                      <Avatar name="Amelia Chen" size="md" status="online" />
                    </>
                  }
                />
              </Card>
            </Subsection>

            <div className="grid gap-6 lg:grid-cols-2">
              <Subsection title="Navigation">
                <Card>
                  <Navigation
                    sections={[
                      {
                        title: "Workspace",
                        items: [
                          {
                            label: "Dashboard",
                            icon: <LayoutDashboard className="h-4 w-4" />,
                            active: true,
                          },
                          {
                            label: "Tasks",
                            icon: <ClipboardList className="h-4 w-4" />,
                            badge: <Badge size="sm">12</Badge>,
                          },
                          { label: "Projects", icon: <FolderKanban className="h-4 w-4" /> },
                          { label: "Calendar", icon: <CalendarDays className="h-4 w-4" /> },
                        ],
                      },
                      {
                        title: "Administration",
                        items: [
                          { label: "People", icon: <Users className="h-4 w-4" /> },
                          { label: "Roles", icon: <Shield className="h-4 w-4" /> },
                          { label: "Settings", icon: <Settings className="h-4 w-4" /> },
                        ],
                      },
                    ]}
                  />
                </Card>
              </Subsection>

              <Subsection title="Summary card (Figma 14:6573)">
                <SummaryCard
                  icon={<Check className="h-7 w-7" />}
                  value="128"
                  label="Tasks completed this quarter"
                  tone="success"
                />
              </Subsection>
            </div>

            <Subsection title="Kanban card (Figma 10:1106)">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <KanbanCard
                  status="High"
                  count={3}
                  title="Design QA"
                  meta="12 Nov"
                  action={<span>View tasks</span>}
                />
                <KanbanCard status="Medium" count={5} title="Token migration" meta="14 Nov" />
                <KanbanCard status="Low" count={1} title="Docs" meta="18 Nov" />
              </div>
            </Subsection>

            <div className="grid gap-6 lg:grid-cols-2">
              <Subsection title="Template card (Figma 15:10040)">
                <TemplateCard
                  items={[
                    {
                      title: "Product request",
                      description: "Intake form for new product ideas.",
                      icon: <Sparkles className="h-4 w-4" />,
                    },
                    {
                      title: "Design review",
                      description: "Checklist for design sign-off.",
                      icon: <FileText className="h-4 w-4" />,
                    },
                  ]}
                  onClose={() => undefined}
                />
              </Subsection>

              <Subsection title="Category card">
                <CategoryCard eyebrow="Browse by team" title="Engineering">
                  <div className="space-y-2">
                    <div className="h-2 rounded-sm bg-grey-700" />
                    <div className="h-2 w-4/5 rounded-sm bg-grey-700" />
                    <div className="h-2 w-3/5 rounded-sm bg-grey-700" />
                  </div>
                </CategoryCard>
              </Subsection>
            </div>

            <Subsection title="Attachments (Figma 16:12125)">
              <AttachmentList>
                {["brief.pdf", "wireframes.fig", "budget.xlsx"].map((name) => (
                  <AttachmentCard
                    key={name}
                    name={name}
                    preview={<FileText className="h-8 w-8 text-tertiary" />}
                    badge={
                      <Badge size="sm" variant="neutral">
                        2.4 MB
                      </Badge>
                    }
                    meta="Uploaded 3 days ago"
                  />
                ))}
              </AttachmentList>
            </Subsection>

            <Subsection title="Chart card (Figma 14:7206)">
              <ChartCard
                title="Completion trends"
                subtitle="Tasks completed per month"
                action={<Badge variant="neutral">6 months</Badge>}
              >
                <div className="flex h-40 items-end gap-2">
                  {[40, 65, 52, 78, 60, 92].map((height, index) => (
                    <div
                      key={index}
                      className="flex-1 rounded-t-sm bg-primary-300"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </ChartCard>
            </Subsection>
          </div>
        </Section>

        {/* ── Patterns ────────────────────────────────────────────── */}
        <Section
          id="patterns"
          title="Patterns"
          description="Recurring arrangements that combine components into a screen-level unit."
        >
          <div className="space-y-8">
            <Subsection title="Filter bar">
              <Card>
                <FilterBar
                  search={search}
                  onSearchChange={setSearch}
                  searchPlaceholder="Search tasks…"
                  filters={[
                    {
                      key: "status",
                      label: "Status",
                      value: filter,
                      onChange: setFilter,
                      options: [
                        { value: "todo", label: "To do" },
                        { value: "done", label: "Done" },
                      ],
                    },
                  ]}
                  view={view}
                  availableViews={["list", "board"]}
                  onViewChange={(next) => setView(next as "list" | "board")}
                  activeChips={
                    filter
                      ? [
                          {
                            key: "status",
                            label: `Status: ${filter}`,
                            onRemove: () => setFilter(""),
                          },
                        ]
                      : []
                  }
                  onClearAll={() => setFilter("")}
                />
              </Card>
            </Subsection>

            <Subsection title="Form section">
              <Card className="space-y-6">
                <FormSection title="Basics" description="Name the task and choose an owner.">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input label="Title" placeholder="Task title" />
                    <Select
                      label="Owner"
                      placeholder="Select owner"
                      options={[{ value: "amelia", label: "Amelia Chen" }]}
                    />
                  </div>
                </FormSection>
                <FormActions>
                  <Button variant="ghost">Cancel</Button>
                  <Button>Save task</Button>
                </FormActions>
              </Card>
            </Subsection>
          </div>
        </Section>

        {/* ── Overlays ────────────────────────────────────────────── */}
        <Section
          id="overlays"
          title="Overlays"
          description="Modals interrupt; drawers support detail work without leaving the page. Both trap focus and close on Escape."
        >
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setModalOpen(true)}>Open modal</Button>
            <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
              Open drawer
            </Button>
          </div>

          <Modal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Delete task"
            description="This action cannot be undone."
            footer={
              <>
                <Button variant="ghost" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={() => setModalOpen(false)}>
                  Delete
                </Button>
              </>
            }
          >
            <p className="text-sm text-secondary">
              The task and all of its subtasks will be permanently removed.
            </p>
          </Modal>

          <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
            <DrawerHeader
              title="Design QA"
              subtitle="PROJ-128 · Due 12 Nov"
              onClose={() => setDrawerOpen(false)}
            />
            <DrawerBody>
              <div className="space-y-4">
                <Input label="Title" defaultValue="Design QA" />
                <Textarea label="Notes" defaultValue="Review spacing and colour tokens." />
              </div>
            </DrawerBody>
            <DrawerFooter>
              <Button variant="ghost" onClick={() => setDrawerOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setDrawerOpen(false)}>Save changes</Button>
            </DrawerFooter>
          </Drawer>
        </Section>

        {/* ── Feedback ────────────────────────────────────────────── */}
        <Section
          id="feedback"
          title="Feedback"
          description="Loading and empty states share the same rhythm so screens never jump between states."
        >
          <div className="space-y-6">
            <Subsection title="Skeletons">
              <div className="grid gap-4 lg:grid-cols-2">
                <SkeletonCard />
                <div className="space-y-4">
                  <SkeletonKpiRow cards={2} />
                  <div className="space-y-2">
                    <Skeleton variant="text" className="h-4 w-1/3" />
                    <Skeleton variant="rect" className="h-24 w-full" />
                  </div>
                </div>
              </div>
              <SkeletonTable rows={3} columns={4} />
            </Subsection>

            <Subsection title="Empty state">
              <Card>
                <EmptyState
                  icon={<ClipboardList className="h-5 w-5" />}
                  title="No tasks yet"
                  description="Create your first task to start tracking work."
                  action={<Button leftIcon={<Plus className="h-4 w-4" />}>New task</Button>}
                />
              </Card>
            </Subsection>
          </div>
        </Section>

        <footer className="border-default border-t pt-6 text-xs text-tertiary">
          Tokens live in <code className="font-mono">src/design-system/tokens</code>. Components
          live in <code className="font-mono">src/design-system</code> and are imported from{" "}
          <code className="font-mono">@/design-system</code>.
        </footer>
      </main>
    </div>
  );
}
