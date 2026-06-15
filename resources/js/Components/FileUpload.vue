<template>
    <div>
        <div
            class="relative flex cursor-pointer items-center justify-center rounded-card border-2 border-dashed px-6 py-4 text-sm transition-colors"
            :class="dragOver ? 'border-brand-primary-500 bg-brand-primary-50' : 'border-border hover:border-border bg-page'"
            @dragover.prevent="dragOver = true"
            @dragleave.prevent="dragOver = false"
            @drop.prevent="onDrop"
            @click="trigger"
        >
            <input ref="fileInput" type="file" class="hidden" :accept="accept" @change="onFileSelected">
            <div class="w-full text-center">
                <svg v-if="!uploading" class="mx-auto h-8 w-8 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <svg v-else class="mx-auto h-8 w-8 animate-spin text-brand-primary-500" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p class="mt-1 text-sm text-text-secondary">
                    <span class="font-medium text-brand-primary-500">Click to upload</span>
                    or drag and drop
                </p>
                <p class="mt-0.5 text-xs text-text-secondary">Images, PDF, Documents, ZIP — up to 50MB</p>
                <div v-if="uploading" class="mt-3">
                    <div class="h-2 w-full rounded-full bg-page">
                        <div class="h-2 rounded-full bg-brand-primary-500 transition-all duration-300" :style="{ width: uploadProgress + '%' }"></div>
                    </div>
                    <p class="mt-1 text-xs text-text-secondary">{{ uploadProgress }}% uploaded</p>
                </div>
            </div>
        </div>
        <p v-if="error" class="mt-1 text-xs text-danger">{{ error }}</p>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import axios from 'axios'

const props = defineProps<{
    uploadRoute: string
    accept?: string
}>()

const emit = defineEmits<{
    success: []
}>()

const dragOver = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const error = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

function trigger() {
    fileInput.value?.click()
}

function onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement
    if (input.files?.length) uploadFile(input.files[0])
}

function onDrop(e: DragEvent) {
    dragOver.value = false
    if (e.dataTransfer?.files.length) uploadFile(e.dataTransfer.files[0])
}

function uploadFile(file: File) {
    error.value = ''
    uploading.value = true
    uploadProgress.value = 0

    const formData = new FormData()
    formData.append('file', file)

    axios.post(props.uploadRoute, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
                uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            }
        },
    }).then(() => {
        uploading.value = false
        uploadProgress.value = 0
        emit('success')
        if (fileInput.value) fileInput.value.value = ''
    }).catch((err) => {
        uploading.value = false
        uploadProgress.value = 0
        error.value = err.response?.data?.message || err.response?.data?.errors?.file?.[0] || 'Upload failed'
    })
}
</script>
