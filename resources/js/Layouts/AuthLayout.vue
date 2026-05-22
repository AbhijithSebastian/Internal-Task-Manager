<template>
    <div class="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div class="w-full max-w-sm">
            <div class="text-center mb-8">
                <Link :href="route('dashboard')" class="inline-block">
                    <h1 class="text-3xl font-bold text-primary-600">Internal Tool</h1>
                </Link>
                <h2 class="mt-4 text-xl font-semibold text-gray-900">{{ title }}</h2>
                <p v-if="subtitle" class="mt-2 text-sm text-gray-600">{{ subtitle }}</p>
            </div>

            <div v-if="$page.props.flash.success" class="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-800">
                {{ $page.props.flash.success }}
            </div>
            <div v-if="$page.props.flash.error" class="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800">
                {{ $page.props.flash.error }}
            </div>

            <div class="card p-6 sm:p-8">
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

const title = computed(() => {
    if (props.title) return props.title
    const component = page.component
    if (component === 'Auth/Login') return 'Sign in to your account'
    if (component === 'Auth/ForgotPassword') return 'Reset your password'
    if (component === 'Auth/ResetPassword') return 'Set new password'
    return 'Authentication'
})
</script>
