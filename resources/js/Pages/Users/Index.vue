<template>
    <AppLayout>
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900">Users</h2>
                    <p class="mt-1 text-sm text-gray-600">Manage team members and their roles</p>
                </div>
                <Link v-if="can('users.create')" :href="route('users.create')" class="btn-primary">Add User</Link>
            </div>

            <div class="card">
                <div class="border-b border-gray-200 bg-gray-50 px-6 py-4">
                    <div class="flex flex-wrap gap-4">
                        <input v-model="filters.search" type="search" placeholder="Search users..." class="input max-w-xs" @input="filter">
                        <select v-model="filters.role" class="input max-w-[180px]" @change="filter">
                            <option value="">All Roles</option>
                            <option v-for="role in roles" :key="role.value" :value="role.value">{{ role.label }}</option>
                        </select>
                        <select v-model="filters.status" class="input max-w-[160px]" @change="filter">
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="trashed">Deleted</option>
                        </select>
                    </div>
                </div>

                <div v-if="users.data.length > 0" class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer select-none" @click="toggleSort('name')">
                                    <div class="flex items-center gap-1">
                                        User
                                        <ArrowsUpDownIcon v-if="filters.sort_by !== 'name'" class="h-3 w-3 text-gray-400" />
                                        <ChevronUpIcon v-else-if="filters.sort_direction === 'asc'" class="h-3 w-3" />
                                        <ChevronDownIcon v-else class="h-3 w-3" />
                                    </div>
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Role</th>
                                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer select-none" @click="toggleSort('created_at')">
                                    <div class="flex items-center gap-1">
                                        Joined
                                        <ArrowsUpDownIcon v-if="filters.sort_by !== 'created_at'" class="h-3 w-3 text-gray-400" />
                                        <ChevronUpIcon v-else-if="filters.sort_direction === 'asc'" class="h-3 w-3" />
                                        <ChevronDownIcon v-else class="h-3 w-3" />
                                    </div>
                                </th>
                                <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200 bg-white">
                            <tr v-for="user in users.data" :key="user.id" :class="user.deleted_at ? 'opacity-60' : ''">
                                <td class="whitespace-nowrap px-6 py-4">
                                    <Link :href="route('users.show', user.id)" class="flex items-center gap-3 group">
                                        <img :src="user.avatar" alt="" class="h-9 w-9 rounded-full object-cover">
                                        <div>
                                            <p class="text-sm font-medium text-gray-900 group-hover:text-primary-600">{{ user.name }}</p>
                                            <p class="text-sm text-gray-500">{{ user.email }}</p>
                                            <p v-if="user.job_title" class="text-xs text-gray-400">{{ user.job_title }}</p>
                                        </div>
                                    </Link>
                                </td>
                                <td class="whitespace-nowrap px-6 py-4">
                                    <Badge :variant="roleBadge(user.roles[0]?.name)">{{ user.roles[0]?.name ?? 'N/A' }}</Badge>
                                </td>
                                <td class="whitespace-nowrap px-6 py-4">
                                    <Badge :variant="user.deleted_at ? 'neutral' : (user.is_active ? 'success' : 'danger')">
                                        {{ user.deleted_at ? 'Deleted' : (user.is_active ? 'Active' : 'Inactive') }}
                                    </Badge>
                                </td>
                                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                    {{ user.created_at }}
                                </td>
                                <td class="whitespace-nowrap px-6 py-4 text-right">
                                    <div class="flex items-center justify-end gap-2">
                                        <Link :href="route('users.show', user.id)" class="text-sm font-medium text-gray-600 hover:text-primary-600" title="View profile">View</Link>
                                        <Link v-if="can('users.update') && !user.deleted_at" :href="route('users.edit', user.id)" class="text-sm font-medium text-primary-600 hover:text-primary-500">Edit</Link>
                                        <button
                                            v-if="can('users.update') && !user.deleted_at && !user.is_super_admin"
                                            class="text-sm font-medium"
                                            :class="user.is_active ? 'text-orange-600 hover:text-orange-500' : 'text-green-600 hover:text-green-500'"
                                            @click="confirmToggleActive(user)"
                                            :title="user.is_active ? 'Deactivate user access' : 'Activate user access'"
                                        >
                                            {{ user.is_active ? 'Deactivate' : 'Activate' }}
                                        </button>
                                        <button
                                            v-if="can('users.delete') && !user.deleted_at && !user.is_super_admin && user.id !== $page.props.auth.user.id"
                                            class="text-sm font-medium text-red-600 hover:text-red-500"
                                            @click="confirmDeleteUser(user)"
                                            title="Soft delete and deactivate user"
                                        >
                                            Delete
                                        </button>
                                        <button
                                            v-if="can('users.restore') && user.deleted_at"
                                            class="text-sm font-medium text-green-600 hover:text-green-500"
                                            @click="confirmRestoreUser(user)"
                                            title="Restore soft deleted user"
                                        >
                                            Restore
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div v-else class="p-6">
                    <EmptyState title="No users found" message="Add users to get started." />
                </div>
                <Pagination v-if="users.data.length > 0" :pagination="users" />
            </div>
        </div>

        <Modal :open="confirmModal.open" @close="confirmModal.open = false">
            <template #title>{{ confirmModal.title }}</template>
            <p class="text-sm text-gray-600">{{ confirmModal.message }}</p>
            <div class="mt-6 flex justify-end gap-3">
                <button class="btn-secondary" @click="confirmModal.open = false">Cancel</button>
                <button :class="confirmModal.danger ? 'btn-danger' : 'btn-primary'" :disabled="confirmModal.processing" @click="confirmModal.action">
                    {{ confirmModal.confirmText }}
                </button>
            </div>
        </Modal>
    </AppLayout>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { Link, router } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import { usePermissions } from '@/Composables/usePermissions'
