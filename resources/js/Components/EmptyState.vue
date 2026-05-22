<template>
    <div class="flex flex-col items-center justify-center py-12 text-center">
        <component :is="iconComponent" v-if="iconComponent" class="h-12 w-12 text-gray-300 mb-4" />
        <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
        <p v-if="message" class="mt-1 max-w-sm text-sm text-gray-500">{{ message }}</p>
        <slot />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ClipboardDocumentListIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
    title: string
    message?: string
    icon?: any
}>()

const iconComponent = computed(() => props.icon ?? ClipboardDocumentListIcon)
</script>
