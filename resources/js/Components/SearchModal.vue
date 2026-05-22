<template>
    <Teleport to="body">
        <Transition name="fade">
            <div v-if="open" class="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
                <div class="fixed inset-0 bg-black/40" @click="close" />

                <div class="relative w-full max-w-xl rounded-xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden" @keydown.esc="close">
                    <div class="flex items-center border-b border-gray-200 px-4">
                        <MagnifyingGlassIcon class="h-5 w-5 shrink-0 text-gray-400" />
                        <input
                            ref="inputRef"
                            v-model="query"
                            type="text"
                            class="flex-1 border-0 px-3 py-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0"
                            placeholder="Search tasks, projects, users, comments... (tag:name to filter by tag)"
                            @input="onInput"
                            @keydown.down.prevent="nextResult"
                            @keydown.up.prevent="prevResult"
                            @keydown.enter.prevent="selectCurrent"
                        />
                        <kbd class="hidden sm:inline-flex items-center rounded border border-gray-200 px-1.5 py-0.5 text-xs text-gray-400">ESC</kbd>
                    </div>

                    <div v-if="query.length > 0" class="max-h-[60vh] overflow-y-auto">
                        <div v-if="loading" class="flex items-center justify-center py-8">
                            <svg class="h-5 w-5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        </div>

                        <div v-else-if="noResults" class="px-4 py-8 text-center text-sm text-gray-500">No results found for "{{ query }}"</div>

                        <template v-else>
                            <SearchSection
                                v-if="results.tasks?.length"
                                label="Tasks"
                                type="tasks"
                                :items="results.tasks"
                                :selected-index="selectedIndex"
                                :start-index="0"
                                view-all-route="tasks.index"
                                view-all-params="search"
                                :search-query="query"
                                @select="navigateTo"
                            >
                                <template #default="{ item, highlighted }">
                                    <div :class="['flex items-center gap-3 px-4 py-2.5 cursor-pointer', highlighted ? 'bg-primary-50' : 'hover:bg-gray-50']">
                                        <ClipboardDocumentListIcon class="h-5 w-5 shrink-0 text-gray-400" />
                                        <div class="min-w-0 flex-1">
                                            <p class="text-sm font-medium text-gray-900 truncate">{{ item.title }}</p>
                                            <p class="text-xs text-gray-500">{{ item.project?.name ?? 'No project' }}</p>
                                        </div>
                                        <Badge :variant="statusVariant(item.status)">{{ item.status_label ?? item.status }}</Badge>
                                    </div>
                                </template>
                            </SearchSection>

                            <SearchSection
                                v-if="results.projects?.length"
                                label="Projects"
                                type="projects"
                                :items="results.projects"
                                :selected-index="selectedIndex"
                                :start-index="tasksCount"
                                view-all-route="projects.index"
                                view-all-params="search"
                                :search-query="query"
                                @select="navigateTo"
                            >
                                <template #default="{ item, highlighted }">
                                    <div :class="['flex items-center gap-3 px-4 py-2.5 cursor-pointer', highlighted ? 'bg-primary-50' : 'hover:bg-gray-50']">
                                        <FolderIcon class="h-5 w-5 shrink-0 text-gray-400" />
                                        <div class="min-w-0 flex-1">
                                            <p class="text-sm font-medium text-gray-900">{{ item.name }}</p>
                                            <p class="text-xs text-gray-500">{{ item.status_label ?? item.status }}</p>
                                        </div>
                                        <Badge :variant="statusVariant(item.status)">{{ item.status_label ?? item.status }}</Badge>
                                    </div>
                                </template>
                            </SearchSection>

                            <SearchSection
                                v-if="results.users?.length"
                                label="Users"
                                type="users"
                                :items="results.users"
                                :selected-index="selectedIndex"
                                :start-index="tasksCount + projectsCount"
                                view-all-route="users.index"
                                view-all-params="search"
                                :search-query="query"
                                @select="navigateTo"
                            >
                                <template #default="{ item, highlighted }">
                                    <div :class="['flex items-center gap-3 px-4 py-2.5 cursor-pointer', highlighted ? 'bg-primary-50' : 'hover:bg-gray-50']">
                                        <div class="h-7 w-7 rounded-full bg-primary-100 flex items-center justify-center text-xs font-medium text-primary-700 shrink-0">
                                            {{ item.name?.charAt(0)?.toUpperCase() }}
                                        </div>
                                        <div>
                                            <p class="text-sm font-medium text-gray-900">{{ item.name }}</p>
                                            <p v-if="item.job_title" class="text-xs text-gray-500">{{ item.job_title }}</p>
                                        </div>
                                    </div>
                                </template>
                            </SearchSection>

                            <SearchSection
                                v-if="results.comments?.length"
                                label="Comments"
                                type="comments"
                                :items="results.comments"
                                :selected-index="selectedIndex"
                                :start-index="tasksCount + projectsCount + usersCount"
                                @select="navigateToComment"
                            >
                                <template #default="{ item, highlighted }">
                                    <div :class="['flex items-center gap-3 px-4 py-2.5 cursor-pointer', highlighted ? 'bg-primary-50' : 'hover:bg-gray-50']" @click="navigateToComment(item)">
                                        <ChatBubbleLeftIcon class="h-5 w-5 shrink-0 text-gray-400" />
                                        <div class="min-w-0 flex-1">
                                            <p class="text-sm text-gray-900 truncate">{{ item.body }}</p>
                                            <p class="text-xs text-gray-500">{{ item.author?.name }} on {{ item.task?.title }}</p>
                                        </div>
                                    </div>
                                </template>
                            </SearchSection>
                        </template>
                    </div>

                    <div v-else class="px-4 py-8 text-center text-sm text-gray-400">
                        <p>Search across tasks, projects, users, and comments</p>
                        <p class="mt-1">Use <kbd class="rounded border border-gray-200 px-1 text-xs">tag:name</kbd> to filter by tag</p>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { router } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import { MagnifyingGlassIcon, ClipboardDocumentListIcon, FolderIcon, ChatBubbleLeftIcon } from '@heroicons/vue/24/outline'