import AppLayout from '@/Layouts/AppLayout.vue'
import Badge from '@/Components/Badge.vue'
import Pagination from '@/Components/Pagination.vue'
import Modal from '@/Components/Modal.vue'
import EmptyState from '@/Components/EmptyState.vue'
import { ChevronUpIcon, ChevronDownIcon, ArrowsUpDownIcon } from '@heroicons/vue/20/solid'

const { can } = usePermissions()

const props = defineProps<{
    users: any
    filters: any
    roles: any
}>()

const filters = reactive({ search: props.filters.search ?? '', role: props.filters.role ?? '', status: props.filters.status ?? '', sort_by: props.filters.sort_by ?? 'created_at', sort_direction: props.filters.sort_direction ?? 'desc' })

const confirmModal = ref({
    open: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    danger: false,
    processing: false,
    action: () => {},
})

function filter() {
    router.get(route('users.index'), filters, { preserveState: true, replace: true })
}

function toggleSort(field: string) {
    if (filters.sort_by === field) {
        filters.sort_direction = filters.sort_direction === 'asc' ? 'desc' : 'asc'
    } else {
        filters.sort_by = field
        filters.sort_direction = 'asc'
    }
    filter()
}

function confirmToggleActive(user: any) {
    const action = user.is_active ? 'deactivate' : 'activate'
    confirmModal.value = {
        open: true,
        title: `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
        message: `Are you sure you want to ${action} ${user.name}?`,
        confirmText: action.charAt(0).toUpperCase() + action.slice(1),
        danger: user.is_active,
        processing: false,
        action: async () => {
            confirmModal.value.processing = true
            router.patch(route('users.toggle-active', user.id), {}, {
                onSuccess: () => { confirmModal.value.open = false },
                onFinish: () => { confirmModal.value.processing = false },
            })
        },
    }
}

function confirmDeleteUser(user: any) {
    confirmModal.value = {
        open: true,
        title: 'Delete User',
        message: `Are you sure you want to delete ${user.name}? This will deactivate their account and soft-delete their profile.`,
        confirmText: 'Delete',
        danger: true,
        processing: false,
        action: async () => {
            confirmModal.value.processing = true
            router.delete(route('users.destroy', user.id), {
                onSuccess: () => { confirmModal.value.open = false },
                onFinish: () => { confirmModal.value.processing = false },
            })
        },
    }
}

function confirmRestoreUser(user: any) {
    confirmModal.value = {
        open: true,
        title: 'Restore User',
        message: `Are you sure you want to restore ${user.name}?`,
        confirmText: 'Restore',
        danger: false,
        processing: false,
        action: async () => {
            confirmModal.value.processing = true
            router.post(route('users.restore', user.id), {}, {
                onSuccess: () => { confirmModal.value.open = false },
                onFinish: () => { confirmModal.value.processing = false },
            })
        },
    }
}

function roleBadge(role: string): string {
    const map: Record<string, string> = {
        'super-admin': 'danger',
        'project-manager': 'warning',
        'team-lead': 'info',
        'employee': 'neutral',
    }
    return map[role] ?? 'neutral'
}
</script>
