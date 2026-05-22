<template>
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div class="card">
            <div class="card-header">
                <h3 class="text-base font-semibold text-gray-900">Team Workload</h3>
            </div>
            <div class="card-body p-0">
                <table v-if="teamWorkload.length > 0" class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Member</th>
                            <th class="px-4 py-2 text-center text-xs font-medium uppercase text-gray-500">Pending</th>
                            <th class="px-4 py-2 text-center text-xs font-medium uppercase text-gray-500">Overdue</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        <tr v-for="user in teamWorkload" :key="user.id" class="hover:bg-gray-50">
                            <td class="px-4 py-2 text-sm text-gray-900">{{ user.name }}</td>
                            <td class="px-4 py-2 text-center text-sm text-gray-600">{{ user.pending_tasks }}</td>
                            <td class="px-4 py-2 text-center text-sm" :class="user.overdue_tasks > 0 ? 'text-red-600 font-medium' : 'text-gray-600'">{{ user.overdue_tasks }}</td>
                        </tr>
                    </tbody>
                </table>
                <div v-else class="p-6 text-sm text-gray-500">No team workload data.</div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h3 class="text-base font-semibold text-gray-900">Review Tasks</h3>
                <Link :href="route('tasks.index', { status: 'in_review' })" class="text-sm text-primary-600 hover:text-primary-500">View all</Link>
            </div>
            <div class="card-body">
                <div v-if="reviewTasks.length === 0" class="text-sm text-gray-500">No tasks in review.</div>
                <ul v-else class="divide-y divide-gray-200">
                    <li v-for="task in reviewTasks" :key="task.id" class="flex items-center justify-between py-3">
                        <div class="min-w-0 flex-1">
                            <Link :href="route('tasks.show', task.id)" class="text-sm font-medium text-gray-900 hover:text-primary-600 truncate block">{{ task.title }}</Link>
                            <p class="text-xs text-gray-500">{{ task.project?.name }} &middot; {{ task.assignee?.name }}</p>
                        </div>
                        <Badge variant="warning" class="shrink-0 ml-4">In Review</Badge>
                    </li>
                </ul>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h3 class="text-base font-semibold text-red-900">Blocked Work</h3>
                <Link :href="route('tasks.index', { status: 'blocked' })" class="text-sm text-primary-600 hover:text-primary-500">View all</Link>
            </div>
            <div class="card-body">
                <div v-if="blockedTasks.length === 0" class="text-sm text-gray-500">No blocked tasks.</div>
                <ul v-else class="divide-y divide-gray-200">
                    <li v-for="task in blockedTasks" :key="task.id" class="flex items-center justify-between py-3">
                        <div class="min-w-0 flex-1">
                            <Link :href="route('tasks.show', task.id)" class="text-sm font-medium text-gray-900 hover:text-primary-600 truncate block">{{ task.title }}</Link>
                            <p class="text-xs text-gray-500">{{ task.project?.name }} &middot; {{ task.assignee?.name }}</p>
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
