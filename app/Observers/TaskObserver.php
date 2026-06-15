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

            $subtaskStatuses = $parent->subtasks()
                ->whereNotIn('status', [TaskStatus::Cancelled])
                ->pluck('status')
                ->map(fn ($s) => $s instanceof TaskStatus ? $s->value : $s);

            $total = $subtaskStatuses->count();
            $done = $subtaskStatuses->filter(fn ($s) => $s === TaskStatus::Done->value)->count();

            if ($total === 0) {
                return;
            }

            $allActiveParentStatuses = [TaskStatus::Backlog->value, TaskStatus::Todo->value, TaskStatus::InProgress->value];
            $parentStatus = $parent->status instanceof TaskStatus ? $parent->status->value : $parent->status;

            if (in_array($parentStatus, $allActiveParentStatuses, true)) {
                if ($done === $total) {
                    $parent->update(['status' => TaskStatus::Done]);
                    log_activity($parent, 'All subtasks completed', [
                        'subtask_count' => $total,
                    ]);
                } elseif ($done > 0) {
                    if ($parentStatus === TaskStatus::Backlog->value || $parentStatus === TaskStatus::Todo->value) {
                        $parent->update(['status' => TaskStatus::InProgress]);
                    }
                }
            }

            $allDone = $subtaskStatuses->filter(fn ($s) => $s !== TaskStatus::Done->value)->isEmpty();
            if ($allDone) {
                log_activity($parent, 'All subtasks completed', [
                    'subtask_count' => $total,
                ]);
            }
        }
    }
}
