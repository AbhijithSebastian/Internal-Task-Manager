<template>
    <div>
        <div v-if="integration.display?.error" class="text-sm text-yellow-600 bg-yellow-50 rounded p-2 mb-2">
            {{ integration.display.error }}
        </div>

        <div v-if="integration.display?.repo_data" class="space-y-2">
            <div class="flex items-center gap-3 text-xs text-gray-600">
                <span v-if="integration.display.repo_data.language" class="px-1.5 py-0.5 rounded bg-gray-100 font-medium">
                    {{ integration.display.repo_data.language }}
                </span>
                <span>★ {{ integration.display.repo_data.stars }}</span>
                <span>⑂ {{ integration.display.repo_data.forks }}</span>
                <span>! {{ integration.display.repo_data.open_issues }}</span>
            </div>

            <div v-if="integration.display.repo_data.description" class="text-xs text-gray-500">
                {{ integration.display.repo_data.description }}
            </div>

            <div v-if="integration.display.commits?.length" class="space-y-1 mt-2">
                <p class="text-xs font-medium text-gray-700">Recent Commits</p>
                <a
                    v-for="commit in integration.display.commits"
                    :key="commit.sha"
                    :href="commit.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center gap-2 text-xs text-gray-600 hover:text-primary-600 py-0.5"
                >
                    <span class="font-mono text-[10px] text-gray-400 shrink-0">{{ commit.sha }}</span>
                    <span class="truncate">{{ commit.message }}</span>
                </a>
            </div>

            <a
                :href="integration.display.repo_data.url"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-500 mt-1"
            >
                View Repository →
            </a>
        </div>

        <div v-if="!integration.display?.repo_data && !integration.display?.error" class="text-xs text-gray-400">
            Repository: {{ integration.display?.repo ?? integration.config.repo ?? '—' }}
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    integration: any
}>()
</script>
