<?php

namespace Database\Seeders;

use App\Enums\Permission;
use App\Enums\UserRole;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app()->make(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

        $this->createPermissions();
        $this->createRoles();
    }

    private function createPermissions(): void
    {
        foreach (Permission::cases() as $permission) {
            \Spatie\Permission\Models\Permission::firstOrCreate([
                'name' => $permission->value,
                'guard_name' => 'web',
            ]);
        }
    }

    private function createRoles(): void
    {
        $pmPermissions = [
            Permission::USERS_VIEW,
            Permission::USERS_CREATE,
            Permission::USERS_UPDATE,
            Permission::USERS_DELETE,
            Permission::USERS_DEACTIVATE,
            Permission::USERS_RESET_PASSWORD,
            Permission::USERS_INVITE,
            Permission::PROJECTS_VIEW,
            Permission::PROJECTS_CREATE,
            Permission::PROJECTS_UPDATE,
            Permission::PROJECTS_DELETE,
            Permission::PROJECTS_ARCHIVE,
            Permission::PROJECTS_MANAGE_MEMBERS,
            Permission::PROJECTS_MANAGE_SETTINGS,
            Permission::TASKS_VIEW,
            Permission::TASKS_CREATE,
            Permission::TASKS_UPDATE,
            Permission::TASKS_DELETE,
            Permission::TASKS_ASSIGN,
            Permission::TASKS_APPROVE,
            Permission::TASKS_REJECT,
            Permission::TASKS_CHANGE_STATUS,
            Permission::SUBTASKS_VIEW,
            Permission::SUBTASKS_CREATE,
            Permission::SUBTASKS_UPDATE,
            Permission::SUBTASKS_DELETE,
            Permission::SUBTASKS_ASSIGN,
            Permission::SUBTASKS_CHANGE_STATUS,
            Permission::SUBTASKS_APPROVE,
            Permission::DASHBOARD_VIEW,
            Permission::DASHBOARD_ACTIVITY,
            Permission::DASHBOARD_NOTIFICATIONS,
            Permission::DASHBOARD_ANNOUNCEMENTS,
            Permission::COMMENTS_VIEW,
            Permission::COMMENTS_CREATE,
            Permission::COMMENTS_UPDATE,
            Permission::COMMENTS_DELETE,
            Permission::COMMENTS_ACTIVITY,
            Permission::REPORTS_VIEW,
            Permission::REPORTS_GENERATE,
            Permission::REPORTS_EXPORT,
            Permission::REPORTS_DOWNLOAD,
            Permission::ATTACHMENTS_VIEW,
            Permission::ATTACHMENTS_UPLOAD,
            Permission::ATTACHMENTS_DELETE,
            Permission::ATTACHMENTS_DOWNLOAD,
            Permission::ANNOUNCEMENTS_VIEW,
            Permission::ANNOUNCEMENTS_CREATE,
            Permission::ANNOUNCEMENTS_UPDATE,
            Permission::ANNOUNCEMENTS_DELETE,
            Permission::NOTIFICATIONS_VIEW,
            Permission::NOTIFICATIONS_MANAGE,
        ];

        $tlPermissions = [
            Permission::USERS_VIEW,
            Permission::PROJECTS_VIEW,
            Permission::TASKS_VIEW,
            Permission::TASKS_CREATE,
            Permission::TASKS_UPDATE,
            Permission::TASKS_CHANGE_STATUS,
            Permission::SUBTASKS_VIEW,
            Permission::SUBTASKS_CREATE,
            Permission::SUBTASKS_UPDATE,
            Permission::SUBTASKS_CHANGE_STATUS,
            Permission::DASHBOARD_VIEW,
            Permission::DASHBOARD_ACTIVITY,
            Permission::DASHBOARD_NOTIFICATIONS,
            Permission::DASHBOARD_ANNOUNCEMENTS,
            Permission::COMMENTS_VIEW,
            Permission::COMMENTS_CREATE,
            Permission::COMMENTS_UPDATE,
            Permission::COMMENTS_DELETE,
            Permission::REPORTS_VIEW,
            Permission::ATTACHMENTS_VIEW,
            Permission::ATTACHMENTS_UPLOAD,
            Permission::ANNOUNCEMENTS_VIEW,
            Permission::NOTIFICATIONS_VIEW,
        ];

        $empPermissions = [
            Permission::TASKS_VIEW,
            Permission::TASKS_UPDATE,
            Permission::TASKS_CHANGE_STATUS,
            Permission::TASKS_SUBMIT_APPROVAL,
            Permission::SUBTASKS_VIEW,
            Permission::SUBTASKS_UPDATE,
            Permission::SUBTASKS_CHANGE_STATUS,
            Permission::DASHBOARD_VIEW,
            Permission::DASHBOARD_NOTIFICATIONS,
            Permission::DASHBOARD_ANNOUNCEMENTS,
            Permission::COMMENTS_VIEW,
            Permission::COMMENTS_CREATE,
            Permission::ATTACHMENTS_VIEW,
            Permission::ATTACHMENTS_UPLOAD,
            Permission::ANNOUNCEMENTS_VIEW,
            Permission::NOTIFICATIONS_VIEW,
        ];

        $this->syncRole(UserRole::SuperAdmin->value, Permission::cases());
        $this->syncRole(UserRole::ProjectManager->value, $pmPermissions);
        $this->syncRole(UserRole::TeamLead->value, $tlPermissions);
        $this->syncRole(UserRole::Employee->value, $empPermissions);
    }

    private function syncRole(string $roleName, array $permissions): void
    {
        $role = Role::firstOrCreate([
            'name' => $roleName,
            'guard_name' => 'web',
        ]);

        $permissionNames = array_map(fn (Permission $p) => $p->value, $permissions);

        $role->syncPermissions($permissionNames);
    }
}
