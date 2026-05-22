<template>
    <div class="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
        <button type="button" class="-m-2.5 p-2.5 text-gray-700 lg:hidden" @click="emit('menuClick')">
            <Bars3Icon class="h-6 w-6" />
        </button>
        <div class="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div class="relative flex flex-1">
                <button class="flex w-full items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors" @click="openSearch">
                    <MagnifyingGlassIcon class="h-5 w-5 shrink-0" />
                    <span class="flex-1 text-left">Search tasks, projects...</span>
                    <kbd class="hidden sm:inline-flex items-center rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs text-gray-400"><span class="text-xs">&#8984;</span>K</kbd>
                </button>
            </div>
        </div>
        <div class="flex items-center gap-x-4 lg:gap-x-6">
            <Link :href="route('notifications.index')" class="relative">
                <BellIcon class="h-6 w-6 text-gray-400 hover:text-gray-600" />
                <span v-if="liveUnread > 0" class="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                    {{ liveUnread > 9 ? '9+' : liveUnread }}
                </span>
            </Link>
            <div class="flex items-center gap-x-2 text-sm">
                <img :src="$page.props.auth.user.avatar" alt="" class="h-8 w-8 rounded-full" @error="onAvatarError">
                <span class="hidden lg:block">{{ $page.props.auth.user.name }}</span>
            </div>
        </div>
        <SearchModal />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Link } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import { Bars3Icon, MagnifyingGlassIcon, BellIcon } from '@heroicons/vue/24/outline'
import axios from 'axios'
import SearchModal from '@/Components/SearchModal.vue'

const props = defineProps<{ unreadCount?: number }>()
const emit = defineEmits<{ menuClick: [] }>()

const liveUnread = ref(props.unreadCount ?? 0)

let pollInterval: ReturnType<typeof setInterval> | null = null

async function pollUnread() {
    try {
        const res = await axios.get(route('api.notifications.unread'))
        liveUnread.value = res.data.unread_count ?? 0
    } catch {
        liveUnread.value = props.unreadCount ?? 0
    }
}

onMounted(() => {
    pollInterval = setInterval(pollUnread, 30000)
    pollUnread()
})

onUnmounted(() => {
    if (pollInterval) clearInterval(pollInterval)
})

function openSearch() {
    window.dispatchEvent(new CustomEvent('opensearch'))
}

const avatarRef = ref<HTMLImageElement | null>(null)
function onAvatarError(e: Event) {
    const img = e.target as HTMLImageElement
    img.style.display = 'none'
    img.insertAdjacentHTML('afterend', '<div class="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-sm font-medium text-primary-700">' + ($page.props.auth.user.name?.[0]?.toUpperCase() ?? '?') + '</div>')
}
</script>
