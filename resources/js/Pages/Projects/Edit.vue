<template>
    <AppLayout>
        <div class="mx-auto max-w-2xl space-y-6">
            <Breadcrumbs :items="[{ label: 'Projects', route: 'projects.index' }, { label: project.name, route: 'projects.show', params: { id: project.id } }, { label: 'Edit' }]" :back="{ route: 'projects.show', params: { id: project.id } }" />

            <div>
                <h2 class="text-2xl font-bold text-text-primary">Edit Project</h2>
                <p class="mt-1 text-sm text-text-secondary">{{ project.name }}</p>
            </div>

            <div class="card card-body">
                <h3 class="text-base font-semibold text-text-primary mb-4">Status</h3>
                <div class="flex items-center gap-3">
                    <Badge :variant="statusBadge(project.status)" class="text-sm">{{ project.status_label ?? project.status }}</Badge>
                    <select v-model="statusForm.status" class="input max-w-[180px]" @change="changeStatus">
                        <option value="active">Active</option>
                        <option value="on_hold">On Hold</option>
                        <option value="completed">Completed</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>
            </div>

            <form @submit.prevent="submit" class="card card-body space-y-6">
                <h3 class="text-base font-semibold text-text-primary">Project Information</h3>
                <div>
                    <label class="label">Project Name <span class="text-danger">*</span></label>
                    <input v-model="form.name" type="text" class="input">
                    <p v-if="form.errors.name" class="mt-1 text-sm text-danger">{{ form.errors.name }}</p>
                </div>
                <div>
                    <label class="label">Description</label>
                    <textarea v-model="form.description" rows="4" class="input" />
                    <p v-if="form.errors.description" class="mt-1 text-sm text-danger">{{ form.errors.description }}</p>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="label">Priority</label>
                        <select v-model="form.priority" class="input">
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </div>
                    <div></div>
                    <div>
                        <label class="label">Start Date</label>
                        <input v-model="form.start_date" type="date" class="input">
                    </div>
                    <div>
                        <label class="label">End Date</label>
                        <input v-model="form.end_date" type="date" class="input">
                        <p v-if="form.errors.end_date" class="mt-1 text-sm text-danger">{{ form.errors.end_date }}</p>
                    </div>
                </div>

                <hr class="border-border">

                <h3 class="text-base font-semibold text-text-primary">Team</h3>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="label">Project Manager</label>
                        <select v-model="form.pm_id" class="input">
                            <option :value="null">—</option>
                            <option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="label">Team Lead</label>
                        <select v-model="form.lead_id" class="input">
                            <option :value="null">—</option>
                            <option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }}</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label class="label">Members</label>
                    <div class="space-y-2">
                        <div v-for="member in project.members" :key="member.id" class="flex items-center justify-between rounded-card border border-border px-3 py-2">
                            <div class="flex items-center gap-2">
                                <img :src="member.avatar" alt="" class="h-7 w-7 rounded-full">
                                <span class="text-sm text-text-primary">{{ member.name }}</span>
                                <Badge variant="info" class="text-[10px]">{{ member.pivot?.role }}</Badge>
                            </div>
                            <div class="flex items-center gap-2">
                                <select class="input text-xs py-1 max-w-[120px]" @change="changeMemberRole(member, ($event.target as HTMLSelectElement).value)">
                                    <option value="member" :selected="member.pivot?.role === 'member'">Member</option>
                                    <option value="manager" :selected="member.pivot?.role === 'manager'">Manager</option>
                                </select>
                                <button class="text-xs text-danger hover:text-danger" @click="removeMember(member)">Remove</button>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <select v-model="addMemberId" class="input text-sm">
                                <option :value="null" disabled>Select user...</option>
                                <option v-for="u in availableUsers" :key="u.id" :value="u.id">{{ u.name }}</option>
                            </select>
                            <button type="button" class="btn-secondary btn-sm" :disabled="!addMemberId" @click="addMember">Add</button>
                        </div>
                    </div>
                </div>

                <hr class="border-border">

                <h3 class="text-base font-semibold text-text-primary">Project Links</h3>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="label">Figma URL</label>
                        <input v-model="form.figma_url" type="url" class="input" placeholder="https://figma.com/file/...">
                        <p v-if="form.errors.figma_url" class="mt-1 text-sm text-danger">{{ form.errors.figma_url }}</p>
                    </div>
                    <div>
                        <label class="label">GitHub URL</label>
                        <input v-model="form.github_url" type="url" class="input" placeholder="https://github.com/...">
                        <p v-if="form.errors.github_url" class="mt-1 text-sm text-danger">{{ form.errors.github_url }}</p>
                    </div>
                    <div>
                        <label class="label">Docs URL</label>
                        <input v-model="form.docs_url" type="url" class="input" placeholder="https://docs.google.com/...">
                        <p v-if="form.errors.docs_url" class="mt-1 text-sm text-danger">{{ form.errors.docs_url }}</p>
                    </div>
                    <div>
                        <label class="label">Meeting URL</label>
                        <input v-model="form.meeting_url" type="url" class="input" placeholder="https://meet.google.com/...">
                        <p v-if="form.errors.meeting_url" class="mt-1 text-sm text-danger">{{ form.errors.meeting_url }}</p>
                    </div>
                </div>

                <div class="flex items-center justify-end gap-4">
                    <Link :href="route('projects.index')" class="btn-secondary">Cancel</Link>
                    <button type="submit" :disabled="form.processing" class="btn-primary">
                        <svg v-if="form.processing" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Update Project
                    </button>
                </div>
            </form>
        </div>

        <ConfirmDialog
            :open="confirmModal"
            title="Remove Member"
            :message="`Remove ${memberToRemove?.name} from this project?`"
            variant="danger"
            confirm-text="Remove"
            @close="confirmModal = false"
            @confirm="confirmRemoveMember"
        />
    </AppLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useForm, Link, router } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import { usePermissions } from '@/Composables/usePermissions'
