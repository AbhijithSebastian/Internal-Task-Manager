<template>
    <div class="flex h-full grow flex-col bg-white">
        <!-- Brand -->
        <div class="flex h-14 shrink-0 items-center gap-3 border-b border-gray-100 px-4">
            <Link :href="route('dashboard')" class="flex items-center gap-2.5">
                <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-900 text-white shadow-sm shrink-0">
                    <span class="text-[10px] font-bold tracking-wider">ITM</span>
                </div>
                <div class="min-w-0">
                    <p class="text-[13px] font-semibold text-gray-900 leading-none">Internal Task</p>
                    <p class="mt-0.5 text-[10px] text-gray-400 leading-none">Manager</p>
                </div>
            </Link>
        </div>

        <!-- Nav -->
        <nav class="flex flex-1 flex-col overflow-y-auto px-3 py-4">
            <!-- Main navigation -->
            <div class="space-y-0.5">
                <p class="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Workspace</p>
                <Link
                    v-for="item in mainNav"
                    :key="item.name"
                    :href="route(item.route)"
                    :class="[
                        isActive(item.route)
                            ? 'bg-gray-900 text-white shadow-sm'
                            : 'text-gray-500 hover:bg-gray-100/80 hover:text-gray-800',
                        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-150'
                    ]"
                >
                    <component
                        :is="item.icon"
                        :class="[
                            isActive(item.route) ? 'text-white' : 'text-gray-400 group-hover:text-gray-600',
                            'h-[18px] w-[18px] shrink-0 transition-colors'
                        ]"
                    />
                    <span class="truncate">{{ item.name }}</span>
                    <span
                        v-if="item.badge"
                        class="ml-auto rounded-full bg-gray-800 px-1.5 py-0.5 text-[10px] font-semibold text-white"
                    >
                        {{ item.badge }}
                    </span>
                </Link>
            </div>

            <!-- Bottom section -->
            <div class="mt-auto space-y-0.5 border-t border-gray-100 pt-4">
                <p class="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Account</p>
                <Link
                    :href="route('profile.edit')"
                    :class="[
                        isActive('profile.edit')
                            ? 'bg-gray-900 text-white'
                            : 'text-gray-500 hover:bg-gray-100/80 hover:text-gray-800',
                        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-150'
                    ]"
                >
                    <Cog6ToothIcon
                        :class="[
                            isActive('profile.edit') ? 'text-white' : 'text-gray-400 group-hover:text-gray-600',
                            'h-[18px] w-[18px] shrink-0 transition-colors'
                        ]"
                    />
                    <span>Settings</span>
                </Link>

                <form @submit.prevent="logout">
                    <button
                        type="submit"
                        class="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-gray-500 transition-all hover:bg-red-50 hover:text-red-600"
                    >
                        <ArrowRightOnRectangleIcon class="h-[18px] w-[18px] shrink-0 text-gray-400 group-hover:text-red-400 transition-colors" />
                        <span>Sign Out</span>
                    </button>
                </form>
            </div>
        </nav>
    </div>
</template>

<script setup lang="ts">
import { Link, router } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import {
    HomeIcon,
    ClipboardDocumentListIcon,
    FolderIcon,
    UsersIcon,
    ChartBarIcon,
    Cog6ToothIcon,
    ArrowRightOnRectangleIcon,
} from '@heroicons/vue/24/outline'

const mainNav = [
    { name: 'Dashboard', route: 'dashboard', icon: HomeIcon },
    { name: 'Tasks', route: 'tasks.index', icon: ClipboardDocumentListIcon },
    { name: 'Projects', route: 'projects.index', icon: FolderIcon },
    { name: 'Team', route: 'users.index', icon: UsersIcon },
    { name: 'Reports', route: 'reports.index', icon: ChartBarIcon },
]

function isActive(routeName: string): boolean {
    return route().current(routeName)
}

function logout() {
    router.post(route('logout'))
}
</script>