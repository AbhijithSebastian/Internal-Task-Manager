<template>
    <AppLayout>
        <div class="space-y-6 py-4">
            <Breadcrumbs :items="[{ label: 'Tasks' }]" />

            <!-- Title & CTA -->
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 class="text-2xl font-bold tracking-tight text-gray-900">Tasks</h2>
                    <p class="mt-1 text-sm text-gray-500">Track, organize, and manage workloads across all active projects.</p>
                </div>
                <Link :href="route('tasks.create')" class="btn-primary inline-flex items-center gap-2">
                    <PlusIcon class="h-4 w-4" />
                    New Task
                </Link>
            </div>

            <!-- KPI Summary Cards -->
            <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div class="rounded-2xl border border-gray-200/70 bg-white px-5 py-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
                    <p class="text-[11px] font-semibold uppercase tracking-widest text-gray-400">My Tasks</p>
                    <p class="mt-3 text-3xl font-bold tabular-nums text-gray-900">{{ stats.my_tasks ?? 0 }}</p>
                </div>
                <div class="rounded-2xl border border-gray-200/70 bg-white px-5 py-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
                    <p class="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Overdue</p>
                    <p class="mt-3 text-3xl font-bold tabular-nums text-gray-900">{{ stats.overdue ?? 0 }}</p>
                </div>
                <div class="rounded-2xl border border-gray-200/70 bg-white px-5 py-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
                    <p class="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Blocked</p>
                    <p class="mt-3 text-3xl font-bold tabular-nums text-gray-900">{{ stats.blocked ?? 0 }}</p>
                </div>
                <div class="rounded-2xl border border-gray-200/70 bg-white px-5 py-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
                    <p class="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Total in Projects</p>
                    <p class="mt-3 text-3xl font-bold tabular-nums text-gray-900">{{ stats.total ?? 0 }}</p>
                </div>
            </div>

            <!-- Filter Bar -->
            <div class="rounded-2xl border border-gray-200/70 bg-white px-5 py-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
                <div class="flex flex-wrap items-center gap-3">
                    <div class="relative flex-1 min-w-[240px] max-w-sm">
                        <MagnifyingGlassIcon class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            v-model="filters.search"
                            type="search"
                            placeholder="Search tasks..."
                            class="input pl-9 w-full"
                            @input="filter"
                        >
                    </div>
                    <select v-model="filters.status" class="input py-2 text-sm" @change="filter">
                        <option value="">All Statuses</option>
                        <option v-for="s in statuses" :key="s.value" :value="s.value">{{ s.label }}</option>
                    </select>
                    <select v-model="filters.priority" class="input py-2 text-sm" @change="filter">
                        <option value="">All Priorities</option>
                        <option v-for="p in priorities" :key="p.value" :value="p.value">{{ p.label }}</option>
                    </select>
                    <select v-model="filters.project_id" class="input py-2 text-sm" @change="filter">
                        <option value="">All Projects</option>
                        <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
                    </select>
                    <select v-model="filters.assignee_id" class="input py-2 text-sm" @change="filter">
                        <option value="">All Assignees</option>
                        <option v-for="m in members" :key="m.id" :value="m.id">{{ m.name }}</option>
                    </select>
                    <button
                        v-if="activeFilterCount > 0"
                        class="text-[13px] font-medium text-gray-500 hover:text-gray-700 transition-colors"
                        @click="clearFilters"
                    >
                        Clear ({{ activeFilterCount }})
                    </button>
                </div>
            </div>

            <!-- Bulk Action Toolbar -->
            <Transition
                enter-active-class="transition-all duration-200 ease-out"
                enter-from-class="opacity-0 -translate-y-1"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition-all duration-150 ease-in"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 -translate-y-1"
            >
                <div
                    v-if="selectedIds.length > 0"
                    class="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-900/10 bg-gray-900 px-5 py-3 shadow-lg"
                >
                    <span class="text-[13px] font-semibold text-white">
                        {{ selectedIds.length }} selected
                    </span>
                    <div class="mx-2 h-4 w-px bg-white/20" />
                    <button
                        class="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-[12px] font-medium text-white transition hover:bg-white/20"
                        :disabled="bulkProcessing"
                        @click="bulkUpdateStatus('done')"
                    >
                        <CheckCircleIcon class="h-3.5 w-3.5" />
                        Mark Complete
                    </button>
                    <button
                        class="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-[12px] font-medium text-white transition hover:bg-white/20"
                        :disabled="bulkProcessing"
                        @click="bulkUpdateStatus('in_progress')"
                    >
                        <ArrowPathIcon class="h-3.5 w-3.5" />
                        In Progress
                    </button>
                    <button
                        class="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-[12px] font-medium text-white transition hover:bg-white/20"
                        :disabled="bulkProcessing"
                        @click="bulkUpdateStatus('cancelled')"
                    >
                        <MinusCircleIcon class="h-3.5 w-3.5" />
                        Mark On Hold
                    </button>
                    <div class="mx-2 h-4 w-px bg-white/20" />
                    <button
                        class="inline-flex items-center gap-1.5 rounded-lg bg-red-600/80 px-3 py-1.5 text-[12px] font-medium text-white transition hover:bg-red-500"
                        :disabled="bulkProcessing"
                        @click="bulkDelete"
                    >
                        <TrashIcon class="h-3.5 w-3.5" />
                        Delete
                    </button>
                    <button
                        class="ml-auto text-[12px] font-medium text-white/60 hover:text-white transition"
                        @click="selectedIds = []"
                    >
                        Deselect all
                    </button>
                </div>
            </Transition>

            <!-- Task Table -->
            <div class="rounded-2xl border border-gray-200/70 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] overflow-hidden">
                <div v-if="tasks.data.length > 0" class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-100">
                        <thead class="bg-gray-50">
                            <tr>
                                <!-- Select All -->
                                <th class="w-10 px-4 py-3">
                                    <input
                                        type="checkbox"
                                        class="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                        :checked="allSelected"
                                        :indeterminate="someSelected && !allSelected"
                                        @change="toggleSelectAll"
                                    >
                                </th>
                                <th class="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-400 cursor-pointer select-none" @click="toggleSort('title')">
                                    <div class="flex items-center gap-1">Task <span class="text-gray-300">⇅</span></div>
                                </th>
                                <th class="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-400">Project</th>
                                <th class="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-400">Status</th>
                                <th class="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-400">Priority</th>
                                <th class="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-400">Assignees</th>
                                <th class="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-400 cursor-pointer select-none" @click="toggleSort('due_date')">
                                    <div class="flex items-center gap-1">Due <span class="text-gray-300">⇅</span></div>
                                </th>
                                <th class="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-widest text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-50 bg-white">
                            <tr
                                v-for="task in tasks.data"
                                :key="task.id"
                                class="group transition-colors hover:bg-gray-50/70"
                                :class="{ 'bg-gray-50/40': selectedIds.includes(task.id) }"
                            >
                                <!-- Checkbox -->
                                <td class="w-10 px-4 py-3.5" @click.stop>
                                    <input
                                        type="checkbox"
                                        class="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                        :checked="selectedIds.includes(task.id)"
                                        @change="toggleSelect(task.id)"
                                    >
                                </td>
                                <!-- Task title -->
                                <td class="px-4 py-3.5">
                                    <Link
                                        :href="route('tasks.show', task.id)"
                                        class="block"
                                        @click.stop
                                    >
                                        <p class="text-[13px] font-medium text-gray-800 truncate max-w-[280px] hover:text-gray-900">{{ task.title }}</p>
                                        <div class="mt-1 flex flex-wrap gap-1">
                                            <span v-for="tag in (task.tags ?? [])" :key="tag" class="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">{{ tag }}</span>
                                        </div>
                                    </Link>
                                </td>
                                <!-- Project -->
                                <td class="px-4 py-3.5 text-[13px] text-gray-500">{{ task.project?.name ?? '—' }}</td>
                                <!-- Status -->
                                <td class="px-4 py-3.5">
                                    <Badge :variant="statusBadge(task.status)">{{ task.status_label ?? task.status }}</Badge>
                                </td>
                                <!-- Priority -->
                                <td class="px-4 py-3.5">
                                    <Badge :variant="priorityBadge(task.priority)">{{ task.priority ?? '—' }}</Badge>
                                </td>
                                <!-- Assignees -->
                                <td class="px-4 py-3.5">
                                    <div class="flex -space-x-1.5">
                                        <div
                                            v-for="a in (task.assignees ?? []).slice(0, 4)"
                                            :key="a.id"
                                            :title="a.name"
                                            class="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[9px] font-semibold uppercase text-gray-600 ring-2 ring-white"
                                        >
                                            {{ a.name.substring(0, 2) }}
                                        </div>
                                        <span v-if="!(task.assignees?.length)" class="text-[12px] italic text-gray-400">—</span>
                                    </div>
                                </td>
                                <!-- Due date -->
                                <td class="px-4 py-3.5 text-[13px]" :class="task.is_overdue ? 'font-semibold text-gray-700' : 'text-gray-500'">
                                    {{ task.due_date ?? '—' }}
                                </td>
                                <!-- Row Actions -->
                                <td class="px-4 py-3.5 text-right" @click.stop>
                                    <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Link
                                            :href="route('tasks.show', task.id)"
                                            class="rounded-lg px-2.5 py-1 text-[12px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                                        >
                                            View
                                        </Link>
                                        <Link
                                            :href="route('tasks.edit', task.id)"
                                            class="rounded-lg px-2.5 py-1 text-[12px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                                        >
                                            Edit
                                        </Link>
                                        <button
                                            class="rounded-lg px-2.5 py-1 text-[12px] font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
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
                <div v-else class="p-10 text-center">
                    <EmptyState title="No tasks found" message="Try adjusting your filters or create a new task." />
                </div>
                <Pagination v-if="tasks.data.length > 0" :pagination="tasks" />
            </div>
        </div>

        <!-- Delete confirm dialog -->
        <ConfirmDialog
            :open="deleteDialog.open"
            :processing="deleteDialog.processing"
            title="Delete Task"
            :message="`Are you sure you want to delete '${deleteDialog.taskTitle}'? This cannot be undone.`"
            variant="danger"
            confirm-text="Delete"
            @confirm="doDeleteTask"
            @close="deleteDialog.open = false"
        />
    </AppLayout>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
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
}>()

