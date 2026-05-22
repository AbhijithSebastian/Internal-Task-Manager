<template>
    <div class="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
        <div class="flex h-16 shrink-0 items-center">
            <Link :href="route('dashboard')" class="text-xl font-bold text-primary-600">
                Internal Tool
            </Link>
        </div>
        <nav class="flex flex-1 flex-col">
            <ul role="list" class="flex flex-1 flex-col gap-y-7">
                <li>
                    <ul role="list" class="-mx-2 space-y-1">
                        <li v-for="item in navigation" :key="item.name">
                            <Link :href="route(item.route)" :class="[isActive(item.route), 'group flex gap-x-3 rounded-lg p-2 text-sm font-semibold leading-6']">
                                <component :is="item.icon" class="h-5 w-5 shrink-0" aria-hidden="true" />
                                {{ item.name }}
                            </Link>
                        </li>
                    </ul>
                </li>
                <li class="mt-4 border-t border-gray-100 pt-4">
                    <div class="mb-2 px-2 text-[11px] font-medium uppercase tracking-wider text-gray-400">
                        <span>Quick access</span>
                    </div>
                    <Link :href="route('tasks.create')" class="group -mx-2 flex gap-x-3 rounded-lg p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50 hover:text-primary-600">
                        <PlusIcon class="h-5 w-5 shrink-0" />
                        New Task
                    </Link>
                    <button @click="openSearch" class="group -mx-2 flex w-full gap-x-3 rounded-lg p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50 hover:text-primary-600">
                        <MagnifyingGlassIcon class="h-5 w-5 shrink-0" />
                        <span class="flex-1 text-left">Search</span>
                        <kbd class="hidden sm:inline-flex items-center rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs text-gray-400"><span class="text-xs">&#8984;</span>K</kbd>
                    </button>
                </li>
                <li class="mt-auto">
                    <Link :href="route('profile.edit')" class="group -mx-2 flex gap-x-3 rounded-lg p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50 hover:text-primary-600">
                        <UserCircleIcon class="h-5 w-5 shrink-0" />
                        Profile
                    </Link>
                    <form @submit.prevent="logout">
                        <button type="submit" class="group -mx-2 flex w-full gap-x-3 rounded-lg p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50 hover:text-red-600">
                            <ArrowRightOnRectangleIcon class="h-5 w-5 shrink-0" />
                            Sign out
                        </button>
                    </form>
                </li>
            </ul>
        </nav>
    </div>
</template>

<script setup lang="ts">
import { Link, router } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import { HomeIcon, FolderIcon, ClipboardDocumentListIcon, UsersIcon, BellIcon, ChartBarIcon, ClockIcon } from '@heroicons/vue/24/outline'
import { UserCircleIcon, ArrowRightOnRectangleIcon, PlusIcon, MagnifyingGlassIcon } from '@heroicons/vue/24/outline'

const navigation = [
    { name: 'Dashboard', route: 'dashboard', icon: HomeIcon },
    { name: 'Projects', route: 'projects.index', icon: FolderIcon },
    { name: 'Tasks', route: 'tasks.index', icon: ClipboardDocumentListIcon },
    { name: 'Users', route: 'users.index', icon: UsersIcon },
    { name: 'Notifications', route: 'notifications.index', icon: BellIcon },
    { name: 'Activity', route: 'activity.index', icon: ClockIcon },
    { name: 'Reports', route: 'reports.index', icon: ChartBarIcon },
]

function isActive(routeName: string): string {
    return route().current(routeName)
        ? 'bg-primary-50 text-primary-700'
        : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'
}

function logout() {
    router.post(route('logout'))
}

function openSearch() {
    window.dispatchEvent(new CustomEvent('opensearch'))
}
</script>
