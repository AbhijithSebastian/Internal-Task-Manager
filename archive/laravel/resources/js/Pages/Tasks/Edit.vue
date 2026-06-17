<template>
    <AppLayout>
        <div class="mx-auto max-w-4xl space-y-8 py-4">
            <Breadcrumbs :items="[{ label: 'Tasks', route: 'tasks.index' }, { label: task.title, route: 'tasks.show', params: { id: task.id } }, { label: 'Edit' }]" :back="{ route: 'tasks.show', params: { id: task.id } }" />

            <div class="flex items-center justify-between border-b border-border pb-4">
                <div>
                    <h2 class="text-3xl font-bold tracking-tight text-text-primary">Edit Task</h2>
                    <p class="mt-1.5 text-sm text-text-secondary">Update task details and assignments.</p>
                </div>
                <div class="flex items-center gap-3">
                    <Link :href="route('tasks.show', task.id)" class="btn-secondary">Cancel</Link>
                    <button type="button" :disabled="form.processing" class="btn-primary" @click="submit">
                        <svg v-if="form.processing" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Save Changes
                    </button>
                </div>
            </div>

            <form @submit.prevent="submit" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Main Content Column -->
                <div class="lg:col-span-2 space-y-6">
                    <div class="card">
                        <div class="card-body space-y-6">
                            <div>
                                <label class="block text-sm font-semibold text-text-primary mb-1.5">Task Title <span class="text-danger">*</span></label>
                                <input v-model="form.title" type="text" class="input w-full text-lg font-medium py-2.5">
                                <p v-if="form.errors.title" class="mt-1.5 text-sm text-danger font-medium">{{ form.errors.title }}</p>
                            </div>

                            <div>
                                <label class="block text-sm font-semibold text-text-primary mb-1.5">Description</label>
                                <textarea v-model="form.description" rows="6" class="input w-full resize-y placeholder-text-secondary" placeholder="Provide details, acceptance criteria, or context..." />
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-body">
                            <h3 class="text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider">Dependencies</h3>

                            <div class="space-y-2 mb-4">
                                <div v-if="_dependencyIds.length === 0" class="text-sm text-text-secondary italic">No dependencies assigned.</div>
                                <div v-for="dep in _dependencyIds" :key="dep.id" class="flex items-center justify-between rounded-card border border-border bg-page px-3 py-2">
                                    <span class="text-sm font-medium text-text-primary">{{ dep.title }}</span>
                                    <button type="button" class="text-xs text-danger hover:text-danger font-medium px-2 py-1" @click="removeDependency(dep.id)">Remove</button>
                                </div>
                            </div>
                            <div class="flex gap-2">
                                <select v-model="addDepId" class="input flex-1 text-sm">
                                    <option :value="null" disabled>Select a task to depend on...</option>
                                    <option v-for="t in availableDeps" :key="t.id" :value="t.id">{{ t.title }}</option>
                                </select>
                                <button type="button" class="btn-secondary btn-sm" :disabled="!addDepId" @click="addDependency">Add Dependency</button>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-body">
                            <h3 class="text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider">Subtasks</h3>

                            <div v-if="subtasks.length > 0" class="mb-4">
                                <div class="flex items-center justify-between text-xs text-text-secondary mb-1">
                                    <span>{{ subtaskCompletionRate }}% complete</span>
                                    <button v-if="subtasks.some(s => s.status === 'done')" class="text-danger hover:text-danger text-xs font-medium" @click="deleteCompletedSubtasks">
                                        Delete completed
                                    </button>
                                </div>
                                <div class="h-2 w-full rounded-full bg-page">
                                    <div class="h-2 rounded-full bg-brand-primary-500 transition-all duration-300" :style="{ width: subtaskCompletionRate + '%' }"></div>
                                </div>
                            </div>

                            <div v-if="subtasks.length === 0 && !showSubtaskForm" class="text-sm text-text-secondary mb-4">No subtasks.</div>

                            <ul v-if="subtasks.length > 0" class="divide-y divide-border mb-4">
                                <li v-for="(subtask, index) in subtasks" :key="subtask.id" class="py-2">
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-2 min-w-0 flex-1">
                                            <input type="checkbox" :checked="subtask.status === 'done'" class="rounded border-border text-brand-primary-500 shrink-0" @change="toggleSubtaskStatus(subtask)">
                                            <template v-if="editingSubtaskId === subtask.id">
                                                <input v-model="editingSubtaskTitle" type="text" class="input text-sm flex-1 min-w-0" @keydown.enter="saveSubtaskTitle(subtask)" @keydown.escape="cancelSubtaskEdit">
                                                <button class="text-xs text-brand-primary-500 hover:text-brand-primary-600 shrink-0" @click="saveSubtaskTitle(subtask)">Save</button>
                                                <button class="text-xs text-text-secondary shrink-0" @click="cancelSubtaskEdit">Cancel</button>
                                            </template>
                                            <template v-else>
                                                <button class="text-sm truncate text-left hover:text-brand-primary-600" :class="subtask.status === 'done' ? 'line-through text-text-secondary' : 'text-text-primary'" @click="startSubtaskEdit(subtask)">{{ subtask.title }}</button>
                                            </template>
                                        </div>
                                        <div class="flex items-center gap-2 shrink-0 ml-2">
                                            <select v-model="subtask.assignee_id" class="input text-xs py-1 max-w-[120px]" @change="changeSubtaskAssignee(subtask)">
                                                <option :value="null">Unassign</option>
                                                <option v-for="m in projectMembers" :key="m.id" :value="m.id">{{ m.name }}</option>
                                            </select>
                                            <button class="text-xs text-danger hover:text-danger" @click="confirmDeleteSubtask(subtask)">
                                                <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                    <div v-if="subtask.due_date" class="mt-1 ml-7 text-xs text-text-secondary">
                                        Due {{ dayjs(subtask.due_date).format('MMM D') }}
                                    </div>
                                </li>
                            </ul>

                            <form v-if="showSubtaskForm" @submit.prevent="addSubtask" class="space-y-2 border-t border-border pt-4">
                                <input v-model="subtaskForm.title" type="text" class="input" placeholder="Subtask title">
                                <div class="flex gap-2">
                                    <select v-model="subtaskForm.priority" class="input flex-1">
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                    <input v-model="subtaskForm.due_date" type="date" class="input flex-1">
                                    <select v-model="subtaskForm.assignee_id" class="input flex-1">
                                        <option :value="null">Assignee</option>
                                        <option v-for="m in projectMembers" :key="m.id" :value="m.id">{{ m.name }}</option>
                                    </select>
                                </div>
                                <div class="flex justify-end gap-2">
                                    <button type="button" class="btn-secondary btn-sm" @click="showSubtaskForm = false">Cancel</button>
                                    <button type="submit" class="btn-primary btn-sm">Add</button>
                                </div>
                            </form>

                            <button v-if="!showSubtaskForm" class="btn-secondary btn-sm mt-2" @click="showSubtaskForm = true">+ Add Subtask</button>
                        </div>
                    </div>

                    <Modal :open="subtaskDeleteModal.open" @close="subtaskDeleteModal.open = false">
                        <template #title>Delete Subtask</template>
                        <p class="text-sm text-text-secondary">Delete <strong>{{ subtaskDeleteModal.subtask?.title }}</strong>? This cannot be undone.</p>
                        <div class="mt-6 flex justify-end gap-3">
                            <button class="btn-secondary btn-sm" @click="subtaskDeleteModal.open = false">Cancel</button>
                            <button class="btn-danger btn-sm" :disabled="subtaskDeleteModal.processing" @click="deleteSubtask">
                                <svg v-if="subtaskDeleteModal.processing" class="animate-spin -ml-1 mr-1 h-3 w-3 text-white inline" viewBox="0 0 24 24" fill="none">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Delete
                            </button>
                        </div>
                    </Modal>

                    <div class="card">
                        <div class="card-body">
                            <h3 class="text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider">Tags & Categorization</h3>

                            <div class="flex flex-wrap gap-2 mb-3">
                                <span v-for="(tag, i) in form.tags" :key="i" class="inline-flex items-center gap-1.5 rounded-md bg-brand-primary-50 px-2.5 py-1 text-xs font-medium text-brand-primary-700 ring-1 ring-inset ring-brand-primary-600/20">
                                    {{ tag }}
                                    <button type="button" class="text-brand-primary-500 hover:text-brand-primary-800 focus:outline-none" @click="form.tags.splice(i, 1)">&times;</button>
                                </span>
                            </div>
                            <div class="flex gap-2 relative">
                                <span class="absolute inset-y-0 left-0 flex items-center pl-3">
                                    <svg class="h-4 w-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                                </span>
                                <input v-model="newTag" type="text" class="input flex-1 pl-9 text-sm" placeholder="Add a tag..." @keydown.enter.prevent="addTag">
                                <button type="button" class="btn-secondary btn-sm" :disabled="!newTag" @click="addTag">Add</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Sidebar Column -->
                <div class="space-y-6">
                    <div class="card">
                        <div class="card-body space-y-5">
                            <div>
                                <label class="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Status</label>
                                <select v-model="form.status" class="input w-full text-sm font-medium">
                                    <option v-for="s in statuses" :key="s.value" :value="s.value">{{ s.label }}</option>
                                </select>
                            </div>

                            <div>
                                <label class="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Assignees</label>
                                <div class="relative" ref="assigneeContainer">
                                    <button
                                        type="button"
                                        class="input w-full text-left text-sm flex items-center justify-between min-h-[38px] py-1.5 px-3 bg-white"
                                        @click="isAssigneeDropdownOpen = !isAssigneeDropdownOpen"
                                    >
                                        <div class="flex flex-wrap gap-1.5">
                                            <span v-if="form.assignee_ids.length === 0" class="text-text-secondary">Unassigned</span>
                                            <span
                                                v-for="id in form.assignee_ids"
                                                :key="id"
                                                class="inline-flex items-center gap-1 rounded bg-page px-2 py-0.5 text-xs font-medium text-text-primary hover:bg-page"
                                            >
                                                {{ getMemberName(id) }}
                                                <button
                                                    type="button"
                                                    class="text-text-secondary hover:text-text-secondary/60 focus:outline-none ml-1 text-sm font-bold"
                                                    @click.stop="toggleAssignee(id)"
                                                >
                                                    &times;
                                                </button>
                                            </span>
                                        </div>
                                        <svg class="h-4 w-4 text-text-secondary ml-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    <!-- Dropdown Menu -->
                                    <div
                                        v-if="isAssigneeDropdownOpen"
                                        class="absolute z-30 mt-1 w-full rounded-md bg-white shadow-dropdown ring-1 ring-black/5 focus:outline-none max-h-60 overflow-y-auto p-1 space-y-1"
                                    >
                                        <div v-if="projectMembers.length === 0" class="text-xs text-text-secondary p-2 text-center">
                                            No members available
                                        </div>
                                        <button
                                            v-for="m in projectMembers"
                                            :key="m.id"
                                            type="button"
                                            class="w-full text-left px-3 py-2 text-sm rounded-md flex items-center justify-between hover:bg-page focus:bg-page focus:outline-none"
                                            @click="toggleAssignee(m.id)"
                                        >
                                            <span class="font-medium" :class="form.assignee_ids.includes(m.id) ? 'text-brand-primary-700 font-semibold' : 'text-text-primary'">
                                                {{ m.name }}
                                            </span>
                                            <svg v-if="form.assignee_ids.includes(m.id)" class="h-4 w-4 text-brand-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <p v-if="form.errors.assignee_ids" class="mt-1 text-xs text-danger">{{ form.errors.assignee_ids }}</p>
                            </div>

                            <hr class="border-border" />

                            <div>
                                <label class="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Priority</label>
                                <select v-model="form.priority" class="input w-full text-sm">
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>

                            <div>
                                <label class="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Due Date</label>
                                <input
                                    v-model="form.due_date"
                                    type="date"
                                    class="input w-full text-sm"
                                    :disabled="$page.props.auth.user.role === 'employee'"
                                    :class="{ 'bg-page cursor-not-allowed text-text-secondary': $page.props.auth.user.role === 'employee' }"
                                >
                                <p v-if="$page.props.auth.user.role === 'employee'" class="text-[10px] text-danger mt-1 font-medium">Project deadlines can only be updated by managers or team leads.</p>
                            </div>

                            <div>
                                <label class="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Employee ETA</label>
                                <input
                                    v-model="form.employee_eta"
                                    type="date"
                                    class="input w-full text-sm text-brand-primary-700"
                                >
                                <p class="text-[11px] text-text-secondary mt-1">Estimated completion date for the assignee.</p>
                            </div>

                            <div>
                                <label class="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Est. Hours</label>
                                <input v-model="form.estimated_hours" type="number" step="0.5" min="0" class="input w-full text-sm" placeholder="e.g. 4.5">
                            </div>
                        </div>
                    </div>

                    <div class="rounded-card border border-border bg-page shadow-card">
                        <div class="p-6 space-y-4">
                            <label class="flex items-start gap-3 cursor-pointer">
                                <div class="flex items-center h-5">
                                    <input v-model="form.requires_approval" type="checkbox" class="h-4 w-4 rounded border-border text-brand-primary-500 focus:ring-brand-primary-600">
                                </div>
                                <div class="text-sm">
                                    <span class="font-medium text-text-primary block">Requires Approval</span>
                                    <span class="text-text-secondary text-xs">Task must be approved by an assigned reviewer before completion.</span>
                                </div>
                            </label>

                            <div v-if="form.requires_approval" class="pt-2">
                                <label class="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Approver</label>
                                <select v-model="form.approver_id" class="input w-full text-sm">
                                    <option :value="null">Select reviewer...</option>
                                    <option v-for="m in projectMembers" :key="m.id" :value="m.id">{{ m.name }}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useForm, Link, router } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import dayjs from 'dayjs'
