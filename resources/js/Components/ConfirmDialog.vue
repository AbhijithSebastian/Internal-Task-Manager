<template>
    <Teleport to="body">
        <Transition name="fade">
            <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center">
                <div class="fixed inset-0 bg-black/40 backdrop-blur-sm" @click="close" />

                <div class="relative w-full max-w-lg rounded-card bg-white shadow-modal ring-1 ring-black/5 animate-slide-up">
                    <div class="px-6 py-5">
                        <div class="flex items-start gap-4">
                            <div v-if="type === 'danger'" class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger-50">
                                <ExclamationTriangleIcon class="h-5 w-5 text-danger" />
                            </div>
                            <div v-else class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-primary-50">
                                <InformationCircleIcon class="h-5 w-5 text-brand-primary-500" />
                            </div>
                            <div class="min-w-0 flex-1">
                                <h3 class="text-lg font-semibold text-text-primary">{{ title }}</h3>
                                <p v-if="message" class="mt-1 text-sm text-text-secondary">{{ message }}</p>
                            </div>
                        </div>
                    </div>

                    <div v-if="$slots.default" class="px-6 pb-5">
                        <slot />
                    </div>

                    <div class="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
                        <button
                            type="button"
                            class="btn-secondary btn-sm"
                            @click="close"
                        >
                            {{ cancelText }}
                        </button>
                        <button
                            type="button"
                            :class="[
                                type === 'danger' ? 'btn-danger btn-sm' : 'btn-primary btn-sm',
                            ]"
                            @click="confirm"
                        >
                            {{ confirmText }}
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/vue/24/outline'

defineProps<{
    open: boolean
    title: string
    message?: string
    confirmText?: string
    cancelText?: string
    type?: 'default' | 'danger'
}>()

const emit = defineEmits<{
    confirm: []
    close: []
}>()

function close() {
    emit('close')
}

function confirm() {
    emit('confirm')
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
