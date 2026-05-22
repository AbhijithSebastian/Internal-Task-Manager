<template>
    <AppLayout>
        <div class="space-y-8 py-4">
            <!-- Breadcrumbs -->
            <Breadcrumbs :items="[{ label: 'Tasks' }]" />

            <!-- Title & CTA -->
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 class="text-3xl font-extrabold tracking-tight text-gray-900">Tasks</h2>
                    <p class="mt-1.5 text-sm text-gray-500">Track, organize, and manage workloads across all active projects.</p>
                </div>
                <div>
                    <Link :href="route('tasks.create')" class="btn-primary flex items-center gap-2 shadow-sm py-2 px-4 rounded-xl">
                        <PlusIcon class="h-4 w-4" />
                        <span>New Task</span>
                    </Link>
                </div>
            </div>

            <!-- Modern Workload & Summary Cards -->
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <!-- My Tasks Card -->
                <div class="card p-5 bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">My Tasks</p>
                            <h3 class="mt-2 text-3xl font-bold text-gray-900">{{ stats.my_tasks ?? 0 }}</h3>
                        </div>
                        <div class="h-12 w-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 group-hover:scale-110 transition-transform">
                            <InboxIcon class="h-6 w-6" />
                        </div>
                    </div>
                    <div class="absolute bottom-0 left-0 right-0 h-1 bg-primary-500 rounded-b-xl"></div>
                </div>

                <!-- Overdue Card -->
                <div class="card p-5 bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Overdue</p>
                            <h3 class="mt-2 text-3xl font-bold text-red-600">{{ stats.overdue ?? 0 }}</h3>
                        </div>
                        <div class="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                            <ClockIcon class="h-6 w-6" />
                        </div>
                    </div>
                    <div class="absolute bottom-0 left-0 right-0 h-1 bg-red-500 rounded-b-xl"></div>
                </div>

                <!-- Blocked Card -->
                <div class="card p-5 bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Blocked</p>
                            <h3 class="mt-2 text-3xl font-bold text-amber-600">{{ stats.blocked ?? 0 }}</h3>
                        </div>
                        <div class="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                            <ExclamationTriangleIcon class="h-6 w-6" />
                        </div>
                    </div>
                    <div class="absolute bottom-0 left-0 right-0 h-1 bg-amber-500 rounded-b-xl"></div>
                </div>

                <!-- Total Active Card -->
                <div class="card p-5 bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Project Tasks</p>
                            <h3 class="mt-2 text-3xl font-bold text-gray-900">{{ stats.total ?? 0 }}</h3>
                        </div>
                        <div class="h-12 w-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-600 group-hover:scale-110 transition-transform">
                            <ClipboardDocumentListIcon class="h-6 w-6" />
                        </div>
                    </div>
                    <div class="absolute bottom-0 left-0 right-0 h-1 bg-gray-500 rounded-b-xl"></div>
                </div>
            </div>

            <!-- Toolbar & Filter Panel -->
            <div class="card p-4 bg-white shadow-sm border border-gray-100 space-y-4">
                <div class="flex flex-wrap items-center gap-4 justify-between">
                    <!-- Search Input -->
                    <div class="relative flex-1 min-w-[280px] max-w-md">
                        <span class="absolute inset-y-0 left-0 flex items-center pl-3">
                            <MagnifyingGlassIcon class="h-4 w-4 text-gray-400" />
                        </span>
                        <input 
                            v-model="filters.search" 
                            type="search" 
                            placeholder="Search tasks... (use tag:name to filter tags)" 
                            class="input pl-9 w-full rounded-xl text-sm border-gray-200 focus:border-primary-500 focus:ring-primary-100 transition-shadow" 
                            @input="filter"
                        >
                    </div>

                    <!-- Dropdowns Row -->
                    <div class="flex flex-wrap items-center gap-3">
                        <!-- Status Selector -->
                        <div class="flex flex-col">
                            <select v-model="filters.status" class="input py-1.5 px-3 rounded-lg text-xs font-medium text-gray-600 border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors" @change="filter">
                                <option value="">All Statuses</option>
                                <option v-for="s in statuses" :key="s.value" :value="s.value">{{ s.label }}</option>
                                <option value="pending">Pending</option>
                                <option value="overdue">Overdue</option>
                                <option value="blocked">Blocked</option>
                                <option value="needs_review">Needs Review</option>
                            </select>
                        </div>

                        <!-- Priority Selector -->
                        <div class="flex flex-col">
                            <select v-model="filters.priority" class="input py-1.5 px-3 rounded-lg text-xs font-medium text-gray-600 border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors" @change="filter">
                                <option value="">All Priorities</option>
                                <option v-for="p in priorities" :key="p.value" :value="p.value">{{ p.label }}</option>
                            </select>
                        </div>

                        <!-- Project Selector -->
                        <div class="flex flex-col">
                            <select v-model="filters.project_id" class="input py-1.5 px-3 rounded-lg text-xs font-medium text-gray-600 border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors" @change="filter">
                                <option value="">All Projects</option>
                                <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
                            </select>
                        </div>

                        <!-- Assignee Selector -->
                        <div class="flex flex-col">
                            <select v-model="filters.assignee_id" class="input py-1.5 px-3 rounded-lg text-xs font-medium text-gray-600 border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors" @change="filter">
                                <option value="">All Assignees</option>
                                <option v-for="m in members" :key="m.id" :value="m.id">{{ m.name }}</option>
                            </select>
                        </div>

                        <!-- Tag Selector -->
                        <div v-if="tags.length" class="flex flex-col">
                            <select v-model="filters.tag" class="input py-1.5 px-3 rounded-lg text-xs font-medium text-gray-600 border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors" @change="filter">
                                <option value="">All Tags</option>
                                <option v-for="tag in tags" :key="tag" :value="tag">{{ tag }}</option>
                            </select>
                        </div>

                        <!-- Clear Filters -->
                        <button v-if="activeFilterCount > 0" class="btn-secondary py-1.5 px-3 rounded-lg text-xs flex items-center gap-1 bg-primary-50 text-primary-700 hover:bg-primary-100 border-none transition-colors" @click="clearFilters">
                            <span>Clear ({{ activeFilterCount }})</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Task List Table -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div v-if="tasks.data.length > 0" class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-150">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 cursor-pointer select-none" @click="toggleSort('title')">
                                    <div class="flex items-center gap-1 hover:text-gray-600">
                                        <span>Task</span>
                                        <span class="text-[10px] text-gray-400">⇅</span>
                                    </div>
                                </th>
                                <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Tags</th>
                                <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Project</th>
                                <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                                <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Priority</th>
                                <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Assignees</th>
                                <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 cursor-pointer select-none" @click="toggleSort('due_date')">
                                    <div class="flex items-center gap-1 hover:text-gray-600">
                                        <span>Due Date</span>
                                        <span class="text-[10px] text-gray-400">⇅</span>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100 bg-white">
                            <tr 
                                v-for="task in tasks.data" 
                                :key="task.id" 
                                class="hover:bg-gray-50/70 cursor-pointer group transition-colors" 
                                :class="task.status === 'blocked' ? 'bg-red-50/10 hover:bg-red-50/20' : ''" 
                                @click="router.visit(route('tasks.show', task.id))"
                            >
                                <td class="px-6 py-4">
                                    <div class="flex items-center gap-2">
                                        <span v-if="task.status === 'blocked'" class="flex h-2 w-2 rounded-full bg-red-500 shrink-0"></span>
                                        <div class="text-sm font-semibold text-gray-800 group-hover:text-primary-600 transition-colors max-w-xs truncate">{{ task.title }}</div>
                                        <span v-if="task.dependencies_count > 0" class="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">{{ task.dependencies_count }} dep</span>
                                    </div>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="flex flex-wrap gap-1">
                                        <span v-for="tag in (task.tags ?? [])" :key="tag" class="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">{{ tag }}</span>
                                    </div>
                                </td>
                                <td class="px-6 py-4 text-sm text-gray-500 font-medium">{{ task.project?.name ?? '—' }}</td>
                                <td class="px-6 py-4">
                                    <Badge :variant="statusBadge(task.status)">{{ task.status_label ?? task.status }}</Badge>
                                </td>
                                <td class="px-6 py-4">
                                    <Badge :variant="priorityBadge(task.priority)">{{ task.priority }}</Badge>
                                </td>
                                <td class="px-6 py-4">
                                    <!-- Multi-assignee Overlapping Badges -->
                                    <div class="flex -space-x-1.5 overflow-hidden">
                                        <template v-if="task.assignees && task.assignees.length > 0">
                                            <div
                                                v-for="assignee in task.assignees"
                                                :key="assignee.id"
                                                class="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-[9px] uppercase cursor-pointer shrink-0"
                                                :title="assignee.name"
                                            >
                                                {{ assignee.name.substring(0, 2) }}
                                            </div>
                                        </template>
                                        <span v-else class="text-xs text-gray-400 italic">Unassigned</span>
                                    </div>
                                </td>
                                <td class="whitespace-nowrap px-6 py-4 text-sm" :class="task.is_overdue ? 'text-red-600 font-semibold' : 'text-gray-500 font-medium'">
                                    <span class="flex items-center gap-1.5">
                                        {{ task.due_date ?? 'No deadline' }}
                                        <svg class="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div v-else class="p-8">
                    <EmptyState title="No tasks found" message="Try adjusting your search query or filter options." />
                </div>
                <Pagination v-if="tasks.data.length > 0" :pagination="tasks" />
            </div>
        </div>
    </AppLayout>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import { Link, router } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import AppLayout from '@/Layouts/AppLayout.vue'
