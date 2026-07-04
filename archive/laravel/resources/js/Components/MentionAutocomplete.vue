<template>
    <div v-if="visible" ref="dropdownRef" class="absolute z-50 mt-1 w-64 rounded-card border border-border bg-white shadow-dropdown" :style="{ top: dropdownTop + 'px' }">
        <div class="px-3 py-2 text-xs font-medium text-text-secondary uppercase tracking-wider border-b border-border">Team Members</div>
        <div v-if="filteredUsers.length === 0" class="px-3 py-3 text-sm text-text-secondary text-center">No matching members</div>
        <button
            v-for="(user, idx) in filteredUsers"
            :key="user.id"
            type="button"
            class="flex w-full items-center gap-2 px-3 py-2 text-sm text-left hover:bg-brand-primary-50 transition-colors"
            :class="{ 'bg-brand-primary-50': idx === selectedIndex }"
            @click="selectUser(user)"
            @mouseenter="selectedIndex = idx"
        >
            <img :src="user.avatar" alt="" class="h-6 w-6 rounded-full">
            <span class="font-medium text-text-primary">{{ user.name }}</span>
            <span v-if="user.job_title" class="text-xs text-text-secondary ml-auto">{{ user.job_title }}</span>
        </button>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps<{
    members: { id: number; name: string; avatar: string; job_title?: string }[]
    query: string
    inputElement: HTMLInputElement | HTMLTextAreaElement | null
    visible: boolean
}>()

const emit = defineEmits<{
    select: [user: { id: number; name: string }]
}>()

const selectedIndex = ref(0)
const dropdownTop = ref(0)
const dropdownRef = ref<HTMLElement | null>(null)

const filteredUsers = computed(() => {
    if (!props.query) return props.members.slice(0, 8)
    const q = props.query.toLowerCase()
    return props.members
        .filter(u => u.name.toLowerCase().includes(q))
        .slice(0, 8)
})

watch(() => props.query, () => {
    selectedIndex.value = 0
})

watch(() => props.visible, (v) => {
    if (v && props.inputElement) {
        const rect = props.inputElement.getBoundingClientRect()
        dropdownTop.value = rect.height + 4
        nextTick(() => {
            dropdownRef.value?.querySelector('button')?.focus()
        })
    }
})

function selectUser(user: { id: number; name: string }) {
    emit('select', user)
}

function nextResult() {
    if (filteredUsers.value.length === 0) return
    selectedIndex.value = selectedIndex.value >= filteredUsers.value.length - 1 ? 0 : selectedIndex.value + 1
}

function prevResult() {
    if (filteredUsers.value.length === 0) return
    selectedIndex.value = selectedIndex.value <= 0 ? filteredUsers.value.length - 1 : selectedIndex.value - 1
}

function selectHighlighted(): { id: number; name: string } | null {
    if (filteredUsers.value.length === 0) return null
    return filteredUsers.value[selectedIndex.value] ?? null
}

defineExpose({ nextResult, prevResult, selectHighlighted })
</script>
