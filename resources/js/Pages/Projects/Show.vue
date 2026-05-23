<template>
    <AppLayout>
        <div class="space-y-6">
            <Breadcrumbs
                :items="[{ label: 'Projects', route: 'projects.index' }, { label: project.name }]"
                :back="{ route: 'projects.index' }"
            />
            <div class="flex items-center justify-between">
                <div>
                    <div class="flex items-center gap-3">
                        <h2 class="text-2xl font-bold text-gray-900">{{ project.name }}</h2>
                        <Badge :variant="statusBadge(project.status)">{{ project.status_label ?? project.status }}</Badge>
                        <Badge v-if="project.priority" :variant="priorityBadge(project.priority)">{{ project.priority }}</Badge>
                    </div>
                    <p v-if="project.description" class="mt-1 text-sm text-gray-600">{{ project.description }}</p>
                </div>
                <div class="flex gap-2">
                    <button v-if="can('projects.update') && project.status !== 'archived'" class="btn-secondary btn-sm" @click="confirmArchive">Archive</button>
                    <Link v-if="can('projects.update')" :href="route('projects.edit', project.id)" class="btn-secondary btn-sm">Edit</Link>
                    <button v-if="can('projects.delete')" class="btn-danger btn-sm" @click="confirmDelete = true">Delete</button>
                    <Link :href="route('tasks.create', { project_id: project.id })" class="btn-primary btn-sm">Add Task</Link>
                </div>
            </div>

            <div class="grid grid-cols-1 gap-6 lg:grid-cols-4">
                <div class="lg:col-span-1 space-y-6">
                    <div class="card p-6">
                        <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Project Info</h3>
                        <div class="space-y-3 text-sm">
                            <div>
                                <p class="text-gray-500">Status</p>
                                <Badge :variant="statusBadge(project.status)">{{ project.status_label ?? project.status }}</Badge>
                            </div>
                            <div>
                                <p class="text-gray-500">Priority</p>
                                <Badge v-if="project.priority" :variant="priorityBadge(project.priority)">{{ project.priority }}</Badge>
                                <span v-else class="text-gray-400">—</span>
                            </div>
                            <div>
                                <p class="text-gray-500">Timeline</p>
                                <p class="text-gray-900">{{ project.start_date ?? '—' }} → {{ project.end_date ?? '—' }}</p>
                            </div>
                            <div>
                                <p class="text-gray-500">Created by</p>
                                <p class="text-gray-900">{{ project.author?.name }}</p>
                            </div>
                            <div>
                                <p class="text-gray-500">Completion</p>
                                <p class="text-gray-900" :class="completionColor(project.completion_rate)">{{ project.completion_rate ?? 0 }}%</p>
                            </div>
                        </div>
                    </div>

                    <div class="card p-6">
                        <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Links</h3>
                        <div class="space-y-2">
                            <a v-if="project.figma_url" :href="project.figma_url" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-500">
                                <PaintBrushIcon class="h-4 w-4" />Figma
                            </a>
                            <a v-if="project.github_url" :href="project.github_url" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-500">
                                <CodeBracketIcon class="h-4 w-4" />GitHub
                            </a>
                            <a v-if="project.docs_url" :href="project.docs_url" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-500">
                                <DocumentTextIcon class="h-4 w-4" />Documentation
                            </a>
                            <a v-if="project.meeting_url" :href="project.meeting_url" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-500">
                                <VideoCameraIcon class="h-4 w-4" />Meeting
                            </a>
                            <p v-if="!project.figma_url && !project.github_url && !project.docs_url && !project.meeting_url" class="text-sm text-gray-400">No links added.</p>
                        </div>
                    </div>

                    <div class="card p-6">
                        <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Team</h3>
                        <div class="space-y-2 text-sm">
                            <div v-if="project.project_manager" class="flex items-center gap-2">
                                <img :src="project.project_manager.avatar" alt="" class="h-6 w-6 rounded-full">
                                <span class="text-gray-900">{{ project.project_manager.name }}</span>
                                <Badge variant="warning">PM</Badge>
                            </div>
                            <div v-if="project.team_lead" class="flex items-center gap-2">
                                <img :src="project.team_lead.avatar" alt="" class="h-6 w-6 rounded-full">
                                <span class="text-gray-900">{{ project.team_lead.name }}</span>
                                <Badge variant="info">Lead</Badge>
                            </div>
                            <hr class="border-gray-200">
                            <div v-for="member in project.members" :key="member.id" class="flex items-center gap-2">
                                <img :src="member.avatar" alt="" class="h-6 w-6 rounded-full">
                                <span class="text-gray-700">{{ member.name }}</span>
                                <span v-if="member.pivot?.role !== 'member'" class="text-xs text-gray-400">({{ member.pivot?.role }})</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="lg:col-span-3 space-y-6">
                    <div class="card">
                        <div class="card-header flex items-center justify-between">
                            <h3 class="text-base font-semibold text-gray-900">Board</h3>
                            <div class="flex gap-1 text-xs text-gray-500">
                                <span class="px-2 py-1 rounded bg-gray-100">{{ totalTasks }} tasks</span>
                            </div>
                        </div>
                        <div class="card-body">
                            <div v-if="!hasTasks" class="text-sm text-gray-500 text-center py-8">
                                No tasks yet. <Link :href="route('tasks.create', { project_id: project.id })" class="text-primary-600 hover:text-primary-500">Create the first task</Link>.
                            </div>
                            <div v-else class="grid grid-cols-1 sm:grid-cols-5 gap-3">
                                <div v-for="column in boardColumns" :key="column.status" class="space-y-2">
                                    <div class="flex items-center justify-between px-1">
                                        <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ column.label }}</span>
                                        <span class="text-xs text-gray-400">{{ board[column.status]?.length ?? 0 }}</span>
                                    </div>
                                    <div class="space-y-2 min-h-[120px]">
                                        <div v-for="task in board[column.status]" :key="task.id" class="card p-3 cursor-pointer hover:shadow-md transition-shadow" @click="goToTask(task.id)">
                                            <p class="text-sm font-medium text-gray-900">{{ task.title }}</p>
                                            <div class="mt-2 flex items-center justify-between">
                                                <img v-if="task.assignee" :src="task.assignee.avatar" :title="task.assignee.name" class="h-5 w-5 rounded-full">
                                                <Badge v-if="task.priority" :variant="taskPriorityBadge(task.priority)" class="text-[10px]">{{ task.priority }}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h3 class="text-base font-semibold">Attachments</h3>
                        </div>
                        <div class="card-body space-y-3">
                            <FileUpload :upload-route="route('projects.attachments.upload', project.id)" @success="reloadPage" />
                            <FileList
                                :files="project.attachments ?? []"
                                :can-delete="true"
                                :delete-route="(file: any) => route('projects.attachments.delete', { project: project.id, media: file.id })"
                                @deleted="reloadPage"
                            />
                        </div>
                    </div>

                    <IntegrationList
                        :project-id="project.id"
                        :integrations="integrations"
                        :can-add="can('projects.update')"
                        :available-types="availableIntegrationTypes"
                        @refresh="reloadPage"
                    />

                    <MeetingLogs
                        :project-id="project.id"
                        :meeting-logs="meeting_logs"
                        :can-add="can('projects.update')"
                        :can-edit="can('projects.update')"
                    />

                    <div class="card">
                        <div class="card-header">
                            <h3 class="text-base font-semibold text-gray-900">Timeline</h3>
                        </div>
                        <div class="card-body">
                            <div v-if="!hasTimelineItems" class="text-sm text-gray-500 text-center py-4">No timeline items.</div>
                            <div v-else class="space-y-4">
                                <div v-if="timeline.overdue?.length" class="space-y-2">
                                    <h4 class="text-xs font-semibold text-red-600 uppercase tracking-wider">Overdue ({{ timeline.overdue.length }})</h4>
                                    <div v-for="task in timeline.overdue" :key="task.id" class="flex items-center justify-between border-l-2 border-red-400 pl-3 py-1.5">
                                        <div>
                                            <Link :href="route('tasks.show', task.id)" class="text-sm font-medium text-gray-900 hover:text-primary-600">{{ task.title }}</Link>
                                            <p v-if="task.assignee" class="text-xs text-gray-500">{{ task.assignee.name }}</p>
                                        </div>
                                        <span class="text-xs text-red-600 font-medium">{{ task.due_date }}</span>
                                    </div>
                                </div>

                                <div v-if="timeline.upcoming?.length" class="space-y-2">
                                    <h4 class="text-xs font-semibold text-yellow-600 uppercase tracking-wider">Upcoming ({{ timeline.upcoming.length }})</h4>
                                    <div v-for="task in timeline.upcoming" :key="task.id" class="flex items-center justify-between border-l-2 border-yellow-400 pl-3 py-1.5">
                                        <div>
                                            <Link :href="route('tasks.show', task.id)" class="text-sm font-medium text-gray-900 hover:text-primary-600">{{ task.title }}</Link>
                                            <p v-if="task.assignee" class="text-xs text-gray-500">{{ task.assignee.name }}</p>
                                        </div>
                                        <span class="text-xs text-gray-500">{{ task.due_date }}</span>
                                    </div>
                                </div>

                                <div v-if="timeline.completed?.length" class="space-y-2">
                                    <h4 class="text-xs font-semibold text-green-600 uppercase tracking-wider">Completed ({{ timeline.completed.length }})</h4>
                                    <div v-for="task in timeline.completed" :key="task.id" class="flex items-center justify-between border-l-2 border-green-400 pl-3 py-1.5">
                                        <div>
                                            <Link :href="route('tasks.show', task.id)" class="text-sm font-medium text-gray-900 hover:text-primary-600">{{ task.title }}</Link>
                                            <p v-if="task.assignee" class="text-xs text-gray-500">{{ task.assignee.name }}</p>
                                        </div>
                                        <span class="text-xs text-green-600">{{ task.due_date ?? '—' }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <Modal :open="archiveModal.open" @close="archiveModal.open = false">
            <template #title>Archive Project</template>
            <p class="text-sm text-gray-600">Are you sure you want to archive <strong>{{ project.name }}</strong>?</p>
            <div class="mt-6 flex justify-end gap-3">
                <button class="btn-secondary" @click="archiveModal.open = false">Cancel</button>
                <button class="btn-danger" :disabled="archiveModal.processing" @click="doArchive">Archive</button>
            </div>
        </Modal>

        <ConfirmDialog
            :open="confirmDelete"
            :processing="confirmDeleteProcessing"
            title="Delete Project"
            message="Are you sure you want to delete this project? This action cannot be undone."
            variant="danger"
            confirm-text="Delete"
            @confirm="doDelete"
            @close="confirmDelete = false"
        />
    </AppLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Link, router } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import { usePermissions } from '@/Composables/usePermissions'
