<template>
    <AppLayout>
        <div class="mx-auto max-w-6xl space-y-8">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-text-primary">Permissions</h1>
                    <p class="mt-1 text-sm text-text-secondary">Manage role presets, user roles, and individual permission overrides.</p>
                </div>
            </div>

            <!-- Tabs -->
            <div class="flex gap-1 rounded-lg bg-page p-1">
                <button
                    :class="activeTab === 'users' ? 'bg-white shadow-sm' : 'text-text-secondary hover:text-text-primary'"
                    class="rounded-md px-4 py-2 text-sm font-medium transition-colors"
                    @click="activeTab = 'users'"
                >
                    User Permissions
                </button>
                <button
                    :class="activeTab === 'roles' ? 'bg-white shadow-sm' : 'text-text-secondary hover:text-text-primary'"
                    class="rounded-md px-4 py-2 text-sm font-medium transition-colors"
                    @click="activeTab = 'roles'; fetchRoles()"
                >
                    Role Presets
                </button>
            </div>

            <!-- User Permissions Tab -->
            <div v-if="activeTab === 'users'">
                <div class="mb-4">
                    <input
                        v-model="searchQuery"
                        type="text"
                        placeholder="Search by name or email..."
                        class="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-primary focus:border-brand-primary-500 focus:outline-none"
                    />
                </div>
                <div class="card overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-border">
                            <thead class="bg-page">
                                <tr>
                                    <th class="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Employee</th>
                                    <th class="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Role</th>
                                    <th class="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Status</th>
                                    <th class="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-text-secondary">Permissions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-border bg-white">
                                <tr v-for="user in filteredUsers" :key="user.id" class="group transition-colors hover:bg-page/50">
                                    <td class="px-5 py-4">
                                        <div class="flex items-center gap-3">
                                            <div class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary-50 text-sm font-semibold text-brand-primary-700 uppercase">
                                                {{ user.name.substring(0, 2) }}
                                            </div>
                                            <div>
                                                <p class="text-sm font-medium text-text-primary">{{ user.name }}</p>
                                                <p class="text-xs text-text-secondary">{{ user.email }}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-5 py-4">
                                        <span class="inline-flex items-center rounded-full bg-brand-primary-50 px-2.5 py-0.5 text-xs font-medium text-brand-primary-700">
                                            {{ user.role_label ?? user.role }}
                                        </span>
                                    </td>
                                    <td class="px-5 py-4">
                                        <span :class="user.is_active ? 'bg-success-50 text-success' : 'bg-gray-100 text-text-secondary'" class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
                                            {{ user.is_active ? 'Active' : 'Inactive' }}
                                        </span>
                                    </td>
                                    <td class="px-5 py-4 text-right">
                                        <button class="btn-primary btn-sm" @click="openManageDrawer(user)">
                                            Manage Permissions
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Role Presets Tab -->
            <div v-if="activeTab === 'roles'">
                <div class="space-y-6">
                    <div
                        v-for="role in rolePresets"
                        :key="role.name"
                        class="card overflow-hidden"
                    >
                        <div class="flex items-center justify-between border-b border-border bg-page px-6 py-4">
                            <div>
                                <h3 class="text-base font-bold text-text-primary">{{ role.label }}</h3>
                                <p class="text-xs text-text-secondary mt-0.5">{{ role.name }}</p>
                            </div>
                            <button
                                v-if="editingRole === role.name"
                                class="btn-secondary btn-sm"
                                @click="cancelRoleEdit(role.name)"
                            >
                                Cancel
                            </button>
                        </div>

                        <div class="px-6 py-4">
                            <button
                                v-if="editingRole !== role.name"
                                class="btn-primary btn-sm"
                                @click="startRoleEdit(role.name)"
                            >
                                Edit Permissions
                            </button>

                            <template v-if="editingRole === role.name">
                                <div class="flex gap-2 mb-4">
                                    <button class="btn-secondary btn-sm text-xs" @click="enableAllRole">Enable All</button>
                                    <button class="btn-secondary btn-sm text-xs" @click="disableAllRole">Disable All</button>
                                </div>

                                <div class="space-y-3">
                                    <div
                                        v-for="group in permissionGroups"
                                        :key="group.key"
                                        class="rounded-lg border border-border overflow-hidden"
                                    >
                                        <button
                                            class="flex w-full items-center justify-between bg-page px-4 py-2.5 text-left text-sm font-semibold text-text-primary hover:bg-gray-50"
                                            @click="toggleRoleGroup(group.key)"
                                        >
                                            <span>{{ group.label }}</span>
                                            <ChevronDownIcon
                                                :class="[
                                                    'h-4 w-4 text-text-secondary transition-transform',
                                                    roleExpandedGroups[role.name]?.[group.key] ? '' : '-rotate-90'
                                                ]"
                                            />
                                        </button>
                                        <Transition name="collapse">
                                            <div v-if="roleExpandedGroups[role.name]?.[group.key]" class="divide-y divide-border border-t border-border">
                                                <div
                                                    v-for="perm in group.permissions"
                                                    :key="perm.value"
                                                    class="flex items-center justify-between px-4 py-2.5"
                                                >
                                                    <span class="text-sm text-text-primary">{{ perm.label }}</span>
                                                    <button
                                                        type="button"
                                                        :class="[
                                                            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                                                            roleEditState[role.name]?.permissions[perm.value] ? 'bg-brand-primary-500' : 'bg-gray-200'
                                                        ]"
                                                        role="switch"
                                                        :aria-checked="roleEditState[role.name]?.permissions[perm.value]"
                                                        @click="toggleRolePermission(role.name, perm.value)"
                                                    >
                                                        <span class="sr-only">{{ perm.label }}</span>
                                                        <span
                                                            :class="[
                                                                'pointer-events-none relative inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                                                                roleEditState[role.name]?.permissions[perm.value] ? 'translate-x-4' : 'translate-x-0'
                                                            ]"
                                                        />
                                                    </button>
                                                </div>
                                            </div>
                                        </Transition>
                                    </div>
                                </div>

                                <div class="mt-6 flex justify-end gap-3 border-t border-border pt-4">
                                    <button class="btn-secondary btn-sm" @click="cancelRoleEdit(role.name)">Cancel</button>
                                    <button class="btn-primary btn-sm" :disabled="savingRole" @click="saveRolePermissions(role.name)">
                                        <svg v-if="savingRole" class="animate-spin -ml-1 mr-1 h-3 w-3 text-white inline" viewBox="0 0 24 24" fill="none">
                                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Save Changes
                                    </button>
                                </div>
                            </template>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- User Manage Drawer -->
        <Transition name="drawer">
            <div v-if="drawerOpen" class="fixed inset-0 z-50 flex">
                <div class="fixed inset-0 bg-black/30" @click="closeDrawer" />
                <div class="relative ml-auto h-full w-full max-w-lg bg-white shadow-xl overflow-y-auto">
                    <div class="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-6 py-4">
                        <div>
                            <h2 class="text-lg font-bold text-text-primary">{{ drawerUser?.name }}</h2>
                            <p class="text-sm text-text-secondary">{{ drawerUser?.email }}</p>
                        </div>
                        <button class="rounded-lg p-2 text-text-secondary hover:bg-page hover:text-text-primary" @click="closeDrawer">
                            <XMarkIcon class="h-5 w-5" />
                        </button>
                    </div>

                    <div class="p-6 space-y-6">
                        <div v-if="loading" class="flex items-center justify-center py-12">
                            <svg class="h-6 w-6 animate-spin text-brand-primary-500" viewBox="0 0 24 24" fill="none">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        </div>

                        <template v-if="!loading && drawerUser">
                            <!-- Role Switcher -->
                            <div class="rounded-lg border border-border bg-page p-4">
                                <label class="block text-sm font-semibold text-text-primary mb-2">Role</label>
                                <select
                                    class="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-primary focus:border-brand-primary-500 focus:outline-none"
                                    :value="drawerUser.role"
                                    @change="changeUserRole(drawerUser.id, ($event.target as HTMLSelectElement).value)"
                                >
                                    <option v-for="r in roleOptions" :key="r.value" :value="r.value">
                                        {{ r.label }}
                                    </option>
                                </select>
                            </div>

                            <!-- Inherit Role Permissions Toggle -->
                            <div class="rounded-lg border border-border bg-page p-4">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="text-sm font-semibold text-text-primary">Inherit Role Permissions</p>
                                        <p class="text-xs text-text-secondary mt-0.5">
                                            When enabled, permissions are automatically inherited from the assigned role.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        :class="[
                                            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                                            editState.inheritRole ? 'bg-brand-primary-500' : 'bg-gray-200'
                                        ]"
                                        role="switch"
                                        :aria-checked="editState.inheritRole"
                                        @click="toggleInheritRole"
                                    >
                                        <span class="sr-only">Inherit role permissions</span>
                                        <span
                                            :class="[
                                                'pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                                                editState.inheritRole ? 'translate-x-5' : 'translate-x-0'
                                            ]"
                                        />
                                    </button>
                                </div>
                            </div>

                            <!-- Bulk Actions -->
                            <div v-if="!editState.inheritRole" class="flex gap-2">
                                <button class="btn-secondary btn-sm text-xs" @click="enableAll">Enable All</button>
                                <button class="btn-secondary btn-sm text-xs" @click="disableAll">Disable All</button>
                                <button class="btn-secondary btn-sm text-xs" @click="resetToDefault">Reset to Default</button>
                            </div>

                            <!-- Permission Groups -->
                            <div class="space-y-4">
                                <div
                                    v-for="group in permissionGroups"
                                    :key="group.key"
                                    class="rounded-lg border border-border overflow-hidden"
                                >
                                    <button
                                        class="flex w-full items-center justify-between bg-page px-4 py-3 text-left text-sm font-semibold text-text-primary hover:bg-gray-50"
                                        @click="toggleGroup(group.key)"
                                    >
                                        <span>{{ group.label }}</span>
                                        <ChevronDownIcon
                                            :class="[
                                                'h-4 w-4 text-text-secondary transition-transform',
                                                expandedGroups[group.key] ? '' : '-rotate-90'
                                            ]"
                                        />
                                    </button>
                                    <Transition name="collapse">
                                        <div v-if="expandedGroups[group.key]" class="divide-y divide-border border-t border-border">
                                            <div
                                                v-for="perm in group.permissions"
                                                :key="perm.value"
                                                class="flex items-center justify-between px-4 py-3"
                                                :class="{ 'opacity-50 pointer-events-none': editState.inheritRole }"
                                            >
                                                <span class="text-sm text-text-primary">{{ perm.label }}</span>
                                                <button
                                                    type="button"
                                                    :class="[
                                                        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                                                        editState.permissions[perm.value] ? 'bg-brand-primary-500' : 'bg-gray-200'
                                                    ]"
                                                    role="switch"
                                                    :aria-checked="editState.permissions[perm.value]"
                                                    :disabled="editState.inheritRole"
                                                    @click="togglePermission(perm.value)"
                                                >
                                                    <span class="sr-only">{{ perm.label }}</span>
                                                    <span
                                                        :class="[
                                                            'pointer-events-none relative inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                                                            editState.permissions[perm.value] ? 'translate-x-4' : 'translate-x-0'
                                                        ]"
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                    </Transition>
                                </div>
                            </div>

                            <!-- Save Button -->
                            <div class="sticky bottom-0 border-t border-border bg-white px-6 py-4 -mx-6 -mb-6 mt-6">
                                <div class="flex justify-end gap-3">
                                    <button class="btn-secondary btn-sm" @click="closeDrawer">Cancel</button>
                                    <button class="btn-primary btn-sm" :disabled="saving" @click="savePermissions">
                                        <svg v-if="saving" class="animate-spin -ml-1 mr-1 h-3 w-3 text-white inline" viewBox="0 0 24 24" fill="none">
                                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </template>
                    </div>
                </div>
            </div>
        </Transition>
    </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { router } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import { XMarkIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/Layouts/AppLayout.vue'

const props = defineProps<{
    users: any[]
    permissionGroups: { key: string; label: string; permissions: { value: string; label: string }[] }[]
}>()

const roleOptions = [
    { value: 'super-admin', label: 'Super Admin' },
    { value: 'project-manager', label: 'Project Manager' },
    { value: 'team-lead', label: 'Team Lead' },
    { value: 'employee', label: 'Employee' },
]

const activeTab = ref('users')

// ── User Permissions Drawer ──

const drawerOpen = ref(false)
const drawerUser = ref<any>(null)
const loading = ref(false)
const saving = ref(false)

interface EditState {
    inheritRole: boolean
    permissions: Record<string, boolean>
}

const editState = reactive<EditState>({
    inheritRole: true,
    permissions: {},
})

const searchQuery = ref('')
const filteredUsers = computed(() => {
    if (!searchQuery.value) return props.users
    const q = searchQuery.value.toLowerCase()
    return props.users.filter(u =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    )
})

const expandedGroups = reactive<Record<string, boolean>>({})

function toggleGroup(key: string) {
    expandedGroups[key] = !expandedGroups[key]
}

function expandAllGroups() {
    props.permissionGroups.forEach(g => { expandedGroups[g.key] = true })
}

async function openManageDrawer(user: any) {
    drawerUser.value = user
    drawerOpen.value = true
    loading.value = true

    expandAllGroups()

    try {
        const res = await fetch(route('permissions.show', user.id))
        const data = await res.json()

        editState.inheritRole = data.user.inherit_role_permissions

        const effectivePerms = editState.inheritRole ? data.role_permissions : data.direct_permissions

        const permMap: Record<string, boolean> = {}
        props.permissionGroups.forEach(group => {
            group.permissions.forEach(p => {
                permMap[p.value] = effectivePerms.includes(p.value)
            })
        })
        Object.assign(editState.permissions, permMap)
    } catch {
        //
    } finally {
        loading.value = false
    }
}

function closeDrawer() {
    drawerOpen.value = false
    drawerUser.value = null
}

function changeUserRole(userId: number, newRole: string) {
    router.put(route('permissions.users.role', userId), {
        role: newRole,
    }, {
        preserveScroll: true,
        onSuccess: () => {
            drawerOpen.value = false
            router.reload({ preserveScroll: true })
        },
    })
}

const rolePresetsForReset = ref<any[]>([])

async function updateFromRolePermissions() {
    if (!drawerUser.value) return

    let roles = rolePresetsForReset.value
    if (roles.length === 0) {
        try {
            const res = await fetch(route('permissions.roles'))
            const data = await res.json()
            roles = data.roles
            rolePresetsForReset.value = data.roles
        } catch {
            return
        }
    }

    const role = roles.find((r: any) => r.name === drawerUser.value.role)
    const rolePerms: string[] = role?.permissions ?? []

    const permMap: Record<string, boolean> = {}
    props.permissionGroups.forEach(group => {
        group.permissions.forEach(p => {
            permMap[p.value] = rolePerms.includes(p.value)
        })
    })
    Object.assign(editState.permissions, permMap)
}

async function toggleInheritRole() {
    editState.inheritRole = !editState.inheritRole
    if (editState.inheritRole) {
        await updateFromRolePermissions()
    }
}

function togglePermission(value: string) {
    editState.permissions[value] = !editState.permissions[value]
}

function enableAll() {
    Object.keys(editState.permissions).forEach(k => { editState.permissions[k] = true })
}

function disableAll() {
    Object.keys(editState.permissions).forEach(k => { editState.permissions[k] = false })
}

async function resetToDefault() {
    if (!drawerUser.value) return
    await updateFromRolePermissions()
}

function savePermissions() {
    if (!drawerUser.value) return
    saving.value = true

    const selectedPerms = Object.entries(editState.permissions)
        .filter(([, enabled]) => enabled)
        .map(([key]) => key)

    router.put(route('permissions.update', drawerUser.value.id), {
        inherit_role_permissions: editState.inheritRole,
        permissions: editState.inheritRole ? [] : selectedPerms,
    }, {
        preserveScroll: true,
        onSuccess: () => {
            closeDrawer()
            saving.value = false
            router.reload({ preserveScroll: true })
        },
        onFinish: () => {
            saving.value = false
        },
    })
}

// ── Role Presets ──

const rolePresets = ref<any[]>([])
const editingRole = ref<string | null>(null)
const savingRole = ref(false)

interface RoleEditState {
    original: Record<string, boolean>
    permissions: Record<string, boolean>
}

const roleEditState = reactive<Record<string, RoleEditState>>({})
const roleExpandedGroups = reactive<Record<string, Record<string, boolean>>>({})

async function fetchRoles() {
    try {
        const res = await fetch(route('permissions.roles'))
        const data = await res.json()
        rolePresets.value = data.roles
    } catch {
        //
    }
}

function startRoleEdit(roleName: string) {
    const role = rolePresets.value.find((r: any) => r.name === roleName)
    if (!role) return

    const permMap: Record<string, boolean> = {}
    props.permissionGroups.forEach(group => {
        group.permissions.forEach(p => {
            permMap[p.value] = role.permissions.includes(p.value)
        })
    })

    roleEditState[roleName] = {
        original: { ...permMap },
        permissions: { ...permMap },
    }

    if (!roleExpandedGroups[roleName]) {
        roleExpandedGroups[roleName] = {}
    }
    props.permissionGroups.forEach(g => {
        if (!roleExpandedGroups[roleName][g.key]) {
            roleExpandedGroups[roleName][g.key] = true
        }
    })

    editingRole.value = roleName
}

function cancelRoleEdit(roleName: string) {
    if (roleEditState[roleName]) {
        Object.assign(roleEditState[roleName].permissions, roleEditState[roleName].original)
    }
    editingRole.value = null
}

function toggleRoleGroup(roleName: string, key: string) {
    if (!roleExpandedGroups[roleName]) {
        roleExpandedGroups[roleName] = {}
    }
    roleExpandedGroups[roleName][key] = !roleExpandedGroups[roleName][key]
}

function toggleRolePermission(roleName: string, value: string) {
    if (roleEditState[roleName]) {
        roleEditState[roleName].permissions[value] = !roleEditState[roleName].permissions[value]
    }
}

function enableAllRole() {
    if (!editingRole.value || !roleEditState[editingRole.value]) return
    Object.keys(roleEditState[editingRole.value].permissions).forEach(k => {
        roleEditState[editingRole.value!].permissions[k] = true
    })
}

function disableAllRole() {
    if (!editingRole.value || !roleEditState[editingRole.value]) return
    Object.keys(roleEditState[editingRole.value].permissions).forEach(k => {
        roleEditState[editingRole.value!].permissions[k] = false
    })
}

function saveRolePermissions(roleName: string) {
    if (!roleEditState[roleName]) return
    savingRole.value = true

    const selectedPerms = Object.entries(roleEditState[roleName].permissions)
        .filter(([, enabled]) => enabled)
        .map(([key]) => key)

    router.put(route('permissions.roles.update', roleName), {
        permissions: selectedPerms,
    }, {
        preserveScroll: true,
        onSuccess: () => {
            editingRole.value = null
            savingRole.value = false
            fetchRoles()
        },
        onFinish: () => {
            savingRole.value = false
        },
    })
}
</script>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
    transition: opacity 0.2s ease;
}
.drawer-enter-active > div:last-child,
.drawer-leave-active > div:last-child {
    transition: transform 0.3s ease;
}
.drawer-enter-from,
.drawer-leave-to {
    opacity: 0;
}
.drawer-enter-from > div:last-child,
.drawer-leave-to > div:last-child {
    transform: translateX(100%);
}
.drawer-enter-to > div:last-child,
.drawer-leave-from > div:last-child {
    transform: translateX(0);
}

.collapse-enter-active,
.collapse-leave-active {
    transition: all 0.2s ease;
    overflow: hidden;
}
.collapse-enter-from,
.collapse-leave-to {
    opacity: 0;
    max-height: 0;
}
.collapse-enter-to,
.collapse-leave-from {
    opacity: 1;
    max-height: 2000px;
}
</style>
