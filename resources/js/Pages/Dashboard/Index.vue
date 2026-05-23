<template>
    <AppLayout>
        <div class="space-y-5">

            <!-- ═══════════════════════════════════════════════════════════
                 SECTION A — Compact greeting strip
            ═══════════════════════════════════════════════════════════ -->
            <section class="flex items-center justify-between gap-4">
                <div>
                    <p class="text-[11px] font-medium uppercase tracking-widest text-gray-400">
                        {{ greeting }}, {{ userName }}
                    </p>
                    <h2 class="mt-1 text-xl font-semibold tracking-tight text-gray-900">
                        What needs attention today?
                    </h2>
                </div>
                <Link
                    :href="route('tasks.create')"
                    class="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-gray-700 active:scale-[0.98]"
                >
                    <PlusIcon class="h-4 w-4" />
                    New Task
                </Link>
            </section>

            <!-- ═══════════════════════════════════════════════════════════
                 SECTION B — KPI Cards (4 equal)
            ═══════════════════════════════════════════════════════════ -->
            <section class="grid grid-cols-2 gap-4 xl:grid-cols-4">
                <Link
                    v-for="stat in statsList"
                    :key="stat.label"
                    :href="stat.route"
                    class="group rounded-2xl border border-gray-200/70 bg-white px-5 py-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] transition-all duration-150 hover:border-gray-300/80 hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.07)]"
                >
                    <div class="flex items-start justify-between">
                        <div class="rounded-lg bg-gray-100 p-2 transition-colors group-hover:bg-gray-200/70">
                            <component :is="stat.icon" class="h-4 w-4 text-gray-600" />
                        </div>
                    </div>
                    <p class="mt-4 text-2xl font-semibold tabular-nums text-gray-900">
                        {{ stat.value ?? '—' }}
                    </p>
                    <p class="mt-0.5 text-xs font-medium text-gray-500">
                        {{ stat.label }}
                    </p>
                </Link>
            </section>

            <!-- ═══════════════════════════════════════════════════════════
                 SECTION C — Bento: Priority Tasks + Upcoming Deadlines
            ═══════════════════════════════════════════════════════════ -->
            <section class="grid grid-cols-1 gap-4 xl:grid-cols-12">

                <!-- Priority Tasks (left, wider) -->
                <div class="rounded-2xl border border-gray-200/70 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] xl:col-span-7">
                    <div class="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                        <div>
                            <h3 class="text-[13px] font-semibold text-gray-900">{{ primaryPanelTitle }}</h3>
                            <p class="mt-0.5 text-[11px] text-gray-400">Priority work requiring attention</p>
                        </div>
                        <Link
                            :href="route('tasks.index')"
                            class="text-[11px] font-medium text-gray-400 transition-colors hover:text-gray-700"
                        >
                            View all →
                        </Link>
                    </div>

                    <div v-if="primaryItems.length === 0" class="px-5 py-10 text-center">
                        <div class="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100">
                            <CheckCircleIcon class="h-5 w-5 text-gray-400" />
                        </div>
                        <p class="text-sm text-gray-400">Nothing urgent right now.</p>
                    </div>

                    <ul v-else class="divide-y divide-gray-50">
                        <li
                            v-for="item in primaryItems.slice(0, 8)"
                            :key="item.id"
                            class="group flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-gray-50/70"
                        >
                            <div class="flex min-w-0 items-center gap-3">
                                <!-- Status dot -->
                                <span class="h-1.5 w-1.5 shrink-0 rounded-full" :class="taskDotClass(item)" />
                                <div class="min-w-0">
                                    <Link
                                        :href="route('tasks.show', item.id)"
                                        class="block truncate text-[13px] font-medium text-gray-800 transition-colors hover:text-gray-900"
                                    >
                                        {{ item.title }}
                                    </Link>
                                    <p class="mt-0.5 truncate text-[11px] text-gray-400">
                                        {{ item.project?.name || 'Internal Task' }}
                                    </p>
                                </div>
                            </div>

                            <div class="flex shrink-0 items-center gap-2">
                                <span
                                    v-if="item.priority"
                                    class="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 capitalize"
                                >
                                    {{ item.priority }}
                                </span>
                                <span
                                    v-if="item.status"
                                    class="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-500"
                                >
                                    {{ formatStatus(item.status) }}
                                </span>
                                <span v-if="item.due_date" class="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                                    {{ formatDate(item.due_date) }}
                                </span>
                                <button
                                    v-if="item.status === 'in_review' && canApproveTask(item)"
                                    @click.stop="approveTask(item.id)"
                                    class="rounded bg-gray-950 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-gray-700 transition"
                                >
                                    Approve
                                </button>
                            </div>
                        </li>
                    </ul>
                </div>

                <!-- Current Projects (right, narrower) -->
                <div class="rounded-2xl border border-gray-200/70 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] xl:col-span-5">
                    <div class="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                        <div>
                            <h3 class="text-[13px] font-semibold text-gray-900">Current Projects</h3>
                            <p class="mt-0.5 text-[11px] text-gray-400">Active projects you are involved in</p>
                        </div>
                        <Link
                            :href="route('projects.index')"
                            class="text-[11px] font-medium text-gray-400 transition-colors hover:text-gray-700"
                        >
                            View all →
                        </Link>
                    </div>

                    <div v-if="current_projects.length === 0" class="px-5 py-10 text-center">
                        <p class="text-sm text-gray-400">No active projects.</p>
                    </div>

                    <ul v-else class="divide-y divide-gray-50">
                        <li
                            v-for="project in current_projects.slice(0, 8)"
                            :key="project.id"
                            class="px-5 py-3.5 transition-colors hover:bg-gray-50/70"
                        >
                            <div class="flex items-start justify-between gap-3 mb-1.5">
                                <div class="min-w-0">
                                    <Link
                                        :href="route('projects.show', project.id)"
                                        class="block truncate text-[13px] font-semibold text-gray-800 transition-colors hover:text-gray-900"
                                    >
                                        {{ project.name }}
                                    </Link>
                                    <p v-if="project.project_manager" class="mt-0.5 truncate text-[11px] text-gray-400">
                                        PM: {{ project.project_manager.name }}
                                    </p>
                                </div>
                                <span class="shrink-0 text-[11px] font-medium text-gray-600">
                                    {{ project.completion_rate !== null && project.completion_rate !== undefined ? `${project.completion_rate}%` : '0%' }}
                                </span>
                            </div>
                            <!-- Progress Bar -->
                            <div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                                <div
                                    class="h-1.5 rounded-full bg-gray-950 transition-all duration-500"
                                    :style="{ width: `${project.completion_rate ?? 0}%` }"
                                />
                            </div>
                        </li>
                    </ul>
                </div>
            </section>

            <!-- ═══════════════════════════════════════════════════════════
                 SECTION D — Recent Activity + Team Workload
            ═══════════════════════════════════════════════════════════ -->
            <section class="grid grid-cols-1 gap-4 xl:grid-cols-2">

                <!-- Recent Activity -->
                <div class="rounded-2xl border border-gray-200/70 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
                    <div class="border-b border-gray-100 px-5 py-4">
                        <h3 class="text-[13px] font-semibold text-gray-900">Recent Activity</h3>
                        <p class="mt-0.5 text-[11px] text-gray-400">Latest updates from your workspace</p>
                    </div>

                    <div v-if="recent_activities.length === 0" class="px-5 py-10 text-center">
                        <p class="text-sm text-gray-400">No recent activity.</p>
                    </div>

                    <ul v-else class="divide-y divide-gray-50 px-5">
                        <li
                            v-for="activity in recent_activities.slice(0, 6)"
                            :key="activity.id"
                            class="flex gap-3 py-3.5"
                        >
                            <div class="flex flex-col items-center">
                                <span class="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300" />
                            </div>
                            <div class="min-w-0 flex-1">
                                <p class="text-[13px] leading-snug text-gray-700">
                                    {{ activity.description }}
                                </p>
                                <p class="mt-1 text-[11px] text-gray-400">
                                    {{ dayjs(activity.created_at).fromNow() }}
                                </p>
                            </div>
                        </li>
                    </ul>
                </div>

                <!-- Team Workload -->
                <div class="rounded-2xl border border-gray-200/70 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
                    <div class="border-b border-gray-100 px-5 py-4">
                        <h3 class="text-[13px] font-semibold text-gray-900">Team Workload</h3>
                        <p class="mt-0.5 text-[11px] text-gray-400">Current task distribution</p>
                    </div>

                    <div v-if="teamWorkload.length === 0" class="px-5 py-10 text-center">
                        <p class="text-sm text-gray-400">No workload data available.</p>
                    </div>

                    <ul v-else class="divide-y divide-gray-50 px-5">
                        <li
                            v-for="member in teamWorkload.slice(0, 6)"
                            :key="member.id"
                            class="py-3.5"
                        >
                            <div class="mb-2 flex items-center justify-between gap-2">
                                <div class="flex items-center gap-2">
                                    <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[9px] font-semibold uppercase text-gray-600">
                                        {{ initials(member.name) }}
                                    </div>
                                    <span class="text-[13px] font-medium text-gray-800">{{ member.name }}</span>
                                </div>
                                <div class="flex items-center gap-2 text-[11px] text-gray-400">
                                    <span>{{ member.pending_tasks || 0 }} tasks</span>
                                    <span class="font-semibold text-gray-600">
                                        {{ workloadPercent(member) }}%
                                    </span>
                                </div>
                            </div>
                            <div class="h-1 w-full overflow-hidden rounded-full bg-gray-100">
                                <div
                                    class="h-1 rounded-full bg-gray-800 transition-all duration-500"
                                    :style="{ width: `${workloadPercent(member)}%` }"
                                />
                            </div>
                        </li>
                    </ul>
                </div>
            </section>

        </div>
    </AppLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Link, usePage, router } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import { usePermissions } from '@/Composables/usePermissions'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import AppLayout from '@/Layouts/AppLayout.vue'