import AppLayout from '@/Layouts/AppLayout.vue'
import Badge from '@/Components/Badge.vue'
import Breadcrumbs from '@/Components/Breadcrumbs.vue'
import ConfirmDialog from '@/Components/ConfirmDialog.vue'
import FileList from '@/Components/FileList.vue'
import FileUpload from '@/Components/FileUpload.vue'
import IntegrationList from '@/Components/Integrations/IntegrationList.vue'
import MeetingLogs from '@/Components/Projects/MeetingLogs.vue'
import Modal from '@/Components/Modal.vue'
import { CodeBracketIcon, DocumentTextIcon, VideoCameraIcon, PaintBrushIcon } from '@heroicons/vue/24/outline'

const { can } = usePermissions()

const props = defineProps<{ project: any; board: any; timeline: any; integrations: any[]; availableIntegrationTypes: any; meeting_logs: any[] }>()

const archiveModal = ref({ open: false, processing: false })
const confirmDelete = ref(false)
const confirmDeleteProcessing = ref(false)

const boardColumns = [
    { status: 'backlog', label: 'Backlog' },
    { status: 'todo', label: 'To Do' },
    { status: 'in_progress', label: 'In Progress' },
    { status: 'in_review', label: 'In Review' },
    { status: 'done', label: 'Done' },
]

