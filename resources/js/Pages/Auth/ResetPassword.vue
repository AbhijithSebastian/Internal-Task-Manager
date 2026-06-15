<template>
    <AuthLayout>
        <form @submit.prevent="submit" class="space-y-5" novalidate>
            <input type="hidden" v-model="form.token">

            <div>
                <label for="email" class="label">Email address</label>
                <input
                    id="email"
                    v-model="form.email"
                    type="email"
                    class="input bg-gray-50 text-text-secondary"
                    readonly
                    autocomplete="email"
                >
            </div>

            <div>
                <label for="password" class="label">New password</label>
                <input
                    id="password"
                    v-model="form.password"
                    type="password"
                    class="input"
                    :class="{ 'input-error': form.errors.password }"
                    autocomplete="new-password"
                    required
                >
                <p v-if="form.errors.password" class="mt-1.5 text-sm text-danger">{{ form.errors.password }}</p>
            </div>

            <div>
                <label for="password_confirmation" class="label">Confirm new password</label>
                <input
                    id="password_confirmation"
                    v-model="form.password_confirmation"
                    type="password"
                    class="input"
                    autocomplete="new-password"
                    required
                >
            </div>

            <button
                type="submit"
                :disabled="form.processing"
                class="btn-primary w-full flex items-center justify-center gap-2"
            >
                <svg v-if="form.processing" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {{ form.processing ? 'Resetting…' : 'Reset password' }}
            </button>
        </form>
    </AuthLayout>
</template>

<script setup lang="ts">
import { useForm } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import AuthLayout from '@/Layouts/AuthLayout.vue'

const props = defineProps<{
    email: string
    token: string
}>()

const form = useForm({
    token: props.token,
    email: props.email,
    password: '',
    password_confirmation: '',
})

function submit() {
    form.post(route('password.store'), {
        onFinish: () => form.reset('password', 'password_confirmation'),
        onError: () => form.reset('password', 'password_confirmation'),
    })
}
</script>
