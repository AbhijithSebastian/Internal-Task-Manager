<template>
    <div class="space-y-6">
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div class="card">
                <div class="card-header">
                    <h3 class="text-card-title">Active Projects</h3>
                    <Link :href="route('projects.index')" class="text-sm font-medium text-brand-primary-500 hover:text-brand-primary-600 transition-colors">View all</Link>
                </div>
                <div class="card-body space-y-4">
                    <div v-if="activeProjects.length === 0" class="text-sm text-text-secondary">No active projects.</div>
                    <div v-for="project in activeProjects" :key="project.id">
                        <div class="flex items-center justify-between mb-1">
                            <Link :href="route('projects.show', project.id)" class="text-sm font-medium text-text-primary hover:text-brand-primary-500">{{ project.name }}</Link>
                            <span class="text-xs text-text-secondary">{{ project.completed_tasks ?? 0 }}/{{ project.total_tasks ?? 0 }}</span>
                        </div>
                        <div class="h-2 w-full overflow-hidden rounded-full bg-page">
                            <div class="h-2 rounded-full bg-brand-primary-500 transition-all" :style="{ width: Math.round(completionRate(project)) + '%' }" />
                        </div>
                    </div>
                </div>
            </div>

        </div>

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                                <p class="text-xs text-text-secondary">{{ task.project?.name }} &middot; {{ task.author?.name }}</p>
                            </div>
                            <Badge variant="warning" class="shrink-0 ml-4">Pending</Badge>
                        </li>
                    </ul>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="text-card-title">Workload</h3>
                </div>
                <div class="card-body p-0">
                    <table v-if="workload.length > 0" class="min-w-full divide-y divide-border">
                        <thead class="bg-page">
                            <tr>
                                <th class="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Member</th>
                                <th class="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">Pending</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-border">
                            <tr v-for="user in workload" :key="user.id" class="hover:bg-page/50">
                                <td class="px-4 py-2 text-sm text-text-primary">{{ user.name }}</td>
                                <td class="px-4 py-2 text-center text-sm text-text-secondary">{{ user.pending_tasks }}</td>
                            </tr>
                        </tbody>
                    </table>
                    <div v-else class="p-6 text-sm text-text-secondary">No workload data.</div>
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
    pendingApprovals: any[]
    workload: any[]
}>()

function completionRate(project: any): number {
    if (!project.total_tasks || project.total_tasks === 0) return 0
    return Math.round((project.completed_tasks ?? 0) / project.total_tasks * 100)
}
</script>
