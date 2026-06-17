<template>
    <div class="min-h-screen flex flex-col items-center justify-center bg-page px-4 py-12">
        <div class="w-full max-w-sm">
            <div class="text-center mb-10">
                <Link :href="route('dashboard')" class="inline-flex items-center gap-3">
                    <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary-500 text-white shadow-sm">
                        <span class="text-sm font-bold tracking-wider">ITM</span>
                    </div>
                    <div class="text-left">
                        <p class="text-lg font-bold text-text-primary">Internal Task</p>
                        <p class="text-xs text-text-secondary">Manager</p>
                    </div>
                </Link>
                <h2 class="mt-8 text-xl font-bold text-text-primary">{{ computedTitle }}</h2>
                <p v-if="subtitle" class="mt-2 text-sm text-text-secondary">{{ subtitle }}</p>
            </div>

            <div v-if="$page.props.flash.success" class="mb-4 rounded-lg bg-success-50 p-4 text-sm text-success">
                {{ $page.props.flash.success }}
            </div>
            <div v-if="$page.props.flash.error" class="mb-4 rounded-lg bg-danger-50 p-4 text-sm text-danger">
                {{ $page.props.flash.error }}
            </div>

            <div class="card p-8 shadow-modal">
                <slot />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Link, usePage } from '@inertiajs/vue3'

const props = defineProps<{
    title?: string
    subtitle?: string
}>()

const page = usePage()

const computedTitle = computed(() => {
    if (props.title) return props.title
    const component = page.component
    if (component === 'Auth/Login') return 'Sign in to your account'
    if (component === 'Auth/ForgotPassword') return 'Reset your password'
    if (component === 'Auth/ResetPassword') return 'Set new password'
    return 'Authentication'
})
</script>
