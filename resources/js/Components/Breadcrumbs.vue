<template>
    <nav class="flex items-center gap-1 text-sm text-gray-500">
        <Link v-if="back && safeRoute(back)" :href="safeRoute(back)!" class="flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeftIcon class="h-4 w-4" />
            <span class="sr-only">Back</span>
        </Link>
        <template v-for="(crumb, i) in items" :key="i">
            <ChevronRightIcon v-if="i > 0 || back" class="h-4 w-4 shrink-0 text-gray-300" />
            <Link v-if="crumb.route && i < items.length - 1 && safeRoute(crumb)" :href="safeRoute(crumb)!" class="hover:text-gray-700 transition-colors">
                {{ crumb.label }}
            </Link>
            <span v-else class="text-gray-900 font-medium">{{ crumb.label }}</span>
        </template>
    </nav>
</template>

<script setup lang="ts">
import { Link } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import { ArrowLeftIcon, ChevronRightIcon } from '@heroicons/vue/20/solid'

interface Crumb {
    label: string
    route?: string
    params?: Record<string, any>
}

defineProps<{
    items: Crumb[]
    back?: { route: string; params?: Record<string, any> }
}>()

function safeRoute(item: { route?: string; params?: Record<string, any> } | undefined): string | null {
    if (!item || !item.route) return null
    try {
        // Filter out params with undefined/null values to avoid Ziggy errors
        const cleanParams = item.params
            ? Object.fromEntries(Object.entries(item.params).filter(([, v]) => v != null))
            : undefined
        // If params were specified but all filtered out, skip route generation
        if (item.params && Object.keys(item.params).length > 0 && (!cleanParams || Object.keys(cleanParams).length === 0)) {
            return null
        }
        return route(item.route, cleanParams ?? undefined)
    } catch {
        return null
    }
}
</script>