import Badge from '@/Components/Badge.vue'
import SearchSection from '@/Components/SearchSection.vue'
import axios from 'axios'

const open = ref(false)
const query = ref('')
const loading = ref(false)
const results = ref<Record<string, any[]>>({})
const selectedIndex = ref(-1)
const inputRef = ref<HTMLInputElement | null>(null)

let debounceTimer: ReturnType<typeof setTimeout> | null = null

const tasksCount = computed(() => results.value.tasks?.length ?? 0)
const projectsCount = computed(() => results.value.projects?.length ?? 0)
const usersCount = computed(() => results.value.users?.length ?? 0)
const totalCount = computed(() => tasksCount.value + projectsCount.value + usersCount.value + (results.value.comments?.length ?? 0))

const noResults = computed(() =>
    !loading.value && query.value.length > 0 && totalCount.value === 0
)

function close() {
    open.value = false
    query.value = ''
    results.value = {}
    selectedIndex.value = -1
}

function onInput() {
    loading.value = true
    selectedIndex.value = -1
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(doSearch, 250)
}

async function doSearch() {
    if (!query.value.trim()) {
        results.value = {}
        loading.value = false
        return
    }
    try {
        const res = await axios.get(route('api.search'), { params: { q: query.value, type: 'all' } })
        results.value = res.data ?? {}
    } catch {
        results.value = {}
    }
    loading.value = false
}

function nextResult() {
    if (totalCount.value === 0) return
    selectedIndex.value = selectedIndex.value >= totalCount.value - 1 ? 0 : selectedIndex.value + 1
}

function prevResult() {
    if (totalCount.value === 0) return
    selectedIndex.value = selectedIndex.value <= 0 ? totalCount.value - 1 : selectedIndex.value - 1
}

function selectCurrent() {
    if (selectedIndex.value < 0) {
        if (totalCount.value > 0) selectedIndex.value = 0
        else return
    }
    let idx = selectedIndex.value
    const taskLen = tasksCount.value
    if (idx < taskLen) {
        navigateTo(results.value.tasks[idx], 'tasks')
        return
    }
    idx -= taskLen
    const projLen = projectsCount.value
    if (idx < projLen) {
        navigateTo(results.value.projects[idx], 'projects')
        return
    }
    idx -= projLen
    const userLen = usersCount.value
    if (idx < userLen) {
        navigateTo(results.value.users[idx], 'users')
        return
    }
    navigateToComment(results.value.comments[idx - userLen])
}

function navigateTo(item: any, type: string) {
    if (!item) return
    const routeMap: Record<string, string> = {
        tasks: 'tasks.show',
        projects: 'projects.show',
        users: 'users.edit',
    }
    const routeName = routeMap[type]
    if (routeName) {
        close()
        router.visit(route(routeName, item.id))
    }
}

function navigateToComment(item: any) {
    if (!item?.task_id) return
    close()
    router.visit(route('tasks.show', item.task_id))
}

function statusVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
    const map: Record<string, any> = {
        done: 'success', approved: 'success', active: 'success',
        in_review: 'warning', in_progress: 'info',
        backlog: 'neutral', todo: 'neutral',
        cancelled: 'danger', blocked: 'danger', archived: 'neutral',
    }
    return map[status] ?? 'neutral'
}

function openHandler() {
    open.value = true
    nextTick(() => inputRef.value?.focus())
}

function onKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        openHandler()
    }
    if (e.key === 'Escape' && open.value) {
        close()
    }
    if (e.key === '/' && !open.value && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault()
        openHandler()
    }
}

onMounted(() => {
    window.addEventListener('keydown', onKeydown)
    window.addEventListener('opensearch', openHandler)
})

onUnmounted(() => {
    window.removeEventListener('keydown', onKeydown)
    window.removeEventListener('opensearch', openHandler)
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
    transition: opacity 0.15s ease;
}
.fade-enter-from, .fade-leave-to {
    opacity: 0;
}
</style>
