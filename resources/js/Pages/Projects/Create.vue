<template>
    <AppLayout>
        <div class="mx-auto max-w-2xl space-y-6">
            <Breadcrumbs :items="[{ label: 'Projects', route: 'projects.index' }, { label: 'New Project' }]" :back="{ route: 'projects.index' }" />

            <div>
                <h2 class="text-2xl font-bold text-text-primary">New Project</h2>
                <p class="mt-1 text-sm text-text-secondary">Create a new project workspace</p>
            </div>

            <form @submit.prevent="submit" class="card card-body space-y-6">
                <div>
                    <label class="label">Project Name <span class="text-danger">*</span></label>
                    <input v-model="form.name" type="text" class="input" placeholder="My Project">
                    <p v-if="form.errors.name" class="mt-1 text-sm text-danger">{{ form.errors.name }}</p>
                </div>

                <div>
                    <label class="label">Description</label>
                    <textarea v-model="form.description" rows="4" class="input" placeholder="Project description..." />
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
                    <label class="label">Team Members</label>
                    <div class="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-border rounded-card p-3">
                        <label v-for="u in users" :key="u.id" class="flex items-center gap-2 text-sm">
                            <input type="checkbox" :value="u.id" v-model="form.member_ids" class="rounded border-border text-brand-primary-500">
                            {{ u.name }}
                        </label>
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
                        Create Project
                    </button>
                </div>
            </form>
        </div>
    </AppLayout>
</template>

<script setup lang="ts">
import { useForm, Link } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import Breadcrumbs from '@/Components/Breadcrumbs.vue'

const props = defineProps<{ users: any }>()

const form = useForm({
    name: '',
    description: '',
    priority: 'medium',
    start_date: '',
    end_date: '',
    pm_id: null as number | null,
    lead_id: null as number | null,
    member_ids: [] as number[],
    figma_url: '',
    github_url: '',
    docs_url: '',
    meeting_url: '',
})

function submit() {
    form.post(route('projects.store'))
}
</script>