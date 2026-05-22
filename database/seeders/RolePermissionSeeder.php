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
            Permission::PROJECTS_VIEW,
            Permission::PROJECTS_CREATE,
            Permission::PROJECTS_UPDATE,
            Permission::PROJECTS_DELETE,
            Permission::PROJECTS_MANAGE_MEMBERS,
            Permission::TASKS_VIEW,
            Permission::TASKS_CREATE,
            Permission::TASKS_UPDATE,
            Permission::TASKS_DELETE,
            Permission::TASKS_ASSIGN,
            Permission::TASKS_APPROVE,
            Permission::COMMENTS_CREATE,
            Permission::COMMENTS_UPDATE,
            Permission::COMMENTS_DELETE,
            Permission::REPORTS_VIEW,
            Permission::REPORTS_EXPORT,
            Permission::FILES_UPLOAD,
            Permission::FILES_DELETE,
        ];

        $tlPermissions = [
            Permission::USERS_VIEW,
            Permission::PROJECTS_VIEW,
            Permission::TASKS_VIEW,
            Permission::TASKS_CREATE,
            Permission::TASKS_UPDATE,
            Permission::TASKS_DELETE,
            Permission::TASKS_ASSIGN,
            Permission::TASKS_REVIEW,
            Permission::COMMENTS_CREATE,
            Permission::COMMENTS_UPDATE,
            Permission::COMMENTS_DELETE,
            Permission::FILES_UPLOAD,
        ];

        $empPermissions = [
            Permission::PROJECTS_VIEW,
            Permission::TASKS_VIEW,
            Permission::TASKS_UPDATE,
            Permission::TASKS_SUBMIT_APPROVAL,
            Permission::COMMENTS_CREATE,
            Permission::FILES_UPLOAD,
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
