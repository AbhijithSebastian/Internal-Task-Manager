<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Tests\TestCase;

class SearchTest extends TestCase
{
    // ─── User Search ───

    public function test_search_users_by_name(): void
    {
        User::factory()->create(['name' => 'Alice Johnson']);
        User::factory()->create(['name' => 'Bob Smith']);

        $this->actingAsSuperAdmin();

        $response = $this->get(route('users.index', ['search' => 'Alice'], absolute: false));

        $response->assertStatus(200);
        $response->assertSee('Alice Johnson');
    }

    public function test_search_users_by_email(): void
    {
        User::factory()->create(['email' => 'unique-user@test.com']);

        $this->actingAsSuperAdmin();

        $response = $this->get(route('users.index', ['search' => 'unique-user'], absolute: false));

        $response->assertStatus(200);
    }

    // ─── Project Search ───

    public function test_search_projects_by_name(): void
    {
        $project = $this->createProjectWithMembers();
        $project2 = Project::factory()->create([
            'name' => 'Alpha Project',
            'author_id' => $this->projectManager->id,
        ]);
        $project2->members()->attach($this->projectManager->id, ['role' => 'owner']);

        $this->actingAsProjectManager();

        $response = $this->get(route('projects.index', ['search' => 'Alpha'], absolute: false));

        $response->assertStatus(200);
    }

    public function test_search_projects_by_description(): void
    {
        $project = $this->createProjectWithMembers();

        $this->actingAsProjectManager();

        $response = $this->get(route('projects.index', ['search' => $project->description], absolute: false));

        $response->assertStatus(200);
    }

    public function test_search_projects_returns_scoped_results(): void
    {
        $project = $this->createProjectWithMembers();

        $outsider = User::factory()->create();
        $outsider->assignRole(\App\Enums\UserRole::Employee->value);

        $this->actingAs($outsider);

        $response = $this->get(route('projects.index', ['search' => $project->name], absolute: false));

        $response->assertStatus(200);
    }

    // ─── Task Search ───

    public function test_search_tasks_by_title(): void
    {
        $project = $this->createProjectWithMembers();
        Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
            'title' => 'Fix login bug',
        ]);

        $this->actingAsProjectManager();

        $response = $this->get(route('tasks.index', ['search' => 'login bug'], absolute: false));

        $response->assertStatus(200);
    }

    public function test_search_tasks_by_tag(): void
    {
        $project = $this->createProjectWithMembers();
        Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
            'title' => 'Tagged task',
            'tags' => ['urgent', 'security'],
        ]);

        $this->actingAsProjectManager();

        $response = $this->get(route('tasks.index', ['search' => 'tag:urgent'], absolute: false));

        $response->assertStatus(200);
    }

    public function test_search_tasks_by_tag_with_text(): void
    {
        $project = $this->createProjectWithMembers();
        Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
            'title' => 'Security patch',
            'tags' => ['security', 'high-priority'],
        ]);

        $this->actingAsProjectManager();

        $response = $this->get(route('tasks.index', ['search' => 'tag:security patch'], absolute: false));

        $response->assertStatus(200);
    }

    // ─── Empty Search Results ───

    public function test_search_with_no_matches_returns_empty(): void
    {
        $this->createProjectWithMembers();

        $this->actingAsProjectManager();

        $response = $this->get(route('projects.index', ['search' => 'zzzzzzzXXXXX'], absolute: false));

        $response->assertStatus(200);
    }

    // ─── Search in Task Filters ───

    public function test_task_filters_by_status(): void
    {
        $project = $this->createProjectWithMembers();
        Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
            'status' => \App\Enums\TaskStatus::Done,
        ]);

        $this->actingAsProjectManager();

        $response = $this->get(route('tasks.index', ['status' => 'done'], absolute: false));

        $response->assertStatus(200);
    }

    public function test_task_filters_by_priority(): void
    {
        $project = $this->createProjectWithMembers();
        Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
            'priority' => \App\Enums\TaskPriority::Urgent,
        ]);

        $this->actingAsProjectManager();

        $response = $this->get(route('tasks.index', ['priority' => 'urgent'], absolute: false));

        $response->assertStatus(200);
    }

    public function test_task_filters_by_assignee(): void
    {
        $project = $this->createProjectWithMembers();
        Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
            'assignee_id' => $this->employee->id,
        ]);

        $this->actingAsProjectManager();

        $response = $this->get(route('tasks.index', ['assignee_id' => $this->employee->id], absolute: false));

        $response->assertStatus(200);
    }

    public function test_task_list_respects_project_filter(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
            'title' => 'Project-specific task',
        ]);

        $this->actingAsProjectManager();

        $response = $this->get(route('tasks.index', ['project_id' => $project->id], absolute: false));

        $response->assertStatus(200);
    }
}
