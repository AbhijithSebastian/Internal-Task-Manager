<template>
    <AppLayout>
        <div class="mx-auto max-w-4xl space-y-6">
            <div>
                <h2 class="text-2xl font-bold text-gray-900">Activity Feed</h2>
                <p class="mt-1 text-sm text-gray-600">Recent activity across your projects</p>
            </div>

            <div class="card">
                <div v-if="activities.data.length === 0" class="p-6 text-center text-sm text-gray-500">No activity yet.</div>
                <ul v-else class="divide-y divide-gray-200">
                    <li v-for="activity in activities.data" :key="activity.id" class="flex items-start gap-4 px-6 py-4">
                        <div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 shrink-0">
                            <span class="text-xs font-medium text-gray-600">{{ activity.causer?.name?.[0] ?? 'S' }}</span>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2">
                                <span class="text-sm font-medium text-gray-900">{{ activity.causer?.name ?? 'System' }}</span>
                                <span class="text-xs text-gray-500">{{ dayjs(activity.created_at).fromNow() }}</span>
                            </div>
                            <p class="mt-0.5 text-sm text-gray-600">
                                {{ activity.activity_label }}
                            </p>
                            <div v-if="activity.properties?.changes" class="mt-1 text-xs text-gray-400">
                                <template v-if="activity.properties.changes.title">
                                    "{{ activity.properties.changes.title.new ?? activity.properties.changes.title }}"
                                </template>
                                <template v-else-if="activity.properties.new">
                                    {{ activity.properties.new.status ?? '' }}
                                </template>
                            </div>
                            <div v-if="activity.subject" class="mt-1">
                                <Link v-if="isTaskActivity(activity) && activity.subject"
                                      :href="route('tasks.show', activity.subject.id)"
                                      class="text-xs text-primary-600 hover:text-primary-500">
                                    {{ activity.subject.title }}
                                </Link>
                                <span v-else class="text-xs text-gray-400">
                                    {{ subjectTypeLabel(activity) }}
                                </span>
                            </div>
                        </div>
                        <span class="text-[10px] text-gray-400 capitalize shrink-0">{{ activity.log_name }}</span>
                    </li>
                </ul>
                <Pagination :pagination="activities" />
            </div>
        </div>
    </AppLayout>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { Link } from '@inertiajs/vue3'
import AppLayout from '@/Layouts/AppLayout.vue'
import Pagination from '@/Components/Pagination.vue'

dayjs.extend(relativeTime)

const props = defineProps<{ activities: any; filters: Record<string, any>; task?: any }>()

function isTaskActivity(activity: any): boolean {
    return activity.subject_type?.includes('Task')
}

function subjectTypeLabel(activity: any): string {
    if (!activity.subject_type) return ''
    const parts = activity.subject_type.split('\\')
    return parts[parts.length - 1] ?? ''
}
</script>
