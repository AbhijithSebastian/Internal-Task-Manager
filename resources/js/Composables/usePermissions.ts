import { usePage, router } from '@inertiajs/vue3'
import { computed, type ComputedRef } from 'vue'

type PermissionName =
    | 'users.view' | 'users.create' | 'users.update' | 'users.delete' | 'users.restore'
    | 'users.deactivate' | 'users.reset-password' | 'users.invite'
    | 'projects.view' | 'projects.create' | 'projects.update' | 'projects.delete' | 'projects.archive'
    | 'projects.manage-members' | 'projects.manage-settings'
    | 'tasks.view' | 'tasks.create' | 'tasks.update' | 'tasks.delete' | 'tasks.assign'
    | 'tasks.approve' | 'tasks.reject' | 'tasks.review' | 'tasks.change-status' | 'tasks.submit-approval'
    | 'subtasks.view' | 'subtasks.create' | 'subtasks.update' | 'subtasks.delete'
    | 'subtasks.assign' | 'subtasks.change-status' | 'subtasks.approve'
    | 'dashboard.view' | 'dashboard.activity' | 'dashboard.notifications' | 'dashboard.announcements'
    | 'comments.view' | 'comments.create' | 'comments.update' | 'comments.delete' | 'comments.activity'
    | 'reports.view' | 'reports.generate' | 'reports.export' | 'reports.download'
    | 'attachments.view' | 'attachments.upload' | 'attachments.delete' | 'attachments.download'
    | 'announcements.view' | 'announcements.create' | 'announcements.update' | 'announcements.delete' | 'announcements.pin'
    | 'notifications.view' | 'notifications.manage'
    | 'permissions.view' | 'permissions.manage'

interface PageProps {
    auth: {
        user: {
            permissions: PermissionName[] | null
            is_super_admin: boolean
            role: string | null
            inherit_role_permissions: boolean
        } | null
    }
}

export function usePermissions() {
    const page = usePage<PageProps>()

    const userPermissions: ComputedRef<PermissionName[]> = computed(() => {
        return page.props.auth.user?.permissions ?? []
    })

    const isSuperAdmin: ComputedRef<boolean> = computed(() => {
        return page.props.auth.user?.is_super_admin ?? false
    })

    const userRole: ComputedRef<string | null> = computed(() => {
        return page.props.auth.user?.role ?? null
    })

    function can(permission: PermissionName): boolean {
        if (isSuperAdmin.value) return true
        return userPermissions.value.includes(permission)
    }

    function canAny(...permissions: PermissionName[]): boolean {
        if (isSuperAdmin.value) return true
        return permissions.some((p) => userPermissions.value.includes(p))
    }

    function canAll(...permissions: PermissionName[]): boolean {
        if (isSuperAdmin.value) return true
        return permissions.every((p) => userPermissions.value.includes(p))
    }

    function cannot(permission: PermissionName): boolean {
        return !can(permission)
    }

    return {
        can,
        canAny,
        canAll,
        cannot,
        isSuperAdmin,
        userRole,
        userPermissions,
    }
}
