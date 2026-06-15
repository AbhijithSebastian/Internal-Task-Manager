<template>
    <AppLayout>
        <div class="space-y-8">
            <!-- ═══ Greeting + New Task ═══ -->
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-text-secondary">
                        {{ greeting }}, {{ userName }}
                    </p>
                    <h1 class="text-2xl font-bold text-text-primary mt-1">What needs attention today?</h1>
                </div>
                <div class="flex items-center gap-2">
                    <button class="btn-secondary btn-sm" @click="showWidgetSettings = true">
                        <AdjustmentsHorizontalIcon class="h-4 w-4" />
                    </button>
                    <Link
                        :href="route('tasks.create')"
                        class="btn-primary"
                    >
                        <PlusIcon class="h-4 w-4 mr-1.5" />
                        New Task
                    </Link>
                </div>
            </div>

            <!-- ═══ KPI Grid ═══ -->
            <div v-if="widgetsVisible.kpi" class="grid grid-cols-2 gap-6 xl:grid-cols-4">
                <Link
                    v-for="stat in statsList"
                    :key="stat.label"
                    :href="stat.route"
                    class="kpi-card group"
                >
                    <div class="flex items-start justify-between">
                        <div class="rounded-lg bg-gray-100 p-2.5 transition-colors group-hover:bg-brand-primary-50">
                            <component :is="stat.icon" class="h-4 w-4 text-text-secondary group-hover:text-brand-primary-500 transition-colors" />
                        </div>
                        <span class="text-xs text-text-secondary/60">This week</span>
                    </div>
                    <p class="kpi-value">{{ stat.value ?? '—' }}</p>
                    <p class="kpi-label">{{ stat.label }}</p>
                    <div class="mt-2">
                        <span :class="stat.trend >= 0 ? 'kpi-trend-up' : 'kpi-trend-down'">
                            <ArrowTrendingUpIcon v-if="stat.trend >= 0" class="h-3 w-3" />
                            <ArrowTrendingDownIcon v-else class="h-3 w-3" />
                            {{ Math.abs(stat.trend || 0) }}%
                        </span>
                    </div>
                </Link>
            </div>

            <!-- ═══ Priority Tasks + Projects ═══ -->
            <div v-if="widgetsVisible.priorityTasks || widgetsVisible.projects" class="grid grid-cols-1 gap-6 xl:grid-cols-12">
                <!-- Priority Tasks -->
                <div v-if="widgetsVisible.priorityTasks" :class="widgetsVisible.projects ? 'card xl:col-span-7' : 'card xl:col-span-12'">
                    <div class="card-header">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="text-card-title">{{ primaryPanelTitle }}</h3>
                                <p class="text-sm text-text-secondary mt-0.5">Priority work requiring attention</p>
                            </div>
                            <Link :href="route('tasks.index')" class="text-sm font-medium text-brand-primary-500 hover:text-brand-primary-600 transition-colors">
                                View all &rarr;
                            </Link>
                        </div>
                    </div>

                    <div v-if="primaryItems.length === 0" class="empty-state">
                        <div class="empty-state-icon">
                            <CheckCircleIcon class="h-6 w-6 text-text-secondary" />
                        </div>
                        <p class="empty-state-title">Nothing urgent right now</p>
                        <p class="empty-state-text">All tasks are on track.</p>
                    </div>

                    <ul v-else class="divide-y divide-border">
                        <li
                            v-for="item in primaryItems.slice(0, 8)"
                            :key="item.id"
                            class="group flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-gray-50/50"
                        >
                            <div class="flex min-w-0 items-center gap-3">
                                <span class="h-2 w-2 shrink-0 rounded-full" :class="taskDotClass(item)" />
                                <div class="min-w-0">
                                    <Link
                                        :href="route('tasks.show', item.id)"
                                        class="block truncate text-sm font-medium text-text-primary transition-colors hover:text-brand-primary-500"
                                    >
                                        {{ item.title }}
                                    </Link>
                                    <p class="mt-0.5 truncate text-xs text-text-secondary">
                                        {{ item.project?.name || 'Internal Task' }}
                                    </p>
                                </div>
                            </div>

                            <div class="flex shrink-0 items-center gap-2">
                                <span v-if="item.priority" class="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-text-secondary capitalize">
                                    {{ item.priority }}
                                </span>
                                <span :class="'status-' + (item.status || 'draft')" class="rounded-md px-2 py-0.5">
                                    {{ formatStatus(item.status) }}
                                </span>
                                <span v-if="item.due_date" class="text-xs text-text-secondary tabular-nums">
                                    {{ formatDate(item.due_date) }}
                                </span>
                                <button
                                    v-if="item.status === 'in_review' && canApproveTask(item)"
                                    @click.stop="approveTask(item.id)"
                                    class="btn-primary btn-sm"
                                >
                                    Approve
                                </button>
                            </div>
                        </li>
                    </ul>
                </div>

                <!-- Current Projects -->
                <div v-if="widgetsVisible.projects" :class="widgetsVisible.priorityTasks ? 'card xl:col-span-5' : 'card xl:col-span-12'">
                    <div class="card-header">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="text-card-title">Current Projects</h3>
                                <p class="text-sm text-text-secondary mt-0.5">Active projects you are involved in</p>
                            </div>
                            <Link :href="route('projects.index')" class="text-sm font-medium text-brand-primary-500 hover:text-brand-primary-600 transition-colors">
                                View all &rarr;
                            </Link>
                        </div>
                    </div>

                    <div v-if="current_projects.length === 0" class="empty-state">
                        <p class="empty-state-text">No active projects.</p>
                    </div>

                    <ul v-else class="divide-y divide-border">
                        <li
                            v-for="project in current_projects.slice(0, 8)"
                            :key="project.id"
                            class="px-6 py-4 transition-colors hover:bg-gray-50/50"
                        >
                            <div class="flex items-start justify-between gap-3 mb-2">
                                <div class="min-w-0">
                                    <Link
                                        :href="route('projects.show', project.id)"
                                        class="block truncate text-sm font-semibold text-text-primary transition-colors hover:text-brand-primary-500"
                                    >
                                        {{ project.name }}
                                    </Link>
                                    <p v-if="project.project_manager" class="mt-0.5 text-xs text-text-secondary">
                                        PM: {{ project.project_manager.name }}
                                    </p>
                                </div>
                                <span class="shrink-0 text-sm font-semibold tabular-nums text-text-primary">
                                    {{ project.completion_rate !== null && project.completion_rate !== undefined ? `${project.completion_rate}%` : '0%' }}
                                </span>
                            </div>
                            <div class="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                                <div
                                    class="h-2 rounded-full bg-brand-primary-500 transition-all duration-500"
                                    :style="{ width: `${project.completion_rate ?? 0}%` }"
                                />
                            </div>
                        </li>
                    </ul>
                </div>
            </div>

            <!-- ═══ Recent Activity + Team Workload ═══ -->
            <div v-if="widgetsVisible.activity || widgetsVisible.workload" class="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <!-- Recent Activity -->
                <div v-if="widgetsVisible.activity" :class="widgetsVisible.workload ? 'card' : 'card xl:col-span-2'">
                    <div class="card-header">
                        <h3 class="text-card-title">Recent Activity</h3>
                        <p class="text-sm text-text-secondary mt-0.5">Latest updates from your workspace</p>
                    </div>

                    <div v-if="recent_activities.length === 0" class="empty-state">
                        <p class="empty-state-text">No recent activity.</p>
                    </div>

                    <ul v-else class="divide-y divide-border">
                        <li
                            v-for="activity in recent_activities.slice(0, 6)"
                            :key="activity.id"
                            class="flex gap-4 px-6 py-4"
                        >
                            <div class="flex flex-col items-center">
                                <span class="mt-[5px] h-2 w-2 shrink-0 rounded-full bg-gray-300" />
                            </div>
                            <div class="min-w-0 flex-1">
                                <p class="text-sm leading-snug text-text-primary">
                                    {{ activity.description }}
                                </p>
                                <p class="mt-1 text-xs text-text-secondary">
                                    {{ dayjs(activity.created_at).fromNow() }}
                                </p>
                            </div>
                        </li>
                    </ul>
                </div>

                <!-- Team Workload -->
                <div v-if="widgetsVisible.workload" :class="widgetsVisible.activity ? 'card' : 'card xl:col-span-2'">
                    <div class="card-header">
                        <h3 class="text-card-title">Team Workload</h3>
                        <p class="text-sm text-text-secondary mt-0.5">Current task distribution</p>
                    </div>

                    <div v-if="teamWorkload.length === 0" class="empty-state">
                        <p class="empty-state-text">No workload data available.</p>
                    </div>

                    <ul v-else class="divide-y divide-border px-6">
                        <li
                            v-for="member in teamWorkload.slice(0, 6)"
                            :key="member.id"
                            class="py-4"
                        >
                            <div class="mb-2 flex items-center justify-between gap-2">
                                <div class="flex items-center gap-3">
                                    <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-primary-50 text-sm font-semibold text-brand-primary-600">
                                        {{ initials(member.name) }}
                                    </div>
                                    <span class="text-sm font-medium text-text-primary">{{ member.name }}</span>
                                </div>
                                <div class="flex items-center gap-2 text-xs text-text-secondary">
                                    <span>{{ member.pending_tasks || 0 }} tasks</span>
                                    <span class="font-semibold text-text-primary">
                                        {{ workloadPercent(member) }}%
                                    </span>
                                </div>
                            </div>
                            <div class="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                                <div
                                    class="h-2 rounded-full bg-brand-primary-500 transition-all duration-500"
                                    :style="{ width: `${workloadPercent(member)}%` }"
                                />
                            </div>
                        </li>
                    </ul>
                </div>
            </div>

            <Modal :open="showWidgetSettings" @close="showWidgetSettings = false">
                <template #title>Customize Dashboard</template>
                <div class="space-y-4">
                    <p class="text-sm text-text-secondary">Choose which sections to show on your dashboard.</p>
                    <div class="space-y-3">
                        <label
                            v-for="widget in widgetOptions"
                            :key="widget.key"
                            class="flex items-center justify-between rounded-card border border-border bg-page px-4 py-3 cursor-pointer hover:bg-gray-50"
                        >
                            <div class="flex items-center gap-3">
                                <component :is="widget.icon" class="h-5 w-5 text-text-secondary" />
                                <div>
                                    <p class="text-sm font-medium text-text-primary">{{ widget.label }}</p>
                                    <p class="text-xs text-text-secondary">{{ widget.description }}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                :class="widgetsVisible[widget.key] ? 'bg-brand-primary-500' : 'bg-gray-200'"
                                class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200"
                                @click="toggleWidget(widget.key)"
                            >
                                <span
                                    :class="widgetsVisible[widget.key] ? 'translate-x-4' : 'translate-x-0'"
                                    class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200"
                                />
                            </button>
                        </label>
                    </div>
                </div>
                <template #footer>
                    <div class="flex justify-end">
                        <button class="btn-primary btn-sm" @click="showWidgetSettings = false">Done</button>
                    </div>
                </template>
            </Modal>
        </div>
    </AppLayout>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue'
