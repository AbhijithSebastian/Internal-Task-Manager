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
                        <h2 class="text-2xl font-bold text-text-primary">{{ project.name }}</h2>
                        <Badge :variant="statusBadge(project.status)">{{ project.status_label ?? project.status }}</Badge>
                        <Badge v-if="project.priority" :variant="priorityBadge(project.priority)">{{ project.priority }}</Badge>
                        <Badge v-if="project.health" :variant="healthBadge(project.health.status)">{{ project.health.label }}</Badge>
                    </div>
                    <p v-if="project.description" class="mt-1 text-sm text-text-secondary">{{ project.description }}</p>
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
                    <div class="card card-body">
                        <h3 class="text-sm font-semibold text-text-primary uppercase tracking-wider mb-3">Project Info</h3>
                        <div class="space-y-3 text-sm">
                            <div>
                                <p class="text-text-secondary">Status</p>
                                <Badge :variant="statusBadge(project.status)">{{ project.status_label ?? project.status }}</Badge>
                            </div>
                            <div>
                                <p class="text-text-secondary">Priority</p>
                                <Badge v-if="project.priority" :variant="priorityBadge(project.priority)">{{ project.priority }}</Badge>
                                <span v-else class="text-text-secondary">—</span>
                            </div>
                            <div>
                                <p class="text-text-secondary">Timeline</p>
                                <p class="text-text-primary">{{ project.start_date ?? '—' }} → {{ project.end_date ?? '—' }}</p>
                            </div>
                            <div>
                                <p class="text-text-secondary">Created by</p>
                                <p class="text-text-primary">{{ project.author?.name }}</p>
                            </div>
                            <div>
                                <p class="text-text-secondary">Completion</p>
                                <p class="text-text-primary" :class="completionColor(project.completion_rate)">{{ project.completion_rate ?? 0 }}%</p>
                            </div>
                        </div>
                    </div>

                    <div class="card card-body">
                        <h3 class="text-sm font-semibold text-text-primary uppercase tracking-wider mb-3">Links</h3>
                        <div class="space-y-2">
                            <a v-if="project.figma_url" :href="project.figma_url" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 text-sm text-brand-primary-500 hover:text-brand-primary-600">
                                <PaintBrushIcon class="h-4 w-4" />Figma
                            </a>
                            <a v-if="project.github_url" :href="project.github_url" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 text-sm text-brand-primary-500 hover:text-brand-primary-600">
                                <CodeBracketIcon class="h-4 w-4" />GitHub
                            </a>
                            <a v-if="project.docs_url" :href="project.docs_url" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 text-sm text-brand-primary-500 hover:text-brand-primary-600">
                                <DocumentTextIcon class="h-4 w-4" />Documentation
                            </a>
                            <a v-if="project.meeting_url" :href="project.meeting_url" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 text-sm text-brand-primary-500 hover:text-brand-primary-600">
                                <VideoCameraIcon class="h-4 w-4" />Meeting
                            </a>
                            <p v-if="!project.figma_url && !project.github_url && !project.docs_url && !project.meeting_url" class="text-sm text-text-secondary">No links added.</p>
                        </div>
                    </div>

                    <div class="card card-body">
                        <h3 class="text-sm font-semibold text-text-primary uppercase tracking-wider mb-3">Team</h3>
                        <div class="space-y-2 text-sm">
                            <div v-if="project.project_manager" class="flex items-center gap-2">
                                <img :src="project.project_manager.avatar" alt="" class="h-6 w-6 rounded-full">
                                <span class="text-text-primary">{{ project.project_manager.name }}</span>
                                <Badge variant="warning">PM</Badge>
                            </div>
                            <div v-if="project.team_lead" class="flex items-center gap-2">
                                <img :src="project.team_lead.avatar" alt="" class="h-6 w-6 rounded-full">
                                <span class="text-text-primary">{{ project.team_lead.name }}</span>
                                <Badge variant="info">Lead</Badge>
                            </div>
                            <hr class="border-border">
                            <div v-for="member in project.members" :key="member.id" class="flex items-center gap-2">
                                <img :src="member.avatar" alt="" class="h-6 w-6 rounded-full">
                                <span class="text-text-primary">{{ member.name }}</span>
                                <span v-if="member.pivot?.role !== 'member'" class="text-xs text-text-secondary">({{ member.pivot?.role }})</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="lg:col-span-3 space-y-6">
                    <div class="card">
                        <div class="card-header flex items-center justify-between">
                            <h3 class="text-base font-semibold text-text-primary">Board</h3>
                            <div class="flex gap-1 text-xs text-text-secondary">
                                <span class="px-2 py-1 rounded bg-page">{{ totalTasks }} tasks</span>
                            </div>
                        </div>
                        <div class="card-body">
                            <div v-if="!hasTasks" class="text-sm text-text-secondary text-center py-8">
                                No tasks yet. <Link :href="route('tasks.create', { project_id: project.id })" class="text-brand-primary-500 hover:text-brand-primary-600">Create the first task</Link>.
                            </div>
                            <div v-else class="grid grid-cols-1 sm:grid-cols-5 gap-3">
                                <div v-for="column in boardColumns" :key="column.status" class="space-y-2">
                                    <div class="flex items-center justify-between px-1">
                                        <span class="text-xs font-semibold text-text-secondary uppercase tracking-wider">{{ column.label }}</span>
                                        <span class="text-xs text-text-secondary">{{ board[column.status]?.length ?? 0 }}</span>
                                    </div>
                                    <div class="space-y-2 min-h-[120px]">
                                        <div v-for="task in board[column.status]" :key="task.id" class="card p-3 cursor-pointer hover:shadow-card-hover transition-shadow" @click="goToTask(task.id)">
                                            <p class="text-sm font-medium text-text-primary">{{ task.title }}</p>
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
                        <div class="card-header flex items-center justify-between">
                            <h3 class="text-base font-semibold text-text-primary">Milestones</h3>
                            <button v-if="can('projects.update')" class="btn-primary btn-sm" @click="showAddMilestone = true">Add Milestone</button>
                        </div>
                        <div class="card-body space-y-4">
                            <div v-if="!milestones.length" class="text-sm text-text-secondary text-center py-4">No milestones yet.</div>
                            <div v-for="milestone in milestones" :key="milestone.id" class="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
                                <div class="min-w-0 flex-1 space-y-1">
                                    <div v-if="editingMilestone?.id === milestone.id" class="flex items-center gap-2">
                                        <input v-model="editForm.name" class="input text-sm font-medium" @keyup.enter="updateMilestone(milestone)" @keyup.escape="cancelEdit" />
                                        <button class="btn-primary btn-sm text-xs" @click="updateMilestone(milestone)">Save</button>
                                        <button class="btn-secondary btn-sm text-xs" @click="cancelEdit">Cancel</button>
                                    </div>
                                    <div v-else class="flex items-center gap-2">
                                        <span class="text-sm font-medium text-text-primary cursor-pointer hover:text-brand-primary-500" @click="startEdit(milestone)">{{ milestone.name }}</span>
                                        <select v-if="editingMilestone?.id === milestone.id" v-model="editForm.status" class="input text-xs py-0.5 max-w-[130px]">
                                            <option value="pending">Pending</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="at_risk">At Risk</option>
                                            <option value="completed">Completed</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                        <Badge v-else :variant="milestoneStatusBadge(milestone.status)" class="cursor-pointer" @click="startEdit(milestone)">{{ milestone.status_label }}</Badge>
                                    </div>
                                    <p v-if="milestone.description" class="text-xs text-text-secondary">{{ milestone.description }}</p>
                                    <p class="text-xs font-medium text-text-secondary">
                                        Due {{ milestone.due_date ?? '—' }}
                                    </p>
                                </div>
                                <button v-if="can('projects.update')" class="shrink-0 text-text-secondary hover:text-danger transition-colors" @click="confirmDeleteMilestone(milestone)">
                                    <TrashIcon class="h-4 w-4" />
                                </button>
                            </div>

                            <form v-if="showAddMilestone" class="mt-4 space-y-3 rounded-lg border border-border bg-page p-4" @submit.prevent="addMilestone">
                                <input v-model="addForm.name" type="text" placeholder="Milestone name" class="input w-full" required />
                                <div class="flex gap-3">
                                    <input v-model="addForm.due_date" type="date" class="input flex-1" />
                                    <select v-model="addForm.status" class="input flex-1">
                                        <option value="pending">Pending</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="at_risk">At Risk</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                                <div class="flex justify-end gap-2">
                                    <button type="button" class="btn-secondary btn-sm" @click="showAddMilestone = false">Cancel</button>
                                    <button type="submit" class="btn-primary btn-sm" :disabled="addForm.processing">Add</button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h3 class="text-base font-semibold text-text-primary">Timeline</h3>
                        </div>
                        <div class="card-body">
                            <div v-if="!hasTimelineItems" class="text-sm text-text-secondary text-center py-4">No timeline items.</div>
                            <div v-else class="space-y-4">
                                <div v-if="timeline.upcoming?.length" class="space-y-2">
                                    <h4 class="text-xs font-semibold text-warning uppercase tracking-wider">Upcoming ({{ timeline.upcoming.length }})</h4>
                                    <div v-for="task in timeline.upcoming" :key="task.id" class="flex items-center justify-between border-l-2 border-warning/40 pl-3 py-1.5">
                                        <div>
                                            <Link :href="route('tasks.show', task.id)" class="text-sm font-medium text-text-primary hover:text-brand-primary-600">{{ task.title }}</Link>
                                            <p v-if="task.assignee" class="text-xs text-text-secondary">{{ task.assignee.name }}</p>
                                        </div>
                                        <span class="text-xs text-text-secondary">{{ task.due_date }}</span>
                                    </div>
                                </div>

                                <div v-if="timeline.completed?.length" class="space-y-2">
                                    <h4 class="text-xs font-semibold text-success uppercase tracking-wider">Completed ({{ timeline.completed.length }})</h4>
                                    <div v-for="task in timeline.completed" :key="task.id" class="flex items-center justify-between border-l-2 border-success/40 pl-3 py-1.5">
                                        <div>
                                            <Link :href="route('tasks.show', task.id)" class="text-sm font-medium text-text-primary hover:text-brand-primary-600">{{ task.title }}</Link>
                                            <p v-if="task.assignee" class="text-xs text-text-secondary">{{ task.assignee.name }}</p>
                                        </div>
                                        <span class="text-xs text-success">{{ task.due_date ?? '—' }}</span>
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
            <p class="text-sm text-text-secondary">Are you sure you want to archive <strong>{{ project.name }}</strong>?</p>
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

        <ConfirmDialog
            :open="deleteConfirm.open"
            :processing="deleteConfirm.processing"
            title="Delete Milestone"
            message="Are you sure you want to delete this milestone?"
            variant="danger"
            confirm-text="Delete"
            @confirm="doDeleteMilestone"
            @close="deleteConfirm.open = false"
        />
    </AppLayout>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
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
import { CodeBracketIcon, DocumentTextIcon, VideoCameraIcon, PaintBrushIcon, TrashIcon } from '@heroicons/vue/24/outline'

