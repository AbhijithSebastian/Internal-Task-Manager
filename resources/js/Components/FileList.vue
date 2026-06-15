<template>
    <div v-if="files.length === 0" class="text-sm text-text-secondary">No files attached.</div>
    <ul v-else class="divide-y divide-border">
        <li v-for="file in files" :key="file.id" class="flex items-center gap-3 py-2">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-page overflow-hidden">
                <img v-if="file.thumbnail_url" :src="file.thumbnail_url" :alt="file.name" class="h-10 w-10 object-cover">
                <span v-else class="text-lg text-text-secondary">{{ fileIcon(file.mime_type) }}</span>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-text-primary truncate">{{ file.name }}</p>
                <p class="text-xs text-text-secondary">{{ formatSize(file.size) }} &middot; {{ file.custom_properties?.uploaded_by_name ?? 'Unknown' }}</p>
            </div>
            <div class="flex items-center gap-1 shrink-0">
                <a :href="file.url" target="_blank" class="btn-sm text-xs text-text-secondary hover:text-brand-primary-500" title="Download">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                </a>
                <button v-if="canDelete" class="btn-sm text-xs text-danger hover:text-danger" title="Delete" @click="confirmDelete(file)">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        </li>
    </ul>
    <Modal :open="deleteModal.open" @close="deleteModal.open = false">
        <template #title>Delete File</template>
        <p class="text-sm text-text-secondary">Delete <strong>{{ deleteModal.file?.name }}</strong>? This cannot be undone.</p>
        <div class="mt-6 flex justify-end gap-3">
            <button class="btn-secondary" @click="deleteModal.open = false">Cancel</button>
            <button class="btn-danger" :disabled="deleteModal.processing" @click="doDelete">Delete</button>
        </div>
    </Modal>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { router } from '@inertiajs/vue3'
import Modal from '@/Components/Modal.vue'

const props = defineProps<{
    files: any[]
    deleteRoute: (file: any) => string
    canDelete?: boolean
}>()

const emit = defineEmits<{
    deleted: []
}>()

const deleteModal = reactive({ open: false, processing: false, file: null as any })

function fileIcon(mime: string): string {
    if (mime.startsWith('image/')) return '🖼'
    if (mime.includes('pdf')) return '📄'
    if (mime.includes('word') || mime.includes('document')) return '📝'
    if (mime.includes('sheet') || mime.includes('excel') || mime.includes('csv')) return '📊'
    if (mime.includes('presentation') || mime.includes('powerpoint')) return '📽'
    if (mime.includes('zip') || mime.includes('rar') || mime.includes('gzip') || mime.includes('7z') || mime.includes('tar')) return '🗜'
    if (mime.startsWith('text/')) return '📃'
    return '📎'
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function confirmDelete(file: any) {
    deleteModal.file = file
    deleteModal.open = true
}

function doDelete() {
    if (!deleteModal.file) return
    deleteModal.processing = true
    router.delete(props.deleteRoute(deleteModal.file), {
        preserveScroll: true,
        onSuccess: () => {
            deleteModal.open = false
            deleteModal.processing = false
            deleteModal.file = null
            emit('deleted')
        },
        onFinish: () => { deleteModal.processing = false },
    })
}
</script>
