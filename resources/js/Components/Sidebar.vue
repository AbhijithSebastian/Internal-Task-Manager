<template>
    <TransitionRoot as="template" :show="sidebarOpen">
        <Dialog class="relative z-50 lg:hidden" @close="emit('close')">
            <TransitionChild as="template" enter="transition-opacity ease-linear duration-300" enter-from="opacity-0" enter-to="opacity-100" leave="transition-opacity ease-linear duration-300" leave-from="opacity-100" leave-to="opacity-0">
                <div class="fixed inset-0 bg-gray-900/80" />
            </TransitionChild>
            <div class="fixed inset-0 flex">
                <TransitionChild as="template" enter="transition ease-in-out duration-300 transform" enter-from="-translate-x-full" enter-to="translate-x-0" leave="transition ease-in-out duration-300 transform" leave-from="translate-x-0" leave-to="-translate-x-full">
                    <DialogPanel class="relative mr-16 flex w-full max-w-xs flex-1">
                        <SidebarContent />
                    </DialogPanel>
                </TransitionChild>
            </div>
        </Dialog>
    </TransitionRoot>
    <aside class="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <SidebarContent />
    </aside>
</template>

<script setup lang="ts">
import { Dialog, DialogPanel, TransitionChild, TransitionRoot } from '@headlessui/vue'
import SidebarContent from './SidebarContent.vue'

defineProps<{ sidebarOpen: boolean }>()
const emit = defineEmits<{ close: [] }>()
</script>
