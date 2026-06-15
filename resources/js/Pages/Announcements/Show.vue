<template>
    <AppLayout>
        <div class="mx-auto max-w-3xl space-y-8">
            <Breadcrumbs :items="[{ label: 'Announcements', route: 'announcements.index' }, { label: announcement.title }]" :back="{ route: 'announcements.index' }" />

            <div class="card">
                <div class="card-body">
                    <div class="flex items-center gap-2 mb-4">
                        <Badge :variant="priorityVariant(announcement.priority)">
                            {{ announcement.priority_label }}
                        </Badge>
                        <Badge :variant="announcement.status === 'published' ? 'success' : 'neutral'">
                            {{ announcement.status_label }}
                        </Badge>
                    </div>

                    <h1 class="text-2xl font-bold text-text-primary">{{ announcement.title }}</h1>

                    <div class="mt-3 flex items-center gap-3 text-sm text-text-secondary">
                        <span class="flex items-center gap-1">
                            <UserIcon class="h-4 w-4" />
                            {{ announcement.author?.name }}
                        </span>
                        <span>{{ dayjs(announcement.published_at ?? announcement.created_at).format('MMMM D, YYYY') }}</span>
                    </div>

                    <div class="mt-6 prose prose-sm max-w-none text-text-primary whitespace-pre-wrap">
                        {{ announcement.content }}
                    </div>
                </div>
            </div>

            <div v-if="can('update', announcement) || can('delete', announcement)" class="flex gap-2">
                <Link v-if="can('update', announcement)" :href="route('announcements.edit', announcement.id)" class="btn-secondary">
                    Edit
                </Link>
                <button v-if="can('delete', announcement)" class="btn-danger" @click="confirmDelete">
                    Delete
                </button>
            </div>
        </div>

        <ConfirmDialog
            :open="deleteModal.open"
            :processing="deleteModal.processing"
            title="Delete Announcement"
            :message="`Delete &ldquo;${announcement.title}&rdquo;? This cannot be undone.`"
            variant="danger"
            confirm-text="Delete"
            @confirm="doDelete"
            @close="deleteModal.open = false"
        />
    </AppLayout>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { Link, router } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import dayjs from 'dayjs'
import { usePermissions } from '@/Composables/usePermissions'
import AppLayout from '@/Layouts/AppLayout.vue'
import Badge from '@/Components/Badge.vue'
import Breadcrumbs from '@/Components/Breadcrumbs.vue'
import ConfirmDialog from '@/Components/ConfirmDialog.vue'
import { UserIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{ announcement: any }>()

const { can } = usePermissions()

const deleteModal = reactive({ open: false, processing: false })

function priorityVariant(priority: string): string {
    const map: Record<string, string> = { low: 'neutral', medium: 'info', high: 'warning', urgent: 'danger' }
    return map[priority] ?? 'neutral'
}

function confirmDelete() {
    deleteModal.open = true
}

function doDelete() {
    deleteModal.processing = true
    router.delete(route('announcements.destroy', props.announcement.id), {
        onFinish: () => {
            deleteModal.open = false
            deleteModal.processing = false
        },
    })
}
</script>
