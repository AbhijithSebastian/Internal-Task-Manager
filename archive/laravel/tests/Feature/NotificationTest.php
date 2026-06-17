<?php

namespace Tests\Feature;

use App\Enums\TaskStatus;
use App\Models\Task;
use App\Notifications\TaskAssignedNotification;
use App\Notifications\TaskStatusChangedNotification;
use App\Notifications\TaskApprovedNotification;
use App\Notifications\TaskPendingReviewNotification;
use App\Notifications\TaskRejectedNotification;
use App\Notifications\ProjectAssignedNotification;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Notification::fake();
    }

    // ─── Single Notification on Task Create ───

    public function test_single_notification_on_task_creation_when_assigned(): void
    {
        $project = $this->createProjectWithMembers();

        $this->actingAsProjectManager();

        $this->post(route('tasks.store', absolute: false), [
            'title' => 'New Task',
            'project_id' => $project->id,
            'assignee_id' => $this->employee->id,
        ]);

        Notification::assertSentTo(
            [$this->employee],
            TaskAssignedNotification::class,
            fn ($notification, $channels, $notifiable) => true,
        );

        Notification::assertSentToTimes(
            $this->employee,
            TaskAssignedNotification::class,
            1,
        );
    }

    public function test_no_notification_when_self_assigning_task_on_create(): void
    {
        $project = $this->createProjectWithMembers();

        $this->actingAsProjectManager();

        $this->post(route('tasks.store', absolute: false), [
            'title' => 'My Own Task',
            'project_id' => $project->id,
            'assignee_id' => $this->projectManager->id,
        ]);

        Notification::assertNothingSent();
    }

    // ─── Single Notification on Task Assign ───

    public function test_single_notification_on_task_assign(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
        ]);

        $this->actingAsProjectManager();

        $this->post(route('tasks.assign', $task, absolute: false), [
            'assignee_id' => $this->employee->id,
        ]);

        Notification::assertSentTo(
            $this->employee,
            TaskAssignedNotification::class,
        );

        Notification::assertSentToTimes(
            $this->employee,
            TaskAssignedNotification::class,
            1,
        );
    }

    // ─── Single Notification on Status Change ───

    public function test_single_notification_on_task_status_change(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
            'assignee_id' => $this->employee->id,
            'status' => TaskStatus::Todo,
        ]);

        $this->actingAsProjectManager();

        $this->patch(route('tasks.status', $task, absolute: false), [
            'status' => 'in_progress',
        ]);

        Notification::assertSentTo(
            $this->employee,
            TaskStatusChangedNotification::class,
        );

        Notification::assertSentToTimes(
            $this->employee,
            TaskStatusChangedNotification::class,
            1,
        );
    }

    // ─── Approval Notifications ───

    public function test_notification_on_submit_for_review(): void
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

        $this->post(route('tasks.submit-review', $task, absolute: false));

        Notification::assertSentTo(
            $this->projectManager,
            TaskPendingReviewNotification::class,
        );
    }

    public function test_notification_on_approve(): void
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

        Notification::assertSentTo(
            $this->employee,
            TaskApprovedNotification::class,
        );
    }

    public function test_notification_on_reject(): void
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
            'rejection_reason' => 'Needs work',
        ]);

        Notification::assertSentTo(
            $this->employee,
            TaskRejectedNotification::class,
        );
    }

    // ─── Project Assignment Notifications ───

    public function test_notification_when_assigned_as_pm(): void
    {
        $this->actingAsSuperAdmin();

        $this->post(route('projects.store', absolute: false), [
            'name' => 'PM Notification Project',
            'pm_id' => $this->projectManager->id,
        ]);

        Notification::assertSentTo(
            $this->projectManager,
            ProjectAssignedNotification::class,
        );
    }

    // ─── Notification List ───

    public function test_user_can_view_own_notifications(): void
    {
        $this->actingAsEmployee();

        $response = $this->get(route('notifications.index', absolute: false));
        $response->assertStatus(200);
    }

    public function test_user_can_mark_notification_as_read(): void
    {
        $notification = $this->employee->notifications()->create([
            'id' => \Illuminate\Support\Str::uuid(),
            'type' => TaskAssignedNotification::class,
            'data' => ['message' => 'Test'],
        ]);

        $this->actingAsEmployee();

        $response = $this->post(route('notifications.read', $notification->id, absolute: false));

        $response->assertStatus(302);
        $this->assertNotNull($notification->fresh()->read_at);
    }

    public function test_user_can_mark_all_notifications_as_read(): void
    {
        $this->employee->notifications()->create([
            'id' => \Illuminate\Support\Str::uuid(),
            'type' => TaskAssignedNotification::class,
            'data' => ['message' => 'Test 1'],
        ]);
        $this->employee->notifications()->create([
            'id' => \Illuminate\Support\Str::uuid(),
            'type' => TaskStatusChangedNotification::class,
            'data' => ['message' => 'Test 2'],
        ]);

        $this->actingAsEmployee();

        $response = $this->post(route('notifications.read-all', absolute: false));

        $response->assertStatus(302);
        $this->assertEquals(0, $this->employee->fresh()->unreadNotifications->count());
    }
}