import AppLayout from '@/Layouts/AppLayout.vue'
import Breadcrumbs from '@/Components/Breadcrumbs.vue'
import Modal from '@/Components/Modal.vue'

const props = defineProps<{ task: any; projects: any; project_members: any; available_dependencies: any }>()

const subtasks = reactive<{ id: number; title: string; status: string; assignee_id: number | null; due_date: string | null }[]>(
    (props.task.subtasks ?? []).map((s: any) => ({ id: s.id, title: s.title, status: s.status, assignee_id: s.assignee_id, due_date: s.due_date }))
)

const subtaskCompletionRate = computed(() => {
    const total = subtasks.length
    if (total === 0) return 0
    const done = subtasks.filter(s => s.status === 'done').length
    return Math.round((done / total) * 100)
})

const projectMembers = props.project_members
const availableDeps = props.available_dependencies.filter((t: any) => !props.task.dependencies?.some((d: any) => d.id === t.id))

const newTag = ref('')
const addDepId = ref<number | null>(null)
const isAssigneeDropdownOpen = ref(false)
const assigneeContainer = ref<HTMLElement | null>(null)

const _dependencyIds = reactive<{ id: number; title: string }[]>(
    (props.task.dependencies ?? []).map((d: any) => ({ id: d.id, title: d.title }))
)

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