const totalTasks = computed(() => boardColumns.reduce((sum, col) => sum + (props.board[col.status]?.length ?? 0), 0))
const hasTasks = computed(() => totalTasks.value > 0)
const hasTimelineItems = computed(() => (props.timeline.overdue?.length ?? 0) + (props.timeline.upcoming?.length ?? 0) + (props.timeline.completed?.length ?? 0) > 0)

function statusBadge(status: string): string {
    const map: Record<string, string> = { active: 'info', on_hold: 'warning', completed: 'success', archived: 'neutral' }
    return map[status] ?? 'neutral'
}

function priorityBadge(priority: string): string {
    const map: Record<string, string> = { urgent: 'danger', high: 'warning', medium: 'info', low: 'neutral' }
    return map[priority] ?? 'neutral'
}

function taskPriorityBadge(priority: string): string {
    const map: Record<string, string> = { urgent: 'danger', high: 'warning', medium: 'info', low: 'neutral' }
    return map[priority] ?? 'neutral'
}

function completionColor(rate: number): string {
    if (rate >= 80) return 'text-green-600'
    if (rate >= 50) return 'text-yellow-600'
    return 'text-gray-600'
}

function goToTask(id: number) {
    router.visit(route('tasks.show', id))
}

function reloadPage() {
    router.reload({ preserveScroll: true })
}

function confirmArchive() {
    archiveModal.value.open = true
}

function doArchive() {
    archiveModal.value.processing = true
    router.patch(route('projects.archive', props.project.id), {}, {
        onSuccess: () => { archiveModal.value.open = false },
        onFinish: () => { archiveModal.value.processing = false },
    })
}

function doDelete() {
    confirmDeleteProcessing.value = true
    router.delete(route('projects.destroy', props.project.id), {
        onSuccess: () => { confirmDelete.value = false },
        onFinish: () => { confirmDeleteProcessing.value = false },
    })
}
</script>
