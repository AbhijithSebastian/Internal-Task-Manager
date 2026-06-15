<template>
    <AppLayout>
        <div class="space-y-6">
            <Breadcrumbs :items="[{ label: 'Reports' }]" />

            <!-- Header -->
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 class="text-2xl font-bold tracking-tight text-text-primary">Reports</h2>
                    <p class="mt-1 text-sm text-text-secondary">Analytics and insights across projects</p>
                </div>
                <div class="flex items-center gap-2">
                    <button @click="openExportPopup(null)" class="btn-primary btn-sm flex items-center gap-1.5">
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Generate Report
                    </button>
                </div>
            </div>

            <!-- Horizontal Filter Bar -->
            <div class="card p-6">
                <div class="flex flex-wrap items-center gap-3">
                    <select v-model="filters.project_id" class="input max-w-[200px]" @change="applyFilters">
                        <option value="">All Projects</option>
                        <option v-for="p in available_projects" :key="p.id" :value="p.id">{{ p.name }}</option>
                    </select>
                    <select v-model="filters.user_id" class="input max-w-[200px]" @change="applyFilters">
                        <option value="">All Users</option>
                        <option v-for="u in available_users" :key="u.id" :value="u.id">{{ u.name }}</option>
                    </select>
                    <div class="flex items-center gap-2">
                        <input v-model="filters.date_from" type="date" class="input" @change="applyFilters" placeholder="From">
                        <span class="text-text-secondary/60 text-xs">to</span>
                        <input v-model="filters.date_to" type="date" class="input" @change="applyFilters" placeholder="To">
                    </div>
                    <button
                        v-if="hasActiveFilters"
                        class="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors ml-2"
                        @click="clearFilters"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            <div class="card overflow-hidden">
                <div class="border-b border-border">
                    <nav class="flex overflow-x-auto px-6" role="tablist">
                        <button v-for="tab in tabs" :key="tab.key" :class="['px-4 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap', activeTab === tab.key ? 'border-brand-primary-500 text-brand-primary-500' : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border']" @click="switchTab(tab.key)">
                            {{ tab.label }}
                        </button>
                    </nav>
                </div>

                <div class="p-6">
                    <div v-if="loading" class="text-sm text-text-secondary">Loading...</div>

                    <template v-else-if="activeTab === 'task_completion'">
                        <div v-if="reports.task_completion.length === 0" class="text-sm text-text-secondary">No data for the selected filters.</div>
                        <div v-else class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-border">
                                <thead class="bg-page"><tr>
                                    <th class="w-10 px-4 py-3">
                                        <input
                                            type="checkbox"
                                            class="h-4 w-4 rounded border-border text-brand-primary-500 focus:ring-brand-primary-500"
                                            :checked="allProjectsSelected"
                                            @change="toggleSelectAllProjects"
                                        >
                                    </th>
                                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Project</th>
                                    <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">Total Tasks</th>
                                    <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">Completed</th>
                                    <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">Pending</th>
                                    <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">Rate</th>
                                    <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-secondary">Actions</th>
                                </tr></thead>
                                <tbody class="divide-y divide-border">
                                    <tr v-for="r in reports.task_completion" :key="r.project_id" class="hover:bg-page/50" :class="{ 'bg-page/30': selectedProjectIds.includes(r.project_id) }">
                                        <td class="w-10 px-4 py-3">
                                            <input
                                                type="checkbox"
                                                class="h-4 w-4 rounded border-border text-brand-primary-500 focus:ring-brand-primary-500"
                                                :checked="selectedProjectIds.includes(r.project_id)"
                                                @change="toggleSelectProject(r.project_id)"
                                            >
                                        </td>
                                        <td class="px-4 py-3 text-sm font-medium text-text-primary">{{ r.project_name }}</td>
                                        <td class="px-4 py-3 text-center text-sm text-text-secondary">{{ r.total_tasks }}</td>
                                        <td class="px-4 py-3 text-center text-sm" :class="r.completed_tasks > 0 ? 'text-success font-medium' : 'text-text-secondary'">{{ r.completed_tasks }}</td>
                                        <td class="px-4 py-3 text-center text-sm text-text-secondary">{{ r.pending_tasks }}</td>
                                        <td class="px-4 py-3 text-center text-sm">
                                            <div class="flex items-center justify-center gap-2">
                                                <div class="h-2 w-20 overflow-hidden rounded-full bg-page">
                                                    <div class="h-2 rounded-full" :class="rateColor(r.completion_rate)" :style="{ width: r.completion_rate + '%' }" />
                                                </div>
                                                <span class="text-xs font-medium" :class="rateTextColor(r.completion_rate)">{{ r.completion_rate }}%</span>
                                            </div>
                                        </td>
                                        <td class="px-4 py-3 text-right space-x-2">
                                            <button @click="openPreview(r.project_id)" class="text-xs font-semibold text-brand-primary-500 hover:text-brand-primary-600 transition-colors">View</button>
                                            <button @click="openExportPopup(r.project_id)" class="text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors">Generate</button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </template>

                    <template v-else-if="activeTab === 'workload_distribution'">
                        <div v-if="reports.workload_distribution.length === 0" class="text-sm text-text-secondary">No workload data.</div>
                        <div v-else class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-border">
                                <thead class="bg-page"><tr>
                                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">User</th>
                                    <th v-for="s in statusLabels" :key="s.value" class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">{{ s.label }}</th>
                                    <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">Total</th>
                                </tr></thead>
                                <tbody class="divide-y divide-border">
                                    <tr v-for="u in reports.workload_distribution" :key="u.user_id" class="hover:bg-page/50">
                                        <td class="px-4 py-3 text-sm font-medium text-text-primary">{{ u.user_name }}</td>
                                        <td v-for="s in statusLabels" :key="s.value" class="px-4 py-3 text-center text-sm">
                                            <Badge v-if="u[s.value + '_tasks'] > 0" :variant="statusBadge(s.value)">
                                                {{ u[s.value + '_tasks'] }}
                                            </Badge>
                                            <span v-else class="text-text-secondary/30">0</span>
                                        </td>
                                        <td class="px-4 py-3 text-center text-sm font-medium text-text-primary">{{ u.total_tasks }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </template>

                    <template v-else-if="activeTab === 'weekly_summary'">
                        <div v-if="reports.weekly_summary.length === 0" class="text-sm text-text-secondary">No data for the selected week.</div>
                        <div v-else>
                            <div class="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
                                <div class="rounded-card border border-border bg-success-50/30 p-6 text-center">
                                    <p class="text-2xl font-bold text-success">{{ reports.weekly_summary[0].tasks_completed }}</p>
                                    <p class="text-xs text-success font-medium mt-1">Tasks Completed</p>
                                </div>
                                <div class="rounded-card border border-border bg-brand-primary-50/30 p-6 text-center">
                                    <p class="text-2xl font-bold text-brand-primary-600">{{ reports.weekly_summary[0].tasks_created }}</p>
                                    <p class="text-xs text-brand-primary-500 font-medium mt-1">Tasks Created</p>
                                </div>
                                <div class="rounded-card border border-border bg-warning-50/30 p-6 text-center">
                                    <p class="text-2xl font-bold text-warning">{{ reports.weekly_summary[0].comments_added }}</p>
                                    <p class="text-xs text-warning font-medium mt-1">Comments Added</p>
                                </div>
                            </div>
                            <div class="overflow-x-auto">
                                <table class="min-w-full divide-y divide-border">
                                    <thead class="bg-page"><tr>
                                        <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Week</th>
                                        <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">Created</th>
                                        <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">Completed</th>
                                        <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">Comments</th>
                                    </tr></thead>
                                    <tbody class="divide-y divide-border">
                                        <tr v-for="r in reports.weekly_summary" :key="r.date_from" class="hover:bg-page/50">
                                            <td class="px-4 py-3 text-sm text-text-secondary">{{ r.date_from }} &mdash; {{ r.date_to }}</td>
                                            <td class="px-4 py-3 text-center text-sm text-text-primary">{{ r.tasks_created }}</td>
                                            <td class="px-4 py-3 text-center text-sm text-success font-medium">{{ r.tasks_completed }}</td>
                                            <td class="px-4 py-3 text-center text-sm text-text-primary">{{ r.comments_added }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </template>

                    <template v-else-if="activeTab === 'meeting_logs'">
                        <div v-if="!reports.meeting_logs || reports.meeting_logs.length === 0" class="text-sm text-text-secondary">No meeting logs found.</div>
                        <div v-else class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-border">
                                <thead class="bg-page"><tr>
                                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Date</th>
                                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Project</th>
                                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Title</th>
                                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Author</th>
                                </tr></thead>
                                <tbody class="divide-y divide-border">
                                    <tr v-for="r in reports.meeting_logs" :key="r.meeting_id" class="hover:bg-page/50">
                                        <td class="px-4 py-3 text-sm text-text-secondary whitespace-nowrap">{{ r.date }}</td>
                                        <td class="px-4 py-3 text-sm font-medium text-text-primary">{{ r.project_name }}</td>
                                        <td class="px-4 py-3 text-sm text-text-primary">{{ r.title }}</td>
                                        <td class="px-4 py-3 text-sm text-text-secondary">{{ r.author_name || 'N/A' }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </template>
                </div>
            </div>
        </div>

        <!-- Floating Bulk Action Bar -->
        <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 translate-y-2"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition-all duration-150 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 translate-y-2"
        >
            <div
                v-if="selectedProjectIds.length > 0"
                class="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 rounded-card border border-border bg-brand-primary-500 px-6 py-3 shadow-lg z-50"
            >
                <span class="text-[13px] font-semibold text-white">
                    {{ selectedProjectIds.length }} projects selected
                </span>
                <div class="mx-2 h-4 w-px bg-white/20" />
                <button
                    class="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[12px] font-semibold text-text-primary transition hover:bg-white/90"
                    @click="openBulkExportPopup"
                >
                    Bulk Export
                </button>
                <button
                    class="text-[12px] font-medium text-white/60 hover:text-white transition"
                    @click="selectedProjectIds = []"
                >
                    Deselect all
                </button>
            </div>
        </Transition>

        <!-- Preview Modal -->
        <div v-if="previewOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div class="bg-white rounded-card max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-card-hover flex flex-col">
                <!-- Modal Header -->
                <div class="px-6 py-4 border-b border-border flex items-center justify-between">
                    <div>
                        <h3 class="text-lg font-bold text-text-primary">Report Preview</h3>
                        <p class="text-xs text-text-secondary">Live summary of project status and details</p>
                    </div>
                    <button @click="previewOpen = false" class="text-text-secondary hover:text-text-primary transition-colors">
                        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <!-- Modal Body -->
                <div class="p-6 overflow-y-auto space-y-6 flex-1">
                    <div v-if="previewLoading" class="flex flex-col items-center justify-center py-12">
                        <svg class="animate-spin h-8 w-8 text-brand-primary-500" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span class="mt-2 text-sm text-text-secondary">Fetching report preview...</span>
                    </div>
                    <div v-else-if="previewData" class="space-y-6">
                        <!-- Project Details Card -->
                        <div class="rounded-card border border-border bg-page p-6">
                            <div class="flex items-start justify-between">
                                <div>
                                    <h4 class="font-bold text-text-primary text-base">{{ previewData.project.name }}</h4>
                                    <p class="text-sm text-text-secondary mt-1">{{ previewData.project.description || 'No description provided.' }}</p>
                                </div>
                                <Badge variant="info" class="text-xs font-semibold">
                                    {{ previewData.project.status_label ?? previewData.project.status }}
                                </Badge>
                            </div>
                            <div class="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                <div><span class="font-medium text-text-secondary/60">Status:</span> <span class="text-text-primary font-semibold ml-1">{{ previewData.project.status }}</span></div>
                                <div><span class="font-medium text-text-secondary/60">Priority:</span> <span class="text-text-primary font-semibold ml-1">{{ previewData.project.priority }}</span></div>
                                <div><span class="font-medium text-text-secondary/60">Start Date:</span> <span class="text-text-primary ml-1">{{ previewData.project.start_date || '—' }}</span></div>
                                <div><span class="font-medium text-text-secondary/60">End Date:</span> <span class="text-text-primary ml-1">{{ previewData.project.end_date || '—' }}</span></div>
                                <div><span class="font-medium text-text-secondary/60">Project Manager:</span> <span class="text-text-primary ml-1">{{ previewData.project.pm || '—' }}</span></div>
                                <div><span class="font-medium text-text-secondary/60">Team Lead:</span> <span class="text-text-primary ml-1">{{ previewData.project.lead || '—' }}</span></div>
                            </div>
                        </div>

                        <!-- Progress Summary -->
                        <div>
                            <h5 class="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Progress Summary</h5>
                            <div class="flex items-center gap-4">
                                <div class="flex-1 bg-page rounded-full h-2.5">
                                    <div class="bg-brand-primary-500 h-2.5 rounded-full" :style="{ width: previewData.progress_summary.completion_rate + '%' }"></div>
                                </div>
                                <span class="text-sm font-semibold text-text-primary">{{ previewData.progress_summary.completion_rate }}%</span>
                            </div>
                            <p class="text-xs text-text-secondary mt-1">{{ previewData.progress_summary.completed_tasks }} of {{ previewData.progress_summary.total_tasks }} tasks completed</p>
                        </div>

                        <!-- Task Status Distribution -->
                        <div>
                            <h5 class="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">Tasks Summary</h5>
                            <div class="grid grid-cols-4 gap-2">
                                <div v-for="(count, status) in previewData.tasks_summary" :key="status" class="bg-page border border-border rounded-card p-2 text-center">
                                    <span class="block text-lg font-bold text-text-primary">{{ count }}</span>
                                    <span class="text-[10px] text-text-secondary capitalize">{{ status.replace('_', ' ') }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Team Summary -->
                        <div>
                            <h5 class="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Team Summary</h5>
                            <div v-if="previewData.team_summary.length === 0" class="text-xs text-text-secondary">No members assigned to this project.</div>
                            <div v-else class="space-y-2">
                                <div v-for="member in previewData.team_summary" :key="member.name" class="flex items-center justify-between text-xs p-2 rounded-card border border-border">
                                    <div class="flex items-center gap-2">
                                        <img :src="member.avatar || 'https://www.gravatar.com/avatar?d=mp'" class="h-6 w-6 rounded-full" alt="">
                                        <span class="font-medium text-text-primary">{{ member.name }}</span>
                                        <span class="text-[10px] text-text-secondary capitalize">({{ member.role }})</span>
                                    </div>
                                    <span class="text-text-secondary">{{ member.assigned_tasks_count }} tasks assigned</span>
                                </div>
                            </div>
                        </div>

                        <!-- Deadlines -->
                        <div>
                            <h5 class="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Deadlines</h5>
                            <div v-if="previewData.deadlines.length === 0" class="text-xs text-text-secondary">No active tasks with deadlines.</div>
                            <div v-else class="space-y-2">
                                <div v-for="task in previewData.deadlines" :key="task.id" class="flex items-center justify-between text-xs p-2 rounded-card border border-border">
                                    <span class="font-medium text-text-primary truncate max-w-[320px]">{{ task.title }}</span>
                                    <div class="flex items-center gap-2">
                                        <span class="text-text-secondary">{{ task.due_date }}</span>
                                        <span class="px-1.5 py-0.5 rounded text-[9px] font-medium capitalize" :class="task.priority === 'urgent' ? 'bg-danger-50 text-danger border border-danger/20' : 'bg-page text-text-secondary border border-border'">{{ task.priority }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Modal Footer -->
                <div class="px-6 py-4 border-t border-border flex justify-end gap-2 bg-page rounded-b-card">
                    <button @click="previewOpen = false" class="btn-secondary btn-sm">Close Preview</button>
                    <button v-if="previewData" @click="previewOpen = false; openExportPopup(previewData.project.id)" class="btn-primary btn-sm">Export Report</button>
                </div>
            </div>
        </div>

        <!-- Export Format Modal -->
        <div v-if="exportOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div class="bg-white rounded-card max-w-md w-full shadow-card-hover p-6 space-y-6">
                <div>
                    <h3 class="text-lg font-bold text-text-primary">Export Report</h3>
                    <p class="text-xs text-text-secondary mt-1">Select format and options to export</p>
                </div>

                <div class="space-y-4">
                    <div>
                        <label class="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">File Format</label>
                        <div class="grid grid-cols-2 gap-2">
                            <button
                                v-for="f in ['csv', 'xlsx', 'pdf', 'html']"
                                :key="f"
                                @click="selectedFormat = f"
                                class="border p-3 rounded-card flex flex-col items-center justify-center text-xs font-semibold uppercase transition-colors"
                                :class="selectedFormat === f ? 'border-brand-primary-500 bg-brand-primary-50/40 text-brand-primary-600' : 'border-border hover:bg-page text-text-secondary'"
                            >
                                <span class="text-base mb-1">
                                    <template v-if="f === 'csv'">📊</template>
                                    <template v-else-if="f === 'xlsx'">📈</template>
                                    <template v-else-if="f === 'pdf'">📕</template>
                                    <template v-else-if="f === 'html'">🖨️</template>
                                </span>
                                {{ f === 'xlsx' ? 'Excel' : f === 'html' ? 'Print' : f }}
                            </button>
                        </div>
                    </div>
                </div>

                <div class="flex justify-end gap-2 pt-2">
                    <button @click="exportOpen = false" class="btn-secondary btn-sm">Cancel</button>
                    <button @click="doExport" class="btn-primary btn-sm">Download</button>
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
import Breadcrumbs from '@/Components/Breadcrumbs.vue'

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

// ── Checkboxes and Bulk Export ──────────────────────────────
const selectedProjectIds = ref<number[]>([])

const currentProjects = computed(() => {
    if (activeTab.value === 'task_completion') {
        return props.reports.task_completion || []
    }
    return []
})

const allProjectsSelected = computed(() => {
    const projects = currentProjects.value
    return projects.length > 0 && projects.every(p => selectedProjectIds.value.includes(p.project_id))
})

function toggleSelectAllProjects() {
    if (allProjectsSelected.value) {
        const idsToRemove = currentProjects.value.map(p => p.project_id)
        selectedProjectIds.value = selectedProjectIds.value.filter(id => !idsToRemove.includes(id))
    } else {
        const idsToAdd = currentProjects.value.map(p => p.project_id)
        selectedProjectIds.value = Array.from(new Set([...selectedProjectIds.value, ...idsToAdd]))
    }
}

function toggleSelectProject(id: number) {
    const idx = selectedProjectIds.value.indexOf(id)
    if (idx > -1) {
        selectedProjectIds.value.splice(idx, 1)
    } else {
        selectedProjectIds.value.push(id)
    }
}

// ── Preview Modal ───────────────────────────────────────────
const previewOpen = ref(false)
const previewLoading = ref(false)
const previewData = ref<any | null>(null)

function openPreview(projectId: number) {
    previewOpen.value = true
    previewLoading.value = true
    previewData.value = null

    fetch(route('reports.project.preview', projectId))
        .then(res => res.json())
        .then(data => {
            previewData.value = data
            previewLoading.value = false
        })
        .catch(err => {
            console.error(err)
            previewLoading.value = false
        })
}

// ── Export Modal ────────────────────────────────────────────
const exportOpen = ref(false)
const selectedFormat = ref('csv')
const exportProjectId = ref<number | null>(null)
const isBulkExport = ref(false)

function openExportPopup(projectId: number | null = null) {
    exportProjectId.value = projectId
    isBulkExport.value = false
    selectedFormat.value = 'csv'
    exportOpen.value = true
}

function openBulkExportPopup() {
    exportProjectId.value = null
    isBulkExport.value = true
    selectedFormat.value = 'csv'
    exportOpen.value = true
}

function getExportUrl(format: string, projectId: number | null = null, projectIds: number[] = []): string {
    const params = new URLSearchParams({ tab: activeTab.value, format })

    if (projectId) {
        params.set('project_id', projectId.toString())
    } else if (projectIds.length > 0) {
        projectIds.forEach(id => params.append('project_ids[]', id.toString()))
    } else {
        if (filters.project_id) params.set('project_id', filters.project_id)
    }

    if (filters.user_id) params.set('user_id', filters.user_id)
    if (filters.date_from) params.set('date_from', filters.date_from)
    if (filters.date_to) params.set('date_to', filters.date_to)
    return route('reports.export') + '?' + params.toString()
}

function doExport() {
    const url = getExportUrl(
        selectedFormat.value,
        exportProjectId.value,
        isBulkExport.value ? selectedProjectIds.value : []
    )

    exportOpen.value = false

    if (isBulkExport.value) {
        selectedProjectIds.value = []
    }

    if (selectedFormat.value === 'html') {
        window.open(url, '_blank')
    } else {
        window.location.href = url
    }
}

// ── Filters & Navigation ────────────────────────────────────
function switchTab(tab: string) {
    activeTab.value = tab
    selectedProjectIds.value = []
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
    if (rate >= 80) return 'bg-success'
    if (rate >= 50) return 'bg-warning'
    return 'bg-danger'
}

function rateTextColor(rate: number): string {
    if (rate >= 80) return 'text-success'
    if (rate >= 50) return 'text-warning'
    return 'text-danger'
}


</script>