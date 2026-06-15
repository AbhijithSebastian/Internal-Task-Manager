<template>
    <AppLayout>
        <div class="space-y-6">
            <Breadcrumbs :items="[{ label: 'Users', route: 'users.index' }, { label: user.name }]" :back="{ route: 'users.index' }" />

            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-text-primary">{{ user.name }}</h2>
                    <p class="text-sm text-text-secondary">{{ user.job_title ?? 'No title' }}</p>
                </div>
                <div class="flex items-center gap-2">
                    <Link v-if="can('users.update')" :href="route('users.edit', user.id)" class="btn-secondary btn-sm">Edit User</Link>
                    <button v-if="can('users.delete')" class="btn-danger btn-sm" @click="confirmDeleteUser = true">Delete</button>
                </div>
            </div>

            <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div class="lg:col-span-1 space-y-6">
                    <div class="card card-body text-center">
                        <img :src="user.avatar" alt="" class="mx-auto h-24 w-24 rounded-full object-cover">
                        <h3 class="mt-4 text-lg font-semibold text-text-primary">{{ user.name }}</h3>
                        <p class="text-sm text-text-secondary">{{ user.email }}</p>
                        <div class="mt-2">
                            <Badge :variant="roleBadge(user.roles[0]?.name)">{{ user.roles[0]?.name ?? 'N/A' }}</Badge>
                        </div>
                        <div class="mt-4 flex justify-center gap-2">
                            <Badge :variant="user.is_active ? 'success' : 'danger'">{{ user.is_active ? 'Active' : 'Inactive' }}</Badge>
                            <Badge v-if="user.deleted_at" variant="neutral">Deleted</Badge>
                        </div>
                    </div>

                    <div class="card card-body space-y-3">
                        <h4 class="text-sm font-semibold text-text-primary uppercase tracking-wider">Details</h4>
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <span class="text-text-secondary">Phone</span>
                                <span class="text-text-primary">{{ user.phone ?? '—' }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-text-secondary">Member since</span>
                                <span class="text-text-primary">{{ stats.member_since }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-text-secondary">Last active</span>
                                <span class="text-text-primary">{{ stats.last_active ?? 'Never' }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="lg:col-span-2 space-y-6">
                    <!-- Stats row -->
                    <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div class="card p-6 text-center">
                            <p class="text-2xl font-bold tabular-nums text-text-primary">{{ stats.total_projects }}</p>
                            <p class="mt-1 text-[11px] font-medium uppercase tracking-widest text-text-secondary">Projects</p>
                        </div>
                        <div class="card p-6 text-center">
                            <p class="text-2xl font-bold tabular-nums text-text-primary">{{ stats.total_tasks }}</p>
                            <p class="mt-1 text-[11px] font-medium uppercase tracking-widest text-text-secondary">Total Tasks</p>
                        </div>
                        <div class="card p-6 text-center">
                            <p class="text-2xl font-bold tabular-nums text-text-primary">{{ stats.completed_tasks }}</p>
                            <p class="mt-1 text-[11px] font-medium uppercase tracking-widest text-text-secondary">Completed</p>
                        </div>
                        <div class="card p-6 text-center">
                            <p class="text-2xl font-bold tabular-nums text-text-primary">{{ stats.in_progress_tasks }}</p>
                            <p class="mt-1 text-[11px] font-medium uppercase tracking-widest text-text-secondary">In Progress</p>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h3 class="text-base font-semibold text-text-primary">Recent Projects</h3>
                        </div>
                        <div class="card-body">
                            <div v-if="user.projects.length === 0" class="text-sm text-text-secondary">No projects yet.</div>
                            <ul v-else class="divide-y divide-border">
                                <li v-for="project in user.projects" :key="project.id" class="flex items-center justify-between py-3">
                                    <Link :href="route('projects.show', project.id)" class="text-sm font-medium text-text-primary hover:text-brand-primary-600">{{ project.name }}</Link>
                                    <Badge :variant="statusBadge(project.status)">{{ project.status }}</Badge>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h3 class="text-base font-semibold text-text-primary">Recent Tasks</h3>
                        </div>
                        <div class="card-body">
                            <div v-if="user.tasks.length === 0" class="text-sm text-text-secondary">No tasks assigned.</div>
                            <ul v-else class="divide-y divide-border">
                                <li v-for="task in user.tasks" :key="task.id" class="flex items-center justify-between py-3">
                                    <div>
                                        <Link :href="route('tasks.show', task.id)" class="text-sm font-medium text-text-primary hover:text-brand-primary-600">{{ task.title }}</Link>
                                        <p class="text-xs text-text-secondary">{{ task.project?.name }}</p>
                                    </div>
                                    <Badge :variant="statusBadge(task.status)">{{ task.status_label ?? task.status }}</Badge>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <ConfirmDialog
            :show="confirmDeleteUser"
            title="Delete User"
            message="Are you sure you want to delete this user? This will soft-delete their account."
            variant="danger"
            confirm-text="Delete"
            @confirm="doDeleteUser"
            @cancel="confirmDeleteUser = false"
        />
    </AppLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Link, router } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import { usePermissions } from '@/Composables/usePermissions'
import AppLayout from '@/Layouts/AppLayout.vue'
import Badge from '@/Components/Badge.vue'
import Breadcrumbs from '@/Components/Breadcrumbs.vue'
import ConfirmDialog from '@/Components/ConfirmDialog.vue'

const { can } = usePermissions()

const props = defineProps<{
    user: any
    stats: any
}>()

const confirmDeleteUser = ref(false)

function roleBadge(role: string): string {
    const map: Record<string, string> = {
        'super-admin': 'danger',
        'project-manager': 'warning',
        'team-lead': 'info',
        'employee': 'neutral',
    }
    return map[role] ?? 'neutral'
}

function statusBadge(status: string): string {
    const map: Record<string, string> = {
        backlog: 'neutral', todo: 'info', in_progress: 'warning',
        in_review: 'warning', done: 'success', cancelled: 'danger',
        active: 'info', on_hold: 'warning', completed: 'success', archived: 'neutral',
    }
    return map[status] ?? 'neutral'
}

function doDeleteUser() {
    router.delete(route('users.destroy', props.user.id), {
        onSuccess: () => { confirmDeleteUser.value = false },
    })
}
</script>