const showSubtaskForm = ref(false)
const editingSubtaskId = ref<number | null>(null)
const editingSubtaskTitle = ref('')
const subtaskDeleteModal = reactive({ open: false, processing: false, subtask: null as any })
const subtaskForm = useForm({ title: '', priority: 'medium', due_date: '', assignee_id: null as number | null })

const form = useForm({
    title: props.task.title,
    description: props.task.description ?? '',
    status: props.task.status,
    priority: props.task.priority,
    assignee_ids: props.task.assignees?.map((a: any) => a.id) ?? [],
    due_date: props.task.due_date ? props.task.due_date.substring(0, 10) : '',
    employee_eta: props.task.employee_eta ? props.task.employee_eta.substring(0, 10) : '',
    estimated_hours: props.task.estimated_hours ?? '',
    tags: [...(props.task.tags ?? [])],
    dependency_ids: [...(props.task.dependencies?.map((d: any) => d.id) ?? [])],
    requires_approval: props.task.requires_approval ?? false,
    approver_id: props.task.approver_id ?? null,
})

function toggleAssignee(id: number) {
    const idx = form.assignee_ids.indexOf(id)
    if (idx > -1) {
        form.assignee_ids.splice(idx, 1)
    } else {
        form.assignee_ids.push(id)
    }
}

