<template>
    <AppLayout>
        <div class="mx-auto max-w-3xl space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-text-primary">Notifications</h2>
                    <p v-if="unreadCount > 0" class="mt-1 text-sm text-text-secondary">{{ unreadCount }} unread</p>
                    <p v-else class="mt-1 text-sm text-text-secondary">Stay updated with the latest activity</p>
                </div>
                <button v-if="notifications.data.length > 0 && unreadCount > 0" class="btn-secondary btn-sm" @click="markAllRead">Mark all as read</button>
            </div>

            <div class="card">
                <div v-if="notifications.data.length === 0" class="p-6">
                    <EmptyState title="No notifications yet" message="You'll see activity about your tasks and mentions here." />
                </div>
                <ul v-else class="divide-y divide-border">
                    <li v-for="notification in notifications.data" :key="notification.id"
                        class="flex items-start gap-4 px-6 py-4 hover:bg-page cursor-pointer transition-colors"
                        :class="!notification.read_at ? 'bg-brand-primary-50 border-l-2 border-brand-primary-500' : ''"
                        @click="markRead(notification)">
                        <div class="shrink-0 mt-0.5">
                            <component :is="iconFor(notification)" class="h-5 w-5" :class="iconColor(notification)" />
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm" :class="notification.read_at ? 'text-text-secondary' : 'font-medium text-text-primary'">
                                <template v-if="notification.data.type === 'task_assigned'">
                                    You have been assigned "{{ notification.data.task_title }}"
                                </template>
                                <template v-else-if="notification.data.type === 'task_status_changed'">
                                    "{{ notification.data.task_title }}" is now {{ notification.data.new_status_label }}
                                </template>
                                <template v-else-if="notification.data.type === 'mention'">
                                    {{ notification.data.mentioned_by }} mentioned you in a comment
                                </template>
                                <template v-else-if="notification.data.type === 'task_pending_review'">
                                    {{ notification.data.submitted_by }} submitted "{{ notification.data.task_title }}" for review
                                </template>
                                <template v-else-if="notification.data.type === 'task_approved'">
                                    "{{ notification.data.task_title }}" was approved by {{ notification.data.approved_by }}
                                </template>
                                <template v-else-if="notification.data.type === 'task_rejected'">
                                    "{{ notification.data.task_title }}" was rejected by {{ notification.data.rejected_by }}
                                </template>
                                <template v-else-if="notification.data.type === 'project_assigned'">
                                    {{ notification.data.assigned_by }} assigned you as {{ notification.data.role }} of "{{ notification.data.project_name }}"
                                </template>
                                <template v-else-if="notification.data.type === 'comment_reply'">
                                    {{ notification.data.replied_by }} replied to your comment on "{{ notification.data.task_title }}"
                                </template>
                                <template v-else-if="notification.data.type === 'due_reminder'">
                                    {{ notification.data.message }}
                                </template>
                                <template v-else>
                                    {{ notification.data.message ?? 'New notification' }}
                                </template>
                            </p>
                            <p class="mt-1 text-xs text-text-secondary">{{ dayjs(notification.created_at).fromNow() }}</p>
                        </div>
                        <div v-if="!notification.read_at" class="h-2 w-2 rounded-full bg-brand-primary-500 mt-2 shrink-0" />
                    </li>
                </ul>
                <Pagination :pagination="notifications" />
            </div>
        </div>
    </AppLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { router } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import {
    BellIcon,
    UserPlusIcon,
    ArrowPathIcon,
    AtSymbolIcon,
    DocumentMagnifyingGlassIcon,
    CheckBadgeIcon,
    XCircleIcon,
    UserGroupIcon,
    ChatBubbleLeftRightIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/Layouts/AppLayout.vue'
import Pagination from '@/Components/Pagination.vue'
import EmptyState from '@/Components/EmptyState.vue'

dayjs.extend(relativeTime)

const props = defineProps<{ notifications: any }>()

const iconMap: Record<string, any> = {
    task_assigned: UserPlusIcon,
    task_status_changed: ArrowPathIcon,
    mention: AtSymbolIcon,
    task_pending_review: DocumentMagnifyingGlassIcon,
    task_approved: CheckBadgeIcon,
    task_rejected: XCircleIcon,
    project_assigned: UserGroupIcon,
    comment_reply: ChatBubbleLeftRightIcon,
    due_reminder: BellIcon,
}

const colorMap: Record<string, string> = {
    task_assigned: 'text-brand-primary-500',
    task_status_changed: 'text-warning',
    mention: 'text-brand-primary-500',
    task_pending_review: 'text-warning',
    task_approved: 'text-success',
    task_rejected: 'text-danger',
    project_assigned: 'text-brand-primary-600',
    comment_reply: 'text-brand-primary-500',
    due_reminder: 'text-warning',
}

function iconFor(notification: any) {
    return iconMap[notification.data?.type] ?? BellIcon
}

function iconColor(notification: any) {
    return colorMap[notification.data?.type] ?? 'text-text-secondary'
}

const unreadCount = computed(() =>
    props.notifications.data?.filter((n: any) => !n.read_at).length ?? 0
)

function markRead(notification: any) {
    if (!notification.read_at) {
        router.post(route('notifications.read', notification.id))
    }
}

function markAllRead() {
    router.post(route('notifications.read-all'))
}
</script>