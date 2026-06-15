<template>
    <AuthLayout subtitle="Manage projects, tasks, and collaborate with your team">
        <form @submit.prevent="submit" class="space-y-6" novalidate>
            <div v-if="form.hasErrors && !form.errors.email && !form.errors.password" class="rounded-lg bg-danger-50 p-3 text-sm text-danger">
                {{ form.errors.error || 'Please check your credentials and try again.' }}
            </div>

            <div>
                <label for="email" class="label">Email address</label>
                <input
                    id="email"
                    v-model="form.email"
                    type="email"
                    class="input"
                    :class="{ 'input-error': form.errors.email }"
                    placeholder="you@company.com"
                    autocomplete="email"
                    autofocus
                    required
                >
                <p v-if="form.errors.email" class="mt-1.5 text-sm text-danger">{{ form.errors.email }}</p>
            </div>

            <div>
                <label for="password" class="label">Password</label>
                <input
                    id="password"
                    v-model="form.password"
                    type="password"
                    class="input"
                    :class="{ 'input-error': form.errors.password }"
                    autocomplete="current-password"
                    required
                >
                <p v-if="form.errors.password" class="mt-1.5 text-sm text-danger">{{ form.errors.password }}</p>
            </div>

            <div class="flex items-center justify-between">
                <label class="flex cursor-pointer items-center gap-2">
                    <input
                        v-model="form.remember"
                        type="checkbox"
                        class="h-4 w-4 rounded border-border text-brand-primary-500 focus:ring-brand-primary-500"
                    >
                    <span class="text-sm text-text-primary select-none">Remember me</span>
                </label>
                <Link
                    :href="route('password.request')"
                    class="text-sm font-medium text-brand-primary-500 hover:text-brand-primary-600 transition-colors"
                >
                    Forgot password?
                </Link>
            </div>

            <button
                type="submit"
                :disabled="form.processing"
                class="btn-primary w-full"
            >
                <svg v-if="form.processing" class="h-4 w-4 animate-spin mr-2" viewBox="0 0 24 24" fill="none">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {{ form.processing ? 'Signing in\u2026' : 'Sign in' }}
            </button>
        </form>
    </AuthLayout>
</template>

<script setup lang="ts">
import { useForm, Link } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import AuthLayout from '@/Layouts/AuthLayout.vue'

const form = useForm({
    email: '',
    password: '',
    remember: false,
})

function submit() {
    form.post(route('login'), {
        onFinish: () => form.reset('password'),
        onError: () => form.reset('password'),
    })
}
</script>
