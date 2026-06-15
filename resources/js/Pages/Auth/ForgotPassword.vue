<template>
    <AuthLayout>
        <form @submit.prevent="submit" class="space-y-5" novalidate>
            <p class="text-sm text-text-secondary leading-relaxed">
                Forgot your password? Enter your email address and we'll send you a link to reset it.
            </p>

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
                    required
                >
                <p v-if="form.errors.email" class="mt-1.5 text-sm text-danger">{{ form.errors.email }}</p>
            </div>

            <button
                type="submit"
                :disabled="form.processing || form.wasSuccessful"
                class="btn-primary w-full flex items-center justify-center gap-2"
            >
                <svg v-if="form.processing" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {{ form.wasSuccessful ? 'Email sent' : form.processing ? 'Sending…' : 'Send reset link' }}
            </button>

            <p class="text-center text-sm text-text-secondary">
                Remember your password?
                <Link :href="route('login')" class="font-medium text-brand-primary-500 hover:text-brand-primary-600 transition-colors">Sign in</Link>
            </p>
        </form>
    </AuthLayout>
</template>

<script setup lang="ts">
import { useForm, Link } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import AuthLayout from '@/Layouts/AuthLayout.vue'

const form = useForm({
    email: '',
})

function submit() {
    form.post(route('password.email'))
}
</script>
