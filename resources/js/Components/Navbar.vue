<template>
    <header class="sticky top-0 z-40 border-b border-border bg-white/95">
        <div class="flex h-16 items-center justify-between px-6 lg:px-8">
            <!-- Left: mobile toggle + page title -->
            <div class="flex items-center gap-4">
                <button
                    type="button"
                    class="rounded-lg p-2 text-text-secondary hover:bg-gray-100 hover:text-text-primary transition-colors lg:hidden"
                    @click="emit('menuClick')"
                >
                    <Bars3Icon class="h-5 w-5" />
                </button>

                <h1 class="text-lg font-semibold text-text-primary tracking-tight">{{ title }}</h1>
            </div>

            <!-- Right -->
            <div class="flex items-center gap-2">
                <!-- Notification Bell -->
                <Link
                    :href="route('notifications.index')"
                    class="relative rounded-lg p-2 text-text-secondary transition-colors hover:bg-gray-100 hover:text-text-primary"
                >
                    <BellIcon class="h-5 w-5" />
                    <span
                        v-if="liveUnread > 0"
                        class="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-primary-500 text-[9px] font-semibold text-white"
                    >
                        {{ liveUnread > 9 ? '9+' : liveUnread }}
                    </span>
                </Link>

                <!-- Divider -->
                <div class="mx-1 h-5 w-px bg-border" />

                <!-- Avatar + name -->
                <Link
                    :href="route('profile.edit')"
                    class="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-50"
                >
                    <div class="relative">
                        <img
                            :src="$page.props.auth.user.avatar"
                            alt=""
                            class="h-8 w-8 rounded-full object-cover ring-2 ring-gray-100"
                            @error="onAvatarError"
                        />
                        <span class="absolute -bottom-px -right-px h-2.5 w-2.5 rounded-full bg-success ring-2 ring-white" />
                    </div>
                    <div class="hidden md:block text-left">
                        <p class="text-sm font-semibold text-text-primary leading-none">
                            {{ $page.props.auth.user.name }}
                        </p>
                        <p class="mt-0.5 text-xs text-text-secondary leading-none capitalize">
                            {{ ($page.props.auth.user.role as string)?.replace('-', ' ') || 'Member' }}
                        </p>
                    </div>
                    <ChevronDownIcon class="hidden h-3.5 w-3.5 text-text-secondary md:block" />
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

const props = defineProps<{ title?: string; unreadCount?: number }>()
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
