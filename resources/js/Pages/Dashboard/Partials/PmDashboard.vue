<template>
    <div class="space-y-6">
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div class="card">
                <div class="card-header">
                    <h3 class="text-base font-semibold text-gray-900">Active Projects</h3>
                    <Link :href="route('projects.index')" class="text-sm text-primary-600 hover:text-primary-500">View all</Link>
                </div>
                <div class="card-body space-y-4">
                    <div v-if="activeProjects.length === 0" class="text-sm text-gray-500">No active projects.</div>
                    <div v-for="project in activeProjects" :key="project.id">
                        <div class="flex items-center justify-between mb-1">
                            <Link :href="route('projects.show', project.id)" class="text-sm font-medium text-gray-900 hover:text-primary-600">{{ project.name }}</Link>
                            <span class="text-xs text-gray-500">{{ project.completed_tasks ?? 0 }}/{{ project.total_tasks ?? 0 }}</span>
                        </div>
                        <div class="h-2 rounded-full bg-gray-200">
                            <div class="h-2 rounded-full bg-primary-500 transition-all" :style="{ width: Math.round(completionRate(project)) + '%' }" />
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="text-base font-semibold text-red-900">Delayed Tasks</h3>
                    <Link :href="route('tasks.index', { status: 'overdue' })" class="text-sm text-primary-600 hover:text-primary-500">View all</Link>
                </div>
                <div class="card-body">
                    <div v-if="delayedTasks.length === 0" class="text-sm text-gray-500">No delayed tasks.</div>
                    <ul v-else class="divide-y divide-gray-200">
                        <li v-for="task in delayedTasks" :key="task.id" class="flex items-center justify-between py-3">
                            <div class="min-w-0 flex-1">
                                <Link :href="route('tasks.show', task.id)" class="text-sm font-medium text-gray-900 hover:text-primary-600 truncate block">{{ task.title }}</Link>
                                <p class="text-xs text-gray-500">{{ task.project?.name }} &middot; {{ task.assignee?.name }}</p>
                            </div>
                            <Badge variant="danger" class="shrink-0 ml-4">{{ dayjs(task.due_date).format('MMM D, YYYY') }}</Badge>
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div class="card">
                <div class="card-header">
                    <h3 class="text-base font-semibold text-gray-900">Pending Approvals</h3>
                </div>
                <div class="card-body">
                    <div v-if="pendingApprovals.length === 0" class="text-sm text-gray-500">No pending approvals.</div>
                    <ul v-else class="divide-y divide-gray-200">
                        <li v-for="task in pendingApprovals" :key="task.id" class="flex items-center justify-between py-3">
                            <div class="min-w-0 flex-1">
                                <Link :href="route('tasks.show', task.id)" class="text-sm font-medium text-gray-900 hover:text-primary-600 truncate block">{{ task.title }}</Link>
                                <p class="text-xs text-gray-500">{{ task.project?.name }} &middot; {{ task.author?.name }}</p>
                            </div>
                            <Badge variant="warning" class="shrink-0 ml-4">Pending</Badge>
                        </li>
                    </ul>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="text-base font-semibold text-gray-900">Workload</h3>
                </div>
                <div class="card-body p-0">
                    <table v-if="workload.length > 0" class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Member</th>
                                <th class="px-4 py-2 text-center text-xs font-medium uppercase text-gray-500">Pending</th>
                                <th class="px-4 py-2 text-center text-xs font-medium uppercase text-gray-500">Overdue</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            <tr v-for="user in workload" :key="user.id" class="hover:bg-gray-50">
                                <td class="px-4 py-2 text-sm text-gray-900">{{ user.name }}</td>
                                <td class="px-4 py-2 text-center text-sm text-gray-600">{{ user.pending_tasks }}</td>
                                <td class="px-4 py-2 text-center text-sm" :class="user.overdue_tasks > 0 ? 'text-red-600 font-medium' : 'text-gray-600'">{{ user.overdue_tasks }}</td>
                            </tr>
                        </tbody>
                    </table>
                    <div v-else class="p-6 text-sm text-gray-500">No workload data.</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Link } from '@inertiajs/vue3'
import dayjs from 'dayjs'
import Badge from '@/Components/Badge.vue'

defineProps<{
    activeProjects: any[]
    delayedTasks: any[]
    pendingApprovals: any[]
    workload: any[]
}>()

function completionRate(project: any): number {
    if (!project.total_tasks || project.total_tasks === 0) return 0
    return Math.round((project.completed_tasks ?? 0) / project.total_tasks * 100)
}
</script>
