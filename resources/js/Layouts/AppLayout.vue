<template>
    <div class="min-h-screen bg-page">
        <Sidebar :sidebar-open="sidebarOpen" @close="sidebarOpen = false" />

        <div class="lg:pl-[280px]">
            <Navbar :title="pageTitle" @menu-click="sidebarOpen = true" />

            <main class="mx-auto max-w-content px-8 py-8">
                <slot />
            </main>
        </div>

        <SearchModal />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usePage } from '@inertiajs/vue3'
import { useToast } from 'vue-toastification'
import { route } from 'ziggy-js'
import Sidebar from '@/Components/Sidebar.vue'
import Navbar from '@/Components/Navbar.vue'
import SearchModal from '@/Components/SearchModal.vue'

const sidebarOpen = ref(false)
const toast = useToast()
const page = usePage()

watch(
    () => page.props.flash,
    (flash: any) => {
        if (flash?.success) toast.success(flash.success)
        if (flash?.error) toast.error(flash.error)
    },
    { deep: true, immediate: true }
)

const pageTitle = computed(() => {
    const name = route().current()
    if (!name) return 'Dashboard'
    const titles: Record<string, string> = {
        dashboard: 'Dashboard',
        'tasks.index': 'Tasks',
        'tasks.create': 'New Task',
        'tasks.edit': 'Edit Task',
        'tasks.show': 'Task Details',
        'projects.index': 'Projects',
        'projects.create': 'New Project',
        'projects.edit': 'Edit Project',
        'projects.show': 'Project Details',
        'users.index': 'Team',
        'users.create': 'Add Team Member',
        'users.edit': 'Edit User',
        'users.show': 'User Profile',
        'reports.index': 'Reports',
        'notifications.index': 'Notifications',
        'activity.index': 'Activity',
        'profile.edit': 'Settings',
        'admin.index': 'Admin',
    }
    return titles[name] || 'Dashboard'
})
</script>
