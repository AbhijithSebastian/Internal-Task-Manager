<template>
    <AppLayout>
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900">Projects</h2>
                    <p class="mt-1 text-sm text-gray-600">Manage your team projects</p>
                </div>
                <Link v-if="can('projects.create')" :href="route('projects.create')" class="btn-primary">New Project</Link>
            </div>

            <div class="card">
                <div class="border-b border-gray-200 bg-gray-50 px-6 py-4">
                    <div class="flex flex-wrap gap-4">
                        <input v-model="filters.search" type="search" placeholder="Search projects..." class="input max-w-xs" @input="filter">
                        <select v-model="filters.status" class="input max-w-[150px]" @change="filter">
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="on_hold">On Hold</option>
                            <option value="completed">Completed</option>
                            <option value="archived">Archived</option>
                        </select>
                        <select v-model="filters.priority" class="input max-w-[150px]" @change="filter">
                            <option value="">All Priority</option>
                            <option value="urgent">Urgent</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </div>
                </div>

                <div v-if="projects.data.length > 0" class="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div v-for="project in projects.data" :key="project.id" class="card p-6 hover:shadow-md transition-shadow relative group">
                        <Link :href="route('projects.show', project.id)">
                            <div class="flex items-start justify-between">
                                <h3 class="text-base font-semibold text-gray-900">{{ project.name }}</h3>
                                <div class="flex gap-1.5">
                                    <Badge :variant="statusBadge(project.status)">{{ project.status_label ?? project.status }}</Badge>
                                    <Badge v-if="project.priority" :variant="priorityBadge(project.priority)">{{ project.priority }}</Badge>
                                </div>
                            </div>
                            <p v-if="project.description" class="mt-2 text-sm text-gray-600 line-clamp-2">{{ project.description }}</p>
                            <div class="mt-4 space-y-1.5 text-sm text-gray-500">
                                <div class="flex items-center gap-4">
                                    <span>{{ project.members_count }} members</span>
                                    <span>{{ project.tasks_count }} tasks</span>
                                    <span v-if="project.completion_rate !== null && project.completion_rate !== undefined" class="font-medium" :class="completionColor(project.completion_rate)">{{ project.completion_rate }}% done</span>
                                </div>
                                <div v-if="project.project_manager" class="flex items-center gap-1">
                                    <UserIcon class="h-3.5 w-3.5 text-gray-400" />
                                    <span>PM: {{ project.project_manager.name }}</span>
                                </div>
                                <div v-if="project.team_lead" class="flex items-center gap-1">
                                    <UserIcon class="h-3.5 w-3.5 text-gray-400" />
                                    <span>Lead: {{ project.team_lead.name }}</span>
                                </div>
                                <div v-if="project.end_date" class="flex items-center gap-1">
                                    <CalendarDaysIcon class="h-3.5 w-3.5 text-gray-400" />
                                    <span>Due {{ project.end_date }}</span>
                                </div>
                            </div>
                        </Link>
                        <div v-if="can('projects.update') && project.status !== 'archived'" class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button class="btn-secondary btn-sm text-xs" @click.stop="confirmArchive(project)">Archive</button>
                        </div>
                    </div>
                </div>
                <div v-else class="p-6">
                    <EmptyState title="No projects found" message="Get started by creating your first project." />
                </div>
                <Pagination v-if="projects.data.length > 0" :pagination="projects" />
            </div>
        </div>

        <Modal :open="archiveModal.open" @close="archiveModal.open = false">
            <template #title>Archive Project</template>
            <p class="text-sm text-gray-600">Are you sure you want to archive <strong>{{ archiveModal.projectName }}</strong>? Archived projects are hidden from the active list.</p>
            <div class="mt-6 flex justify-end gap-3">
                <button class="btn-secondary" @click="archiveModal.open = false">Cancel</button>
                <button class="btn-danger" :disabled="archiveModal.processing" @click="archiveModal.action">Archive</button>
            </div>
        </Modal>
    </AppLayout>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { Link, router } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import { usePermissions } from '@/Composables/usePermissions'
import AppLayout from '@/Layouts/AppLayout.vue'
import Badge from '@/Components/Badge.vue'
import Pagination from '@/Components/Pagination.vue'
import Modal from '@/Components/Modal.vue'
import { UserIcon, CalendarDaysIcon } from '@heroicons/vue/24/outline'
import EmptyState from '@/Components/EmptyState.vue'

const { can } = usePermissions()

const props = defineProps<{ projects: any; filters: any; users: any }>()

const filters = reactive({
    search: props.filters.search ?? '',
    status: props.filters.status ?? '',
    priority: props.filters.priority ?? '',
})

const archiveModal = ref({
    open: false,
    projectName: '',
    processing: false,
    action: () => {},
})

function filter() {
    router.get(route('projects.index'), filters, { preserveState: true, replace: true })
}

function confirmArchive(project: any) {
    archiveModal.value = {
        open: true,
        projectName: project.name,
        processing: false,
        action: async () => {
            archiveModal.value.processing = true
            router.patch(route('projects.archive', project.id), {}, {
                onSuccess: () => { archiveModal.value.open = false },
                onFinish: () => { archiveModal.value.processing = false },
            })
        },
    }
}

function statusBadge(status: string): string {
    const map: Record<string, string> = { active: 'success', on_hold: 'warning', completed: 'info', archived: 'neutral' }
    return map[status] ?? 'neutral'
}

function priorityBadge(priority: string): string {
    const map: Record<string, string> = { urgent: 'danger', high: 'warning', medium: 'info', low: 'neutral' }
    return map[priority] ?? 'neutral'
}

function completionColor(rate: number): string {
    if (rate >= 80) return 'text-green-600'
    if (rate >= 50) return 'text-yellow-600'
    return 'text-gray-500'
}
</script>
