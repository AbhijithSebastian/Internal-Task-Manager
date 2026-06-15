<template>
    <AppLayout>
        <div class="space-y-8">
            <!-- ═══ Header ═══ -->
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-text-primary">Tasks</h1>
                    <p class="mt-1 text-sm text-text-secondary">Track, organize, and manage workloads across all active projects.</p>
                </div>
                <div class="flex items-center gap-3">
                    <Link v-if="filters.tab !== 'my-subtasks'" :href="route('tasks.create')" class="btn-primary">
                        <PlusIcon class="h-4 w-4 mr-1.5" />
                        New Task
                    </Link>
                    <button @click="openNewSubtask" class="btn-secondary">
                        <PlusIcon class="h-4 w-4 mr-1.5" />
                        New Subtask
                    </button>
                </div>
            </div>

            <!-- ═══ Tabs ═══ -->
            <div class="flex gap-1 rounded-xl bg-page p-1 border border-border">
                <button
                    v-for="tab in tabs"
                    :key="tab.key"
                    class="px-4 py-2 text-sm font-medium rounded-lg transition-all"
                    :class="filters.tab === tab.key ? 'bg-white text-text-primary shadow-sm ring-1 ring-border' : 'text-text-secondary hover:text-text-primary'"
                    @click="switchTab(tab.key)"
                >
                    {{ tab.label }}
                    <span v-if="tab.count !== undefined" class="ml-1.5 text-xs text-text-secondary">({{ tab.count }})</span>
                </button>
            </div>

            <!-- ═══ Stats Bar ═══ -->
            <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div class="kpi-card">
                    <p class="text-xs font-semibold uppercase tracking-wider text-text-secondary">My Tasks</p>
                    <p class="kpi-value">{{ stats.my_tasks ?? 0 }}</p>
                </div>
                <div class="kpi-card">
                    <p class="text-xs font-semibold uppercase tracking-wider text-text-secondary">My Subtasks</p>
                    <p class="kpi-value">{{ stats.my_subtasks ?? 0 }}</p>
                </div>
                <div class="kpi-card">
                    <p class="text-xs font-semibold uppercase tracking-wider text-danger">Blocked</p>
                    <p class="kpi-value">{{ stats.blocked ?? 0 }}</p>
                </div>
            </div>

            <!-- ═══ Filter Bar ═══ -->
            <div class="card">
                <div class="flex flex-wrap items-center gap-3 p-5">
                    <div class="relative flex-1 min-w-[240px] max-w-sm">
                        <MagnifyingGlassIcon class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary/60" />
                        <input
                            v-model="filters.search"
                            type="search"
                            :placeholder="filters.tab === 'my-subtasks' ? 'Search subtasks...' : 'Search tasks...'"
                            class="input pl-9 w-full"
                            @input="filter"
                        >
                    </div>
                    <select v-model="filters.status" class="input py-2 text-sm max-w-[180px] w-full" @change="filter">
                        <option value="">All Statuses</option>
                        <option v-for="s in statuses" :key="s.value" :value="s.value">{{ s.label }}</option>
                    </select>
                    <select v-model="filters.priority" class="input py-2 text-sm max-w-[180px] w-full" @change="filter">
                        <option value="">All Priorities</option>
                        <option v-for="p in priorities" :key="p.value" :value="p.value">{{ p.label }}</option>
                    </select>
                    <select v-if="filters.tab !== 'my-subtasks'" v-model="filters.project_id" class="input py-2 text-sm max-w-[200px] w-full" @change="filter">
                        <option value="">All Projects</option>
                        <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
                    </select>
                    <select v-if="filters.tab !== 'my-subtasks'" v-model="filters.assignee_id" class="input py-2 text-sm max-w-[200px] w-full" @change="filter">
                        <option value="">All Assignees</option>
                        <option v-for="m in members" :key="m.id" :value="m.id">{{ m.name }}</option>
                    </select>
                    <button
                        v-if="activeFilterCount > 0"
                        class="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                        @click="clearFilters"
                    >
                        Clear ({{ activeFilterCount }})
                    </button>
                </div>
            </div>

            <!-- ═══ Bulk Action Toolbar ═══ -->
            <Transition
                enter-active-class="transition-all duration-200 ease-out"
                enter-from-class="opacity-0 -translate-y-2"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition-all duration-150 ease-in"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 -translate-y-2"
            >
                <div
                    v-if="selectedIds.length > 0"
                    class="flex flex-wrap items-center gap-3 rounded-card border border-brand-primary-200 bg-brand-primary-50 px-5 py-3 shadow-sm"
                >
                    <span class="text-sm font-semibold text-brand-primary-600">
                        {{ selectedIds.length }} selected
                    </span>
                    <div class="mx-1 h-4 w-px bg-brand-primary-200" />
                    <button
                        class="btn-sm text-brand-primary-600 hover:bg-brand-primary-100 border border-brand-primary-200 bg-white rounded-lg"
                        :disabled="bulkProcessing"
                        @click="bulkUpdateStatus('done')"
                    >
                        <CheckCircleIcon class="h-3.5 w-3.5 mr-1" />
                        Mark Complete
                    </button>
                    <button
                        class="btn-sm text-brand-primary-600 hover:bg-brand-primary-100 border border-brand-primary-200 bg-white rounded-lg"
                        :disabled="bulkProcessing"
                        @click="bulkUpdateStatus('in_progress')"
                    >
                        <ArrowPathIcon class="h-3.5 w-3.5 mr-1" />
                        In Progress
                    </button>
                    <button
                        class="btn-sm text-brand-primary-600 hover:bg-brand-primary-100 border border-brand-primary-200 bg-white rounded-lg"
                        :disabled="bulkProcessing"
                        @click="bulkUpdateStatus('cancelled')"
                    >
                        <MinusCircleIcon class="h-3.5 w-3.5 mr-1" />
                        Mark On Hold
                    </button>
                    <div class="mx-1 h-4 w-px bg-brand-primary-200" />

                    <select
                        class="input py-1.5 text-sm max-w-[160px] bg-white border-brand-primary-200 text-brand-primary-600"
                        @change="bulkUpdatePriority(($event.target as HTMLSelectElement).value); ($event.target as HTMLSelectElement).value = ''"
                        :disabled="bulkProcessing"
                    >
                        <option value="" disabled selected>Change Priority</option>
                        <option v-for="p in priorities" :key="p.value" :value="p.value">{{ p.label }}</option>
                    </select>

                    <select
                        class="input py-1.5 text-sm max-w-[160px] bg-white border-brand-primary-200 text-brand-primary-600"
                        @change="bulkAssignUser(($event.target as HTMLSelectElement).value); ($event.target as HTMLSelectElement).value = ''"
                        :disabled="bulkProcessing"
                    >
                        <option value="" disabled selected>Assign User</option>
                        <option v-for="m in members" :key="m.id" :value="m.id">{{ m.name }}</option>
                    </select>

                    <div class="mx-1 h-4 w-px bg-brand-primary-200" />
                    <button
                        class="btn-sm text-danger hover:bg-danger-50 border border-brand-primary-200 bg-white rounded-lg"
                        :disabled="bulkProcessing"
                        @click="bulkDelete"
                    >
                        <TrashIcon class="h-3.5 w-3.5 mr-1" />
                        Delete
                    </button>
                    <button
                        class="ml-auto text-sm font-medium text-brand-primary-500 hover:text-brand-primary-700 transition-colors"
                        @click="selectedIds = []"
                    >
                        Deselect all
                    </button>
                </div>
            </Transition>

            <!-- ═══ Table ═══ -->
            <div class="card overflow-hidden">
                <div v-if="tasks.data.length > 0" class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-border">
                        <thead class="bg-page">
                            <tr>
                                <th v-if="filters.tab !== 'my-subtasks'" class="w-10 px-4 py-3.5">
                                    <input
                                        type="checkbox"
                                        class="h-4 w-4 rounded border-border text-brand-primary-500 focus:ring-brand-primary-500"
                                        :checked="allSelected"
                                        :indeterminate="someSelected && !allSelected"
                                        @change="toggleSelectAll"
                                    >
                                </th>
                                <th class="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">{{ filters.tab === 'my-subtasks' ? 'Subtask' : 'Task' }}</th>
                                <th v-if="filters.tab === 'my-subtasks'" class="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Parent Task</th>
                                <th class="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Project</th>
                                <th class="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Status</th>
                                <th class="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Priority</th>
                                <th v-if="filters.tab !== 'my-subtasks'" class="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Assignees</th>
                                <th v-else class="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Assigned To</th>
                                <th class="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Due</th>
                                <th class="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-text-secondary">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-border bg-white">
                            <tr
                                v-for="task in tasks.data"
                                :key="task.id"
                                class="group transition-colors hover:bg-page/50"
                                :class="{ 'bg-page/30': selectedIds.includes(task.id) }"
                            >
                                <td v-if="filters.tab !== 'my-subtasks'" class="w-10 px-4 py-3.5" @click.stop>
                                    <input
                                        type="checkbox"
                                        class="h-4 w-4 rounded border-border text-brand-primary-500 focus:ring-brand-primary-500"
                                        :checked="selectedIds.includes(task.id)"
                                        @change="toggleSelect(task.id)"
                                    >
                                </td>
                                <td class="px-4 py-3.5 max-w-[300px]">
                                    <Link :href="route(filters.tab === 'my-subtasks' ? 'tasks.show' : 'tasks.show', task.id)" class="block">
                                        <p class="text-sm font-medium text-text-primary truncate hover:text-brand-primary-500 transition-colors">{{ task.title }}</p>
                                        <div v-if="task.tags?.length" class="mt-1 flex flex-wrap gap-1">
                                            <span v-for="tag in (task.tags ?? [])" :key="tag" class="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">{{ tag }}</span>
                                        </div>
                                    </Link>
                                </td>
                                <td v-if="filters.tab === 'my-subtasks'" class="px-4 py-3.5 max-w-[200px]">
                                    <Link v-if="task.parent" :href="route('tasks.show', task.parent.id)" class="text-sm text-text-primary hover:text-brand-primary-500 transition-colors truncate block">
                                        {{ task.parent.title }}
                                    </Link>
                                    <span v-else class="text-xs text-text-secondary">—</span>
                                </td>
                                <td class="px-4 py-3.5 text-sm text-text-secondary">{{ task.project?.name ?? (task.parent?.project?.name ?? '—') }}</td>
                                <td class="px-4 py-3.5">
                                    <span :class="'status-' + (typeof task.status === 'string' ? task.status : (task.status?.value ?? 'draft'))" class="rounded-md px-2 py-0.5 text-[11px] font-medium">
                                        {{ task.status_label ?? (typeof task.status === 'string' ? task.status : task.status?.value) }}
                                    </span>
                                </td>
                                <td class="px-4 py-3.5">
                                    <span :class="priorityBadgeClass(task.priority?.value ?? task.priority)" class="rounded-md px-2 py-0.5 text-[11px] font-medium capitalize">
                                        {{ task.priority?.value ?? task.priority ?? '—' }}
                                    </span>
                                </td>
                                <td class="px-4 py-3.5">
                                    <div class="flex -space-x-1.5">
                                        <div
                                            v-for="a in (task.assignees ?? []).slice(0, 4)"
                                            :key="a.id"
                                            :title="a.name"
                                            class="flex h-7 w-7 items-center justify-center rounded-full bg-brand-primary-50 text-[10px] font-semibold text-brand-primary-600 ring-2 ring-white"
                                        >
                                            {{ a.name.substring(0, 2) }}
                                        </div>
                                        <span v-if="!(task.assignees?.length)" class="text-xs italic text-text-secondary">—</span>
                                    </div>
                                </td>
                                <td class="px-4 py-3.5 text-sm text-text-secondary">
                                    {{ task.due_date ?? '—' }}
                                </td>
                                <td class="px-4 py-3.5 text-right" @click.stop>
                                    <div class="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Link :href="route('tasks.show', task.id)" class="btn-ghost btn-sm text-xs">
                                            View
                                        </Link>
                                        <Link v-if="filters.tab !== 'my-subtasks'" :href="route('tasks.edit', task.id)" class="btn-ghost btn-sm text-xs">
                                            Edit
                                        </Link>
                                        <button
                                            v-if="filters.tab !== 'my-subtasks'"
                                            class="btn-ghost btn-sm text-xs text-danger hover:bg-danger-50"
                                            @click="confirmDeleteTask(task)"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div v-else class="empty-state">
                    <EmptyState title="No tasks found" description="Try adjusting your filters or create a new task." />
                </div>
                <Pagination v-if="tasks.data.length > 0" :meta="tasks" />
            </div>
        </div>

        <!-- Delete confirm dialog -->
        <ConfirmDialog
            :open="deleteDialog.open"
            title="Delete Task"
            :message="`Are you sure you want to delete '${deleteDialog.taskTitle}'? This cannot be undone.`"
            type="danger"
            confirm-text="Delete"
            @confirm="doDeleteTask"
            @close="deleteDialog.open = false"
        />

        <!-- New Subtask Modal -->
        <div v-if="subtaskModal.open" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div class="bg-white rounded-card max-w-lg w-full shadow-card-hover p-6 space-y-5">
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="text-lg font-bold text-text-primary">Create Subtask</h3>
                        <p class="text-xs text-text-secondary mt-0.5">Add a new subtask under a parent task</p>
                    </div>
                    <button @click="subtaskModal.open = false" class="text-text-secondary hover:text-text-primary transition-colors">
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div class="space-y-4">
                    <div>
                        <label class="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Project</label>
                        <select v-model="subtaskModal.project_id" class="input w-full" @change="fetchParentTasks">
                            <option value="">Select a project</option>
                            <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Parent Task <span class="text-danger">*</span></label>
                        <select v-model="subtaskModal.parent_task_id" class="input w-full" :disabled="!subtaskModal.project_id || subtaskModal.loadingTasks">
                            <option value="">Select parent task</option>
                            <option v-if="subtaskModal.loadingTasks" value="" disabled>Loading...</option>
                            <option v-for="t in subtaskModal.availableTasks" :key="t.id" :value="t.id">{{ t.title }}</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Title <span class="text-danger">*</span></label>
                        <input v-model="subtaskModal.title" type="text" class="input w-full" placeholder="Enter subtask title">
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Assignee</label>
                            <select v-model="subtaskModal.assignee_id" class="input w-full">
                                <option value="">Select assignee</option>
                                <option v-for="m in members" :key="m.id" :value="m.id">{{ m.name }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Status</label>
                            <select v-model="subtaskModal.status" class="input w-full">
                                <option v-for="s in statuses" :key="s.value" :value="s.value">{{ s.label }}</option>
                            </select>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Priority</label>
                            <select v-model="subtaskModal.priority" class="input w-full">
                                <option v-for="p in priorities" :key="p.value" :value="p.value">{{ p.label }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Due Date</label>
                            <input v-model="subtaskModal.due_date" type="date" class="input w-full">
                        </div>
                    </div>
                </div>

                <div class="flex justify-end gap-2 pt-2">
                    <button @click="subtaskModal.open = false" class="btn-secondary btn-sm">Cancel</button>
                    <button @click="createSubtask" class="btn-primary btn-sm" :disabled="subtaskModal.submitting">
                        {{ subtaskModal.submitting ? 'Creating...' : 'Create Subtask' }}
                    </button>
                </div>
            </div>
        </div>
    </AppLayout>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue'
import { Link, router } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import AppLayout from '@/Layouts/AppLayout.vue'
import Badge from '@/Components/Badge.vue'
import Breadcrumbs from '@/Components/Breadcrumbs.vue'
import Pagination from '@/Components/Pagination.vue'
import EmptyState from '@/Components/EmptyState.vue'
import ConfirmDialog from '@/Components/ConfirmDialog.vue'
import {
    PlusIcon,
    MagnifyingGlassIcon,
    CheckCircleIcon,
    ArrowPathIcon,
    MinusCircleIcon,
    TrashIcon,
} from '@heroicons/vue/24/outline'

const props = defineProps<{
    tasks: any
    filters: any
    projects: any
    tags: any
    members: any
    stats: any
    userRole?: string
}>()

const tabs = computed(() => {
    const isEmployee = props.userRole === 'employee'
    return [
        { key: 'all', label: 'All Tasks', count: props.stats.total },
        { key: 'my-tasks', label: 'My Tasks', count: props.stats.my_tasks },
        ...(!isEmployee ? [] : []),
        { key: 'my-subtasks', label: 'My Subtasks', count: props.stats.my_subtasks },
        { key: 'completed', label: 'Completed' },
    ]
})

const currentTab = ref(props.filters.tab ?? 'all')

function switchTab(tab: string) {
    currentTab.value = tab
    filters.tab = tab
    selectedIds.value = []
    filter()
}

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
    tab: props.filters.tab ?? 'all',
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
    Object.assign(filters, { search: '', status: '', priority: '', project_id: '', assignee_id: '', tag: '' })
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

const selectedIds = ref<number[]>([])
const allSelected = computed(() => props.tasks.data.length > 0 && selectedIds.value.length === props.tasks.data.length)
const someSelected = computed(() => selectedIds.value.length > 0)

function toggleSelect(id: number) {
    const idx = selectedIds.value.indexOf(id)
    if (idx > -1) selectedIds.value.splice(idx, 1)
    else selectedIds.value.push(id)
}

function toggleSelectAll() {
    if (allSelected.value) {
        selectedIds.value = []
    } else {
        selectedIds.value = props.tasks.data.map((t: any) => t.id)
    }
}

const bulkProcessing = ref(false)

async function bulkUpdateStatus(status: string) {
    if (!selectedIds.value.length || bulkProcessing.value) return
    bulkProcessing.value = true
    const ids = [...selectedIds.value]
    for (let i = 0; i < ids.length - 1; i++) {
        await new Promise<void>((resolve) => {
            router.patch(route('tasks.status', ids[i]), { status }, {
                preserveScroll: true, preserveState: true,
                onFinish: () => resolve(),
            })
        })
    }
    router.patch(route('tasks.status', ids[ids.length - 1]), { status }, {
        onSuccess: () => { selectedIds.value = [] },
        onFinish: () => { bulkProcessing.value = false },
    })
}

async function bulkDelete() {
    if (!selectedIds.value.length || bulkProcessing.value) return
    if (!confirm(`Delete ${selectedIds.value.length} task(s)? This cannot be undone.`)) return
    bulkProcessing.value = true
    const ids = [...selectedIds.value]
    for (let i = 0; i < ids.length - 1; i++) {
        await new Promise<void>((resolve) => {
            router.delete(route('tasks.destroy', ids[i]), {
                preserveScroll: true, preserveState: true,
                onFinish: () => resolve(),
            })
        })
    }
    router.delete(route('tasks.destroy', ids[ids.length - 1]), {
        onSuccess: () => { selectedIds.value = [] },
        onFinish: () => { bulkProcessing.value = false },
    })
}

async function bulkUpdatePriority(priority: string) {
    if (!selectedIds.value.length || bulkProcessing.value || !priority) return
    bulkProcessing.value = true
    const ids = [...selectedIds.value]
    for (let i = 0; i < ids.length - 1; i++) {
        await new Promise<void>((resolve) => {
            router.put(route('tasks.update', ids[i]), { priority }, {
                preserveScroll: true, preserveState: true,
                onFinish: () => resolve(),
            })
        })
    }
    router.put(route('tasks.update', ids[ids.length - 1]), { priority }, {
        onSuccess: () => { selectedIds.value = [] },
        onFinish: () => { bulkProcessing.value = false },
    })
}

async function bulkAssignUser(userIdStr: string) {
    if (!selectedIds.value.length || bulkProcessing.value || !userIdStr) return
    bulkProcessing.value = true
    const ids = [...selectedIds.value]
    const assignee_id = parseInt(userIdStr, 10)
    for (let i = 0; i < ids.length - 1; i++) {
        await new Promise<void>((resolve) => {
            router.post(route('tasks.assign', ids[i]), { assignee_id }, {
                preserveScroll: true, preserveState: true,
                onFinish: () => resolve(),
            })
        })
    }
    router.post(route('tasks.assign', ids[ids.length - 1]), { assignee_id }, {
        onSuccess: () => { selectedIds.value = [] },
        onFinish: () => { bulkProcessing.value = false },
    })
}

const subtaskModal = reactive({
    open: false,
    project_id: '',
    parent_task_id: '',
    availableTasks: [] as any[],
    loadingTasks: false,
    title: '',
    assignee_id: '',
    status: 'todo',
    priority: 'medium',
    due_date: '',
    submitting: false,
})

function openNewSubtask() {
    subtaskModal.open = true
    subtaskModal.project_id = ''
    subtaskModal.parent_task_id = ''
    subtaskModal.availableTasks = []
    subtaskModal.title = ''
    subtaskModal.assignee_id = ''
    subtaskModal.status = 'todo'
    subtaskModal.priority = 'medium'
    subtaskModal.due_date = ''
}

function fetchParentTasks() {
    if (!subtaskModal.project_id) {
        subtaskModal.availableTasks = []
        subtaskModal.parent_task_id = ''
        return
    }
    subtaskModal.loadingTasks = true
    subtaskModal.parent_task_id = ''
    fetch(route('tasks.parents') + '?' + new URLSearchParams({ project_id: subtaskModal.project_id }))
        .then(res => res.json())
        .then(data => {
            subtaskModal.availableTasks = data.tasks
            subtaskModal.loadingTasks = false
        })
        .catch(() => {
            subtaskModal.availableTasks = []
            subtaskModal.loadingTasks = false
        })
}

function createSubtask() {
    if (!subtaskModal.parent_task_id || !subtaskModal.title) return
    subtaskModal.submitting = true

    router.post(route('tasks.subtasks.store', subtaskModal.parent_task_id), {
        title: subtaskModal.title,
        assignee_id: subtaskModal.assignee_id || undefined,
        priority: subtaskModal.priority,
        due_date: subtaskModal.due_date || undefined,
    }, {
        preserveState: true,
        onSuccess: () => {
            subtaskModal.open = false
            subtaskModal.submitting = false
        },
        onError: () => {
            subtaskModal.submitting = false
        },
        onFinish: () => {
            subtaskModal.submitting = false
        },
    })
}

const deleteDialog = ref({ open: false, taskId: 0, taskTitle: '', processing: false })

function confirmDeleteTask(task: any) {
    deleteDialog.value = { open: true, taskId: task.id, taskTitle: task.title, processing: false }
}

function doDeleteTask() {
    deleteDialog.value.processing = true
    router.delete(route('tasks.destroy', deleteDialog.value.taskId), {
        onSuccess: () => { deleteDialog.value.open = false },
        onFinish: () => { deleteDialog.value.processing = false },
    })
}

function priorityBadgeClass(priority: string | null | undefined): string {
    const map: Record<string, string> = {
        low: 'bg-gray-100 text-text-secondary',
        medium: 'bg-brand-primary-50 text-brand-primary-600',
        high: 'bg-warning-50 text-warning',
        urgent: 'bg-danger-50 text-danger',
    }
    return map[priority ?? ''] ?? 'bg-gray-100 text-text-secondary'
}
</script>