import { Link, usePage, router } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import { usePermissions } from '@/Composables/usePermissions'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import AppLayout from '@/Layouts/AppLayout.vue'
import Modal from '@/Components/Modal.vue'
import {
    ClipboardDocumentListIcon,
    CheckCircleIcon,
    EyeIcon,
    FolderIcon,
    PlusIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    AdjustmentsHorizontalIcon,
    Squares2X2Icon,
    ListBulletIcon,
    ClockIcon,
    UserGroupIcon,
} from '@heroicons/vue/24/outline'

dayjs.extend(relativeTime)

const WIDGET_STORAGE_KEY = 'dashboard_widgets'

function getDefaultWidgets() {
    const userRole = (usePage().props.auth.user as any)?.role
    return {
        kpi: true,
        priorityTasks: true,
        projects: true,
        activity: true,
        workload: userRole === 'super-admin' || userRole === 'project-manager',
    }
}

function loadWidgetPreferences(): Record<string, boolean> {
    const defaults = getDefaultWidgets()
    try {
        const stored = localStorage.getItem(WIDGET_STORAGE_KEY)
        if (stored) {
            const parsed = JSON.parse(stored)
            return { ...defaults, ...parsed }
        }
    } catch {}
    return { ...defaults }
}

function saveWidgetPreferences(prefs: Record<string, boolean>) {
    try {
        localStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(prefs))
    } catch {}
}

