<?php

namespace Tests\Feature;

use App\Enums\Permission;
use App\Enums\UserRole;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Tests\TestCase;

class RBACTest extends TestCase
{
    // ─── Employee Restrictions ───

    public function test_employee_cannot_create_project(): void
    {
        $this->actingAsEmployee();

        $response = $this->get(route('projects.create', absolute: false));
        $response->assertStatus(403);

        $response = $this->post(route('projects.store', absolute: false), [
            'name' => 'Test Project',
        ]);
        $response->assertStatus(403);
    }

    public function test_employee_cannot_approve_tasks(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->employee->id,
            'assignee_id' => $this->employee->id,
            'requires_approval' => true,
            'status' => 'in_review',
            'approver_id' => $this->projectManager->id,
        ]);

        $this->actingAsEmployee();

        $response = $this->post(route('tasks.approve', $task, absolute: false));
        $response->assertStatus(403);
    }

    public function test_employee_cannot_manage_users(): void
    {
        $this->actingAsEmployee();

        $response = $this->get(route('users.index', absolute: false));
        $response->assertStatus(403);

        $response = $this->get(route('users.create', absolute: false));
        $response->assertStatus(403);
    }

    public function test_employee_cannot_access_reports(): void
    {
        $this->actingAsEmployee();

        $response = $this->get(route('reports.index', absolute: false));
        $response->assertStatus(403);
    }

    public function test_employee_cannot_export_reports(): void
    {
        $this->actingAsEmployee();

        $response = $this->get(route('reports.export', absolute: false));
        $response->assertStatus(403);
    }

    public function test_employee_cannot_assign_tasks(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
        ]);

        $this->actingAsEmployee();

        $response = $this->post(route('tasks.assign', $task, absolute: false), [
            'assignee_id' => $this->teamLead->id,
        ]);
        $response->assertStatus(403);
    }

    public function test_employee_cannot_delete_tasks(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
        ]);

        $this->actingAsEmployee();

        $response = $this->delete(route('tasks.destroy', $task, absolute: false));
        $response->assertStatus(403);
    }

    public function test_employee_cannot_manage_project_members(): void
    {
        $project = $this->createProjectWithMembers();
        $newUser = User::factory()->create();

        $this->actingAsEmployee();

        $response = $this->post(route('projects.members.add', $project, absolute: false), [
            'user_id' => $newUser->id,
        ]);
        $response->assertStatus(403);
    }

    public function test_employee_cannot_update_other_comments(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
        ]);

        $this->actingAs($this->projectManager);
        $comment = $task->comments()->create([
            'body' => 'Manager comment',
            'author_id' => $this->projectManager->id,
            'project_id' => $project->id,
        ]);

        $this->actingAsEmployee();

        $response = $this->put(route('comments.update', $comment, absolute: false), [
            'body' => 'Hacked!',
        ]);
        $response->assertStatus(403);
    }

    // ─── Team Lead Scoped Access ───

    public function test_team_lead_can_view_assigned_projects(): void
    {
        $project = $this->createProjectWithMembers();

        $this->actingAsTeamLead();

        $response = $this->get(route('projects.show', $project, absolute: false));
        $response->assertStatus(200);
    }

    public function test_team_lead_cannot_create_projects(): void
    {
        $this->actingAsTeamLead();

        $response = $this->get(route('projects.create', absolute: false));
        $response->assertStatus(403);
    }

    public function test_team_lead_can_assign_tasks_on_their_project(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
        ]);

        $this->actingAsTeamLead();

        $response = $this->post(route('tasks.assign', $task, absolute: false), [
            'assignee_id' => $this->employee->id,
        ]);
        $response->assertStatus(302);
    }

    public function test_team_lead_cannot_approve_tasks(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->employee->id,
            'assignee_id' => $this->employee->id,
            'requires_approval' => true,
            'status' => 'in_review',
            'approver_id' => $this->projectManager->id,
        ]);

        $this->actingAsTeamLead();

        $response = $this->post(route('tasks.approve', $task, absolute: false));
        $response->assertStatus(403);
    }

    public function test_team_lead_cannot_manage_users(): void
    {
        $this->actingAsTeamLead();

        $response = $this->get(route('users.create', absolute: false));
        $response->assertStatus(403);
    }

    public function test_team_lead_cannot_access_reports(): void
    {
        $this->actingAsTeamLead();

        $response = $this->get(route('reports.index', absolute: false));
        $response->assertStatus(403);
    }

    // ─── Project Manager Scoped Access ───

    public function test_project_manager_can_create_project(): void
    {
        $this->actingAsProjectManager();

        $response = $this->get(route('projects.create', absolute: false));
        $response->assertStatus(200);
    }

    public function test_project_manager_can_approve_tasks(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->employee->id,
            'assignee_id' => $this->employee->id,
            'requires_approval' => true,
            'status' => 'in_review',
            'approver_id' => $this->projectManager->id,
        ]);

        $this->actingAsProjectManager();

        $response = $this->post(route('tasks.approve', $task, absolute: false));
        $response->assertStatus(302);
    }

    public function test_project_manager_can_manage_members(): void
    {
        $project = $this->createProjectWithMembers();
        $newUser = User::factory()->create();

        $this->actingAsProjectManager();

        $response = $this->post(route('projects.members.add', $project, absolute: false), [
            'user_id' => $newUser->id,
        ]);
        $response->assertStatus(302);
    }

    public function test_project_manager_can_view_reports(): void
    {
        $this->actingAsProjectManager();

        $response = $this->get(route('reports.index', absolute: false));
        $response->assertStatus(200);
    }

    public function test_project_manager_can_manage_users(): void
    {
        $this->actingAsProjectManager();

        $response = $this->get(route('users.create', absolute: false));
        $response->assertStatus(200);
    }

    public function test_project_manager_cannot_delete_self(): void
    {
        $this->actingAsProjectManager();

        $response = $this->delete(route('users.destroy', $this->projectManager, absolute: false));
        $response->assertStatus(403);
    }

    public function test_project_manager_cannot_delete_super_admin(): void
    {
        $this->actingAsProjectManager();

        $response = $this->delete(route('users.destroy', $this->superAdmin, absolute: false));
        $response->assertStatus(403);
    }

    // ─── Super Admin Full Access ───

    public function test_super_admin_can_access_reports(): void
    {
        $this->actingAsSuperAdmin();

        $response = $this->get(route('reports.index', absolute: false));
        $response->assertStatus(200);
    }

    public function test_super_admin_can_export_reports(): void
    {
        $this->actingAsSuperAdmin();

        $response = $this->get(route('reports.export', absolute: false));
        $response->assertStatus(200);
    }

    public function test_super_admin_can_create_users(): void
    {
        $this->actingAsSuperAdmin();

        $response = $this->get(route('users.create', absolute: false));
        $response->assertStatus(200);
    }

    public function test_super_admin_can_delete_any_user(): void
    {
        $this->actingAsSuperAdmin();

        $response = $this->delete(route('users.destroy', $this->employee, absolute: false));
        $response->assertStatus(302);
    }

    public function test_super_admin_can_manage_integrations_on_any_project(): void
    {
        $project = $this->createProjectWithMembers();

        $this->actingAsSuperAdmin();

        $response = $this->get(route('projects.integrations.index', $project, absolute: false));
        $response->assertStatus(200);
    }

    public function test_super_admin_bypasses_all_policy_checks(): void
    {
        $project = Project::factory()->create([
            'author_id' => $this->employee->id,
        ]);

        $this->actingAsSuperAdmin();

        $response = $this->get(route('projects.edit', $project, absolute: false));
        $response->assertStatus(200);
    }
}
