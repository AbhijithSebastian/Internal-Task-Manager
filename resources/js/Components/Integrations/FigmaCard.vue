<template>
    <div>
        <div v-if="integration.display?.embed_url" class="space-y-2">
            <iframe
                :src="integration.display.embed_url"
                class="w-full h-64 rounded-lg border border-gray-200"
                allowfullscreen
            />
            <a
                :href="integration.display.file_url"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-500"
            >
                Open in Figma →
            </a>
        </div>

        <div v-else class="text-xs text-gray-500">
            File key: {{ integration.display?.file_key ?? integration.config.file_key ?? '—' }}
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    integration: any
}>()
</script>
