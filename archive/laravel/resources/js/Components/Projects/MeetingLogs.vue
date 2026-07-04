<template>
    <div class="card">
        <div class="card-header flex items-center justify-between">
            <h3 class="text-base font-semibold text-gray-900">Meeting Logs</h3>
            <button v-if="canAdd" @click="openCreateModal" class="btn-primary btn-sm">Add Log</button>
        </div>
        <div class="card-body">
            <div v-if="!meetingLogs || meetingLogs.length === 0" class="text-sm text-gray-500 text-center py-4">
                No meeting logs yet.
            </div>
            <div v-else class="space-y-4">
                <div v-for="log in meetingLogs" :key="log.id" class="border rounded p-4 space-y-3">
                    <div class="flex justify-between items-start">
                        <div>
                            <h4 class="font-medium text-gray-900">{{ log.title }}</h4>
                            <p class="text-xs text-gray-500">{{ log.meeting_date }} • by {{ log.author?.name }}</p>
                        </div>
                        <div class="flex gap-2">
                            <button v-if="canEdit" @click="openEditModal(log)" class="text-gray-400 hover:text-primary-600">
                                <PencilIcon class="h-4 w-4" />
                            </button>
                            <button v-if="canEdit" @click="confirmDelete(log)" class="text-gray-400 hover:text-red-600">
                                <TrashIcon class="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                    <div v-if="log.attendees" class="text-sm">
                        <span class="font-medium text-gray-700">Attendees:</span> {{ log.attendees }}
                    </div>
                    <div class="text-sm text-gray-800 whitespace-pre-wrap">{{ log.summary }}</div>
                    
                    <div v-if="log.decisions_taken || log.action_items || log.blockers" class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t text-sm">
                        <div v-if="log.decisions_taken">
                            <span class="font-medium text-green-700 block mb-1">Decisions</span>
                            <div class="text-gray-700 whitespace-pre-wrap">{{ log.decisions_taken }}</div>
                        </div>
                        <div v-if="log.action_items">
                            <span class="font-medium text-blue-700 block mb-1">Action Items</span>
                            <div class="text-gray-700 whitespace-pre-wrap">{{ log.action_items }}</div>
                        </div>
                        <div v-if="log.blockers">
                            <span class="font-medium text-red-700 block mb-1">Blockers</span>
                            <div class="text-gray-700 whitespace-pre-wrap">{{ log.blockers }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <Modal :open="isModalOpen" @close="closeModal">
            <template #title>{{ form.id ? 'Edit Meeting Log' : 'Add Meeting Log' }}</template>
            <form @submit.prevent="submitForm" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Title</label>
                    <input type="text" v-model="form.title" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" required />
                    <p v-if="form.errors.title" class="mt-1 text-sm text-red-600">{{ form.errors.title }}</p>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700">Meeting Date</label>
                    <input type="date" v-model="form.meeting_date" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" required />
                    <p v-if="form.errors.meeting_date" class="mt-1 text-sm text-red-600">{{ form.errors.meeting_date }}</p>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700">Attendees</label>
                    <input type="text" v-model="form.attendees" placeholder="Comma separated list" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700">Summary *</label>
                    <textarea v-model="form.summary" rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" required></textarea>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Decisions</label>
                        <textarea v-model="form.decisions_taken" rows="2" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"></textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Action Items</label>
                        <textarea v-model="form.action_items" rows="2" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"></textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Blockers</label>
                        <textarea v-model="form.blockers" rows="2" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"></textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Notes</label>
                        <textarea v-model="form.notes" rows="2" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"></textarea>
                    </div>
                </div>

                <div class="mt-5 flex justify-end gap-3">
                    <button type="button" class="btn-secondary" @click="closeModal">Cancel</button>
                    <button type="submit" class="btn-primary" :disabled="form.processing">Save</button>
                </div>
            </form>
        </Modal>

        <ConfirmDialog
            :open="isDeleteOpen"
            :processing="deleteProcessing"
            title="Delete Meeting Log"
            message="Are you sure you want to delete this meeting log? This action cannot be undone."
            variant="danger"
            confirm-text="Delete"
            @confirm="executeDelete"
            @close="isDeleteOpen = false"
        />
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useForm, router } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import Modal from '@/Components/Modal.vue'
import ConfirmDialog from '@/Components/ConfirmDialog.vue'
import { PencilIcon, TrashIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
    projectId: number
    meetingLogs: any[]
    canAdd: boolean
    canEdit: boolean
}>()

const isModalOpen = ref(false)
const isDeleteOpen = ref(false)
const deleteProcessing = ref(false)
const logToDelete = ref<number | null>(null)

const form = useForm({
    id: null as number | null,
    title: '',
    meeting_date: new Date().toISOString().split('T')[0],
    attendees: '',
    summary: '',
    decisions_taken: '',
    blockers: '',
    action_items: '',
    notes: '',
})

function openCreateModal() {
    form.reset()
    form.id = null
    form.clearErrors()
    isModalOpen.value = true
}

function openEditModal(log: any) {
    form.id = log.id
    form.title = log.title
    form.meeting_date = log.meeting_date
    form.attendees = log.attendees || ''
    form.summary = log.summary || ''
    form.decisions_taken = log.decisions_taken || ''
    form.blockers = log.blockers || ''
    form.action_items = log.action_items || ''
    form.notes = log.notes || ''
    form.clearErrors()
    isModalOpen.value = true
}

function closeModal() {
    isModalOpen.value = false
    form.reset()
}

function submitForm() {
    if (form.id) {
        form.put(route('meeting-logs.update', form.id), {
            onSuccess: () => closeModal(),
        })
    } else {
        form.post(route('projects.meeting-logs.store', props.projectId), {
            onSuccess: () => closeModal(),
        })
    }
}

function confirmDelete(log: any) {
    logToDelete.value = log.id
    isDeleteOpen.value = true
}

function executeDelete() {
    if (!logToDelete.value) return
    deleteProcessing.value = true
    router.delete(route('meeting-logs.destroy', logToDelete.value), {
        onSuccess: () => {
            isDeleteOpen.value = false
            logToDelete.value = null
        },
        onFinish: () => {
            deleteProcessing.value = false
        }
    })
}
</script>
