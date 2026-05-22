<template>
    <TransitionRoot as="template" :show="open">
        <Dialog class="relative z-50" @close="emit('close')">
            <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0" enter-to="opacity-100" leave="ease-in duration-200" leave-from="opacity-100" leave-to="opacity-0">
                <div class="fixed inset-0 bg-gray-500/75 transition-opacity" />
            </TransitionChild>
            <div class="fixed inset-0 z-50 overflow-y-auto">
                <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                    <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enter-to="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leave-from="opacity-100 translate-y-0 sm:scale-100" leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
                        <DialogPanel class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:p-6">
                            <div class="sm:flex sm:items-start">
                                <div class="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10" :class="iconBg">
                                    <component :is="icon" class="h-6 w-6" :class="iconColor" />
                                </div>
                                <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                                    <DialogTitle as="h3" class="text-lg font-semibold leading-6 text-gray-900">
                                        {{ title }}
                                    </DialogTitle>
                                    <div class="mt-2">
                                        <p class="text-sm text-gray-500">{{ message }}</p>
                                    </div>
                                </div>
                            </div>
                            <div class="mt-6 flex items-center justify-end gap-3">
                                <button type="button" class="btn-secondary" @click="emit('close')">Cancel</button>
                                <button type="button" :class="confirmClass" :disabled="processing" @click="emit('confirm')">
                                    <svg v-if="processing" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    {{ confirmText }}
                                </button>
                            </div>
                        </DialogPanel>
                    </TransitionChild>
                </div>
            </div>
        </Dialog>
    </TransitionRoot>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
    open: boolean
    title: string
    message: string
    confirmText?: string
    variant?: 'danger' | 'warning' | 'info'
    processing?: boolean
}>()

const emit = defineEmits<{ close: []; confirm: [] }>()

const icon = computed(() => {
    if (props.variant === 'danger') return ExclamationTriangleIcon
    return InformationCircleIcon
})

const iconBg = computed(() => {
    if (props.variant === 'danger') return 'bg-red-100'
    if (props.variant === 'warning') return 'bg-yellow-100'
    return 'bg-blue-100'
})

const iconColor = computed(() => {
    if (props.variant === 'danger') return 'text-red-600'
    if (props.variant === 'warning') return 'text-yellow-600'
    return 'text-blue-600'
})

const confirmClass = computed(() => {
    if (props.variant === 'danger') return 'btn-danger'
    return 'btn-primary'
})
</script>
