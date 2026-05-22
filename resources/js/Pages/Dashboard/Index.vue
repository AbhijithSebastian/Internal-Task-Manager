<template>
    <AppLayout>
        <div class="space-y-8">
            <div>
                <h2 class="text-2xl font-bold text-gray-900">Dashboard</h2>
                <p class="mt-1 text-sm text-gray-600">Welcome back, {{ $page.props.auth.user.name }}</p>
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Link v-for="stat in statsList" :key="stat.label" :href="stat.route" class="card p-6 hover:shadow-md transition-shadow cursor-pointer">
                    <div class="flex items-center gap-4">
                        <component :is="stat.icon" class="h-8 w-8 text-primary-600" />
                        <div>
                            <p class="text-2xl font-bold text-gray-900">{{ stat.value }}</p>
                            <p class="text-sm text-gray-600">{{ stat.label }}</p>
                        </div>
                    </div>
                </Link>
            </div>

            <EmployeeDashboard
                v-if="role === 'employee'"
                :my-tasks="roleData.my_tasks"
                :overdue-tasks="roleData.overdue_tasks"
                :mentions="roleData.mentions"
                :pending-approvals="roleData.pending_approvals"
            />
            <PmDashboard
                v-if="role === 'project-manager'"
                :active-projects="roleData.active_projects"
                :delayed-tasks="roleData.delayed_tasks"
                :pending-approvals="roleData.pending_approvals"
                :workload="roleData.workload"
            />
            <LeadDashboard
                v-if="role === 'team-lead'"
                :team-workload="roleData.team_workload"
                :review-tasks="roleData.review_tasks"
                :blocked-tasks="roleData.blocked_tasks"
            />
            <AdminDashboard
                v-if="role === 'super-admin'"
                :project-progress="roleData.project_progress"
                :status-distribution="roleData.status_distribution"
                :tasks-over-time="roleData.tasks_over_time"
                :team-workload="roleData.team_workload"
            />

            <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div class="card">
                    <div class="card-header">
                        <h3 class="text-base font-semibold text-gray-900">Upcoming Deadlines</h3>
                    </div>
                    <div class="card-body">
                        <div v-if="upcoming_deadlines.length === 0" class="text-sm text-gray-500">No upcoming deadlines.</div>
                        <ul v-else class="divide-y divide-gray-200">
                            <li v-for="task in upcoming_deadlines" :key="task.id" class="flex items-center justify-between py-3">
                                <div class="min-w-0 flex-1">
                                    <Link :href="route('tasks.show', task.id)" class="text-sm font-medium text-gray-900 hover:text-primary-600 truncate block">{{ task.title }}</Link>
                                    <p class="text-xs text-gray-500">{{ task.project?.name }}</p>
                                </div>
                                <Badge :variant="dayjs(task.due_date).diff(dayjs(), 'day') <= 1 ? 'danger' : 'warning'" class="shrink-0 ml-4">
                                    {{ dayjs(task.due_date).format('MMM D, YYYY') }}
                                </Badge>
                            </li>
                        </ul>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="text-base font-semibold text-gray-900">Recent Activity</h3>
                    </div>
                    <div class="card-body">
                        <div v-if="recent_activities.length === 0" class="text-sm text-gray-500">No recent activity.</div>
                        <ul v-else class="divide-y divide-gray-200">
                            <li v-for="activity in recent_activities" :key="activity.id" class="py-3 text-sm text-gray-600">
                                {{ activity.description }}
                                <span class="text-xs text-gray-400">{{ dayjs(activity.created_at).fromNow() }}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </AppLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Link, usePage } from '@inertiajs/vue3'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import AppLayout from '@/Layouts/AppLayout.vue'
import Badge from '@/Components/Badge.vue'
import EmployeeDashboard from './Partials/EmployeeDashboard.vue'
import PmDashboard from './Partials/PmDashboard.vue'
import LeadDashboard from './Partials/LeadDashboard.vue'
import AdminDashboard from './Partials/AdminDashboard.vue'
import { FolderIcon, ClipboardDocumentListIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import { route } from 'ziggy-js'

dayjs.extend(relativeTime)

const page = usePage()

const props = defineProps<{
    stats: {
        active_projects: number
        total_tasks: number
        assigned_tasks: number
        completed_tasks: number
        overdue_tasks: number
        in_review_tasks: number
    }
    role_data: Record<string, any>
    upcoming_deadlines: any[]
    recent_activities: any[]
}>()

const role = computed(() => (page.props.auth.user as any)?.role ?? 'employee')
const roleData = computed(() => props.role_data ?? {})

const statsList = computed(() => [
    { label: 'Active Projects', value: props.stats.active_projects, icon: FolderIcon, route: route('projects.index') },
    { label: 'Assigned Tasks', value: props.stats.assigned_tasks, icon: ClipboardDocumentListIcon, route: route('tasks.index') },
    { label: 'Completed', value: props.stats.completed_tasks, icon: CheckCircleIcon, route: route('tasks.index', { status: 'done' }) },
    { label: 'Overdue', value: props.stats.overdue_tasks, icon: ExclamationTriangleIcon, route: route('tasks.index', { status: 'overdue' }) },
])
</script>
