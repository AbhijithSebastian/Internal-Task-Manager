<template>
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div class="card">
            <div class="card-header">
                <h3 class="text-card-title">Team Workload</h3>
            </div>
            <div class="card-body p-0">
                    <table v-if="teamWorkload.length > 0" class="min-w-full divide-y divide-border">
                    <thead class="bg-page">
                        <tr>
                            <th class="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Member</th>
                            <th class="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">Pending</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-border">
                        <tr v-for="user in teamWorkload" :key="user.id" class="hover:bg-page/50">
                            <td class="px-4 py-2 text-sm text-text-primary">{{ user.name }}</td>
                            <td class="px-4 py-2 text-center text-sm text-text-secondary">{{ user.pending_tasks }}</td>
                        </tr>
                    </tbody>
                </table>
                <div v-else class="empty-state"><p class="empty-state-text">No team workload data.</p></div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h3 class="text-card-title">Review Tasks</h3>
                <Link :href="route('tasks.index', { status: 'in_review' })" class="text-sm font-medium text-brand-primary-500 hover:text-brand-primary-600 transition-colors">View all</Link>
            </div>
            <div class="card-body">
                <div v-if="reviewTasks.length === 0" class="text-sm text-text-secondary">No tasks in review.</div>
                <ul v-else class="divide-y divide-border">
                    <li v-for="task in reviewTasks" :key="task.id" class="flex items-center justify-between py-3">
                        <div class="min-w-0 flex-1">
                            <Link :href="route('tasks.show', task.id)" class="text-sm font-medium text-text-primary hover:text-brand-primary-500 truncate block">{{ task.title }}</Link>
                            <p class="text-xs text-text-secondary">{{ task.project?.name }} &middot; {{ task.assignees?.[0]?.name }}</p>
                        </div>
                        <Badge variant="warning" class="shrink-0 ml-4">In Review</Badge>
                    </li>
                </ul>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h3 class="text-card-title text-danger">Blocked Work</h3>
                <Link :href="route('tasks.index', { status: 'blocked' })" class="text-sm font-medium text-brand-primary-500 hover:text-brand-primary-600 transition-colors">View all</Link>
            </div>
            <div class="card-body">
                <div v-if="blockedTasks.length === 0" class="text-sm text-text-secondary">No blocked tasks.</div>
                <ul v-else class="divide-y divide-border">
                    <li v-for="task in blockedTasks" :key="task.id" class="flex items-center justify-between py-3">
                        <div class="min-w-0 flex-1">
                            <Link :href="route('tasks.show', task.id)" class="text-sm font-medium text-text-primary hover:text-brand-primary-500 truncate block">{{ task.title }}</Link>
                            <p class="text-xs text-text-secondary">{{ task.project?.name }} &middot; {{ task.assignees?.[0]?.name }}</p>
                        </div>
                        <Badge variant="danger" class="shrink-0 ml-4">Blocked</Badge>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Link } from '@inertiajs/vue3'
import Badge from '@/Components/Badge.vue'

defineProps<{
    teamWorkload: any[]
    reviewTasks: any[]
    blockedTasks: any[]
}>()
</script>
