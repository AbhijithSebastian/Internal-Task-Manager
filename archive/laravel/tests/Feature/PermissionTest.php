<?php

namespace Tests\Feature;

use App\Enums\Permission;
use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PermissionTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;
    protected User $projectManager;
    protected User $teamLead;
    protected User $employee;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = User::factory()->create(['email' => 'sa-perm@test.com']);
        $this->superAdmin->assignRole(UserRole::SuperAdmin->value);

        $this->projectManager = User::factory()->create(['email' => 'pm-perm@test.com']);
        $this->projectManager->assignRole(UserRole::ProjectManager->value);

        $this->teamLead = User::factory()->create(['email' => 'tl-perm@test.com']);
        $this->teamLead->assignRole(UserRole::TeamLead->value);

        $this->employee = User::factory()->create(['email' => 'emp-perm@test.com']);
        $this->employee->assignRole(UserRole::Employee->value);
    }

    // ─── Permission Page Access ───

    public function test_super_admin_can_view_permissions_page(): void
    {
        $this->actingAs($this->superAdmin);
        $response = $this->get(route('permissions.index'));
        $response->assertStatus(200);
    }

    public function test_project_manager_cannot_view_permissions_page(): void
    {
        $this->actingAs($this->projectManager);
        $response = $this->get(route('permissions.index'));
        $response->assertStatus(403);
    }

    public function test_team_lead_cannot_view_permissions_page(): void
    {
        $this->actingAs($this->teamLead);
        $response = $this->get(route('permissions.index'));
        $response->assertStatus(403);
    }

    public function test_employee_cannot_view_permissions_page(): void
    {
        $this->actingAs($this->employee);
        $response = $this->get(route('permissions.index'));
        $response->assertStatus(403);
    }

    // ─── Permission Show (User Detail) ───

    public function test_super_admin_can_view_user_permissions(): void
    {
        $this->actingAs($this->superAdmin);
        $response = $this->getJson(route('permissions.show', $this->employee));
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'user' => ['id', 'name', 'email', 'role', 'inherit_role_permissions'],
            'role_permissions',
            'direct_permissions',
            'effective_permissions',
        ]);
    }

    public function test_non_admin_cannot_view_user_permissions(): void
    {
        $this->actingAs($this->employee);
        $response = $this->getJson(route('permissions.show', $this->projectManager));
        $response->assertStatus(403);
    }

    // ─── Permission Update ───

    public function test_super_admin_can_update_user_permissions(): void
    {
        $this->actingAs($this->superAdmin);

        $response = $this->put(route('permissions.update', $this->employee), [
            'inherit_role_permissions' => false,
            'permissions' => ['tasks.view', 'tasks.create', 'dashboard.view'],
        ]);

        $response->assertSessionHas('success');
        $this->assertFalse($this->employee->fresh()->inherit_role_permissions);
        $this->assertTrue($this->employee->fresh()->can('tasks.view'));
        $this->assertTrue($this->employee->fresh()->can('tasks.create'));
        $this->assertFalse($this->employee->fresh()->can('projects.delete'));
    }

    public function test_non_admin_cannot_update_permissions(): void
    {
        $this->actingAs($this->projectManager);

        $response = $this->put(route('permissions.update', $this->employee), [
            'inherit_role_permissions' => false,
            'permissions' => ['tasks.view'],
        ]);

        $response->assertStatus(403);
    }

    public function test_re_enabling_inheritance_removes_direct_permissions(): void
    {
        $this->actingAs($this->superAdmin);

        $this->employee->syncPermissions(['tasks.view', 'tasks.create']);
        $this->employee->update(['inherit_role_permissions' => false]);

        $response = $this->put(route('permissions.update', $this->employee), [
            'inherit_role_permissions' => true,
            'permissions' => [],
        ]);

        $response->assertSessionHas('success');
        $this->assertTrue($this->employee->fresh()->inherit_role_permissions);
        $this->assertCount(0, $this->employee->fresh()->getDirectPermissions());
    }

    // ─── Role Assignment ───

    public function test_super_admin_can_change_user_role(): void
    {
        $this->actingAs($this->superAdmin);

        $response = $this->put(route('permissions.users.role', $this->employee), [
            'role' => 'project-manager',
        ]);

        $response->assertSessionHas('success');
        $this->assertTrue($this->employee->fresh()->hasRole(UserRole::ProjectManager->value));
    }

    public function test_changing_role_enables_inheritance(): void
    {
        $this->actingAs($this->superAdmin);

        $this->employee->update(['inherit_role_permissions' => false]);

        $this->put(route('permissions.users.role', $this->employee), [
            'role' => 'team-lead',
        ]);

        $this->assertTrue($this->employee->fresh()->inherit_role_permissions);
    }

    public function test_non_admin_cannot_change_user_role(): void
    {
        $this->actingAs($this->teamLead);

        $response = $this->put(route('permissions.users.role', $this->employee), [
            'role' => 'project-manager',
        ]);

        $response->assertStatus(403);
    }

    public function test_invalid_role_returns_error(): void
    {
        $this->actingAs($this->superAdmin);

        $response = $this->put(route('permissions.users.role', $this->employee), [
            'role' => 'nonexistent-role',
        ]);

        $response->assertSessionHas('error');
    }

    // ─── Role Presets ───

    public function test_super_admin_can_view_role_presets(): void
    {
        $this->actingAs($this->superAdmin);

        $response = $this->getJson(route('permissions.roles'));

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'roles' => [
                '*' => ['id', 'name', 'label', 'permissions'],
            ],
        ]);
    }

    public function test_non_admin_cannot_view_role_presets(): void
    {
        $this->actingAs($this->employee);

        $response = $this->getJson(route('permissions.roles'));

        $response->assertStatus(403);
    }

    public function test_super_admin_can_update_role_permissions(): void
    {
        $this->actingAs($this->superAdmin);

        $role = \Spatie\Permission\Models\Role::findByName(UserRole::Employee->value, 'web');

        $response = $this->put(route('permissions.roles.update', $role), [
            'permissions' => ['tasks.view', 'dashboard.view'],
        ]);

        $response->assertSessionHas('success');
        $role->refresh();
        $this->assertTrue($role->hasPermissionTo('tasks.view'));
        $this->assertTrue($role->hasPermissionTo('dashboard.view'));
        $this->assertFalse($role->hasPermissionTo('projects.create'));
    }

    public function test_non_admin_cannot_update_role_permissions(): void
    {
        $this->actingAs($this->projectManager);

        $role = \Spatie\Permission\Models\Role::findByName(UserRole::Employee->value, 'web');

        $response = $this->put(route('permissions.roles.update', $role), [
            'permissions' => ['tasks.view'],
        ]);

        $response->assertStatus(403);
    }

    // ─── Permission Authorization ───

    public function test_inherited_role_permissions_work(): void
    {
        $this->actingAs($this->superAdmin);

        $this->employee->update(['inherit_role_permissions' => true]);
        $this->employee->syncPermissions([]);

        $employeeRole = \Spatie\Permission\Models\Role::findByName(UserRole::Employee->value, 'web');
        $employeeRole->syncPermissions(['tasks.view', 'tasks.change-status']);

        $this->employee->refresh();
        $this->employee->load('roles');
        $this->employee->load('permissions');

        $this->assertTrue($this->employee->can('tasks.view'));
        $this->assertTrue($this->employee->can('tasks.change-status'));
        $this->assertFalse($this->employee->can('projects.create'));
    }

    public function test_direct_permissions_override_role_inheritance(): void
    {
        $this->actingAs($this->superAdmin);

        $this->employee->update(['inherit_role_permissions' => false]);
        $this->employee->syncPermissions(['reports.view']);

        $employeeRole = \Spatie\Permission\Models\Role::findByName(UserRole::Employee->value, 'web');
        $employeeRole->syncPermissions(['tasks.view']);

        $this->employee->refresh();
        $this->employee->load('roles');
        $this->employee->load('permissions');

        $this->assertTrue($this->employee->can('reports.view'));
    }

    // ─── Super Admin always has access ───

    public function test_super_admin_bypasses_permission_checks(): void
    {
        $this->actingAs($this->superAdmin);

        $this->superAdmin->syncPermissions([]);
        $this->superAdmin->update(['inherit_role_permissions' => false]);

        $response = $this->get(route('permissions.index'));
        $response->assertStatus(200);
    }

    public function test_permissions_page_contains_user_data(): void
    {
        $this->actingAs($this->superAdmin);

        $response = $this->get(route('permissions.index'));

        $response->assertInertia(fn ($page) => $page
            ->component('Permissions/Index')
            ->has('users')
            ->has('permissionGroups')
        );
    }

    // ─── Validation ───

    public function test_update_validates_permission_strings(): void
    {
        $this->actingAs($this->superAdmin);

        $response = $this->put(route('permissions.update', $this->employee), [
            'inherit_role_permissions' => false,
            'permissions' => ['invalid-permission-name'],
        ]);

        $response->assertSessionHasErrors('permissions.0');
    }

    public function test_update_role_requires_valid_role(): void
    {
        $this->actingAs($this->superAdmin);

        $response = $this->put(route('permissions.users.role', $this->employee), [
            'role' => '',
        ]);

        $response->assertSessionHasErrors('role');
    }

    // ─── Edge Cases ───

    public function test_super_admin_can_manage_own_permissions(): void
    {
        $this->actingAs($this->superAdmin);

        $response = $this->put(route('permissions.update', $this->superAdmin), [
            'inherit_role_permissions' => true,
            'permissions' => [],
        ]);

        $response->assertSessionHas('success');
    }

    public function test_empty_permissions_array_clears_direct_permissions(): void
    {
        $this->actingAs($this->superAdmin);

        $this->employee->syncPermissions(['tasks.view']);
        $this->employee->update(['inherit_role_permissions' => false]);

        $this->put(route('permissions.update', $this->employee), [
            'inherit_role_permissions' => false,
            'permissions' => [],
        ]);

        $this->assertCount(0, $this->employee->fresh()->getDirectPermissions());
    }
}
