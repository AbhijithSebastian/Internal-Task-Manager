<?php

namespace Tests\Feature;

use App\Enums\TaskStatus;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Services\Task\TaskService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskServiceTest extends TestCase
{
    use RefreshDatabase;

    private TaskService $taskService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->taskService = app(TaskService::class);
    }

    public function test_can_create_task(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['author_id' => $user->id]);
        $project->members()->attach($user->id);

        $this->actingAs($user);

        $task = $this->taskService->create([
            'title' => 'Test Task',
            'project_id' => $project->id,
        ]);

        $this->assertDatabaseHas('tasks', ['title' => 'Test Task']);
        $this->assertEquals(TaskStatus::Backlog, $task->status);
    }

    public function test_can_update_task_status(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['author_id' => $user->id]);
        $project->members()->attach($user->id);
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $user->id,
            'status' => TaskStatus::Todo,
        ]);

        $updated = $this->taskService->updateStatus($task, TaskStatus::InProgress);

        $this->assertEquals(TaskStatus::InProgress, $updated->status);
    }

    public function test_can_assign_task(): void
    {
        $user = User::factory()->create();
        $assignee = User::factory()->create();
        $project = Project::factory()->create(['author_id' => $user->id]);
        $project->members()->attach($user->id);
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $user->id,
        ]);

        $assigned = $this->taskService->assign($task, $assignee);

        $this->assertEquals($assignee->id, $assigned->assignee_id);
    }
}
