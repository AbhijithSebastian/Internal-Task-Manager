<template>
    <div class="min-h-screen bg-[#f7f8fa]">
        <Sidebar :sidebar-open="sidebarOpen" @close="sidebarOpen = false" />

        <div class="lg:pl-60">
            <Navbar @menu-click="sidebarOpen = true" />

            <main class="px-6 py-6 lg:px-8 lg:py-7">
                <slot />
            </main>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { usePage } from '@inertiajs/vue3'
import { useToast } from 'vue-toastification'
import Sidebar from '@/Components/Sidebar.vue'
import Navbar from '@/Components/Navbar.vue'

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
</script>