const showWidgetSettings = ref(false)

const widgetsVisible = reactive(loadWidgetPreferences())

const widgetOptions = [
    { key: 'kpi', label: 'KPI Metrics', description: 'Active Projects, Due This Week, Pending Reviews', icon: Squares2X2Icon },
    { key: 'priorityTasks', label: 'Priority Tasks', description: 'High-priority tasks requiring attention', icon: ListBulletIcon },
    { key: 'projects', label: 'Current Projects', description: 'Active projects with progress bars', icon: FolderIcon },
    { key: 'activity', label: 'Recent Activity', description: 'Latest workspace activity feed', icon: ClockIcon },
    { key: 'workload', label: 'Team Workload', description: 'Task distribution across team members', icon: UserGroupIcon },
]

function toggleWidget(key: string) {
    widgetsVisible[key] = !widgetsVisible[key]
    saveWidgetPreferences({ ...widgetsVisible })
}

onMounted(() => {
    const prefs = loadWidgetPreferences()
    Object.assign(widgetsVisible, prefs)
})

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

const role = computed(() => (page.props.auth.user as any)?.role ?? 'employee')
const userName = computed(() => (page.props.auth.user as any)?.name?.split(' ')[0] ?? 'there')

const greeting = computed(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
})

const statsList = computed(() => [
    {
        label: 'Active Projects',
        value: props.stats.active_projects,
        icon: FolderIcon,
        trend: props.stats.trends?.active_projects ?? 0,
        route: route('projects.index'),
    },
    {
        label: 'Due This Week',
        value: props.stats.tasks_due_this_week,
        icon: ClipboardDocumentListIcon,
        trend: props.stats.trends?.tasks_due_this_week ?? 0,
        route: route('tasks.index'),
    },
    {
        label: 'Pending Reviews',
        value: props.stats.pending_reviews,
        icon: EyeIcon,
        trend: props.stats.trends?.pending_reviews ?? 0,
        route: route('tasks.index'),
    },
])

