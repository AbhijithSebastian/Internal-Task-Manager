<template>
    <AppLayout>
        <div class="mx-auto max-w-4xl space-y-8 py-4">
            <Breadcrumbs :items="[{ label: 'Tasks', route: 'tasks.index' }, { label: 'New Task' }]" :back="{ route: 'tasks.index' }" />

            <div class="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                    <h2 class="text-3xl font-bold tracking-tight text-gray-900">Create Task</h2>
                    <p class="mt-1.5 text-sm text-gray-500">Add a new task and specify its details, priority, and assignee.</p>
                </div>
                <div class="flex items-center gap-3">
                    <Link :href="route('tasks.index')" class="btn-secondary">Cancel</Link>
                    <button type="button" :disabled="form.processing" class="btn-primary" @click="submit">
                        <svg v-if="form.processing" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Create Task
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
                                <input v-model="form.title" type="text" class="input w-full text-lg font-medium placeholder-gray-400 py-2.5" placeholder="e.g. Design new landing page hero section" autofocus>
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
                            <h3 class="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Tags & Categorization</h3>
                            
                            <div class="flex flex-wrap gap-2 mb-3">
                                <span v-for="(tag, i) in form.tags" :key="i" class="inline-flex items-center gap-1.5 rounded-md bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 ring-1 ring-inset ring-primary-600/20">
                                    {{ tag }}
                                    <button type="button" class="text-primary-600 hover:text-primary-800 focus:outline-none" @click="removeTag(i)">&times;</button>
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
                                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Project <span class="text-red-500">*</span></label>
                                <select v-model="form.project_id" class="input w-full text-sm font-medium" @change="onProjectChange">
                                    <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
                                </select>
                                <p v-if="form.errors.project_id" class="mt-1 text-xs text-red-600">{{ form.errors.project_id }}</p>
                            </div>

                            <div>
                                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Assignee</label>
                                <div class="relative">
                                    <select v-model="form.assignee_id" class="input w-full text-sm">
                                        <option :value="null">Unassigned</option>
                                        <option v-for="m in projectMembers" :key="m.id" :value="m.id">{{ m.name }}</option>
                                    </select>
                                </div>
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
                                <input v-model="form.due_date" type="date" class="input w-full text-sm text-gray-700">
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
import { ref, watch } from 'vue'
import { useForm, Link, router } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import AppLayout from '@/Layouts/AppLayout.vue'
import Breadcrumbs from '@/Components/Breadcrumbs.vue'

const props = defineProps<{ projects: any }>()

const newTag = ref('')
const projectMembers = ref<{ id: number; name: string }[]>([])

const form = useForm({
    project_id: props.projects[0]?.id ?? '',
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    estimated_hours: '',
    assignee_id: null as number | null,
    tags: [] as string[],
    requires_approval: false,
    approver_id: null as number | null,
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

watch(() => form.project_id, (id) => {
    fetchProjectMembers(id)
}, { immediate: true })

function submit() {
    form.post(route('tasks.store'))
}
</script>
