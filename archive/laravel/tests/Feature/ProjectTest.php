<?php

namespace Tests\Feature;

use App\Enums\ProjectStatus;
use App\Models\Project;
use App\Models\User;
use Tests\TestCase;

class ProjectTest extends TestCase
{
    // ─── Create ───

    public function test_project_manager_can_create_project(): void
    {
        $this->actingAsProjectManager();

        $response = $this->post(route('projects.store', absolute: false), [
            'name' => 'New Test Project',
            'description' => 'Project description',
            'priority' => 'high',
            'start_date' => '2026-01-01',
            'end_date' => '2026-06-30',
            'member_ids' => [$this->teamLead->id, $this->employee->id],
        ]);

        $response->assertRedirect(route('projects.index', absolute: false));
        $this->assertDatabaseHas('projects', ['name' => 'New Test Project']);
    }

    public function test_create_project_adds_creator_as_owner_member(): void
    {
        $this->actingAsProjectManager();

        $project = $this->projectManager->projects()->first();

        $this->post(route('projects.store', absolute: false), [
            'name' => 'Owner Test Project',
        ]);

        $created = Project::where('name', 'Owner Test Project')->first();
        $this->assertNotNull($created);
        $this->assertTrue($created->members->contains($this->projectManager));
    }

    public function test_create_project_requires_name(): void
    {
        $this->actingAsProjectManager();

        $response = $this->post(route('projects.store', absolute: false), []);

        $response->assertSessionHasErrors('name');
    }

    // ─── Read / View ───

    public function test_project_list_is_accessible(): void
    {
        $this->createProjectWithMembers();

        $this->actingAsProjectManager();

        $response = $this->get(route('projects.index', absolute: false));
        $response->assertStatus(200);
    }

    public function test_project_show_is_accessible_to_member(): void
    {
        $project = $this->createProjectWithMembers();

        $this->actingAsEmployee();

        $response = $this->get(route('projects.show', $project, absolute: false));
        $response->assertStatus(200);
    }

    public function test_project_show_is_accessible_to_author(): void
    {
        $project = $this->createProjectWithMembers();

        $this->actingAsProjectManager();

        $response = $this->get(route('projects.show', $project, absolute: false));
        $response->assertStatus(200);
    }

    // ─── Update ───

    public function test_owner_can_update_project(): void
    {
        $project = $this->createProjectWithMembers();

        $this->actingAsProjectManager();

        $response = $this->put(route('projects.update', $project, absolute: false), [
            'name' => 'Updated Name',
            'description' => 'Updated description',
        ]);

        $response->assertRedirect(route('projects.index', absolute: false));
        $this->assertEquals('Updated Name', $project->fresh()->name);
    }

    public function test_non_owner_cannot_update_project(): void
    {
        $project = $this->createProjectWithMembers();

        $this->actingAsEmployee();

        $response = $this->put(route('projects.update', $project, absolute: false), [
            'name' => 'Hacked Name',
        ]);

        $response->assertStatus(403);
    }

    // ─── Archive ───

    public function test_owner_can_archive_project(): void
    {
        $project = $this->createProjectWithMembers();

        $this->actingAsProjectManager();

        $response = $this->patch(route('projects.archive', $project, absolute: false));

        $response->assertStatus(302);
        $this->assertEquals(ProjectStatus::Archived, $project->fresh()->status);
    }

    public function test_employee_cannot_archive_project(): void
    {
        $project = $this->createProjectWithMembers();

        $this->actingAsEmployee();

        $response = $this->patch(route('projects.archive', $project, absolute: false));

        $response->assertStatus(403);
    }

    // ─── Delete ───

    public function test_owner_can_delete_project(): void
    {
        $project = $this->createProjectWithMembers();

        $this->actingAsProjectManager();

        $response = $this->delete(route('projects.destroy', $project, absolute: false));

        $response->assertRedirect(route('projects.index', absolute: false));
        $this->assertSoftDeleted($project);
    }

    public function test_employee_cannot_delete_project(): void
    {
        $project = $this->createProjectWithMembers();

        $this->actingAsEmployee();

        $response = $this->delete(route('projects.destroy', $project, absolute: false));

        $response->assertStatus(403);
    }

    // ─── Member Assignment ───

    public function test_owner_can_add_member(): void
    {
        $project = $this->createProjectWithMembers();
        $newUser = User::factory()->create();

        $this->actingAsProjectManager();

        $response = $this->post(route('projects.members.add', $project, absolute: false), [
            'user_id' => $newUser->id,
        ]);

        $response->assertStatus(302);
        $this->assertTrue($project->fresh()->members->contains($newUser));
    }

    public function test_owner_can_remove_member(): void
    {
        $project = $this->createProjectWithMembers();

        $this->actingAsProjectManager();

        $response = $this->delete(route('projects.members.remove', [$project, $this->employee], absolute: false));

        $response->assertStatus(302);
        $this->assertFalse($project->fresh()->members->contains($this->employee));
    }

    public function test_owner_can_update_member_role(): void
    {
        $project = $this->createProjectWithMembers();

        $this->actingAsProjectManager();

        $response = $this->put(route('projects.members.role', [$project, $this->teamLead], absolute: false), [
            'role' => 'manager',
        ]);

        $response->assertStatus(302);

        $membership = $project->fresh()->members()->where('user_id', $this->teamLead->id)->first();
        $this->assertEquals('manager', $membership->pivot->role);
    }

    public function test_non_member_cannot_view_project(): void
    {
        $project = $this->createProjectWithMembers();
        $outsider = User::factory()->create();
        $outsider->assignRole(\App\Enums\UserRole::Employee->value);

        $this->actingAs($outsider);

        $response = $this->get(route('projects.show', $project, absolute: false));
        $response->assertStatus(403);
    }

    // ─── Status Update ───

    public function test_owner_can_update_project_status(): void
    {
        $project = $this->createProjectWithMembers();

        $this->actingAsProjectManager();

        $response = $this->patch(route('projects.status', $project, absolute: false), [
            'status' => 'on_hold',
        ]);

        $response->assertStatus(302);
        $this->assertEquals(ProjectStatus::OnHold, $project->fresh()->status);
    }

    public function test_project_status_requires_valid_value(): void
    {
        $project = $this->createProjectWithMembers();

        $this->actingAsProjectManager();

        $response = $this->patch(route('projects.status', $project, absolute: false), [
            'status' => 'invalid_status',
        ]);

        $response->assertSessionHasErrors('status');
    }
}
