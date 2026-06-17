<template>
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div class="card">
            <div class="card-header">
                <h3 class="text-card-title">My Tasks</h3>
                <Link :href="route('tasks.index', { assignee_id: $page.props.auth.user.id })" class="text-sm font-medium text-brand-primary-500 hover:text-brand-primary-600 transition-colors">View all</Link>
            </div>
            <div class="card-body">
                <div v-if="myTasks.length === 0" class="text-sm text-text-secondary">No pending tasks.</div>
                <ul v-else class="divide-y divide-border">
                    <li v-for="task in myTasks" :key="task.id" class="flex items-center justify-between py-3">
                        <div class="min-w-0 flex-1">
                            <Link :href="route('tasks.show', task.id)" class="text-sm font-medium text-text-primary hover:text-brand-primary-500 truncate block">{{ task.title }}</Link>
                            <p class="text-xs text-text-secondary">{{ task.project?.name }}</p>
                        </div>
                        <div class="flex items-center gap-2 shrink-0 ml-4">
                            <Badge :variant="priorityVariant(task.priority)">{{ task.priority_label }}</Badge>
                            <Badge v-if="task.due_date" :variant="dayjs(task.due_date).diff(dayjs(), 'day') <= 1 ? 'danger' : 'warning'">{{ dayjs(task.due_date).format('MMM D') }}</Badge>
                        </div>
                    </li>
                </ul>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h3 class="text-card-title">Recent Mentions</h3>
            </div>
            <div class="card-body">
                <div v-if="mentions.length === 0" class="text-sm text-text-secondary">No mentions yet.</div>
                <ul v-else class="divide-y divide-border">
                    <li v-for="mention in mentions" :key="mention.id" class="py-3">
                        <p class="text-sm text-text-primary">You were mentioned in a comment</p>
                        <p class="text-xs text-text-secondary">{{ dayjs(mention.created_at).fromNow() }}</p>
                    </li>
                </ul>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h3 class="text-card-title">Pending Approvals</h3>
            </div>
            <div class="card-body">
                <div v-if="pendingApprovals.length === 0" class="text-sm text-text-secondary">No pending approvals.</div>
                <ul v-else class="divide-y divide-border">
                    <li v-for="task in pendingApprovals" :key="task.id" class="flex items-center justify-between py-3">
                        <div class="min-w-0 flex-1">
                            <Link :href="route('tasks.show', task.id)" class="text-sm font-medium text-text-primary hover:text-brand-primary-500 truncate block">{{ task.title }}</Link>
                            <p class="text-xs text-text-secondary">Approver: {{ task.approver?.name }}</p>
                        </div>
                        <Badge variant="warning" class="shrink-0 ml-4">Pending</Badge>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Link } from '@inertiajs/vue3'
import dayjs from 'dayjs'
import Badge from '@/Components/Badge.vue'

defineProps<{
    myTasks: any[]
    mentions: any[]
    pendingApprovals: any[]
}>()

function priorityVariant(priority: string): 'danger' | 'warning' | 'info' | 'neutral' {
    const map: Record<string, 'danger' | 'warning' | 'info' | 'neutral'> = {
        urgent: 'danger',
        high: 'warning',
        medium: 'info',
        low: 'neutral',
    }
    return map[priority] ?? 'neutral'
}
</script>
