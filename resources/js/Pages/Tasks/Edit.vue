<template>
    <AppLayout>
        <div class="mx-auto max-w-4xl space-y-8 py-4">
            <Breadcrumbs :items="[{ label: 'Tasks', route: 'tasks.index' }, { label: task.title, route: 'tasks.show', params: { id: task.id } }, { label: 'Edit' }]" :back="{ route: 'tasks.show', params: { id: task.id } }" />

            <div class="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                    <h2 class="text-3xl font-bold tracking-tight text-gray-900">Edit Task</h2>
                    <p class="mt-1.5 text-sm text-gray-500">Update task details and assignments.</p>
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
                    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div class="p-6 space-y-6">
                            <div>
                                <label class="block text-sm font-semibold text-gray-900 mb-1.5">Task Title <span class="text-red-500">*</span></label>
                                <input v-model="form.title" type="text" class="input w-full text-lg font-medium py-2.5">
                                <p v-if="form.errors.title" class="mt-1.5 text-sm text-red-600 font-medium">{{ form.errors.title }}</p>
                            </div>

                            <div>
                                <label class="block text-sm font-semibold text-gray-900 mb-1.5">Description</label>
                                <textarea v-model="form.description" rows="6" class="input w-full resize-y placeholder-gray-400" placeholder="Provide details, acceptance criteria, or context..." />
                            </div>
                        </div>
                    </div>

                    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div class="p-6">
                            <h3 class="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Dependencies</h3>
                            
                            <div class="space-y-2 mb-4">
                                <div v-if="_dependencyIds.length === 0" class="text-sm text-gray-500 italic">No dependencies assigned.</div>
                                <div v-for="dep in _dependencyIds" :key="dep.id" class="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2">
                                    <span class="text-sm font-medium text-gray-700">{{ dep.title }}</span>
                                    <button type="button" class="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1" @click="removeDependency(dep.id)">Remove</button>
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

                    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div class="p-6">
                            <h3 class="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Tags & Categorization</h3>
                            
                            <div class="flex flex-wrap gap-2 mb-3">
                                <span v-for="(tag, i) in form.tags" :key="i" class="inline-flex items-center gap-1.5 rounded-md bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 ring-1 ring-inset ring-primary-600/20">
                                    {{ tag }}
                                    <button type="button" class="text-primary-600 hover:text-primary-800 focus:outline-none" @click="form.tags.splice(i, 1)">&times;</button>
                                </span>
                            </div>
                            <div class="flex gap-2 relative">
                                <span class="absolute inset-y-0 left-0 flex items-center pl-3">
                                    <svg class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                                </span>
                                <input v-model="newTag" type="text" class="input flex-1 pl-9 text-sm" placeholder="Add a tag..." @keydown.enter.prevent="addTag">
                                <button type="button" class="btn-secondary btn-sm" :disabled="!newTag" @click="addTag">Add</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Sidebar Column -->
                <div class="space-y-6">
                    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div class="p-5 space-y-5">
                            <div>
                                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Status</label>
                                <select v-model="form.status" class="input w-full text-sm font-medium">
                                    <option v-for="s in statuses" :key="s.value" :value="s.value">{{ s.label }}</option>
                                </select>
                            </div>

                            <div>
                                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Assignee</label>
                                <select v-model="form.assignee_id" class="input w-full text-sm">
                                    <option :value="null">Unassigned</option>
                                    <option v-for="m in projectMembers" :key="m.id" :value="m.id">{{ m.name }}</option>
                                </select>
                            </div>

                            <hr class="border-gray-100" />

                            <div>
                                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Priority</label>
                                <select v-model="form.priority" class="input w-full text-sm">
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>

                            <div>
                                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Due Date</label>
                                <input 
                                    v-model="form.due_date" 
                                    type="date" 
                                    class="input w-full text-sm"
                                    :disabled="$page.props.auth.user.role === 'employee'"
                                    :class="{ 'bg-gray-50 cursor-not-allowed text-gray-500': $page.props.auth.user.role === 'employee' }"
                                >
                                <p v-if="$page.props.auth.user.role === 'employee'" class="text-[10px] text-red-500 mt-1 font-medium">Project deadlines can only be updated by managers or team leads.</p>
                            </div>

                            <div>
                                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Employee ETA</label>
                                <input 
                                    v-model="form.employee_eta" 
                                    type="date" 
                                    class="input w-full text-sm text-primary-700"
                                >
                                <p class="text-[11px] text-gray-400 mt-1">Estimated completion date for the assignee.</p>
                            </div>

                            <div>
                                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Est. Hours</label>
                                <input v-model="form.estimated_hours" type="number" step="0.5" min="0" class="input w-full text-sm" placeholder="e.g. 4.5">
                            </div>
                        </div>
                    </div>

                    <div class="bg-gray-50 rounded-xl shadow-inner border border-gray-200 overflow-hidden">
                        <div class="p-5 space-y-4">
                            <label class="flex items-start gap-3 cursor-pointer">
                                <div class="flex items-center h-5">
                                    <input v-model="form.requires_approval" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600">
                                </div>
                                <div class="text-sm">
                                    <span class="font-medium text-gray-900 block">Requires Approval</span>
                                    <span class="text-gray-500 text-xs">Task must be approved by an assigned reviewer before completion.</span>
                                </div>
                            </label>

                            <div v-if="form.requires_approval" class="pt-2">
                                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Approver</label>
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
import { ref, reactive } from 'vue'
import { useForm, Link } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import AppLayout from '@/Layouts/AppLayout.vue'
import Breadcrumbs from '@/Components/Breadcrumbs.vue'

const props = defineProps<{ task: any; projects: any; project_members: any; available_dependencies: any }>()

const projectMembers = props.project_members
const availableDeps = props.available_dependencies.filter((t: any) => !props.task.dependencies?.some((d: any) => d.id === t.id))

const newTag = ref('')
const addDepId = ref<number | null>(null)

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

const form = useForm({
    title: props.task.title,
    description: props.task.description ?? '',
    status: props.task.status,
    priority: props.task.priority,
    assignee_id: props.task.assignee_id ?? null,
    due_date: props.task.due_date ? props.task.due_date.substring(0, 10) : '',
    employee_eta: props.task.employee_eta ? props.task.employee_eta.substring(0, 10) : '',
    estimated_hours: props.task.estimated_hours ?? '',
    tags: [...(props.task.tags ?? [])],
    dependency_ids: [...(props.task.dependencies?.map((d: any) => d.id) ?? [])],
    requires_approval: props.task.requires_approval ?? false,
    approver_id: props.task.approver_id ?? null,
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

function submit() {
    form.put(route('tasks.update', props.task.id))
}
</script>
