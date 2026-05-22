<template>
    <AppLayout>
        <div class="mx-auto max-w-4xl space-y-8 py-4">
            <Breadcrumbs
                :items="[{ label: 'Tasks', route: 'tasks.index' }, { label: 'New Task' }]"
                :back="{ route: 'tasks.index' }"
            />

            <div class="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                    <h2 class="text-3xl font-bold tracking-tight text-gray-900">Create Task</h2>
                    <p class="mt-1.5 text-sm text-gray-500">
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
                    <div class="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                        <div class="space-y-6 p-6">
                            <div>
                                <label class="mb-1.5 block text-sm font-semibold text-gray-900">
                                    Task Title <span class="text-red-500">*</span>
                                </label>

                                <input
                                    v-model="form.title"
                                    type="text"
                                    class="input w-full py-2.5 text-lg font-medium placeholder-gray-400"
                                    placeholder="e.g. Design new landing page hero section"
                                    autofocus
                                />

                                <p
                                    v-if="form.errors.title"
                                    class="mt-1.5 text-sm font-medium text-red-600"
                                >
                                    {{ form.errors.title }}
                                </p>
                            </div>

                            <div>
                                <label class="mb-1.5 block text-sm font-semibold text-gray-900">
                                    Description
                                </label>

                                <textarea
                                    v-model="form.description"
                                    rows="6"
                                    class="input w-full resize-y placeholder-gray-400"
                                    placeholder="Provide details, acceptance criteria, or context..."
                                />
                            </div>
                        </div>
                    </div>

                    <div class="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                        <div class="p-6">
                            <h3
                                class="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900"
                            >
                                Tags & Categorization
                            </h3>

                            <div class="mb-3 flex flex-wrap gap-2">
                                <span
                                    v-for="(tag, i) in form.tags"
                                    :key="i"
                                    class="inline-flex items-center gap-1.5 rounded-md bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 ring-1 ring-inset ring-primary-600/20"
                                >
                                    {{ tag }}

                                    <button
                                        type="button"
                                        class="text-primary-600 hover:text-primary-800"
                                        @click="removeTag(i)"
                                    >
                                        &times;
                                    </button>
                                </span>
                            </div>

                            <div class="relative flex gap-2">
                                <span class="absolute inset-y-0 left-0 flex items-center pl-3">
                                    <svg
                                        class="h-4 w-4 text-gray-400"
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
                    <div class="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                        <div class="space-y-5 p-5">
                            <div>
                                <label
                                    class="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500"
                                >
                                    Project <span class="text-red-500">*</span>
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
                                    class="mt-1 text-xs text-red-600"
                                >
                                    {{ form.errors.project_id }}
                                </p>
                            </div>

                            <div>
                                <label
                                    class="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500"
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
                                                class="text-gray-400"
                                            >
                                                Unassigned
                                            </span>

                                            <span
                                                v-for="id in form.assignee_ids"
                                                :key="id"
                                                class="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700"
                                            >
                                                {{ getMemberName(id) }}

                                                <button
                                                    type="button"
                                                    class="ml-1 text-sm font-bold text-gray-400 hover:text-gray-600"
                                                    @click.stop="toggleAssignee(id)"
                                                >
                                                    &times;
                                                </button>
                                            </span>
                                        </div>

                                        <svg
                                            class="ml-2 h-4 w-4 flex-shrink-0 text-gray-400"
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
                                        class="absolute z-30 mt-1 max-h-60 w-full space-y-1 overflow-y-auto rounded-md bg-white p-1 shadow-lg ring-1 ring-black ring-opacity-5"
                                    >
                                        <div
                                            v-if="projectMembers.length === 0"
                                            class="p-2 text-center text-xs text-gray-400"
                                        >
                                            No members available
                                        </div>

                                        <button
                                            v-for="m in projectMembers"
                                            :key="m.id"
                                            type="button"
                                            class="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-gray-50"
                                            @click="toggleAssignee(m.id)"
                                        >
                                            <span
                                                :class="
                                                    form.assignee_ids.includes(m.id)
                                                        ? 'font-semibold text-primary-700'
                                                        : 'text-gray-700'
                                                "
                                            >
                                                {{ m.name }}
                                            </span>

                                            <svg
                                                v-if="form.assignee_ids.includes(m.id)"
                                                class="h-4 w-4 text-primary-600"
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
                                    class="mt-1 text-xs text-red-600"
                                >
                                    {{ form.errors.assignee_ids }}
                                </p>
                            </div>

                            <hr class="border-gray-100" />

                            <div>
                                <label
                                    class="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500"
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
                                    class="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500"
                                >
                                    Due Date
                                </label>

                                <input
                                    v-model="form.due_date"
                                    type="date"
                                    class="input w-full text-sm text-gray-700"
                                />
                            </div>

                            <div>
                                <label
                                    class="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500"
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
                        class="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 shadow-inner"
                    >
                        <div class="space-y-4 p-5">
                            <label class="flex cursor-pointer items-start gap-3">
                                <div class="flex h-5 items-center">
                                    <input
                                        v-model="form.requires_approval"
                                        type="checkbox"
                                        class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                                    />
                                </div>

                                <div class="text-sm">
                                    <span class="block font-medium text-gray-900">
                                        Requires Approval
                                    </span>
                                    <span class="text-xs text-gray-500">
                                        Task must be approved by an assigned reviewer.
                                    </span>
                                </div>
                            </label>

                            <div v-if="form.requires_approval" class="pt-2">
                                <label
                                    class="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500"
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
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useForm, Link } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import AppLayout from '@/Layouts/AppLayout.vue'
import Breadcrumbs from '@/Components/Breadcrumbs.vue'

const props = defineProps<{ projects: any[] }>()

const newTag = ref('')
const projectMembers = ref<{ id: number; name: string }[]>([])
const isAssigneeDropdownOpen = ref(false)
const assigneeContainer = ref<HTMLElement | null>(null)

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
    form.post(route('tasks.store'))
}
</script>