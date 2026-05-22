<?php

namespace Tests;

use App\Enums\Permission;
use App\Enums\UserRole;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Spatie\Permission\Models\Role;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    protected User $superAdmin;
    protected User $projectManager;
    protected User $teamLead;
    protected User $employee;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedRolesAndPermissions();
        $this->createTestUsers();
    }

    protected function seedRolesAndPermissions(): void
    {
        app()->make(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (Permission::cases() as $permission) {
            \Spatie\Permission\Models\Permission::firstOrCreate([
                'name' => $permission->value,
                'guard_name' => 'web',
            ]);
        }

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

    protected function createTestUsers(): void
    {
        $this->superAdmin = User::factory()->create(['email' => 'superadmin@test.com']);
        $this->superAdmin->assignRole(UserRole::SuperAdmin->value);

        $this->projectManager = User::factory()->create(['email' => 'pm@test.com']);
        $this->projectManager->assignRole(UserRole::ProjectManager->value);

        $this->teamLead = User::factory()->create(['email' => 'lead@test.com']);
        $this->teamLead->assignRole(UserRole::TeamLead->value);

        $this->employee = User::factory()->create(['email' => 'employee@test.com']);
        $this->employee->assignRole(UserRole::Employee->value);
    }

    protected function createProjectWithMembers(string $role = 'owner'): Project
    {
        $project = Project::factory()->create([
            'author_id' => $this->projectManager->id,
            'pm_id' => $this->projectManager->id,
            'lead_id' => $this->teamLead->id,
        ]);
        $project->members()->attach($this->projectManager->id, ['role' => $role]);
        $project->members()->attach($this->teamLead->id, ['role' => 'manager']);
        $project->members()->attach($this->employee->id, ['role' => 'member']);

        return $project;
    }

    protected function actingAsSuperAdmin(): User
    {
        $this->actingAs($this->superAdmin);
        return $this->superAdmin;
    }

    protected function actingAsProjectManager(): User
    {
        $this->actingAs($this->projectManager);
        return $this->projectManager;
    }

    protected function actingAsTeamLead(): User
    {
        $this->actingAs($this->teamLead);
        return $this->teamLead;
    }

    protected function actingAsEmployee(): User
    {
        $this->actingAs($this->employee);
        return $this->employee;
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