// ── Filters ───────────────────────────────────────────────────
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

// ── Bulk Selection ────────────────────────────────────────────
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

// ── Bulk Actions ──────────────────────────────────────────────
const bulkProcessing = ref(false)

async function bulkUpdateStatus(status: string) {
    if (!selectedIds.value.length || bulkProcessing.value) return
    bulkProcessing.value = true

    // Fire sequential PATCH requests using existing tasks.status route
    const ids = [...selectedIds.value]
    const promises = ids.map((id) =>
        new Promise<void>((resolve) => {
            router.patch(
                route('tasks.status', id),
                { status },
                { preserveScroll: true, onFinish: () => resolve() }
            )
        })
    )

    // Use the last one to trigger a full reload
    for (let i = 0; i < ids.length - 1; i++) {
        await new Promise<void>((resolve) => {
            router.patch(route('tasks.status', ids[i]), { status }, {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => resolve(),
            })
        })
    }
    // Last request — full reload
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
                preserveScroll: true,
                preserveState: true,
                onFinish: () => resolve(),
            })
        })
    }
    router.delete(route('tasks.destroy', ids[ids.length - 1]), {
        onSuccess: () => { selectedIds.value = [] },
        onFinish: () => { bulkProcessing.value = false },
    })
}

// ── Single Row Delete ─────────────────────────────────────────
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

// ── Badge helpers ─────────────────────────────────────────────
function statusBadge(status: string): string {
    const map: Record<string, string> = {
        backlog: 'neutral', todo: 'info', in_progress: 'warning',
        in_review: 'warning', approved: 'success', done: 'success',
        cancelled: 'neutral', blocked: 'danger',
    }
    return map[status] ?? 'neutral'
}

function priorityBadge(priority: string): string {
    const map: Record<string, string> = { low: 'neutral', medium: 'info', high: 'warning', urgent: 'danger' }
    return map[priority] ?? 'neutral'
}
</script>
