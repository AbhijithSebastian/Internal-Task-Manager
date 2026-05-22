<?php

namespace Tests\Feature;

use App\Enums\TaskStatus;
use App\Models\Task;
use Tests\TestCase;

class SubtaskTest extends TestCase
{
    // ─── Create ───

    public function test_can_create_subtask(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
        ]);

        $this->actingAsProjectManager();

        $response = $this->post(route('tasks.subtasks.store', $task, absolute: false), [
            'title' => 'Subtask One',
            'description' => 'Subtask description',
            'priority' => 'medium',
        ]);

        $response->assertStatus(302);
        $this->assertDatabaseHas('tasks', [
            'title' => 'Subtask One',
            'parent_id' => $task->id,
        ]);
    }

    public function test_subtask_inherits_project(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
        ]);

        $this->actingAsProjectManager();

        $this->post(route('tasks.subtasks.store', $task, absolute: false), [
            'title' => 'Subtask',
        ]);

        $subtask = Task::where('title', 'Subtask')->first();
        $this->assertEquals($project->id, $subtask->project_id);
        $this->assertEquals($task->id, $subtask->parent_id);
    }

    public function test_create_subtask_requires_title(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
        ]);

        $this->actingAsProjectManager();

        $response = $this->post(route('tasks.subtasks.store', $task, absolute: false), []);

        $response->assertSessionHasErrors('title');
    }

    public function test_assignee_can_create_subtask(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
            'assignee_id' => $this->employee->id,
        ]);

        $this->actingAsEmployee();

        $response = $this->post(route('tasks.subtasks.store', $task, absolute: false), [
            'title' => 'Assignee Subtask',
        ]);

        $response->assertStatus(302);
    }

    public function test_non_member_cannot_create_subtask(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
        ]);
        $outsider = \App\Models\User::factory()->create();
        $outsider->assignRole(\App\Enums\UserRole::Employee->value);

        $this->actingAs($outsider);

        $response = $this->post(route('tasks.subtasks.store', $task, absolute: false), [
            'title' => 'Outsider Subtask',
        ]);

        $response->assertStatus(403);
    }

    // ─── Update ───

    public function test_can_update_subtask(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
        ]);
        $subtask = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
            'parent_id' => $task->id,
            'title' => 'Original Title',
        ]);

        $this->actingAsProjectManager();

        $response = $this->put(route('tasks.subtasks.update', [$task, $subtask], absolute: false), [
            'title' => 'Updated Subtask Title',
        ]);

        $response->assertStatus(302);
        $this->assertEquals('Updated Subtask Title', $subtask->fresh()->title);
    }

    // ─── Completion Logic ───

    public function test_completing_all_subtasks_logs_activity(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
        ]);
        $subtask1 = Task::factory()->create([
            'project_id' => $project->id,
            'parent_id' => $task->id,
            'status' => TaskStatus::Done,
            'author_id' => $this->projectManager->id,
        ]);
        $subtask2 = Task::factory()->create([
            'project_id' => $project->id,
            'parent_id' => $task->id,
            'status' => TaskStatus::Todo,
            'author_id' => $this->projectManager->id,
        ]);

        $this->actingAsProjectManager();

        $response = $this->patch(route('tasks.status', $subtask2, absolute: false), [
            'status' => 'done',
        ]);

        $response->assertStatus(302);
    }

    // ─── Delete ───

    public function test_can_delete_subtask(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
        ]);
        $subtask = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
            'parent_id' => $task->id,
        ]);

        $this->actingAsProjectManager();

        $response = $this->delete(route('tasks.subtasks.destroy', [$task, $subtask], absolute: false));

        $response->assertStatus(302);
        $this->assertSoftDeleted($subtask);
    }
}
