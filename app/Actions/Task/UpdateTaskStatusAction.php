<?php

namespace App\Actions\Task;

use App\Enums\TaskStatus;
use App\Exceptions\BusinessException;
use App\Models\Task;

class UpdateTaskStatusAction
{
    public function execute(Task $task, TaskStatus $newStatus): Task
    {
        $oldStatus = $task->status;

        if ($oldStatus === $newStatus) {
            return $task;
        }

        $this->validateTransition($oldStatus, $newStatus);

        if ($newStatus === TaskStatus::Done) {
            $this->validateDependencies($task);
            $this->validateSubtasks($task);
        }

        $task->update([
            'status' => $newStatus,
            'blocked_reason' => $newStatus === TaskStatus::Blocked ? ($task->blocked_reason ?? request('blocked_reason')) : null,
        ]);

        if ($task->subtasks()->exists() && in_array($newStatus, [TaskStatus::Cancelled, TaskStatus::Blocked])) {
            $task->subtasks()->update(['status' => $newStatus]);
        }

        log_activity($task, 'Task status changed', [
            'old' => $oldStatus->value,
            'new' => $newStatus->value,
            'changed_by' => auth()->user()?->name,
        ]);

        return $task->fresh();
    }

    private function validateSubtasks(Task $task): void
    {
        $incomplete = $task->subtasks()
            ->whereNotIn('status', [TaskStatus::Done, TaskStatus::Cancelled])
            ->count();

        if ($incomplete > 0) {
            throw new BusinessException(
                message: 'Cannot mark task as done with incomplete subtasks.',
                publicMessage: __('tasks.subtasks_incomplete'),
            );
        }
    }

    private function validateTransition(TaskStatus $current, TaskStatus $next): void
    {
        $allowed = $this->allowedTransitions()[$current->value] ?? [];

        if (!in_array($next->value, $allowed, true)) {
            throw new BusinessException(
                message: "Cannot transition from {$current->label()} to {$next->label()}.",
                publicMessage: __('tasks.invalid_status_transition', [
                    'from' => $current->label(),
                    'to' => $next->label(),
                ]),
            );
        }
    }

    private function validateDependencies(Task $task): void
    {
        $incomplete = $task->dependencies()
            ->whereNotIn('status', [TaskStatus::Done, TaskStatus::Cancelled])
            ->count();

        if ($incomplete > 0) {
            throw new BusinessException(
                message: 'Cannot mark task as done with incomplete dependencies.',
                publicMessage: __('tasks.dependencies_incomplete'),
            );
        }
    }

    private function allowedTransitions(): array
    {
        return [
            TaskStatus::Backlog->value => [
                TaskStatus::Todo->value,
                TaskStatus::Cancelled->value,
            ],
            TaskStatus::Todo->value => [
                TaskStatus::InProgress->value,
                TaskStatus::Backlog->value,
                TaskStatus::Blocked->value,
                TaskStatus::Cancelled->value,
            ],
            TaskStatus::InProgress->value => [
                TaskStatus::InReview->value,
                TaskStatus::Todo->value,
                TaskStatus::Blocked->value,
                TaskStatus::Cancelled->value,
            ],
            TaskStatus::InReview->value => [
                TaskStatus::Approved->value,
                TaskStatus::InProgress->value,
                TaskStatus::Blocked->value,
                TaskStatus::Cancelled->value,
            ],
            TaskStatus::Approved->value => [
                TaskStatus::Done->value,
                TaskStatus::InReview->value,
                TaskStatus::Cancelled->value,
            ],
            TaskStatus::Done->value => [
                TaskStatus::InReview->value,
            ],
            TaskStatus::Cancelled->value => [
                TaskStatus::Todo->value,
            ],
            TaskStatus::Blocked->value => [
                TaskStatus::Todo->value,
                TaskStatus::InProgress->value,
                TaskStatus::InReview->value,
                TaskStatus::Cancelled->value,
            ],
        ];
    }
}
