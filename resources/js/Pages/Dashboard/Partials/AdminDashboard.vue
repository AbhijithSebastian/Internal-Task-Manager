<template>
    <div class="space-y-6">
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div class="card">
                <div class="card-header">
                    <h3 class="text-base font-semibold text-gray-900">Project Progress</h3>
                    <Link :href="route('reports.index')" class="text-sm text-primary-600 hover:text-primary-500">Full report</Link>
                </div>
                <div class="card-body space-y-4">
                    <div v-if="projectProgress.length === 0" class="text-sm text-gray-500">No projects.</div>
                    <div v-for="project in projectProgress" :key="project.id">
                        <div class="flex items-center justify-between mb-1">
                            <Link :href="route('projects.show', project.id)" class="text-sm font-medium text-gray-900 hover:text-primary-600">{{ project.name }}</Link>
                            <span class="text-xs text-gray-500">{{ project.completed_tasks }}/{{ project.total_tasks }} ({{ project.completion_rate }}%)</span>
                        </div>
                        <div class="h-2 rounded-full bg-gray-200">
                            <div class="h-2 rounded-full bg-primary-500 transition-all" :style="{ width: project.completion_rate + '%' }" />
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="text-base font-semibold text-gray-900">Status Distribution</h3>
                </div>
                <div class="card-body space-y-3">
                    <div v-for="item in statusDistribution" :key="item.status" class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <Badge :variant="statusBadge(item.status)">{{ item.label }}</Badge>
                        </div>
                        <span class="text-sm font-medium text-gray-900">{{ item.count }}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div class="card">
                <div class="card-header">
                    <h3 class="text-base font-semibold text-gray-900">Tasks Created (Last Month)</h3>
                </div>
                <div class="card-body">
                    <div v-if="tasksOverTime.length === 0" class="text-sm text-gray-500">No tasks created in this period.</div>
                    <div v-else class="space-y-2">
                        <div v-for="item in tasksOverTime" :key="item.date" class="flex items-center justify-between">
                            <span class="text-sm text-gray-600">{{ dayjs(item.date).format('MMM D, YYYY') }}</span>
                            <span class="text-sm font-medium text-gray-900">{{ item.count }} tasks</span>
                        </div>
                    </div>
                </div>
            </div>

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
    projectProgress: any[]
    statusDistribution: any[]
    tasksOverTime: any[]
    teamWorkload: any[]
}>()

function statusBadge(status: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
    const map: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
        done: 'success',
        approved: 'success',
        in_review: 'warning',
        in_progress: 'info',
        todo: 'neutral',
        backlog: 'neutral',
        cancelled: 'danger',
        blocked: 'danger',
    }
    return map[status] ?? 'neutral'
}
</script>