const { can } = usePermissions()

const props = defineProps<{ project: any; board: any; timeline: any; integrations: any[]; availableIntegrationTypes: any; meeting_logs: any[]; milestones: any[] }>()

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
const hasTimelineItems = computed(() => (props.timeline.upcoming?.length ?? 0) + (props.timeline.completed?.length ?? 0) > 0)

const milestones = computed(() => props.milestones ?? props.project.milestones ?? [])

const showAddMilestone = ref(false)
const editingMilestone = ref<any>(null)
const addForm = reactive({ name: '', due_date: '', status: 'pending', processing: false })
const editForm = reactive({ name: '', status: 'pending' })
const deleteConfirm = reactive({ open: false, milestone: null as any, processing: false })

function healthBadge(status: string): string {
    const map: Record<string, string> = { healthy: 'success', at_risk: 'warning', delayed: 'danger', critical: 'danger' }
    return map[status] ?? 'neutral'
}

function milestoneStatusBadge(status: string): string {
    const map: Record<string, string> = { completed: 'success', in_progress: 'info', at_risk: 'warning', cancelled: 'neutral', pending: 'neutral' }
    return map[status] ?? 'neutral'
}

function startEdit(milestone: any) {
    editingMilestone.value = milestone
    editForm.name = milestone.name
    editForm.status = milestone.status
}

