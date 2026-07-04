<template>
    <div class="space-y-4">
        <div v-for="field in fields" :key="field.key" class="space-y-1">
            <label class="label">
                {{ field.label }}
                <span v-if="field.required" class="text-danger">*</span>
            </label>

            <input
                v-if="field.type === 'text' || field.type === 'email' || field.type === 'password'"
                v-model="localConfig[field.key]"
                :type="field.type === 'password' ? 'password' : field.type === 'email' ? 'email' : 'text'"
                class="input"
                :placeholder="field.placeholder ?? ''"
            />

            <label v-else-if="field.type === 'checkbox'" class="flex items-center gap-2 text-sm cursor-pointer">
                <input
                    type="checkbox"
                    :checked="localConfig[field.key] ?? false"
                    class="rounded border-border text-brand-primary-500"
                    @change="localConfig[field.key] = ($event.target as HTMLInputElement).checked"
                />
                {{ field.label }}
            </label>

            <p v-if="field.help" class="text-xs text-text-secondary">{{ field.help }}</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { router } from '@inertiajs/vue3'
import { route } from 'ziggy-js'

const props = defineProps<{
    type: string
    config: Record<string, any>
}>()

const emit = defineEmits<{
    'update:config': [value: Record<string, any>]
}>()

const fields = ref<any[]>([])
const localConfig = ref<Record<string, any>>({...props.config})

watch(localConfig, (val) => {
    emit('update:config', val)
}, { deep: true })

onMounted(async () => {
    try {
        const response = await fetch(route('integrations.form-fields', props.type))
        const data = await response.json()
        fields.value = data.fields ?? []

        const defaults: Record<string, any> = {}
        for (const field of fields.value) {
            if (field.type === 'checkbox') {
                defaults[field.key] = props.config[field.key] ?? false
            } else {
                defaults[field.key] = props.config[field.key] ?? ''
            }
        }
        localConfig.value = defaults
        emit('update:config', defaults)
    } catch (e) {
        //
    }
})
</script>