function getMemberName(id: number) {
    return projectMembers.find((m: any) => m.id === id)?.name || 'Unknown'
}

function handleClickOutside(event: MouseEvent) {
    if (assigneeContainer.value && !assigneeContainer.value.contains(event.target as Node)) {
        isAssigneeDropdownOpen.value = false
    }
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
})

function addTag() {
    const tag = newTag.value.trim().toLowerCase()
    if (tag && !form.tags.includes(tag)) {
        form.tags.push(tag)
    }
    newTag.value = ''
}

function addDependency() {
    if (!addDepId.value) return
    const dep = props.available_dependencies.find((t: any) => t.id === addDepId.value)
    if (dep && !form.dependency_ids.includes(dep.id)) {
        form.dependency_ids.push(dep.id)
        _dependencyIds.push({ id: dep.id, title: dep.title })
    }
    addDepId.value = null
}

function removeDependency(id: number) {
    form.dependency_ids = form.dependency_ids.filter((d: number) => d !== id)
    const idx = _dependencyIds.findIndex((d: any) => d.id === id)
    if (idx >= 0) _dependencyIds.splice(idx, 1)
}

function addSubtask() {
    subtaskForm.post(route('tasks.subtasks.store', props.task.id), {
        preserveScroll: true,
        onSuccess: () => {
            subtaskForm.reset()
            subtaskForm.priority = 'medium'
            subtaskForm.due_date = ''
            showSubtaskForm.value = false
            router.reload({ preserveScroll: true })
        },
    })
}

