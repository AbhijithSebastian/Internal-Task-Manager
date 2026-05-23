<template>
    <header class="sticky top-0 z-40 border-b border-gray-100/80 bg-white/95 backdrop-blur-sm">
        <div class="flex h-14 items-center justify-between px-6 lg:px-8">
            <!-- Left: mobile toggle + page title -->
            <div class="flex items-center gap-3">
                <button
                    type="button"
                    class="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors lg:hidden"
                    @click="emit('menuClick')"
                >
                    <Bars3Icon class="h-5 w-5" />
                </button>

                <h1 class="text-sm font-semibold text-gray-800 tracking-tight">Dashboard</h1>
            </div>

            <!-- Right: bell + avatar -->
            <div class="flex items-center gap-1.5">
                <!-- Notification Bell -->
                <Link
                    :href="route('notifications.index')"
                    class="relative rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                >
                    <BellIcon class="h-5 w-5" />
                    <span
                        v-if="liveUnread > 0"
                        class="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-gray-900 text-[9px] font-semibold text-white"
                    >
                        {{ liveUnread > 9 ? '9+' : liveUnread }}
                    </span>
                </Link>

                <!-- Divider -->
                <div class="mx-1 h-5 w-px bg-gray-200" />

                <!-- Avatar + name -->
                <Link
                    :href="route('profile.edit')"
                    class="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-100"
                >
                    <div class="relative">
                        <img
                            :src="$page.props.auth.user.avatar"
                            alt=""
                            class="h-7 w-7 rounded-full object-cover ring-1 ring-gray-200"
                            @error="onAvatarError"
                        />
                        <span class="absolute -bottom-px -right-px h-2.5 w-2.5 rounded-full bg-emerald-400 ring-1 ring-white" />
                    </div>
                    <div class="hidden md:block">
                        <p class="text-xs font-semibold text-gray-800 leading-none">
                            {{ $page.props.auth.user.name }}
                        </p>
                        <p class="mt-0.5 text-[10px] text-gray-400 leading-none capitalize">
                            {{ ($page.props.auth.user.role as string)?.replace('-', ' ') }}
                        </p>
                    </div>
                    <ChevronDownIcon class="hidden h-3 w-3 text-gray-400 md:block" />
                </Link>
            </div>
        </div>
    </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Link } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import axios from 'axios'
import { Bars3Icon, BellIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'

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

function onAvatarError(e: Event) {
    const img = e.target as HTMLImageElement
    img.style.display = 'none'
}
</script>