import Badge from '@/Components/Badge.vue'
import Breadcrumbs from '@/Components/Breadcrumbs.vue'
import Pagination from '@/Components/Pagination.vue'
import EmptyState from '@/Components/EmptyState.vue'
import { 
    PlusIcon, 
    InboxIcon, 
    ClockIcon, 
    ExclamationTriangleIcon, 
    ClipboardDocumentListIcon, 
    MagnifyingGlassIcon 
} from '@heroicons/vue/24/outline'

const props = defineProps<{ 
    tasks: any; 
    filters: any; 
    projects: any; 
    tags: any; 
    members: any;
    stats: any;
}>()

const statuses = [
    { value: 'backlog', label: 'Backlog' },
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'in_review', label: 'In Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'done', label: 'Done' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'blocked', label: 'Blocked' },
]

const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
]

const filters = reactive({
    search: props.filters.search ?? '',
    status: props.filters.status ?? '',
    priority: props.filters.priority ?? '',
    project_id: props.filters.project_id ?? '',
    assignee_id: props.filters.assignee_id ?? '',
    tag: props.filters.tag ?? '',
    sort_by: props.filters.sort_by ?? '',
    sort_direction: props.filters.sort_direction ?? '',
})

const activeFilterCount = computed(() => {
    let count = 0
    if (filters.search) count++
    if (filters.status) count++
    if (filters.priority) count++
    if (filters.project_id) count++
    if (filters.assignee_id) count++
    if (filters.tag) count++
    return count
})

function filter() {
    router.get(route('tasks.index'), filters, { preserveState: true, replace: true })
}

function clearFilters() {
    filters.search = ''
    filters.status = ''
    filters.priority = ''
    filters.project_id = ''
    filters.assignee_id = ''
    filters.tag = ''
    filter()
}

function toggleSort(field: string) {
    if (filters.sort_by === field) {
        filters.sort_direction = filters.sort_direction === 'asc' ? 'desc' : 'asc'
    } else {
        filters.sort_by = field
        filters.sort_direction = 'asc'
    }
    filter()
}

function statusBadge(status: string): string {
    const map: Record<string, string> = {
        backlog: 'neutral', todo: 'info', in_progress: 'warning',
        in_review: 'warning', approved: 'success', done: 'success',
        cancelled: 'danger', blocked: 'danger', pending: 'info', overdue: 'danger',
    }
    return map[status] ?? 'neutral'
}

function priorityBadge(priority: string): string {
    const map: Record<string, string> = { low: 'neutral', medium: 'info', high: 'warning', urgent: 'danger' }
    return map[priority] ?? 'neutral'
}
</script>
