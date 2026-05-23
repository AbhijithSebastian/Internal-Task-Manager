<template>
    <AppLayout>
        <div class="mx-auto max-w-6xl space-y-6">
            <Breadcrumbs :items="[{ label: 'Users', route: 'users.index' }, { label: user.name, route: 'users.show', params: { id: user.id } }, { label: 'Edit' }]" :back="{ route: 'users.show', params: { id: user.id } }" />

            <div>
                <h2 class="text-2xl font-bold text-gray-900">Edit User</h2>
                <p class="mt-1 text-sm text-gray-600">{{ user.name }}</p>
            </div>

            <!-- Two-column grid -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <!-- Left column: Avatar card -->
                <div class="lg:col-span-1">
                    <div class="card p-6">
                        <h3 class="text-base font-semibold text-gray-900 mb-4">Avatar</h3>
                        <div class="flex flex-col items-center text-center gap-4">
                            <img :src="avatarPreview || user.avatar" alt="" class="h-28 w-28 rounded-full object-cover border border-gray-200/80 shadow-sm">
                            <div class="space-y-2 w-full flex flex-col items-center">
                                <label class="btn-secondary btn-sm cursor-pointer w-full text-center">
                                    Upload Photo
                                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="hidden" @change="handleAvatarUpload">
                                </label>
                                <button class="btn-sm text-sm text-red-600 hover:text-red-500 w-full text-center" @click="removeAvatar">Remove</button>
                                <p class="text-xs text-gray-400 mt-1">JPEG, PNG, or WebP. Max 2MB.</p>
                            </div>
                        </div>
                        <p v-if="avatarError" class="mt-2 text-sm text-red-600 text-center">{{ avatarError }}</p>
                    </div>
                </div>

                <!-- Right/Main column: Profile info + Password -->
                <div class="lg:col-span-2">
                    <form @submit.prevent="submit" class="card p-6 space-y-6">
                        <h3 class="text-base font-semibold text-gray-900">Profile Information</h3>
                        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label class="label">Name <span class="text-red-500">*</span></label>
                                <input v-model="form.name" type="text" class="input">
                                <p v-if="form.errors.name" class="mt-1 text-sm text-red-600">{{ form.errors.name }}</p>
                            </div>
                            <div>
                                <label class="label">Email <span class="text-red-500">*</span></label>
                                <input v-model="form.email" type="email" class="input">
                                <p v-if="form.errors.email" class="mt-1 text-sm text-red-600">{{ form.errors.email }}</p>
                            </div>
                            <div>
                                <label class="label">Role</label>
                                <select v-model="form.role" class="input">
                                    <option value="" disabled>Select role</option>
                                    <option v-for="role in roles" :key="role.value" :value="role.value">{{ role.label }}</option>
                                </select>
                                <p v-if="form.errors.role" class="mt-1 text-sm text-red-600">{{ form.errors.role }}</p>
                            </div>
                            <div>
                                <label class="label">Job Title</label>
                                <input v-model="form.job_title" type="text" class="input">
                            </div>
                            <div>
                                <label class="label">Phone</label>
                                <input v-model="form.phone" type="text" class="input">
                            </div>
                            <div>
                                <label class="label">Account Status</label>
                                <select v-model="form.is_active" class="input">
                                    <option :value="true">Active</option>
                                    <option :value="false">Inactive</option>
                                </select>
                            </div>
                        </div>

                        <hr class="border-gray-200">

                        <h3 class="text-base font-semibold text-gray-900">Change Password</h3>
                        <p class="text-xs text-gray-400 -mt-4">Leave blank to keep current password.</p>
                        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label class="label">New Password</label>
                                <input v-model="form.password" type="password" class="input" placeholder="Min 8 characters">
                                <p v-if="form.errors.password" class="mt-1 text-sm text-red-600">{{ form.errors.password }}</p>
                            </div>
                            <div>
                                <label class="label">Confirm Password</label>
                                <input v-model="form.password_confirmation" type="password" class="input" placeholder="Repeat password">
                            </div>
                        </div>

                        <div class="flex items-center justify-between gap-4 pt-4 border-t border-gray-100">
                            <div>
                                <button v-if="canDeactivate" type="button" class="btn-danger" @click="confirmDelete = true">
                                    Deactivate User
                                </button>
                            </div>
                            <div class="flex items-center gap-4">
                                <Link :href="route('users.index')" class="btn-secondary">Cancel</Link>
                                <button type="submit" :disabled="form.processing" class="btn-primary">
                                    <svg v-if="form.processing" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Update User
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <ConfirmDialog
                :open="confirmDelete"
                :processing="confirmDeleteProcessing"
                title="Deactivate User"
                message="Are you sure you want to deactivate this user? They will no longer be able to log in, but their contributions (projects, tasks, comments) will be preserved."
                variant="danger"
                confirm-text="Deactivate"
                @confirm="doDelete"
                @close="confirmDelete = false"
            />
        </div>
    </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useForm, Link, router, usePage } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import AppLayout from '@/Layouts/AppLayout.vue'
import Breadcrumbs from '@/Components/Breadcrumbs.vue'
import ConfirmDialog from '@/Components/ConfirmDialog.vue'
import { usePermissions } from '@/Composables/usePermissions'

const props = defineProps<{ user: any; roles: any }>()

const form = useForm({
    name: props.user.name,
    email: props.user.email,
    role: props.user.roles[0]?.name ?? '',
    job_title: props.user.job_title ?? '',
    phone: props.user.phone ?? '',
    is_active: props.user.is_active,
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
    router.post(route('users.avatar.upload', props.user.id), formData, {
        preserveScroll: true,
        onSuccess: () => {
            avatarPreview.value = null
        },
    })
}

function removeAvatar() {
    router.delete(route('users.avatar.delete', props.user.id), {
        preserveScroll: true,
    })
}

const { can } = usePermissions()
const page = usePage()

const canDeactivate = computed(() => {
    return can('users.delete') && props.user.id !== page.props.auth.user?.id && !props.user.is_super_admin
})

const confirmDelete = ref(false)
const confirmDeleteProcessing = ref(false)

function doDelete() {
    confirmDeleteProcessing.value = true
    router.delete(route('users.destroy', props.user.id), {
        onSuccess: () => { confirmDelete.value = false },
        onFinish: () => { confirmDeleteProcessing.value = false },
    })
}

function submit() {
    form.put(route('users.update', props.user.id), {
        onSuccess: () => {
            form.reset('password', 'password_confirmation')
        },
    })
}
</script>
