<template>
    <span
        :class="[
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
            variantClass,
        ]"
    >
        <slot />
    </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand'
}>()

const variantClass = computed(() => {
    const map: Record<string, string> = {
        success: 'bg-success-50 text-success',
        warning: 'bg-warning-50 text-warning',
        danger: 'bg-danger-50 text-danger',
        info: 'bg-brand-primary-50 text-brand-primary-600',
        brand: 'bg-brand-primary-500 text-white',
        neutral: 'bg-gray-100 text-text-secondary',
    }
    return map[props.variant || 'neutral']
})
</script>
