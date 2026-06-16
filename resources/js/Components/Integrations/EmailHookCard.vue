<template>
    <div class="space-y-2">
        <div>
            <p class="text-xs text-text-secondary mb-1">Inbound Email Address</p>
            <div class="flex items-center gap-2">
                <code class="text-sm bg-page px-2 py-1 rounded flex-1 truncate">
                    {{ integration.display?.inbound_email ?? integration.config.inbound_email ?? '—' }}
                </code>
                <button
                    class="text-xs text-brand-primary-500 hover:text-brand-primary-600 shrink-0"
                    @click="copyEmail"
                >
                    {{ copied ? 'Copied!' : 'Copy' }}
                </button>
            </div>
        </div>

        <div v-if="integration.config.forward_to" class="text-xs text-text-secondary">
            Forwarding to: {{ integration.config.forward_to }}
        </div>

        <div class="flex items-center gap-2 text-xs text-text-secondary">
            <span>Auto-create tasks:</span>
            <Badge :variant="integration.config.create_tasks ? 'success' : 'neutral'">
                {{ integration.config.create_tasks ? 'Yes' : 'No' }}
            </Badge>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Badge from '@/Components/Badge.vue'

const props = defineProps<{
    integration: any
}>()

const copied = ref(false)

function copyEmail() {
    const email = props.integration.display?.inbound_email ?? props.integration.config.inbound_email ?? ''
    if (!email) return

    navigator.clipboard.writeText(email).then(() => {
        copied.value = true
        setTimeout(() => { copied.value = false }, 2000)
    })
}
</script>
