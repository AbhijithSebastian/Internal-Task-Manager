<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\MorphTo;

class Activity extends \Spatie\Activitylog\Models\Activity
{
    protected $appends = [
        'activity_label',
    ];

    public function subject(): MorphTo
    {
        return $this->morphTo()->withTrashed();
    }

    public function causer(): MorphTo
    {
        return $this->morphTo()->withTrashed();
    }

    public function getActivityLabelAttribute(): string
    {
        $map = [
            'Task created' => 'Created a task',
            'Task updated' => 'Updated a task',
            'Task status changed' => 'Changed task status',
            'Task deleted' => 'Deleted a task',
            'Task assigned' => 'Assigned a task',
            'Task blocked' => 'Blocked a task',
            'Task unblocked' => 'Unblocked a task',
            'Comment created' => 'Added a comment',
            'Comment updated' => 'Edited a comment',
            'Comment deleted' => 'Deleted a comment',
            'Subtask created' => 'Added a subtask',
            'Subtask updated' => 'Updated a subtask',
            'Subtask deleted' => 'Deleted a subtask',
            'All subtasks completed' => 'Completed all subtasks',
            'Project created' => 'Created a project',
            'Project updated' => 'Updated a project',
            'User created' => 'Created a user',
            'User updated' => 'Updated a user',
            'User deleted' => 'Deleted a user',
            'User restored' => 'Restored a user',
            'Dependency added' => 'Added a dependency',
            'Dependency removed' => 'Removed a dependency',
        ];

        return $map[$this->description] ?? $this->description;
    }
}
