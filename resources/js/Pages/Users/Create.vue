<template>
    <AppLayout>
        <div class="mx-auto max-w-2xl space-y-6">
            <Breadcrumbs :items="[{ label: 'Users', route: 'users.index' }, { label: 'New User' }]" :back="{ route: 'users.index' }" />

            <div>
                <h2 class="text-2xl font-bold text-text-primary">Add User</h2>
                <p class="mt-1 text-sm text-text-secondary">Create a new team member account</p>
            </div>

            <form @submit.prevent="submit" class="card card-body space-y-6">
                <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                        <label class="label">Name <span class="text-danger">*</span></label>
                        <input v-model="form.name" type="text" class="input" placeholder="John Doe">
                        <p v-if="form.errors.name" class="mt-1 text-sm text-danger">{{ form.errors.name }}</p>
                    </div>
                    <div>
                        <label class="label">Email <span class="text-danger">*</span></label>
                        <input v-model="form.email" type="email" class="input" placeholder="john@company.com">
                        <p v-if="form.errors.email" class="mt-1 text-sm text-danger">{{ form.errors.email }}</p>
                    </div>
                    <div>
                        <label class="label">Password <span class="text-danger">*</span></label>
                        <input v-model="form.password" type="password" class="input" placeholder="Min 8 characters">
                        <p v-if="form.errors.password" class="mt-1 text-sm text-danger">{{ form.errors.password }}</p>
                    </div>
                    <div>
                        <label class="label">Confirm Password <span class="text-danger">*</span></label>
                        <input v-model="form.password_confirmation" type="password" class="input" placeholder="Repeat password">
                    </div>
                    <div>
                        <label class="label">Role <span class="text-danger">*</span></label>
                        <select v-model="form.role" class="input">
                            <option value="" disabled>Select role</option>
                            <option v-for="role in roles" :key="role.value" :value="role.value">{{ role.label }}</option>
                        </select>
                        <p v-if="form.errors.role" class="mt-1 text-sm text-danger">{{ form.errors.role }}</p>
                    </div>
                    <div>
                        <label class="label">Job Title</label>
                        <input v-model="form.job_title" type="text" class="input" placeholder="Software Engineer">
                    </div>
                    <div>
                        <label class="label">Phone</label>
                        <input v-model="form.phone" type="text" class="input" placeholder="+1 555-0123">
                    </div>
                </div>
                <div class="flex items-center justify-end gap-4">
                    <Link :href="route('users.index')" class="btn-secondary">Cancel</Link>
                    <button type="submit" :disabled="form.processing" class="btn-primary">
                        <svg v-if="form.processing" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Create User
                    </button>
                </div>
            </form>
        </div>
    </AppLayout>
</template>

<script setup lang="ts">
import { useForm, Link } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import Breadcrumbs from '@/Components/Breadcrumbs.vue'

const props = defineProps<{ roles: any }>()

const form = useForm({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: '',
    job_title: '',
    phone: '',
})

function submit() {
    form.post(route('users.store'))
}
</script>