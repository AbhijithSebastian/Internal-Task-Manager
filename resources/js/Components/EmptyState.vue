<template>
    <div class="flex flex-col items-center justify-center py-16 px-8 text-center">
        <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
            <component :is="icon" class="h-6 w-6 text-text-secondary" />
        </div>
        <h3 class="text-sm font-semibold text-text-primary">{{ title }}</h3>
        <p v-if="description" class="mt-1 text-sm text-text-secondary">{{ description }}</p>
        <slot />
    </div>
</template>

<script setup lang="ts">
import { defineComponent } from 'vue'
import { InboxIcon } from '@heroicons/vue/24/outline'

defineProps<{
    title: string
    description?: string
    icon?: any
}>()
</script>
