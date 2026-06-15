<template>
    <AppLayout>
        <div class="mx-auto max-w-4xl space-y-8 py-4">
            <Breadcrumbs
                :items="[{ label: 'Tasks', route: 'tasks.index' }, { label: 'New Task' }]"
                :back="{ route: 'tasks.index' }"
            />

            <div class="flex items-center justify-between border-b border-border pb-4">
                <div>
                    <h2 class="text-3xl font-bold tracking-tight text-text-primary">Create Task</h2>
                    <p class="mt-1.5 text-sm text-text-secondary">
                        Add a new task and specify its details, priority, and assignee.
                    </p>
                </div>

                <div class="flex items-center gap-3">
                    <Link :href="route('tasks.index')" class="btn-secondary">Cancel</Link>

                    <button
                        type="button"
                        :disabled="form.processing"
                        class="btn-primary"
                        @click="submit"
                    >
                        <svg
                            v-if="form.processing"
                            class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                class="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                stroke-width="4"
                            />
                            <path
                                class="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                        </svg>
                        Create Task
                    </button>
                </div>
            </div>

            <form @submit.prevent="submit" class="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div class="space-y-6 lg:col-span-2">
                    <!-- ═══ Subtasks Section ═══ -->
                    <div class="card">
                        <div class="card-header flex items-center justify-between">
                            <h3 class="text-base font-semibold">
                                Subtasks
                                <span v-if="subtasks.length" class="ml-2 text-sm font-normal text-text-secondary">
                                    ({{ completedSubtaskCount }}/{{ subtasks.length }})
                                </span>
                            </h3>
                            <button type="button" class="btn-secondary btn-sm" @click="addSubtaskRow">
                                + Add Subtask
                            </button>
                        </div>
                        <div class="card-body space-y-3">
                            <div v-if="subtasks.length === 0" class="text-sm text-text-secondary">
                                No subtasks added yet. Break this task into smaller pieces.
                            </div>
                            <div
                                v-for="(st, idx) in subtasks"
                                :key="idx"
                                class="rounded-lg border border-border bg-page p-4 space-y-3"
                            >
                                <div class="flex items-start justify-between gap-2">
                                    <input
                                        v-model="st.title"
                                        type="text"
                                        class="input flex-1 text-sm font-medium"
                                        placeholder="Subtask title"
                                    />
                                    <button
                                        type="button"
                                        class="text-danger hover:text-danger shrink-0 mt-1"
                                        @click="subtasks.splice(idx, 1)"
                                        title="Remove subtask"
                                    >
                                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <select v-model="st.priority" class="input text-sm">
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                    <input v-model="st.due_date" type="date" class="input text-sm" />
                                    <select v-model="st.assignee_id" class="input text-sm">
                                        <option :value="null">Unassigned</option>
                                        <option v-for="m in projectMembers" :key="m.id" :value="m.id">{{ m.name }}</option>
                                    </select>
                                </div>
                                <textarea
                                    v-model="st.description"
                                    rows="2"
                                    class="input w-full text-sm resize-none"
                                    placeholder="Optional description..."
                                />
                                <p v-if="subtaskErrors[idx]" class="text-xs text-danger">{{ subtaskErrors[idx] }}</p>
                            </div>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-body space-y-6">
                            <div>
                                <label class="mb-1.5 block text-sm font-semibold text-text-primary">
                                    Task Title <span class="text-danger">*</span>
                                </label>

                                <input
                                    v-model="form.title"
                                    type="text"
                                    class="input w-full py-2.5 text-lg font-medium placeholder-text-secondary"
                                    placeholder="e.g. Design new landing page hero section"
                                    autofocus
                                />

                                <p
                                    v-if="form.errors.title"
                                    class="mt-1.5 text-sm font-medium text-danger"
                                >
                                    {{ form.errors.title }}
                                </p>
                            </div>

                            <div>
                                <label class="mb-1.5 block text-sm font-semibold text-text-primary">
                                    Description
                                </label>

                                <textarea
                                    v-model="form.description"
                                    rows="6"
                                    class="input w-full resize-y placeholder-text-secondary"
                                    placeholder="Provide details, acceptance criteria, or context..."
                                />
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-body">
                            <h3
                                class="mb-4 text-sm font-semibold uppercase tracking-wider text-text-primary"
                            >
                                Tags & Categorization
                            </h3>

                            <div class="mb-3 flex flex-wrap gap-2">
                                <span
                                    v-for="(tag, i) in form.tags"
                                    :key="i"
                                    class="inline-flex items-center gap-1.5 rounded-md bg-brand-primary-50 px-2.5 py-1 text-xs font-medium text-brand-primary-700 ring-1 ring-inset ring-brand-primary-600/20"
                                >
                                    {{ tag }}

                                    <button
                                        type="button"
                                        class="text-brand-primary-500 hover:text-brand-primary-800"
                                        @click="removeTag(i)"
                                    >
                                        &times;
                                    </button>
                                </span>
                            </div>

                            <div class="relative flex gap-2">
                                <span class="absolute inset-y-0 left-0 flex items-center pl-3">
                                    <svg
                                        class="h-4 w-4 text-text-secondary"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                        />
                                    </svg>
                                </span>

                                <input
                                    v-model="newTag"
                                    type="text"
                                    class="input flex-1 pl-9 text-sm"
                                    placeholder="Add a tag..."
                                    @keydown.enter.prevent="addTag"
                                />

                                <button
                                    type="button"
                                    class="btn-secondary btn-sm"
                                    :disabled="!newTag"
                                    @click="addTag"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="space-y-6">
                    <div class="card">
                        <div class="card-body space-y-5">
                            <div>
                                <label
                                    class="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-secondary"
                                >
                                    Project <span class="text-danger">*</span>
                                </label>

                                <select
                                    v-model="form.project_id"
                                    class="input w-full text-sm font-medium"
                                    @change="onProjectChange"
                                >
                                    <option
                                        v-for="p in projects"
                                        :key="p.id"
                                        :value="p.id"
                                    >
                                        {{ p.name }}
                                    </option>
                                </select>

                                <p
                                    v-if="form.errors.project_id"
                                    class="mt-1 text-xs text-danger"
                                >
                                    {{ form.errors.project_id }}
                                </p>
                            </div>

                            <div>
                                <label
                                    class="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-secondary"
                                >
                                    Assignees
                                </label>

                                <div class="relative" ref="assigneeContainer">
                                    <button
                                        type="button"
                                        class="input flex min-h-[38px] w-full items-center justify-between bg-white px-3 py-1.5 text-left text-sm"
                                        @click="isAssigneeDropdownOpen = !isAssigneeDropdownOpen"
                                    >
                                        <div class="flex flex-wrap gap-1.5">
                                            <span
                                                v-if="form.assignee_ids.length === 0"
                                                class="text-text-secondary"
                                            >
                                                Unassigned
                                            </span>

                                            <span
                                                v-for="id in form.assignee_ids"
                                                :key="id"
                                                class="inline-flex items-center gap-1 rounded bg-page px-2 py-0.5 text-xs font-medium text-text-primary"
                                            >
                                                {{ getMemberName(id) }}

                                                <button
                                                    type="button"
                                                    class="ml-1 text-sm font-bold text-text-secondary hover:text-gray-600"
                                                    @click.stop="toggleAssignee(id)"
                                                >
                                                    &times;
                                                </button>
                                            </span>
                                        </div>

                                        <svg
                                            class="ml-2 h-4 w-4 flex-shrink-0 text-text-secondary"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M19 9l-7 7-7-7"
                                            />
                                        </svg>
                                    </button>

                                    <div
                                        v-if="isAssigneeDropdownOpen"
                                        class="absolute z-30 mt-1 max-h-60 w-full space-y-1 overflow-y-auto rounded-md bg-white p-1 shadow-dropdown ring-1 ring-black/5"
                                    >
                                        <div
                                            v-if="projectMembers.length === 0"
                                            class="p-2 text-center text-xs text-text-secondary"
                                        >
                                            No members available
                                        </div>

                                        <button
                                            v-for="m in projectMembers"
                                            :key="m.id"
                                            type="button"
                                            class="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-page"
                                            @click="toggleAssignee(m.id)"
                                        >
                                            <span
                                                :class="
                                                    form.assignee_ids.includes(m.id)
                                                        ? 'font-semibold text-brand-primary-700'
                                                        : 'text-text-primary'
                                                "
                                            >
                                                {{ m.name }}
                                            </span>

                                            <svg
                                                v-if="form.assignee_ids.includes(m.id)"
                                                class="h-4 w-4 text-brand-primary-500"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                <p
                                    v-if="form.errors.assignee_ids"
                                    class="mt-1 text-xs text-danger"
                                >
                                    {{ form.errors.assignee_ids }}
                                </p>
                            </div>

                            <hr class="border-border" />

                            <div>
                                <label
                                    class="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-secondary"
                                >
                                    Priority
                                </label>

                                <select v-model="form.priority" class="input w-full text-sm">
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>

                            <div>
                                <label
                                    class="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-secondary"
                                >
                                    Due Date
                                </label>

                                <input
                                    v-model="form.due_date"
                                    type="date"
                                    class="input w-full text-sm text-text-primary"
                                />
                            </div>

                            <div>
                                <label
                                    class="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-secondary"
                                >
                                    Est. Hours
                                </label>

                                <input
                                    v-model="form.estimated_hours"
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    class="input w-full text-sm"
                                    placeholder="e.g. 4.5"
                                />
                            </div>
                        </div>
                    </div>

                    <div
                        class="rounded-xl border border-border bg-page shadow-inner"
                    >
                        <div class="space-y-4 p-5">
                            <label class="flex cursor-pointer items-start gap-3">
                                <div class="flex h-5 items-center">
                                    <input
                                        v-model="form.requires_approval"
                                        type="checkbox"
                                        class="h-4 w-4 rounded border-border text-brand-primary-500 focus:ring-brand-primary-600"
                                    />
                                </div>

                                <div class="text-sm">
                                    <span class="block font-medium text-text-primary">
                                        Requires Approval
                                    </span>
                                    <span class="text-xs text-text-secondary">
                                        Task must be approved by an assigned reviewer.
                                    </span>
                                </div>
                            </label>

                            <div v-if="form.requires_approval" class="pt-2">
                                <label
                                    class="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-secondary"
                                >
                                    Approver
                                </label>

                                <select
                                    v-model="form.approver_id"
                                    class="input w-full text-sm"
                                >
                                    <option :value="null">Select reviewer...</option>

                                    <option
                                        v-for="m in projectMembers"
                                        :key="m.id"
                                        :value="m.id"
                                    >
                                        {{ m.name }}
                                    </option>
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
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { useForm, Link } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import AppLayout from '@/Layouts/AppLayout.vue'
import Breadcrumbs from '@/Components/Breadcrumbs.vue'