import {
    ClipboardDocumentListIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    EyeIcon,
    PlusIcon,
} from '@heroicons/vue/24/outline'

dayjs.extend(relativeTime)

const page = usePage()

const props = defineProps<{
    stats: any
    role_data: Record<string, any>
    current_projects: any[]
    recent_activities: any[]
}>()

const { can } = usePermissions()

function canApproveTask(task: any) {
    const user = page.props.auth.user as any
    if (!user) return false
    if (user.is_super_admin) return true
    if (!can('tasks.approve')) return false
    return task.approver_id === user.id || user.role === 'project-manager' || user.role === 'team-lead'
}

function approveTask(taskId: number) {
    router.post(route('tasks.approve', taskId), {}, {
        preserveScroll: true,
    })
}

// ── Auth ──────────────────────────────────────────────────────
const role = computed(() => (page.props.auth.user as any)?.role ?? 'employee')
const userName = computed(() => (page.props.auth.user as any)?.name?.split(' ')[0] ?? 'there')

// ── Greeting ──────────────────────────────────────────────────
const greeting = computed(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
})

// ── KPI Stats ─────────────────────────────────────────────────
const statsList = computed(() => [
    {
        label: 'Assigned Tasks',
        value: props.stats.assigned_tasks,
        icon: ClipboardDocumentListIcon,
        route: route('tasks.index'),
    },
    {
        label: 'Completed',
        value: props.stats.completed_tasks,
        icon: CheckCircleIcon,
        route: route('tasks.index'),
    },
    {
        label: 'Overdue',
        value: props.stats.overdue_tasks,
        icon: ExclamationTriangleIcon,
        route: route('tasks.index'),
    },
    {
        label: 'In Review',
        value: props.stats.in_review_tasks,
        icon: EyeIcon,
        route: route('tasks.index'),
    },
])

