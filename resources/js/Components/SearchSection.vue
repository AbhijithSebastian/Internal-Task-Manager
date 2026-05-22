<template>
    <div class="border-b border-gray-100 last:border-b-0">
        <div class="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 bg-gray-50/50">
            {{ label }}
        </div>
        <div v-for="(item, idx) in items" :key="getKey(item, idx)" @click="emit('select', item, type)">
            <slot :item="item" :highlighted="startIndex + idx === selectedIndex" />
        </div>
        <a v-if="viewAllRoute" :href="viewAllHref" class="block px-4 py-2 text-xs text-primary-600 hover:text-primary-500 hover:bg-primary-50/50 text-center font-medium">
            View all {{ label.toLowerCase() }} &rarr;
        </a>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { route } from 'ziggy-js'

const props = defineProps<{
    label: string
    type: string
    items: any[]
    selectedIndex: number
    startIndex: number
    viewAllRoute?: string
    viewAllParams?: string
    searchQuery?: string
}>()

const emit = defineEmits<{ select: [item: any, type: string] }>()

const viewAllHref = computed(() => {
    if (!props.viewAllRoute) return '#'
    try {
        return route(props.viewAllRoute, { [props.viewAllParams ?? 'search']: props.searchQuery ?? '' })
    } catch {
        return '#'
    }
})

function getKey(item: any, idx: number): string | number {
    return item?.id ?? idx
}
</script>
