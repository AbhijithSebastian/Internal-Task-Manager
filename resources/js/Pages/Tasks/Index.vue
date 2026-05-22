<template>
    <AppLayout>
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900">Tasks</h2>
                    <p class="mt-1 text-sm text-gray-600">View and manage tasks across projects</p>
                </div>
                <div class="flex gap-2">
                    <button class="btn-secondary btn-sm" @click="showQuickCreate = true">Quick Create</button>
                    <Link :href="route('tasks.create')" class="btn-primary">New Task</Link>
                </div>
            </div>

            <QuickCreateTask
                :open="showQuickCreate"
                :projects="projects"
                @close="showQuickCreate = false"
                @created="refreshPage"
            />

            <div class="card">
                <div class="border-b border-gray-200 bg-gray-50 px-6 py-4">
                    <div class="flex flex-wrap gap-4">
                        <input v-model="filters.search" type="search" placeholder="Search tasks..." class="input max-w-xs" @input="filter">
                        <select v-model="filters.status" class="input max-w-[160px]" @change="filter">
                            <option value="">All Status</option>
                            <option v-for="s in statuses" :key="s.value" :value="s.value">{{ s.label }}</option>
                            <option value="pending">Pending</option>
                            <option value="overdue">Overdue</option>
                            <option value="blocked">Blocked</option>
                            <option value="needs_review">Needs Review</option>
                        </select>
                        <select v-model="filters.priority" class="input max-w-[150px]" @change="filter">
                            <option value="">All Priority</option>
                            <option v-for="p in priorities" :key="p.value" :value="p.value">{{ p.label }}</option>
                        </select>
                        <select v-model="filters.project_id" class="input max-w-[200px]" @change="filter">
                            <option value="">All Projects</option>
                            <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
                        </select>
                        <select v-model="filters.assignee_id" class="input max-w-[200px]" @change="filter">
                            <option value="">All Assignees</option>
                            <option v-for="m in members" :key="m.id" :value="m.id">{{ m.name }}</option>
                        </select>
                        <select v-if="tags.length" v-model="filters.tag" class="input max-w-[160px]" @change="filter">
                            <option value="">All Tags</option>
                            <option v-for="tag in tags" :key="tag" :value="tag">{{ tag }}</option>
                        </select>
                        <button v-if="activeFilterCount > 0" class="btn-secondary btn-sm" @click="clearFilters">
                            Clear ({{ activeFilterCount }})
                        </button>
                    </div>
                </div>

                <div v-if="tasks.data.length > 0" class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer select-none" @click="toggleSort('title')">Task</th>
                                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Tags</th>
                                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Project</th>
                                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Priority</th>
                                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Assignee</th>
                                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer select-none" @click="toggleSort('due_date')">Due</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200 bg-white">
                            <tr v-for="task in tasks.data" :key="task.id" class="hover:bg-gray-50 cursor-pointer group" :class="task.status === 'blocked' ? 'bg-red-50/40 hover:bg-red-50' : ''" @click="router.visit(route('tasks.show', task.id))">
                                <td class="px-6 py-4">
                                    <div class="flex items-center gap-2">
                                        <div class="text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors">{{ task.title }}</div>
                                        <span v-if="task.dependencies_count > 0" class="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{{ task.dependencies_count }} dep</span>
                                    </div>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="flex flex-wrap gap-1">
                                        <span v-for="tag in (task.tags ?? [])" :key="tag" class="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">{{ tag }}</span>
                                    </div>
                                </td>
                                <td class="px-6 py-4 text-sm text-gray-500">{{ task.project?.name }}</td>
                                <td class="px-6 py-4">
                                    <Badge :variant="statusBadge(task.status)">{{ task.status_label ?? task.status }}</Badge>
                                </td>
                                <td class="px-6 py-4">
                                    <Badge :variant="priorityBadge(task.priority)">{{ task.priority }}</Badge>
                                </td>
                                <td class="px-6 py-4 text-sm text-gray-500">{{ task.assignee?.name ?? 'Unassigned' }}</td>
                                <td class="whitespace-nowrap px-6 py-4 text-sm" :class="task.is_overdue ? 'text-red-600 font-medium' : 'text-gray-500'">
                                    <span class="flex items-center gap-1.5">
                                        {{ task.due_date }}
                                        <svg class="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div v-else class="p-6">
                    <EmptyState title="No tasks found" message="Try adjusting your search or filter criteria." />
                </div>
                <Pagination v-if="tasks.data.length > 0" :pagination="tasks" />
            </div>
        </div>
    </AppLayout>
</template>

<script setup lang="ts">
import { reactive, computed, ref } from 'vue'
import { Link, router } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import Badge from '@/Components/Badge.vue'
import Pagination from '@/Components/Pagination.vue'
import QuickCreateTask from '@/Components/QuickCreateTask.vue'
import EmptyState from '@/Components/EmptyState.vue'

const showQuickCreate = ref(false)

function refreshPage() {
    router.reload({ preserveScroll: true })
}

const props = defineProps<{ tasks: any; filters: any; projects: any; tags: any; members: any }>()

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
