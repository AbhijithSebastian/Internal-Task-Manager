<template>
    <div class="flex h-full grow flex-col bg-white">
        <!-- Brand -->
        <div class="flex h-16 shrink-0 items-center gap-3 border-b border-border px-5">
            <Link :href="route('dashboard')" class="flex items-center gap-3">
                <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-primary-500 text-white shadow-sm shrink-0">
                    <span class="text-[10px] font-bold tracking-wider">ITM</span>
                </div>
                <div class="min-w-0">
                    <p class="text-sm font-semibold text-text-primary leading-none">Internal Task</p>
                    <p class="mt-0.5 text-[11px] text-text-secondary leading-none">Manager</p>
                </div>
            </Link>
        </div>

        <!-- Nav -->
        <nav class="flex flex-1 flex-col overflow-y-auto px-3 py-4">
            <div class="space-y-0.5">
                <p class="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-text-secondary">Workspace</p>
                <Link
                    v-for="item in mainNav"
                    :key="item.name"
                    :href="route(item.route)"
                    :class="[
                        isActive(item.route)
                            ? 'bg-brand-primary-50 text-brand-primary-600 font-semibold'
                            : 'text-text-secondary hover:bg-gray-100 hover:text-text-primary',
                        'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150'
                    ]"
                >
                    <component
                        :is="item.icon"
                        :class="[
                            isActive(item.route) ? 'text-brand-primary-500' : 'text-text-secondary/60 group-hover:text-text-primary',
                            'h-5 w-5 shrink-0 transition-colors'
                        ]"
                    />
                    <span class="truncate">{{ item.name }}</span>
                    <span
                        v-if="item.badge"
                        class="ml-auto rounded-full bg-brand-primary-500 px-1.5 py-0.5 text-[10px] font-semibold text-white"
                    >
                        {{ item.badge }}
                    </span>
                </Link>
            </div>

            <!-- Bottom section -->
            <div class="mt-auto space-y-0.5 border-t border-border pt-4">
                <p class="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-text-secondary">Account</p>
                <Link
                    :href="route('profile.edit')"
                    :class="[
                        isActive('profile.edit')
                            ? 'bg-brand-primary-50 text-brand-primary-600 font-semibold'
                            : 'text-text-secondary hover:bg-gray-100 hover:text-text-primary',
                        'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150'
                    ]"
                >
                    <Cog6ToothIcon
                        :class="[
                            isActive('profile.edit') ? 'text-brand-primary-500' : 'text-text-secondary/60 group-hover:text-text-primary',
                            'h-5 w-5 shrink-0 transition-colors'
                        ]"
                    />
                    <span>Settings</span>
                </Link>

                <form @submit.prevent="logout">
                    <button
                        type="submit"
                        class="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition-all hover:bg-danger-50 hover:text-danger"
                    >
                        <ArrowRightOnRectangleIcon class="h-5 w-5 shrink-0 text-text-secondary/60 transition-colors group-hover:text-danger" />
                        <span>Sign Out</span>
                    </button>
                </form>
            </div>
        </nav>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Link, router } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import { usePermissions } from '@/Composables/usePermissions'
import {
    HomeIcon,
    ClipboardDocumentListIcon,
    FolderIcon,
    UsersIcon,
    ChartBarIcon,
    Cog6ToothIcon,
    ArrowRightOnRectangleIcon,
    MegaphoneIcon,
    LockClosedIcon,
} from '@heroicons/vue/24/outline'

const { can } = usePermissions()

const mainNav = computed(() => {
    const items = [
        { name: 'Dashboard', route: 'dashboard', icon: HomeIcon },
        { name: 'Tasks', route: 'tasks.index', icon: ClipboardDocumentListIcon },
        { name: 'Projects', route: 'projects.index', icon: FolderIcon },
        { name: 'Team', route: 'users.index', icon: UsersIcon },
        { name: 'Announcements', route: 'announcements.index', icon: MegaphoneIcon },
        { name: 'Reports', route: 'reports.index', icon: ChartBarIcon },
    ]

    if (can('permissions.view')) {
        items.push({ name: 'Permissions', route: 'permissions.index', icon: LockClosedIcon })
    }

    return items
})

function isActive(routeName: string): boolean {
    return route().current(routeName)
}

function logout() {
    router.post(route('logout'))
}
</script>
