<template>
    <div v-if="pagination.total > pagination.per_page" class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div class="flex flex-1 justify-between sm:hidden">
            <Link v-if="pagination.prev_page_url" :href="pagination.prev_page_url" class="btn-secondary btn-sm">Previous</Link>
            <Link v-if="pagination.next_page_url" :href="pagination.next_page_url" class="btn-secondary btn-sm">Next</Link>
        </div>
        <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
                <p class="text-sm text-gray-700">
                    Showing
                    <span class="font-medium">{{ pagination.from }}</span>
                    to
                    <span class="font-medium">{{ pagination.to }}</span>
                    of
                    <span class="font-medium">{{ pagination.total }}</span>
                    results
                </p>
            </div>
            <div>
                <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm">
                    <Link v-if="pagination.prev_page_url" :href="pagination.prev_page_url" class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                        <ChevronLeftIcon class="h-5 w-5" />
                    </Link>
                    <template v-for="(link, index) in pagination.links" :key="index">
                        <span v-if="link.url === null" class="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300">{{ link.label }}</span>
                        <Link v-else :href="link.url" :class="[link.active ? 'bg-primary-600 text-white' : 'text-gray-900 hover:bg-gray-50', 'relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300']">{{ link.label }}</Link>
                    </template>
                    <Link v-if="pagination.next_page_url" :href="pagination.next_page_url" class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                        <ChevronRightIcon class="h-5 w-5" />
                    </Link>
                </nav>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Link } from '@inertiajs/vue3'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/20/solid'

defineProps<{ pagination: any }>()
</script>