import AppLayout from '@/Layouts/AppLayout.vue'
import Badge from '@/Components/Badge.vue'
import Breadcrumbs from '@/Components/Breadcrumbs.vue'
import ConfirmDialog from '@/Components/ConfirmDialog.vue'

const { can } = usePermissions()

const props = defineProps<{ project: any; users: any }>()

const form = useForm({
    name: props.project.name,
    description: props.project.description ?? '',
    priority: props.project.priority ?? 'medium',
    start_date: props.project.start_date ?? '',
    end_date: props.project.end_date ?? '',
    pm_id: props.project.pm_id ?? null,
    lead_id: props.project.lead_id ?? null,
    figma_url: props.project.figma_url ?? '',
    github_url: props.project.github_url ?? '',
    docs_url: props.project.docs_url ?? '',
    meeting_url: props.project.meeting_url ?? '',
})

const statusForm = useForm({ status: props.project.status })
const addMemberId = ref<number | null>(null)
const confirmModal = ref(false)
const memberToRemove = ref<any | null>(null)

const memberIds = computed(() => props.project.members.map((m: any) => m.id))

const availableUsers = computed(() =>
    props.users.filter((u: any) => !memberIds.value.includes(u.id))
)

function submit() {
    form.put(route('projects.update', props.project.id))
}

function changeStatus() {
    router.patch(route('projects.status', props.project.id), { status: statusForm.status })
}

function addMember() {
    if (!addMemberId.value) return
    router.post(route('projects.members.add', props.project.id), {
        user_id: addMemberId.value,
    }, {
        preserveScroll: true,
        onSuccess: () => { addMemberId.value = null },
    })
}

function changeMemberRole(member: any, role: string) {
    router.put(route('projects.members.role', { project: props.project.id, user: member.id }), { role }, { preserveScroll: true })
}

function removeMember(member: any) {
    memberToRemove.value = member
    confirmModal.value = true
}

function confirmRemoveMember() {
    if (!memberToRemove.value) return
    router.delete(route('projects.members.remove', { project: props.project.id, user: memberToRemove.value.id }), { preserveScroll: true })
    confirmModal.value = false
    memberToRemove.value = null
}

function statusBadge(status: string): string {
    const map: Record<string, string> = { active: 'info', on_hold: 'warning', completed: 'success', archived: 'neutral' }
    return map[status] ?? 'neutral'
}
</script>