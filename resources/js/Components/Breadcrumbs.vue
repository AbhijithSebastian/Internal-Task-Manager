<template>
    <div v-if="items.length > 0" class="flex items-center gap-2 text-sm text-text-secondary mb-6">
        <template v-for="(item, i) in items" :key="i">
            <Link
                v-if="item.route"
                :href="route(item.route, item.params || {})"
                :class="i === items.length - 1 ? 'text-text-primary font-medium' : 'hover:text-text-primary transition-colors'"
            >
                {{ item.label }}
            </Link>
            <span v-else :class="i === items.length - 1 ? 'text-text-primary font-medium' : ''">
                {{ item.label }}
            </span>
            <ChevronRightIcon v-if="i < items.length - 1" class="h-3.5 w-3.5 text-text-secondary/50" />
        </template>
    </div>
</template>

<script setup lang="ts">
import { Link } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import { ChevronRightIcon } from '@heroicons/vue/24/outline'

interface BreadcrumbItem {
    label: string
    route?: string
    params?: Record<string, any>
}

defineProps<{
    items: BreadcrumbItem[]
}>()
</script>
