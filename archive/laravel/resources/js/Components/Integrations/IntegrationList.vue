<template>
    <div class="card">
        <div class="card-header flex items-center justify-between">
            <h3 class="text-base font-semibold text-text-primary">Integrations</h3>
            <button v-if="canAdd" class="btn-secondary btn-sm" @click="showAddModal = true">
                <PlusIcon class="h-4 w-4" />
                Add Integration
            </button>
        </div>
        <div class="card-body space-y-4">
            <p v-if="integrations.length === 0" class="text-sm text-text-secondary text-center py-4">
                No integrations configured yet.
            </p>
            <div v-for="integration in integrations" :key="integration.id" class="border border-border rounded-card p-4">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2">
                        <component :is="typeIcon(integration.type)" class="h-5 w-5 text-text-secondary" />
                        <span class="text-sm font-medium text-text-primary">{{ typeName(integration.type) }}</span>
                        <Badge v-if="!integration.is_active" variant="neutral">Disabled</Badge>
                    </div>
                    <div class="flex items-center gap-2">
                        <button class="text-xs text-text-secondary hover:text-text-primary" @click="toggleIntegration(integration.id)">
                            {{ integration.is_active ? 'Disable' : 'Enable' }}
                        </button>
                        <button class="text-xs text-danger hover:text-danger" @click="confirmRemove(integration.id)">
                            Remove
                        </button>
                    </div>
                </div>

                <GitHubCard v-if="integration.type === 'github'" :integration="integration" />
                <FigmaCard v-if="integration.type === 'figma'" :integration="integration" />
                <EmailHookCard v-if="integration.type === 'email_hook'" :integration="integration" />

                <p v-if="integration.last_synced_at" class="mt-2 text-xs text-text-secondary">
                    Last synced {{ integration.last_synced_at }}
                </p>
            </div>
        </div>

        <Modal :open="showAddModal" @close="showAddModal = false">
            <template #title>Add Integration</template>
            <div class="space-y-4">
                <p class="text-sm text-text-secondary">Choose an integration type to add to this project.</p>
                <div class="space-y-2">
                    <button
                        v-for="(info, type) in availableTypes"
                        :key="type"
                        class="w-full text-left p-3 rounded-card border border-border hover:border-brand-primary-300 hover:bg-brand-primary-50 transition-colors"
                        :class="{ 'border-brand-primary-500 bg-brand-primary-50': selectedType === type }"
                        @click="selectedType = type"
                    >
                        <div class="flex items-center gap-3">
                            <component :is="typeIcon(type)" class="h-5 w-5 text-text-secondary shrink-0" />
                            <div>
                                <p class="text-sm font-medium text-text-primary">{{ info.label }}</p>
                                <p class="text-xs text-text-secondary">{{ info.description }}</p>
                            </div>
                        </div>
                    </button>
                </div>

                <template v-if="selectedType">
                    <hr class="border-border">
                    <IntegrationForm
                        :type="selectedType"
                        :config="formConfig"
                        @update:config="formConfig = $event"
                    />
                </template>
            </div>

            <template #footer>
                <div class="flex justify-end gap-3">
                    <button class="btn-secondary" @click="showAddModal = false">Cancel</button>
                    <button class="btn-primary" :disabled="!selectedType || formProcessing" @click="saveIntegration">
                        Add Integration
                    </button>
                </div>
            </template>
        </Modal>

        <Modal :open="removeModal.open" @close="removeModal.open = false">
            <template #title>Remove Integration</template>
            <p class="text-sm text-text-secondary">Are you sure you want to remove this integration?</p>
            <template #footer>
                <div class="flex justify-end gap-3">
                    <button class="btn-secondary" @click="removeModal.open = false">Cancel</button>
                    <button class="btn-danger" :disabled="removeModal.processing" @click="doRemove">Remove</button>
                </div>
            </template>
        </Modal>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { router } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import Modal from '@/Components/Modal.vue'
import GitHubCard from './GitHubCard.vue'
import FigmaCard from './FigmaCard.vue'
import EmailHookCard from './EmailHookCard.vue'
import IntegrationForm from './IntegrationForm.vue'
import { PlusIcon, CodeBracketIcon, PaintBrushIcon, EnvelopeIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
    projectId: number
    integrations: any[]
    canAdd: boolean
    availableTypes: Record<string, any>
}>()

const showAddModal = ref(false)
const selectedType = ref<string | null>(null)
const formConfig = ref<Record<string, any>>({})
const formProcessing = ref(false)

const removeModal = ref({ open: false, processing: false, id: null as number | null })

const typeIcon = (type: string) => {
    const map: Record<string, any> = {
        github: CodeBracketIcon,
        figma: PaintBrushIcon,
        email_hook: EnvelopeIcon,
    }
    return map[type] ?? CodeBracketIcon
}

const typeName = (type: string) => {
    return props.availableTypes[type]?.label ?? type
}

function toggleIntegration(id: number) {
    router.post(route('integrations.toggle', id), {}, {
        preserveScroll: true,
        onSuccess: () => emitRefresh(),
    })
}

function confirmRemove(id: number) {
    removeModal.value = { open: true, processing: false, id }
}

function doRemove() {
    if (!removeModal.value.id) return
    removeModal.value.processing = true
    router.delete(route('integrations.destroy', removeModal.value.id), {
        preserveScroll: true,
        onSuccess: () => {
            removeModal.value.open = false
            emitRefresh()
        },
        onFinish: () => { removeModal.value.processing = false },
    })
}

function saveIntegration() {
    if (!selectedType.value) return
    formProcessing.value = true
    router.post(route('projects.integrations.store', props.projectId), {
        type: selectedType.value,
        config: formConfig.value,
    }, {
        preserveScroll: true,
        onSuccess: () => {
            showAddModal.value = false
            selectedType.value = null
            formConfig.value = {}
            emitRefresh()
        },
        onFinish: () => { formProcessing.value = false },
    })
}

const emit = defineEmits<{ refresh: [] }>()
function emitRefresh() {
    emit('refresh')
}
</script>
