<template>
    <AppLayout>
        <div class="mx-auto max-w-4xl space-y-6">
            <div>
                <h2 class="text-2xl font-bold text-text-primary">Activity Feed</h2>
                <p class="mt-1 text-sm text-text-secondary">Recent activity across your projects</p>
            </div>

            <div class="card">
                <div v-if="activities.data.length === 0" class="p-6 text-center text-sm text-text-secondary">No activity yet.</div>
                <ul v-else class="divide-y divide-border">
                    <li v-for="activity in activities.data" :key="activity.id" class="flex items-start gap-4 px-6 py-4">
                        <div class="flex h-8 w-8 items-center justify-center rounded-full bg-page shrink-0">
                            <span class="text-xs font-medium text-text-secondary">{{ activity.causer?.name?.[0] ?? 'S' }}</span>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2">
                                <span class="text-sm font-medium text-text-primary">{{ activity.causer?.name ?? 'System' }}</span>
                                <span class="text-xs text-text-secondary">{{ dayjs(activity.created_at).fromNow() }}</span>
                            </div>
                            <p class="mt-0.5 text-sm text-text-secondary">
                                {{ activity.activity_label }}
                            </p>
                            <div v-if="activity.properties?.changes" class="mt-1 text-xs text-text-secondary">
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
                                      class="text-xs text-brand-primary-500 hover:text-brand-primary-600">
                                    {{ activity.subject.title }}
                                </Link>
                                <span v-else class="text-xs text-text-secondary">
                                    {{ subjectTypeLabel(activity) }}
                                </span>
                            </div>
                        </div>
                        <span class="text-[10px] text-text-secondary capitalize shrink-0">{{ activity.log_name }}</span>
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