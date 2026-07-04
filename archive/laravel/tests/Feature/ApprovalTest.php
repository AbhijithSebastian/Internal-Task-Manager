<?php

namespace Tests\Feature;

use App\Enums\TaskStatus;
use App\Models\Task;
use Tests\TestCase;

class ApprovalTest extends TestCase
{
    // ─── Submit for Review ───

    public function test_assignee_can_submit_task_for_review(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
            'assignee_id' => $this->employee->id,
            'requires_approval' => true,
            'approver_id' => $this->projectManager->id,
            'status' => TaskStatus::InProgress,
        ]);

        $this->actingAsEmployee();

        $response = $this->post(route('tasks.submit-review', $task, absolute: false));

        $response->assertStatus(302);
        $this->assertEquals(TaskStatus::InReview, $task->fresh()->status);
    }

    public function test_non_assignee_cannot_submit_for_review(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
            'assignee_id' => $this->employee->id,
            'requires_approval' => true,
            'approver_id' => $this->projectManager->id,
            'status' => TaskStatus::InProgress,
        ]);

        $this->actingAsTeamLead();

        $response = $this->post(route('tasks.submit-review', $task, absolute: false));

        $response->assertStatus(403);
    }

    public function test_cannot_submit_task_without_requires_approval(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
            'assignee_id' => $this->employee->id,
            'requires_approval' => false,
        ]);

        $this->actingAsEmployee();

        $response = $this->post(route('tasks.submit-review', $task, absolute: false));

        $response->assertSessionHas('error');
    }

    // ─── Approve ───

    public function test_approver_can_approve_task(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
            'assignee_id' => $this->employee->id,
            'requires_approval' => true,
            'approver_id' => $this->projectManager->id,
            'status' => TaskStatus::InReview,
        ]);

        $this->actingAsProjectManager();

        $response = $this->post(route('tasks.approve', $task, absolute: false));

        $response->assertStatus(302);
        $this->assertEquals(TaskStatus::Approved, $task->fresh()->status);
        $this->assertNotNull($task->fresh()->approved_at);
    }

    public function test_approver_sets_approved_at_timestamp(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
            'assignee_id' => $this->employee->id,
            'requires_approval' => true,
            'approver_id' => $this->projectManager->id,
            'status' => TaskStatus::InReview,
        ]);

        $this->actingAsProjectManager();

        $this->post(route('tasks.approve', $task, absolute: false));

        $this->assertNotNull($task->fresh()->approved_at);
    }

    public function test_employee_cannot_approve_task(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
            'assignee_id' => $this->employee->id,
            'requires_approval' => true,
            'approver_id' => $this->projectManager->id,
            'status' => TaskStatus::InReview,
        ]);

        $this->actingAsEmployee();

        $response = $this->post(route('tasks.approve', $task, absolute: false));

        $response->assertStatus(403);
    }

    // ─── Reject ───

    public function test_approver_can_reject_task(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
            'assignee_id' => $this->employee->id,
            'requires_approval' => true,
            'approver_id' => $this->projectManager->id,
            'status' => TaskStatus::InReview,
        ]);

        $this->actingAsProjectManager();

        $response = $this->post(route('tasks.reject', $task, absolute: false), [
            'rejection_reason' => 'Needs more testing',
        ]);

        $response->assertStatus(302);
        $this->assertEquals(TaskStatus::InProgress, $task->fresh()->status);
        $this->assertEquals('Needs more testing', $task->fresh()->rejection_reason);
    }

    public function test_reject_returns_task_to_in_progress(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
            'assignee_id' => $this->employee->id,
            'requires_approval' => true,
            'approver_id' => $this->projectManager->id,
            'status' => TaskStatus::InReview,
        ]);

        $this->actingAsProjectManager();

        $this->post(route('tasks.reject', $task, absolute: false), [
            'rejection_reason' => 'Incomplete',
        ]);

        $this->assertEquals(TaskStatus::InProgress, $task->fresh()->status);
    }

    public function test_reject_requires_reason(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
            'assignee_id' => $this->employee->id,
            'requires_approval' => true,
            'approver_id' => $this->projectManager->id,
            'status' => TaskStatus::InReview,
        ]);

        $this->actingAsProjectManager();

        $response = $this->post(route('tasks.reject', $task, absolute: false), []);

        $response->assertSessionHasErrors('rejection_reason');
    }

    public function test_employee_cannot_reject_task(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
            'assignee_id' => $this->employee->id,
            'requires_approval' => true,
            'approver_id' => $this->projectManager->id,
            'status' => TaskStatus::InReview,
        ]);

        $this->actingAsEmployee();

        $response = $this->post(route('tasks.reject', $task, absolute: false), [
            'rejection_reason' => 'Bad',
        ]);

        $response->assertStatus(403);
    }

    // ─── Unauthorized Access Prevention ───

    public function test_user_without_approve_permission_cannot_approve_task(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
            'assignee_id' => $this->employee->id,
            'requires_approval' => true,
            'approver_id' => $this->teamLead->id,
            'status' => TaskStatus::InReview,
        ]);

        $this->actingAsEmployee();

        $response = $this->post(route('tasks.approve', $task, absolute: false));

        $response->assertStatus(403);
    }

    public function test_team_lead_cannot_approve_task_even_if_approver(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
            'assignee_id' => $this->employee->id,
            'requires_approval' => true,
            'approver_id' => $this->teamLead->id,
            'status' => TaskStatus::InReview,
        ]);

        $this->actingAsTeamLead();

        $response = $this->post(route('tasks.approve', $task, absolute: false));

        $response->assertStatus(403);
    }
}
