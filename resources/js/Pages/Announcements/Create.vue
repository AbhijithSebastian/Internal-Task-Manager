<template>
    <AppLayout>
        <div class="mx-auto max-w-3xl space-y-8 py-4">
            <Breadcrumbs :items="[{ label: 'Announcements', route: 'announcements.index' }, { label: 'Create' }]" :back="{ route: 'announcements.index' }" />

            <div class="flex items-center justify-between border-b border-border pb-4">
                <div>
                    <h2 class="text-3xl font-bold tracking-tight text-text-primary">New Announcement</h2>
                    <p class="mt-1.5 text-sm text-text-secondary">Share an update with your team.</p>
                </div>
                <div class="flex items-center gap-3">
                    <Link :href="route('announcements.index')" class="btn-secondary">Cancel</Link>
                    <button type="button" :disabled="form.processing" class="btn-primary" @click="submit">
                        <svg v-if="form.processing" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Publish
                    </button>
                </div>
            </div>

            <form @submit.prevent="submit" class="space-y-6">
                <div class="card">
                    <div class="card-body space-y-6">
                        <div>
                            <label class="block text-sm font-semibold text-text-primary mb-1.5">Title <span class="text-danger">*</span></label>
                            <input v-model="form.title" type="text" class="input w-full text-lg font-medium py-2.5" placeholder="What's new?">
                            <p v-if="form.errors.title" class="mt-1.5 text-sm text-danger font-medium">{{ form.errors.title }}</p>
                        </div>

                        <div>
                            <label class="block text-sm font-semibold text-text-primary mb-1.5">Content <span class="text-danger">*</span></label>
                            <textarea v-model="form.content" rows="8" class="input w-full resize-y" placeholder="Write your announcement here..." />
                            <p v-if="form.errors.content" class="mt-1.5 text-sm text-danger font-medium">{{ form.errors.content }}</p>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-text-primary mb-1.5">Priority</label>
                                <select v-model="form.priority" class="input w-full">
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>

                            <div>
                                <label class="block text-sm font-semibold text-text-primary mb-1.5">Status</label>
                                <select v-model="form.status" class="input w-full">
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                </select>
                            </div>

                            <div>
                                <label class="block text-sm font-semibold text-text-primary mb-1.5">Schedule (optional)</label>
                                <input v-model="form.published_at" type="datetime-local" class="input w-full">
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    </AppLayout>
</template>

<script setup lang="ts">
import { useForm, Link } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import AppLayout from '@/Layouts/AppLayout.vue'
import Breadcrumbs from '@/Components/Breadcrumbs.vue'

const form = useForm({
    title: '',
    content: '',
    priority: 'medium',
    status: 'published',
    published_at: '',
})

function submit() {
    form.post(route('announcements.store'))
}
</script>