function toggleSubtaskStatus(subtask: any) {
    const newStatus = subtask.status === 'done' ? 'todo' : 'done'
    router.patch(route('tasks.status', subtask.id), { status: newStatus }, {
        preserveScroll: true,
        onSuccess: () => { subtask.status = newStatus },
    })
}

function startSubtaskEdit(subtask: any) {
    editingSubtaskId.value = subtask.id
    editingSubtaskTitle.value = subtask.title
}

function cancelSubtaskEdit() {
    editingSubtaskId.value = null
    editingSubtaskTitle.value = ''
}

function saveSubtaskTitle(subtask: any) {
    if (!editingSubtaskTitle.value.trim() || editingSubtaskTitle.value === subtask.title) {
        cancelSubtaskEdit()
        return
    }
    router.put(route('tasks.subtasks.update', { task: props.task.id, subtask: subtask.id }), {
        title: editingSubtaskTitle.value,
    }, {
        preserveScroll: true,
        onSuccess: () => {
            subtask.title = editingSubtaskTitle.value
            cancelSubtaskEdit()
        },
    })
}

function changeSubtaskAssignee(subtask: any) {
    router.put(route('tasks.subtasks.update', { task: props.task.id, subtask: subtask.id }), {
        assignee_id: subtask.assignee_id,
    }, { preserveScroll: true })
}

function confirmDeleteSubtask(subtask: any) {
    subtaskDeleteModal.subtask = subtask
    subtaskDeleteModal.open = true
}

function deleteSubtask() {
    if (!subtaskDeleteModal.subtask) return
    subtaskDeleteModal.processing = true
    router.delete(route('tasks.subtasks.destroy', { task: props.task.id, subtask: subtaskDeleteModal.subtask.id }), {
        preserveScroll: true,
        onFinish: () => {
            const idx = subtasks.findIndex((s: any) => s.id === subtaskDeleteModal.subtask.id)
            if (idx >= 0) subtasks.splice(idx, 1)
            subtaskDeleteModal.open = false
            subtaskDeleteModal.processing = false
            subtaskDeleteModal.subtask = null
        },
    })
}

function deleteCompletedSubtasks() {
    const completedIds = subtasks.filter(s => s.status === 'done').map(s => s.id)
    if (completedIds.length === 0) return
    router.post(route('tasks.subtasks.bulk-delete', props.task.id), { subtask_ids: completedIds }, {
        preserveScroll: true,
        onSuccess: () => {
            completedIds.forEach((id: number) => {
                const idx = subtasks.findIndex((s: any) => s.id === id)
                if (idx >= 0) subtasks.splice(idx, 1)
            })
        },
    })
}

function submit() {
    form.put(route('tasks.update', props.task.id))
}
</script>