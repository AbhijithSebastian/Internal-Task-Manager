<template>
    <AppLayout>
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900">Reports</h2>
                    <p class="mt-1 text-sm text-gray-600">Analytics and insights across projects</p>
                </div>
                <div class="flex items-center gap-3">
                    <a :href="exportUrl('csv')" class="btn-secondary btn-sm">CSV</a>
                    <a :href="exportUrl('xlsx')" class="btn-secondary btn-sm">Excel</a>
                    <a :href="exportUrl('pdf')" class="btn-secondary btn-sm">PDF</a>
                    <a :href="exportUrl('html')" target="_blank" class="btn-secondary btn-sm">Print HTML</a>
                </div>
            </div>

            <div class="card">
                <div class="border-b border-gray-200 bg-gray-50 px-6 py-4">
                    <div class="flex flex-wrap gap-4">
                        <select v-model="filters.project_id" class="input max-w-[200px]" @change="applyFilters">
                            <option value="">All Projects</option>
                            <option v-for="p in available_projects" :key="p.id" :value="p.id">{{ p.name }}</option>
                        </select>
                        <select v-model="filters.user_id" class="input max-w-[200px]" @change="applyFilters">
                            <option value="">All Users</option>
                            <option v-for="u in available_users" :key="u.id" :value="u.id">{{ u.name }}</option>
                        </select>
                        <input v-model="filters.date_from" type="date" class="input max-w-[180px]" @change="applyFilters" placeholder="From">
                        <input v-model="filters.date_to" type="date" class="input max-w-[180px]" @change="applyFilters" placeholder="To">
                        <button v-if="hasActiveFilters" class="btn-secondary btn-sm" @click="clearFilters">Clear</button>
                    </div>
                </div>

                <div class="border-b border-gray-200">
                    <nav class="flex overflow-x-auto px-6" role="tablist">
                        <button v-for="tab in tabs" :key="tab.key" :class="['px-4 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap', activeTab === tab.key ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300']" @click="switchTab(tab.key)">
                            {{ tab.label }}
                        </button>
                    </nav>
                </div>

                <div class="p-6">
                    <div v-if="loading" class="text-sm text-gray-500">Loading...</div>

                    <template v-else-if="activeTab === 'task_completion'">
                        <div v-if="reports.task_completion.length === 0" class="text-sm text-gray-500">No data for the selected filters.</div>
                        <table v-else class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50"><tr>
                                <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Project</th>
                                <th class="px-4 py-2 text-center text-xs font-medium uppercase text-gray-500">Total</th>
                                <th class="px-4 py-2 text-center text-xs font-medium uppercase text-gray-500">Completed</th>
                                <th class="px-4 py-2 text-center text-xs font-medium uppercase text-gray-500">Pending</th>
                                <th class="px-4 py-2 text-center text-xs font-medium uppercase text-gray-500">Rate</th>
                            </tr></thead>
                            <tbody class="divide-y divide-gray-200">
                                <tr v-for="r in reports.task_completion" :key="r.project_id" class="hover:bg-gray-50">
                                    <td class="px-4 py-2 text-sm font-medium text-gray-900">{{ r.project_name }}</td>
                                    <td class="px-4 py-2 text-center text-sm text-gray-600">{{ r.total_tasks }}</td>
                                    <td class="px-4 py-2 text-center text-sm" :class="r.completed_tasks > 0 ? 'text-green-600 font-medium' : 'text-gray-600'">{{ r.completed_tasks }}</td>
                                    <td class="px-4 py-2 text-center text-sm text-gray-600">{{ r.pending_tasks }}</td>
                                    <td class="px-4 py-2 text-center text-sm">
                                        <div class="flex items-center justify-center gap-2">
                                            <div class="h-2 w-20 rounded-full bg-gray-200">
                                                <div class="h-2 rounded-full" :class="rateColor(r.completion_rate)" :style="{ width: r.completion_rate + '%' }" />
                                            </div>
                                            <span class="text-xs font-medium" :class="rateTextColor(r.completion_rate)">{{ r.completion_rate }}%</span>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </template>

                    <template v-else-if="activeTab === 'overdue_analysis'">
                        <div v-if="reports.overdue_analysis.length === 0" class="text-sm text-gray-500">No overdue tasks for the selected filters.</div>
                        <table v-else class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50"><tr>
                                <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Task</th>
                                <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Project</th>
                                <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Assignee</th>
                                <th class="px-4 py-2 text-center text-xs font-medium uppercase text-gray-500">Due</th>
                                <th class="px-4 py-2 text-center text-xs font-medium uppercase text-gray-500">Days Overdue</th>
                                <th class="px-4 py-2 text-center text-xs font-medium uppercase text-gray-500">Priority</th>
                            </tr></thead>
                            <tbody class="divide-y divide-gray-200">
                                <tr v-for="r in reports.overdue_analysis" :key="r.task_id" class="hover:bg-gray-50">
                                    <td class="px-4 py-2 text-sm font-medium text-gray-900">{{ r.task_title }}</td>
                                    <td class="px-4 py-2 text-sm text-gray-600">{{ r.project_name }}</td>
                                    <td class="px-4 py-2 text-sm text-gray-600">{{ r.assignee_name ?? 'Unassigned' }}</td>
                                    <td class="px-4 py-2 text-center text-sm text-red-600">{{ r.due_date }}</td>
                                    <td class="px-4 py-2 text-center">
                                        <Badge :variant="r.days_overdue > 7 ? 'danger' : 'warning'">{{ r.days_overdue }}d</Badge>
                                    </td>
                                    <td class="px-4 py-2 text-center">
                                        <Badge :variant="priorityVariant(r.priority)">{{ r.priority_label }}</Badge>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </template>

                    <template v-else-if="activeTab === 'team_productivity'">
                        <div v-if="reports.team_productivity.length === 0" class="text-sm text-gray-500">No completed tasks for the selected filters.</div>
                        <table v-else class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50"><tr>
                                <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">User</th>
                                <th class="px-4 py-2 text-center text-xs font-medium uppercase text-gray-500">Tasks Completed</th>
                            </tr></thead>
                            <tbody class="divide-y divide-gray-200">
                                <tr v-for="r in reports.team_productivity" :key="r.user_id" class="hover:bg-gray-50">
                                    <td class="px-4 py-2 text-sm font-medium text-gray-900">{{ r.user_name }}</td>
                                    <td class="px-4 py-2 text-center text-sm">
                                        <Badge variant="success">{{ r.completed_tasks }}</Badge>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </template>

                    <template v-else-if="activeTab === 'project_health'">
                        <div v-if="reports.project_health.length === 0" class="text-sm text-gray-500">No project data available.</div>
                        <div v-else class="space-y-6">
                            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <div v-for="p in reports.project_health" :key="p.project_id" class="rounded-lg border p-4" :class="healthBorder(p.health_score)">
                                    <div class="flex items-center justify-between mb-2">
                                        <h4 class="text-sm font-semibold text-gray-900">{{ p.project_name }}</h4>
                                        <Badge :variant="healthBadge(p.health_score)">{{ healthLabel(p.health_score) }}</Badge>
                                    </div>
                                    <div class="h-2 rounded-full bg-gray-200 mb-3">
                                        <div class="h-2 rounded-full bg-primary-500 transition-all" :style="{ width: p.completion_rate + '%' }" />
                                    </div>
                                    <div class="grid grid-cols-3 gap-2 text-center text-xs">
                                        <div><span class="block font-medium text-gray-900">{{ p.completed_tasks }}</span>Done</div>
                                        <div><span class="block font-medium text-yellow-600">{{ p.in_progress_tasks }}</span>In Progress</div>
                                        <div><span class="block font-medium text-red-600">{{ p.blocked_tasks + p.overdue_tasks }}</span>Issues</div>
                                    </div>
                                </div>
                            </div>
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50"><tr>
                                    <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Project</th>
                                    <th class="px-4 py-2 text-center text-xs font-medium uppercase text-gray-500">Total</th>
                                    <th class="px-4 py-2 text-center text-xs font-medium uppercase text-gray-500">Done</th>
                                    <th class="px-4 py-2 text-center text-xs font-medium uppercase text-gray-500">Blocked</th>
                                    <th class="px-4 py-2 text-center text-xs font-medium uppercase text-gray-500">Overdue</th>
                                    <th class="px-4 py-2 text-center text-xs font-medium uppercase text-gray-500">In Progress</th>
                                    <th class="px-4 py-2 text-center text-xs font-medium uppercase text-gray-500">Rate</th>
                                    <th class="px-4 py-2 text-center text-xs font-medium uppercase text-gray-500">Health</th>
                                </tr></thead>
                                <tbody class="divide-y divide-gray-200">
                                    <tr v-for="p in reports.project_health" :key="p.project_id" class="hover:bg-gray-50">
                                        <td class="px-4 py-2 text-sm font-medium text-gray-900">{{ p.project_name }}</td>
                                        <td class="px-4 py-2 text-center text-sm text-gray-600">{{ p.total_tasks }}</td>
                                        <td class="px-4 py-2 text-center text-sm text-green-600 font-medium">{{ p.completed_tasks }}</td>
                                        <td class="px-4 py-2 text-center text-sm" :class="p.blocked_tasks > 0 ? 'text-red-600 font-medium' : 'text-gray-600'">{{ p.blocked_tasks }}</td>
                                        <td class="px-4 py-2 text-center text-sm" :class="p.overdue_tasks > 0 ? 'text-red-600 font-medium' : 'text-gray-600'">{{ p.overdue_tasks }}</td>
                                        <td class="px-4 py-2 text-center text-sm text-yellow-600">{{ p.in_progress_tasks }}</td>
                                        <td class="px-4 py-2 text-center text-sm">{{ p.completion_rate }}%</td>
                                        <td class="px-4 py-2 text-center">
                                            <Badge :variant="healthBadge(p.health_score)">{{ healthLabel(p.health_score) }}</Badge>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </template>

                    <template v-else-if="activeTab === 'workload_distribution'">
                        <div v-if="reports.workload_distribution.length === 0" class="text-sm text-gray-500">No workload data.</div>
                        <table v-else class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50"><tr>
                                <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">User</th>
                                <th v-for="s in statusLabels" :key="s.value" class="px-4 py-2 text-center text-xs font-medium uppercase text-gray-500">{{ s.label }}</th>
                                <th class="px-4 py-2 text-center text-xs font-medium uppercase text-gray-500">Total</th>
                            </tr></thead>
                            <tbody class="divide-y divide-gray-200">
                                <tr v-for="u in reports.workload_distribution" :key="u.user_id" class="hover:bg-gray-50">
                                    <td class="px-4 py-2 text-sm font-medium text-gray-900">{{ u.user_name }}</td>
                                    <td v-for="s in statusLabels" :key="s.value" class="px-4 py-2 text-center text-sm">
                                        <Badge v-if="u[s.value + '_tasks'] > 0" :variant="statusBadge(s.value)">
                                            {{ u[s.value + '_tasks'] }}
                                        </Badge>
                                        <span v-else class="text-gray-300">0</span>
                                    </td>
                                    <td class="px-4 py-2 text-center text-sm font-medium text-gray-900">{{ u.total_tasks }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </template>

                    <template v-else-if="activeTab === 'weekly_summary'">
                        <div v-if="reports.weekly_summary.length === 0" class="text-sm text-gray-500">No data for the selected week.</div>
                        <div v-else>
                            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                                <div class="rounded-lg border bg-green-50 p-4 text-center">
                                    <p class="text-2xl font-bold text-green-700">{{ reports.weekly_summary[0].tasks_completed }}</p>
                                    <p class="text-xs text-green-600">Tasks Completed</p>
                                </div>
                                <div class="rounded-lg border bg-blue-50 p-4 text-center">
                                    <p class="text-2xl font-bold text-blue-700">{{ reports.weekly_summary[0].tasks_created }}</p>
                                    <p class="text-xs text-blue-600">Tasks Created</p>
                                </div>
                                <div class="rounded-lg border bg-yellow-50 p-4 text-center">
                                    <p class="text-2xl font-bold text-yellow-700">{{ reports.weekly_summary[0].comments_added }}</p>
                                    <p class="text-xs text-yellow-600">Comments Added</p>
                                </div>
                                <div class="rounded-lg border bg-red-50 p-4 text-center">
                                    <p class="text-2xl font-bold text-red-700">{{ reports.weekly_summary[0].tasks_overdue }}</p>
                                    <p class="text-xs text-red-600">Overdue Tasks</p>
                                </div>
                            </div>
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50"><tr>
                                    <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Week</th>
                                    <th class="px-4 py-2 text-center text-xs font-medium uppercase text-gray-500">Created</th>
                                    <th class="px-4 py-2 text-center text-xs font-medium uppercase text-gray-500">Completed</th>
                                    <th class="px-4 py-2 text-center text-xs font-medium uppercase text-gray-500">Overdue</th>
                                    <th class="px-4 py-2 text-center text-xs font-medium uppercase text-gray-500">Comments</th>
                                </tr></thead>
                                <tbody class="divide-y divide-gray-200">
                                    <tr v-for="r in reports.weekly_summary" :key="r.date_from" class="hover:bg-gray-50">
                                        <td class="px-4 py-2 text-sm text-gray-600">{{ r.date_from }} &mdash; {{ r.date_to }}</td>
                                        <td class="px-4 py-2 text-center text-sm text-gray-900">{{ r.tasks_created }}</td>
                                        <td class="px-4 py-2 text-center text-sm text-green-600 font-medium">{{ r.tasks_completed }}</td>
                                        <td class="px-4 py-2 text-center text-sm" :class="r.tasks_overdue > 0 ? 'text-red-600 font-medium' : 'text-gray-600'">{{ r.tasks_overdue }}</td>
                                        <td class="px-4 py-2 text-center text-sm text-gray-900">{{ r.comments_added }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </template>

                    <template v-else-if="activeTab === 'meeting_logs'">
                        <div v-if="!reports.meeting_logs || reports.meeting_logs.length === 0" class="text-sm text-gray-500">No meeting logs found.</div>
                        <table v-else class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50"><tr>
                                <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                                <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Project</th>
                                <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Title</th>
                                <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Author</th>
                            </tr></thead>
                            <tbody class="divide-y divide-gray-200">
                                <tr v-for="r in reports.meeting_logs" :key="r.id" class="hover:bg-gray-50">
                                    <td class="px-4 py-2 text-sm text-gray-600 whitespace-nowrap">{{ r.meeting_date }}</td>
                                    <td class="px-4 py-2 text-sm font-medium text-gray-900">{{ r.project_name }}</td>
                                    <td class="px-4 py-2 text-sm text-gray-900">{{ r.title }}</td>
                                    <td class="px-4 py-2 text-sm text-gray-600">{{ r.author_name }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </template>
                </div>
            </div>
        </div>
    </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { router } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import AppLayout from '@/Layouts/AppLayout.vue'
import Badge from '@/Components/Badge.vue'

const props = defineProps<{
    reports: Record<string, any[]>
    filters: { tab?: string; project_id?: string; user_id?: string; date_from?: string; date_to?: string }
    available_projects: any[]
    available_users: any[]
}>()

const activeTab = ref(props.filters?.tab ?? 'task_completion')
const loading = ref(false)

const filters = reactive({
    project_id: props.filters?.project_id ?? '',
    user_id: props.filters?.user_id ?? '',
    date_from: props.filters?.date_from ?? '',
    date_to: props.filters?.date_to ?? '',
})

const tabs = [
    { key: 'task_completion', label: 'Task Completion' },
    { key: 'overdue_analysis', label: 'Overdue Analysis' },
    { key: 'team_productivity', label: 'Team Productivity' },
    { key: 'project_health', label: 'Project Health' },
    { key: 'workload_distribution', label: 'Workload Distribution' },
    { key: 'weekly_summary', label: 'Weekly Summary' },
    { key: 'meeting_logs', label: 'Meeting Logs' },
]

const statusLabels = [
    { value: 'backlog', label: 'Backlog' },
    { value: 'todo', label: 'Todo' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'in_review', label: 'In Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'done', label: 'Done' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'blocked', label: 'Blocked' },
]

const hasActiveFilters = computed(() =>
    filters.project_id || filters.user_id || filters.date_from || filters.date_to
)

function exportUrl(format: string): string {
    const params = new URLSearchParams({ tab: activeTab.value, format })
    if (filters.project_id) params.set('project_id', filters.project_id)
    if (filters.user_id) params.set('user_id', filters.user_id)
    if (filters.date_from) params.set('date_from', filters.date_from)
    if (filters.date_to) params.set('date_to', filters.date_to)
    return route('reports.export') + '?' + params.toString()
}

function switchTab(tab: string) {
    activeTab.value = tab
}

function applyFilters() {
    loading.value = true
    const params: Record<string, string> = { tab: activeTab.value }
    if (filters.project_id) params.project_id = filters.project_id
    if (filters.user_id) params.user_id = filters.user_id
    if (filters.date_from) params.date_from = filters.date_from
    if (filters.date_to) params.date_to = filters.date_to
    router.get(route('reports.index'), params, { preserveState: true, onFinish: () => { loading.value = false } })
}

function clearFilters() {
    filters.project_id = ''
    filters.user_id = ''
    filters.date_from = ''
    filters.date_to = ''
    applyFilters()
}

function priorityVariant(p: string): 'danger' | 'warning' | 'info' | 'neutral' {
    return { urgent: 'danger', high: 'warning', medium: 'info', low: 'neutral' }[p] ?? 'neutral'
}

function statusBadge(s: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
    const map: Record<string, any> = {
        done: 'success', approved: 'success',
        in_review: 'warning', in_progress: 'info',
        backlog: 'neutral', todo: 'neutral',
        cancelled: 'danger', blocked: 'danger',
    }
    return map[s] ?? 'neutral'
}

function rateColor(rate: number): string {
    if (rate >= 80) return 'bg-green-500'
    if (rate >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
}

function rateTextColor(rate: number): string {
    if (rate >= 80) return 'text-green-700'
    if (rate >= 50) return 'text-yellow-700'
    return 'text-red-700'
}

function healthScore(score: number): number {
    return score
}

function healthBorder(score: number): string {
    if (score >= 80) return 'border-green-200 bg-green-50/30'
    if (score >= 50) return 'border-yellow-200 bg-yellow-50/30'
    return 'border-red-200 bg-red-50/30'
}

function healthBadge(score: number): 'success' | 'warning' | 'danger' {
    if (score >= 80) return 'success'
    if (score >= 50) return 'warning'
    return 'danger'
}

function healthLabel(score: number): string {
    if (score >= 80) return 'Healthy'
    if (score >= 50) return 'At Risk'
    return 'Critical'
}
</script>
