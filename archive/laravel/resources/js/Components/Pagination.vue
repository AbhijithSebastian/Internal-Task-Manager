<template>
    <div v-if="p.last_page > 1" class="flex items-center justify-between gap-4 pt-4">
        <p class="text-sm text-text-secondary">
            Showing {{ p.from }}–{{ p.to }} of {{ p.total }}
        </p>

        <div class="flex items-center gap-1">
            <Link
                v-if="p.current_page > 1"
                :href="p.path + '?page=' + (p.current_page - 1)"
                class="btn-ghost btn-sm"
            >
                <ChevronLeftIcon class="h-4 w-4" />
                Previous
            </Link>

            <template v-for="(link, i) in p.links" :key="i">
                <Link
                    v-if="link.url && !isNaN(Number(link.label))"
                    :href="link.url"
                    :class="[
                        'flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors min-w-[32px]',
                        link.active
                            ? 'bg-brand-primary-50 text-brand-primary-600'
                            : 'text-text-secondary hover:bg-gray-100 hover:text-text-primary',
                    ]"
                    v-html="link.label"
                />
            </template>

            <Link
                v-if="p.current_page < p.last_page"
                :href="p.path + '?page=' + (p.current_page + 1)"
                class="btn-ghost btn-sm"
            >
                Next
                <ChevronRightIcon class="h-4 w-4" />
            </Link>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Link } from '@inertiajs/vue3'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
    meta: { type: Object, default: null },
    pagination: { type: Object, default: null },
})

const p = computed(() => props.meta || props.pagination || { last_page: 0, current_page: 0, from: 0, to: 0, total: 0, path: '', links: [] })
</script>