function cancelEdit() {
    editingMilestone.value = null
}

function addMilestone() {
    addForm.processing = true
    router.post(route('projects.milestones.store', props.project.id), {
        name: addForm.name,
        due_date: addForm.due_date || null,
        status: addForm.status,
    }, {
        preserveScroll: true,
        onSuccess: () => {
            showAddMilestone.value = false
            addForm.name = ''
            addForm.due_date = ''
            addForm.status = 'pending'
        },
        onFinish: () => { addForm.processing = false },
    })
}

function updateMilestone(milestone: any) {
    router.put(route('milestones.update', milestone.id), {
        name: editForm.name,
        status: editForm.status,
    }, {
        preserveScroll: true,
        onSuccess: () => { editingMilestone.value = null },
    })
}

function confirmDeleteMilestone(milestone: any) {
    deleteConfirm.milestone = milestone
    deleteConfirm.open = true
}

function doDeleteMilestone() {
    if (!deleteConfirm.milestone) return
    deleteConfirm.processing = true
    router.delete(route('milestones.destroy', deleteConfirm.milestone.id), {
        preserveScroll: true,
        onSuccess: () => {
            deleteConfirm.open = false
            deleteConfirm.milestone = null
        },
        onFinish: () => { deleteConfirm.processing = false },
    })
}

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
    if (rate >= 80) return 'text-success'
    if (rate >= 50) return 'text-warning'
    return 'text-text-secondary'
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