<template>
    <AppLayout>
        <div class="mx-auto max-w-6xl space-y-6">
            <Breadcrumbs :items="[{ label: 'Profile & Settings' }]" />

            <div>
                <h2 class="text-2xl font-bold tracking-tight text-text-primary">Profile</h2>
                <p class="mt-1 text-sm text-text-secondary">Your personal information and preferences</p>
            </div>

            <!-- Two-column grid -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <!-- Left column: Avatar card -->
                <div class="lg:col-span-1">
                    <div class="card card-body">
                        <h3 class="text-base font-semibold text-text-primary mb-4">Avatar</h3>
                        <div class="flex flex-col items-center text-center gap-4">
                            <img :src="avatarPreview || user.avatar" alt="" class="h-28 w-28 rounded-full object-cover border border-border shadow-card">
                            <div class="space-y-2 w-full flex flex-col items-center">
                                <label class="btn-secondary btn-sm cursor-pointer w-full text-center">
                                    Upload Photo
                                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="hidden" @change="handleAvatarUpload">
                                </label>
                                <button class="btn-sm text-sm text-danger hover:text-danger w-full text-center" @click="removeAvatar">Remove</button>
                                <p class="text-xs text-text-secondary mt-1">JPEG, PNG, or WebP. Max 2MB.</p>
                            </div>
                        </div>
                        <p v-if="avatarError" class="mt-2 text-sm text-danger text-center">{{ avatarError }}</p>
                    </div>
                </div>

                <!-- Right/Main column: Profile info + Password -->
                <div class="lg:col-span-2 space-y-6">
                    <form @submit.prevent="submitProfile" class="card card-body space-y-6">
                        <h3 class="text-base font-semibold text-text-primary">Personal Information</h3>
                        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label class="label">Name <span class="text-danger">*</span></label>
                                <input v-model="profileForm.name" type="text" class="input">
                                <p v-if="profileForm.errors.name" class="mt-1 text-sm text-danger">{{ profileForm.errors.name }}</p>
                            </div>
                            <div>
                                <label class="label">Email <span class="text-danger">*</span></label>
                                <input v-model="profileForm.email" type="email" class="input">
                                <p v-if="profileForm.errors.email" class="mt-1 text-sm text-danger">{{ profileForm.errors.email }}</p>
                            </div>
                            <div>
                                <label class="label">Job Title</label>
                                <input v-model="profileForm.job_title" type="text" disabled class="input bg-page text-text-secondary cursor-not-allowed border-border">
                                <p class="text-[10px] text-text-secondary mt-1">Job title can only be updated by admins.</p>
                            </div>
                            <div>
                                <label class="label">Phone</label>
                                <input v-model="profileForm.phone" type="text" class="input">
                            </div>
                        </div>
                        <div class="flex justify-end pt-4 border-t border-border">
                            <button type="submit" :disabled="profileForm.processing" class="btn-primary">Save Changes</button>
                        </div>
                    </form>

                    <form @submit.prevent="submitPassword" class="card card-body space-y-6">
                        <h3 class="text-base font-semibold text-text-primary">Change Password</h3>
                        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label class="label">Current Password <span class="text-danger">*</span></label>
                                <input v-model="passwordForm.current_password" type="password" class="input">
                                <p v-if="passwordForm.errors.current_password" class="mt-1 text-sm text-danger">{{ passwordForm.errors.current_password }}</p>
                            </div>
                            <div></div>
                            <div>
                                <label class="label">New Password <span class="text-danger">*</span></label>
                                <input v-model="passwordForm.password" type="password" class="input" placeholder="Min 8 characters">
                                <p v-if="passwordForm.errors.password" class="mt-1 text-sm text-danger">{{ passwordForm.errors.password }}</p>
                            </div>
                            <div>
                                <label class="label">Confirm Password <span class="text-danger">*</span></label>
                                <input v-model="passwordForm.password_confirmation" type="password" class="input" placeholder="Repeat password">
                            </div>
                        </div>
                        <div class="flex justify-end pt-4 border-t border-border">
                            <button type="submit" :disabled="passwordForm.processing" class="btn-primary">Update Password</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </AppLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useForm, router } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import AppLayout from '@/Layouts/AppLayout.vue'
import Breadcrumbs from '@/Components/Breadcrumbs.vue'

const props = defineProps<{ user: any }>()

const profileForm = useForm({
    name: props.user.name,
    email: props.user.email,
    job_title: props.user.job_title ?? '',
    phone: props.user.phone ?? '',
})

const passwordForm = useForm({
    current_password: '',
    password: '',
    password_confirmation: '',
})

const avatarPreview = ref<string | null>(null)
const avatarError = ref<string | null>(null)

function handleAvatarUpload(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
        avatarError.value = 'File size must be less than 2MB.'
        return
    }

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
        avatarError.value = 'File must be JPEG, PNG, WebP, or GIF.'
        return
    }

    avatarError.value = null

    const reader = new FileReader()
    reader.onload = (e) => {
        avatarPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)

    const formData = new FormData()
    formData.append('avatar', file)
    router.post(route('profile.avatar.upload'), formData, {
        preserveScroll: true,
        onSuccess: () => {
            avatarPreview.value = null
        },
    })
}

function removeAvatar() {
    router.delete(route('profile.avatar.delete'), {
        preserveScroll: true,
    })
}

function submitProfile() {
    profileForm.patch(route('profile.update'))
}

function submitPassword() {
    passwordForm.patch(route('profile.password'), {
        onSuccess: () => {
            passwordForm.reset()
        },
    })
}
</script>