<template>
    <span :class="classes">
        <slot />
    </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
}>()

const classes = computed(() => {
    const map = {
        success: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        danger: 'bg-red-100 text-red-800',
        info: 'bg-blue-100 text-blue-800',
        neutral: 'bg-gray-100 text-gray-800',
    }

    return `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[props.variant ?? 'neutral']}`
})
</script>
