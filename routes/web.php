<?php

use App\Http\Controllers\ActivityController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\AttachmentController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\IntegrationController;
use App\Http\Controllers\MeetingLogController;
use App\Http\Controllers\MilestoneController;
use App\Http\Controllers\MonitoringController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

// ─── Guest Routes (unauthenticated only) ───

Route::get('/test-auth', function () {
    return response()->json([
        'authenticated' => auth()->check(),
        'user' => auth()->user()?->email,
        'session_id' => session()->getId(),
        'cookie_name' => config('session.cookie'),
    ]);
});
Route::middleware('guest')->group(function () {
    Route::get('login', [AuthenticatedSessionController::class, 'create'])
        ->name('login');
    Route::post('login', [AuthenticatedSessionController::class, 'store'])
        ->middleware('throttle:100,15');

    Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])
        ->name('password.request');
    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])
        ->middleware('throttle:3,60')
        ->name('password.email');

    Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])
        ->name('password.reset');
    Route::post('reset-password', [NewPasswordController::class, 'store'])
        ->middleware('throttle:3,60')
        ->name('password.store');
});

// ─── Authenticated Routes (session required) ───

Route::middleware(['auth'])->group(function () {
    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');

    Route::get('permissions', [\App\Http\Controllers\PermissionController::class, 'index'])
        ->name('permissions.index');
    Route::get('permissions/users/{user}', [\App\Http\Controllers\PermissionController::class, 'show'])
        ->name('permissions.show');
    Route::put('permissions/users/{user}', [\App\Http\Controllers\PermissionController::class, 'update'])
        ->name('permissions.update');
    Route::put('permissions/users/{user}/role', [\App\Http\Controllers\PermissionController::class, 'updateRole'])
        ->name('permissions.users.role');
    Route::get('permissions/roles', [\App\Http\Controllers\PermissionController::class, 'roles'])
        ->name('permissions.roles');
    Route::put('permissions/roles/{role}', [\App\Http\Controllers\PermissionController::class, 'updateRolePermissions'])
        ->name('permissions.roles.update');

    Route::get('attachments/{media}/serve', [AttachmentController::class, 'serve'])
        ->name('attachments.serve');
    Route::get('attachments/{media}/thumbnail', [AttachmentController::class, 'thumbnail'])
        ->name('attachments.thumbnail');

    Route::get('/', [DashboardController::class, 'index'])
        ->name('dashboard');

    Route::get('monitoring', [MonitoringController::class, 'index'])
        ->name('monitoring');

    Route::resource('announcements', AnnouncementController::class);
    Route::get('profile', [ProfileController::class, 'edit'])
        ->name('profile.edit');
    Route::patch('profile', [ProfileController::class, 'update'])
        ->name('profile.update');
    Route::patch('profile/password', [ProfileController::class, 'updatePassword'])
        ->name('profile.password');
    Route::post('profile/avatar', [ProfileController::class, 'uploadAvatar'])
        ->name('profile.avatar.upload');
    Route::delete('profile/avatar', [ProfileController::class, 'deleteAvatar'])
        ->name('profile.avatar.delete');

    Route::resource('users', UserController::class);
    Route::patch('users/{user}/restore', [UserController::class, 'restore'])
        ->name('users.restore');
    Route::patch('users/{user}/toggle-active', [UserController::class, 'toggleActive'])
        ->name('users.toggle-active');
    Route::post('users/{user}/avatar', [UserController::class, 'uploadAvatar'])
        ->name('users.avatar.upload');
    Route::delete('users/{user}/avatar', [UserController::class, 'deleteAvatar'])
        ->name('users.avatar.delete');

    Route::resource('projects', ProjectController::class);
        Route::patch('projects/{project}/archive', [ProjectController::class, 'archive'])
            ->name('projects.archive');
        Route::patch('projects/{project}/status', [ProjectController::class, 'updateStatus'])
            ->name('projects.status');
        Route::patch('projects/{project}/restore', [ProjectController::class, 'restore'])
            ->name('projects.restore');
        Route::get('projects/{project}/members', [ProjectController::class, 'members'])
            ->name('projects.members');
        Route::post('projects/{project}/members', [ProjectController::class, 'addMember'])
            ->name('projects.members.add');
        Route::put('projects/{project}/members/{user}', [ProjectController::class, 'updateMemberRole'])
            ->name('projects.members.role');
        Route::delete('projects/{project}/members/{user}', [ProjectController::class, 'removeMember'])
            ->name('projects.members.remove');

        Route::post('projects/{project}/meeting-logs', [MeetingLogController::class, 'store'])
            ->name('projects.meeting-logs.store');
        Route::put('meeting-logs/{meeting_log}', [MeetingLogController::class, 'update'])
            ->name('meeting-logs.update');
        Route::delete('meeting-logs/{meeting_log}', [MeetingLogController::class, 'destroy'])
            ->name('meeting-logs.destroy');

        Route::post('projects/{project}/milestones', [MilestoneController::class, 'store'])
            ->name('projects.milestones.store');
        Route::put('milestones/{milestone}', [MilestoneController::class, 'update'])
            ->name('milestones.update');
        Route::delete('milestones/{milestone}', [MilestoneController::class, 'destroy'])
            ->name('milestones.destroy');

        Route::get('projects/{project}/integrations', [IntegrationController::class, 'index'])
            ->name('projects.integrations.index');
        Route::post('projects/{project}/integrations', [IntegrationController::class, 'store'])
            ->name('projects.integrations.store');
        Route::get('integrations/{integration}', [IntegrationController::class, 'show'])
            ->name('integrations.show');
        Route::put('integrations/{integration}', [IntegrationController::class, 'update'])
            ->name('integrations.update');
        Route::post('integrations/{integration}/toggle', [IntegrationController::class, 'toggle'])
            ->name('integrations.toggle');
        Route::delete('integrations/{integration}', [IntegrationController::class, 'destroy'])
            ->name('integrations.destroy');

        Route::resource('tasks', TaskController::class);
        Route::get('tasks/parents', [TaskController::class, 'parentTasks'])
            ->name('tasks.parents');
        Route::patch('tasks/{task}/status', [TaskController::class, 'updateStatus'])
            ->name('tasks.status');
        Route::post('tasks/{task}/assign', [TaskController::class, 'assign'])
            ->name('tasks.assign');
        Route::post('tasks/{task}/dependencies', [TaskController::class, 'addDependency'])
            ->name('tasks.dependencies.add');
        Route::delete('tasks/{task}/dependencies/{dependency}', [TaskController::class, 'removeDependency'])
            ->name('tasks.dependencies.remove');
        Route::post('tasks/{task}/submit-for-review', [TaskController::class, 'submitForReview'])
            ->name('tasks.submit-review');
        Route::post('tasks/{task}/approve', [TaskController::class, 'approveTask'])
            ->name('tasks.approve');
        Route::post('tasks/{task}/reject', [TaskController::class, 'rejectTask'])
            ->name('tasks.reject');
        Route::post('tasks/{task}/block', [TaskController::class, 'block'])
            ->name('tasks.block');
        Route::post('tasks/{task}/unblock', [TaskController::class, 'unblock'])
            ->name('tasks.unblock');
        Route::post('tasks/{task}/subtasks', [TaskController::class, 'createSubtask'])
            ->name('tasks.subtasks.store');
        Route::put('tasks/{task}/subtasks/{subtask}', [TaskController::class, 'updateSubtask'])
            ->name('tasks.subtasks.update');
        Route::delete('tasks/{task}/subtasks/{subtask}', [TaskController::class, 'deleteSubtask'])
            ->name('tasks.subtasks.destroy');
        Route::post('tasks/{task}/subtasks/bulk-delete', [TaskController::class, 'bulkDeleteSubtasks'])
            ->name('tasks.subtasks.bulk-delete');
        Route::post('tasks/{task}/attachments', [AttachmentController::class, 'storeTask'])
            ->name('tasks.attachments.upload');
        Route::delete('tasks/{task}/attachments/{media}', [AttachmentController::class, 'destroyTask'])
            ->name('tasks.attachments.delete');
        Route::post('projects/{project}/attachments', [AttachmentController::class, 'storeProject'])
            ->name('projects.attachments.upload');
        Route::delete('projects/{project}/attachments/{media}', [AttachmentController::class, 'destroyProject'])
            ->name('projects.attachments.delete');

        Route::post('tasks/{task}/comments', [CommentController::class, 'store'])
            ->name('comments.store');
        Route::put('comments/{comment}', [CommentController::class, 'update'])
            ->name('comments.update');
        Route::delete('comments/{comment}', [CommentController::class, 'destroy'])
            ->name('comments.destroy');

        Route::get('notifications', [NotificationController::class, 'index'])
            ->name('notifications.index');
        Route::post('notifications/{id}/read', [NotificationController::class, 'markAsRead'])
            ->name('notifications.read');
        Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead'])
            ->name('notifications.read-all');

        Route::get('activity', [ActivityController::class, 'index'])
            ->name('activity.index');
        Route::get('tasks/{task}/activity', [ActivityController::class, 'task'])
            ->name('activity.task');

        Route::get('integration-types', [IntegrationController::class, 'types'])
            ->name('integrations.types');
        Route::get('integration-types/{type}/fields', [IntegrationController::class, 'formFields'])
            ->name('integrations.form-fields');
        Route::get('generate-email-hook', [IntegrationController::class, 'generateEmailHook'])
            ->name('integrations.generate-email-hook');

        Route::get('reports', [ReportController::class, 'index'])
            ->name('reports.index');
        Route::get('reports/project/{project}/preview', [ReportController::class, 'projectPreview'])
            ->name('reports.project.preview');
        Route::get('reports/export', [ReportController::class, 'export'])
            ->name('reports.export');
        Route::get('/test-auth', function () {

    return [

        'authenticated' => auth()->check(),

        'user' => auth()->user()?->email,

        'session_id' => session()->getId(),

    ];

});
});
