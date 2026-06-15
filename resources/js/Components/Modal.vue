<template>
    <Teleport to="body">
        <Transition name="fade">
            <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center">
                <div class="fixed inset-0 bg-black/40 backdrop-blur-sm" @click="close" />

                <div class="relative w-full max-w-lg rounded-card bg-white shadow-modal ring-1 ring-black/5 animate-slide-up">
                    <div class="flex items-center justify-between border-b border-border px-6 py-4">
                        <h3 class="text-lg font-semibold text-text-primary">{{ title }}</h3>
                        <button class="rounded-lg p-1 text-text-secondary hover:bg-gray-100 hover:text-text-primary transition-colors" @click="close">
                            <XMarkIcon class="h-5 w-5" />
                        </button>
                    </div>

                    <div class="px-6 py-5">
                        <slot />
                    </div>

                    <div v-if="$slots.footer" class="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
                        <slot name="footer" />
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/24/outline'

defineProps<{
    open: boolean
    title: string
}>()

const emit = defineEmits<{ close: [] }>()

function close() {
    emit('close')
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
