import { usePage, router } from '@inertiajs/vue3'
import { computed, type ComputedRef } from 'vue'

type PermissionName =
    | 'users.view' | 'users.create' | 'users.update' | 'users.delete' | 'users.restore'
    | 'projects.view' | 'projects.create' | 'projects.update' | 'projects.delete' | 'projects.manage-members'
    | 'tasks.view' | 'tasks.create' | 'tasks.update' | 'tasks.delete' | 'tasks.assign'
    | 'tasks.approve' | 'tasks.review' | 'tasks.submit-approval'
    | 'comments.create' | 'comments.update' | 'comments.delete'
    | 'reports.view' | 'reports.export'
    | 'files.upload' | 'files.delete'
    | 'permissions.manage'

interface PageProps {
    auth: {
        user: {
            permissions: PermissionName[] | null
            is_super_admin: boolean
            role: string | null
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