// ── Primary Panel (role-aware) ────────────────────────────────
const primaryPanelTitle = computed(() => {
    if (role.value === 'project-manager') return 'Pending Tasks'
    if (role.value === 'team-lead') return 'Review Queue'
    if (role.value === 'super-admin') return 'Pending Tasks'
    return 'My Tasks'
})

const primaryItems = computed(() => {
    if (role.value === 'project-manager') return props.role_data.pending_approvals || []
    if (role.value === 'team-lead') return props.role_data.review_tasks || []
    // For super-admin show pending approvals (tasks needing action), fallback to delayed
    if (role.value === 'super-admin') return props.role_data.pending_approvals || []
    return props.role_data.my_tasks || []
})

// ── Team Workload ─────────────────────────────────────────────
const teamWorkload = computed(() => {
    return props.role_data.team_workload || props.role_data.workload || []
})

// ── Helpers ───────────────────────────────────────────────────
function formatDate(date: string) {
    if (!date) return '—'
    return dayjs(date).format('MMM D')
}

function formatStatus(status: string) {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function initials(name: string) {
    if (!name) return '?'
    return name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
}

function workloadPercent(member: any) {
    const tasks = member.pending_tasks || 0
    return Math.min(Math.round(tasks * 10), 100)
}

function taskDotClass(item: any) {
    const s = item.status || ''
    if (s === 'blocked') return 'bg-gray-600'
    if (s === 'in_review') return 'bg-gray-400'
    if (s === 'in_progress') return 'bg-gray-700'
    if (item.is_overdue) return 'bg-gray-500'
    return 'bg-gray-300'
}

function deadlineDotClass(task: any) {
    if (!task.due_date) return 'bg-gray-300'
    const diff = dayjs(task.due_date).diff(dayjs(), 'day')
    if (diff <= 1) return 'bg-gray-700'
    if (diff <= 3) return 'bg-gray-500'
    return 'bg-gray-300'
}
</script>