<?php

namespace Tests\Feature;

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Tests\TestCase;

class TaskTest extends TestCase
{
    // ─── Create ───

    public function test_can_create_task(): void
    {
        $project = $this->createProjectWithMembers();

        $this->actingAsProjectManager();

        $response = $this->post(route('tasks.store', absolute: false), [
            'title' => 'New Task',
            'description' => 'Task description',
            'priority' => 'high',
            'project_id' => $project->id,
            'assignee_id' => $this->employee->id,
        ]);

        $response->assertRedirect(route('tasks.index', absolute: false));
        $this->assertDatabaseHas('tasks', ['title' => 'New Task']);
    }

    public function test_create_task_defaults_to_backlog(): void
    {
        $project = $this->createProjectWithMembers();

        $this->actingAsProjectManager();

        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
        ]);

        $this->assertEquals(TaskStatus::Backlog, $task->status);
    }

    public function test_create_task_requires_title(): void
    {
        $project = $this->createProjectWithMembers();

        $this->actingAsProjectManager();

        $response = $this->post(route('tasks.store', absolute: false), [
            'project_id' => $project->id,
        ]);

        $response->assertSessionHasErrors('title');
    }

    public function test_create_task_requires_project_id(): void
    {
        $this->actingAsProjectManager();

        $response = $this->post(route('tasks.store', absolute: false), [
            'title' => 'No Project Task',
        ]);

        $response->assertSessionHasErrors('project_id');
    }

    public function test_non_member_cannot_create_task_in_project(): void
    {
        $project = Project::factory()->create(['author_id' => $this->projectManager->id]);
        $outsider = User::factory()->create();
        $outsider->assignRole(\App\Enums\UserRole::Employee->value);

        $this->actingAs($outsider);

        $response = $this->post(route('tasks.store', absolute: false), [
            'title' => 'Outsider Task',
            'project_id' => $project->id,
        ]);

        $response->assertStatus(403);
    }

    // ─── Read / View ───

    public function test_task_list_is_accessible(): void
    {
        $this->createProjectWithMembers();

        $this->actingAsProjectManager();

        $response = $this->get(route('tasks.index', absolute: false));
        $response->assertStatus(200);
    }

    public function test_task_show_is_accessible_to_assignee(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
            'assignee_id' => $this->employee->id,
        ]);

        $this->actingAsEmployee();

        $response = $this->get(route('tasks.show', $task, absolute: false));
        $response->assertStatus(200);
    }

    public function test_task_show_is_inaccessible_to_non_member(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
        ]);
        $outsider = User::factory()->create();
        $outsider->assignRole(\App\Enums\UserRole::Employee->value);

        $this->actingAs($outsider);

        $response = $this->get(route('tasks.show', $task, absolute: false));
        $response->assertStatus(403);
    }

    // ─── Update ───

    public function test_can_update_task(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
        ]);

        $this->actingAsProjectManager();

        $response = $this->put(route('tasks.update', $task, absolute: false), [
            'title' => 'Updated Title',
        ]);

        $response->assertRedirect(route('tasks.index', absolute: false));
        $this->assertEquals('Updated Title', $task->fresh()->title);
    }

    public function test_assignee_can_update_task(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
            'assignee_id' => $this->employee->id,
        ]);

        $this->actingAsEmployee();

        $response = $this->put(route('tasks.update', $task, absolute: false), [
            'title' => 'Updated by Assignee',
        ]);

        $response->assertStatus(302);
        $this->assertEquals('Updated by Assignee', $task->fresh()->title);
    }

    // ─── Assign ───

    public function test_can_assign_task(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
        ]);

        $this->actingAsProjectManager();

        $response = $this->post(route('tasks.assign', $task, absolute: false), [
            'assignee_id' => $this->employee->id,
        ]);

        $response->assertStatus(302);
        $this->assertEquals($this->employee->id, $task->fresh()->assignee_id);
    }

    public function test_non_manager_cannot_assign_task(): void
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

    // ─── Status Transitions ───

    public function test_can_update_task_status(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
            'status' => 'todo',
        ]);

        $this->actingAsProjectManager();

        $response = $this->patch(route('tasks.status', $task, absolute: false), [
            'status' => 'in_progress',
        ]);

        $response->assertStatus(302);
        $this->assertEquals(TaskStatus::InProgress, $task->fresh()->status);
    }

    public function test_can_block_task(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
            'assignee_id' => $this->employee->id,
        ]);

        $this->actingAsProjectManager();

        $response = $this->post(route('tasks.block', $task, absolute: false), [
            'blocked_reason' => 'Waiting for API key',
        ]);

        $response->assertStatus(302);
        $this->assertEquals(TaskStatus::Blocked, $task->fresh()->status);
        $this->assertEquals('Waiting for API key', $task->fresh()->blocked_reason);
    }

    public function test_can_unblock_task(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
            'status' => TaskStatus::Blocked,
            'blocked_reason' => 'Blocked',
        ]);

        $this->actingAsProjectManager();

        $response = $this->post(route('tasks.unblock', $task, absolute: false));

        $response->assertStatus(302);
        $this->assertEquals(TaskStatus::Todo, $task->fresh()->status);
        $this->assertNull($task->fresh()->blocked_reason);
    }

    public function test_block_requires_reason(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
        ]);

        $this->actingAsProjectManager();

        $response = $this->post(route('tasks.block', $task, absolute: false), []);

        $response->assertSessionHasErrors('blocked_reason');
    }

    public function test_assignee_can_block_own_task(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
            'assignee_id' => $this->employee->id,
        ]);

        $this->actingAsEmployee();

        $response = $this->post(route('tasks.block', $task, absolute: false), [
            'blocked_reason' => 'Blocked by assignee',
        ]);

        $response->assertStatus(302);
        $this->assertEquals(TaskStatus::Blocked, $task->fresh()->status);
    }

    // ─── Dependencies ───

    public function test_can_add_dependency(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
        ]);
        $dependency = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
        ]);

        $this->actingAsProjectManager();

        $response = $this->post(route('tasks.dependencies.add', $task, absolute: false), [
            'dependency_id' => $dependency->id,
        ]);

        $response->assertStatus(302);
        $this->assertTrue($task->fresh()->dependencies->contains($dependency));
    }

    public function test_can_remove_dependency(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
        ]);
        $dependency = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
        ]);

        $task->dependencies()->attach($dependency->id);

        $this->actingAsProjectManager();

        $response = $this->delete(route('tasks.dependencies.remove', [$task, $dependency], absolute: false));

        $response->assertStatus(302);
        $this->assertFalse($task->fresh()->dependencies->contains($dependency));
    }

    // ─── Validation ───

    public function test_create_task_validates_priority(): void
    {
        $project = $this->createProjectWithMembers();

        $this->actingAsProjectManager();

        $response = $this->post(route('tasks.store', absolute: false), [
            'title' => 'Invalid Priority',
            'project_id' => $project->id,
            'priority' => 'super-urgent',
        ]);

        $response->assertSessionHasErrors('priority');
    }

    public function test_status_update_validates_value(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
        ]);

        $this->actingAsProjectManager();

        $response = $this->patch(route('tasks.status', $task, absolute: false), [
            'status' => 'nonexistent',
        ]);

        $response->assertSessionHasErrors('status');
    }

    // ─── Delete ───

    public function test_author_can_delete_task(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
        ]);

        $this->actingAsProjectManager();

        $response = $this->delete(route('tasks.destroy', $task, absolute: false));

        $response->assertRedirect(route('tasks.index', absolute: false));
        $this->assertSoftDeleted($task);
    }

    public function test_non_author_cannot_delete_task(): void
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
}