const primaryPanelTitle = computed(() => {
    if (role.value === 'project-manager') return 'Pending Tasks'
    if (role.value === 'team-lead') return 'Review Queue'
    if (role.value === 'super-admin') return 'Pending Tasks'
    return 'My Tasks'
})

const primaryItems = computed(() => {
    if (role.value === 'project-manager') return props.role_data.pending_approvals || []
    if (role.value === 'team-lead') return props.role_data.review_tasks || []
    if (role.value === 'super-admin') return props.role_data.pending_approvals || []
    return props.role_data.my_tasks || []
})

const teamWorkload = computed(() => {
    return props.role_data.team_workload || props.role_data.workload || []
})

function formatDate(date: string) {
    if (!date) return '—'
    return dayjs(date).format('MMM D')
}

function formatStatus(status: string) {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function initials(name: string) {
    if (!name) return '?'
    return name.split(' ').slice(0, 2).map((n) => n[0]).join('')
}

function workloadPercent(member: any) {
    const tasks = member.pending_tasks || 0
    return Math.min(Math.round(tasks * 10), 100)
}

function taskDotClass(item: any) {
    const s = item.status || ''
    if (s === 'blocked') return 'bg-danger'
    if (s === 'in_review') return 'bg-warning'
    if (s === 'in_progress') return 'bg-brand-primary-500'
    return 'bg-gray-300'
}
</script>
