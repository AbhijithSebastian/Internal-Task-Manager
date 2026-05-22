<?php

namespace App\Observers;

use App\Enums\TaskStatus;
use App\Models\Task;

class TaskObserver
{
    public function creating(Task $task): void
    {
        if (!$task->status) {
            $task->status = TaskStatus::Backlog;
        }
    }

    public function updated(Task $task): void
    {
        if ($task->parent_id && $task->isDirty('status')) {
            $parent = $task->parent;

            if (!$parent) {
                return;
            }

            $allDone = $parent->subtasks()
                ->whereNotIn('status', [TaskStatus::Done, TaskStatus::Cancelled])
                ->count() === 0;

            if ($allDone) {
                log_activity($parent, 'All subtasks completed', [
                    'subtask_count' => $parent->subtasks()->count(),
                ]);
            }
        }
    }
}
