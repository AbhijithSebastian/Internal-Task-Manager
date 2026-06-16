<template>
    <Modal :open="open" @close="emit('close')">
        <template #title>Quick Create Task</template>
        <form @submit.prevent="submit" class="space-y-4">
            <div>
                <label class="label">Project <span class="text-danger">*</span></label>
                <select v-model="form.project_id" class="input" required>
                    <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
                </select>
                <p v-if="form.errors.project_id" class="mt-1 text-sm text-danger">{{ form.errors.project_id }}</p>
            </div>
            <div>
                <label class="label">Title <span class="text-danger">*</span></label>
                <input ref="titleInput" v-model="form.title" type="text" class="input" placeholder="What needs to be done?" autofocus required>
                <p v-if="form.errors.title" class="mt-1 text-sm text-danger">{{ form.errors.title }}</p>
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="label">Priority</label>
                    <select v-model="form.priority" class="input">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                    </select>
                </div>
                <div>
                    <label class="label">Due date</label>
                    <input v-model="form.due_date" type="date" class="input">
                </div>
            </div>
            <div>
                <label class="label">Assignee</label>
                <select v-model="form.assignee_id" class="input">
                    <option :value="null">Unassigned</option>
                    <option v-for="m in projectMembers" :key="m.id" :value="m.id">{{ m.name }}</option>
                </select>
            </div>
            <div class="flex items-center justify-end gap-3 pt-2">
                <button type="button" class="btn-secondary btn-sm" @click="emit('close')">Cancel</button>
                <button type="submit" :disabled="form.processing" class="btn-primary btn-sm">
                    <svg v-if="form.processing" class="animate-spin -ml-1 mr-1 h-3 w-3 text-white inline" viewBox="0 0 24 24" fill="none">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Create Task
                </button>
            </div>
        </form>
    </Modal>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useForm, router } from '@inertiajs/vue3'
import { route } from 'ziggy-js'

const props = defineProps<{
    open: boolean
    projects: any[]
}>()

const emit = defineEmits<{
    close: []
    created: []
}>()

const titleInput = ref<HTMLInputElement | null>(null)
const projectMembers = ref<{ id: number; name: string }[]>([])

const form = useForm({
    project_id: props.projects[0]?.id ?? '',
    title: '',
    priority: 'medium',
    due_date: '',
    assignee_id: null as number | null,
    description: '',
})

watch(() => props.open, async (isOpen) => {
    if (isOpen) {
        form.reset()
        form.project_id = props.projects[0]?.id ?? ''
        if (props.projects[0]?.id) {
            await fetchMembers(props.projects[0].id)
        }
        nextTick(() => titleInput.value?.focus())
    }
})

watch(() => form.project_id, async (id) => {
    if (id) await fetchMembers(id)
})

async function fetchMembers(projectId: string | number) {
    try {
        const res = await fetch(`/projects/${projectId}/members`)
        projectMembers.value = await res.json()
    } catch {
        projectMembers.value = []
    }
}

function submit() {
    form.post(route('tasks.store'), {
        onSuccess: () => {
            emit('created')
            emit('close')
        },
    })
}
</script>