const props = defineProps<{ projects: any[] }>()

const newTag = ref('')
const projectMembers = ref<{ id: number; name: string }[]>([])
const isAssigneeDropdownOpen = ref(false)
const assigneeContainer = ref<HTMLElement | null>(null)

interface SubtaskRow {
    title: string
    description: string
    priority: string
    due_date: string
    assignee_id: number | null
    estimated_hours: string
}

const subtasks = reactive<SubtaskRow[]>([])
const subtaskErrors = reactive<Record<number, string>>({})

const completedSubtaskCount = computed(() => 0)

function addSubtaskRow() {
    subtasks.push({
        title: '',
        description: '',
        priority: 'medium',
        due_date: '',
        assignee_id: null,
        estimated_hours: '',
    })
}

const form = useForm({
    project_id: props.projects[0]?.id ?? '',
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    estimated_hours: '',
    assignee_ids: [] as number[],
    tags: [] as string[],
    requires_approval: false,
    approver_id: null as number | null,
    subtasks: [] as SubtaskRow[],
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
    return projectMembers.value.find((m) => m.id === id)?.name || 'Unknown'
}

function handleClickOutside(event: MouseEvent) {
    if (
        assigneeContainer.value &&
        !assigneeContainer.value.contains(event.target as Node)
    ) {
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

function removeTag(index: number) {
    form.tags.splice(index, 1)
}

function onProjectChange() {
    form.assignee_ids = []
    form.approver_id = null

    if (!form.project_id) {
        projectMembers.value = []
        return
    }

    fetchProjectMembers(form.project_id)
}

async function fetchProjectMembers(id: number | string) {
    if (!id) return

    try {
        const res = await fetch(`/projects/${id}/members`)
        const members = await res.json()
        projectMembers.value = members
    } catch {
        projectMembers.value = []
    }
}

watch(
    () => form.project_id,
    (id) => {
        fetchProjectMembers(id)
    },
    { immediate: true }
)

function submit() {
    const invalidSubtasks = subtasks
        .map((st, idx) => ({ st, idx }))
        .filter(({ st }) => !st.title.trim())

    Object.keys(subtaskErrors).forEach(k => delete subtaskErrors[Number(k)])

    if (invalidSubtasks.length > 0) {
        invalidSubtasks.forEach(({ idx }) => {
            subtaskErrors[idx] = 'Title is required'
        })
        return
    }

    form.subtasks = subtasks.filter(st => st.title.trim())
    form.post(route('tasks.store'))
}
</script>
