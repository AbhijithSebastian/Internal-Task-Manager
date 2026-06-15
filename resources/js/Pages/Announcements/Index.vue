<template>
    <AppLayout>
        <div class="mx-auto max-w-4xl space-y-8">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-text-secondary">Workspace</p>
                    <h1 class="text-2xl font-bold text-text-primary mt-1">Announcements</h1>
                </div>
                <Link v-if="can('create')" :href="route('announcements.create')" class="btn-primary">
                    <PlusIcon class="h-4 w-4 mr-1.5" />
                    New Announcement
                </Link>
            </div>

            <div v-if="announcements.data.length === 0" class="empty-state">
                <div class="empty-state-icon">
                    <MegaphoneIcon class="h-6 w-6" />
                </div>
                <p class="empty-state-title">No announcements yet</p>
                <p class="empty-state-text">Create your first announcement to share with the team.</p>
            </div>

            <div v-else class="space-y-4">
                <div
                    v-for="announcement in announcements.data"
                    :key="announcement.id"
                    class="card hover:shadow-md transition-shadow"
                >
                    <div class="card-body">
                        <div class="flex items-start justify-between gap-4">
                            <div class="min-w-0 flex-1">
                                <div class="flex items-center gap-2 mb-2">
                                    <Badge :variant="priorityVariant(announcement.priority)">
                                        {{ announcement.priority_label }}
                                    </Badge>
                                    <Badge :variant="announcement.status === 'published' ? 'success' : 'neutral'">
                                        {{ announcement.status_label }}
                                    </Badge>
                                </div>
                                <h3 class="text-lg font-semibold text-text-primary">
                                    <Link :href="route('announcements.show', announcement.id)" class="hover:text-brand-primary-500 transition-colors">
                                        {{ announcement.title }}
                                    </Link>
                                </h3>
                                <p class="mt-2 text-sm text-text-secondary line-clamp-2">{{ announcement.content }}</p>
                                <div class="mt-3 flex items-center gap-3 text-xs text-text-secondary">
                                    <span class="flex items-center gap-1">
                                        <UserIcon class="h-3 w-3" />
                                        {{ announcement.author?.name }}
                                    </span>
                                    <span>{{ dayjs(announcement.published_at ?? announcement.created_at).format('MMM D, YYYY') }}</span>
                                </div>
                            </div>
                            <div v-if="can('update', announcement) || can('delete', announcement)" class="flex gap-1 shrink-0">
                                <Link v-if="can('update', announcement)" :href="route('announcements.edit', announcement.id)" class="btn-secondary btn-sm">
                                    Edit
                                </Link>
                                <button v-if="can('delete', announcement)" class="btn-danger btn-sm" @click="confirmDelete(announcement)">
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <Pagination :pagination="announcements" />
            </div>
        </div>

        <ConfirmDialog
            :open="deleteModal.open"
            :processing="deleteModal.processing"
            title="Delete Announcement"
            :message="`Delete &ldquo;${deleteModal.announcement?.title}&rdquo;? This cannot be undone.`"
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
import Pagination from '@/Components/Pagination.vue'
import ConfirmDialog from '@/Components/ConfirmDialog.vue'
import { PlusIcon, MegaphoneIcon, UserIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{ announcements: any }>()

const { can } = usePermissions()

const deleteModal = reactive({ open: false, processing: false, announcement: null as any })

function priorityVariant(priority: string): string {
    const map: Record<string, string> = { low: 'neutral', medium: 'info', high: 'warning', urgent: 'danger' }
    return map[priority] ?? 'neutral'
}

function confirmDelete(announcement: any) {
    deleteModal.announcement = announcement
    deleteModal.open = true
}

function doDelete() {
    if (!deleteModal.announcement) return
    deleteModal.processing = true
    router.delete(route('announcements.destroy', deleteModal.announcement.id), {
        onFinish: () => {
            deleteModal.open = false
            deleteModal.processing = false
            deleteModal.announcement = null
        },
    })
}
</script>
