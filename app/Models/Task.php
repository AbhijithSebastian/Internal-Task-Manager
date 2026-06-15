<?php

namespace App\Models;

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Traits\HasAssignees;
use App\Traits\HasAttachments;
use App\Traits\HasAuthor;
use App\Traits\HasProject;
use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\MediaLibrary\HasMedia;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Task extends Model implements HasMedia
{
    use HasFactory,
        SoftDeletes,
        HasAuthor,
        HasAssignees,
        HasProject,
        HasAttachments,
        LogsActivity;

    public ?int $tempAssigneeId = null;

    protected static function booted()
    {
        static::saved(function ($task) {
            if ($task->tempAssigneeId !== null) {
                $task->assignees()->sync([$task->tempAssigneeId]);
                $task->tempAssigneeId = null;
            }
        });
    }

    protected $fillable = [
        'title',
        'description',
        'status',
        'priority',
        'tags',
        'blocked_reason',
        'due_date',
        'estimated_hours',
        'project_id',
        'author_id',
        'assignee_id',
        'assignee_ids',
        'parent_id',
        'requires_approval',
        'approver_id',
        'rejection_reason',
        'approved_at',
        'employee_eta',
        'dependency_ids',
    ];

    protected $casts = [
        'status' => TaskStatus::class,
        'priority' => TaskPriority::class,
        'tags' => 'array',
        'due_date' => 'date',
        'employee_eta' => 'date',
        'estimated_hours' => 'decimal:2',
        'requires_approval' => 'boolean',
        'approved_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function setDependencyIdsAttribute($value)
    {
        // Handled in TaskService sync
    }

    public function setAssigneeIdsAttribute($value)
    {
        // Handled in TaskService sync
    }

    public function getAssigneeIdAttribute()
    {
        return $this->assignees->first()?->id;
    }

    public function setAssigneeIdAttribute($value)
    {
        $this->tempAssigneeId = $value ? (int) $value : null;
    }

    protected $appends = [
        'status_label',
        'priority_label',
        'approval_status',
        'subtask_completion_rate',
    ];

    public function getCommentCountAttribute(): int
    {
        return $this->comments_count ?? $this->comments()->count();
    }

    public function getSubtaskCountAttribute(): int
    {
        return $this->subtasks_count ?? $this->subtasks()->count();
    }

    public function getCompletedSubtaskCountAttribute(): int
    {
        return $this->completed_subtask_count ?? $this->subtasks()->where('status', TaskStatus::Done)->count();
    }

    public function getSubtaskCompletionRateAttribute(): int
    {
        $total = $this->subtasks_count ?? $this->subtasks()->count();
        if ($total === 0) {
            return 0;
        }

        $completed = $this->completed_subtask_count ?? $this->subtasks()->where('status', TaskStatus::Done)->count();
        return (int) round(($completed / $total) * 100);
    }

    public function getStatusLabelAttribute(): ?string
    {
        try {
            return $this->status instanceof TaskStatus ? $this->status->label() : null;
        } catch (\Illuminate\Database\Eloquent\MissingAttributeException) {
            return null;
        }
    }

    public function getPriorityLabelAttribute(): ?string
    {
        try {
            return $this->priority instanceof TaskPriority ? $this->priority->label() : null;
        } catch (\Illuminate\Database\Eloquent\MissingAttributeException) {
            return null;
        }
    }

    public function scopePending($query)
    {
        return $query->whereNotIn('status', [TaskStatus::Done, TaskStatus::Cancelled]);
    }

    public function scopeByTag($query, string $tag)
    {
        return $query->whereJsonContains('tags', $tag);
    }

    public function scopeBlocked($query)
    {
        return $query->where('status', TaskStatus::Blocked);
    }

    public function scopeSubtasks($query)
    {
        return $query->whereNotNull('parent_id');
    }

    public function scopeParentTasks($query)
    {
        return $query->whereNull('parent_id');
    }

    public function scopeSearch($query, string $term)
    {
        if (preg_match('/tag:(\S+)/i', $term, $matches)) {
            $tag = $matches[1];
            $text = trim(str_replace($matches[0], '', $term));

            $query->whereJsonContains('tags', $tag);

            if ($text) {
                $query->where(function ($q) use ($text) {
                    $q->where('title', 'ilike', "%{$text}%")
                      ->orWhere('description', 'ilike', "%{$text}%");
                });
            }

            return $query;
        }

        return $query->where(function ($q) use ($term) {
            $q->where('title', 'ilike', "%{$term}%")
              ->orWhere('description', 'ilike', "%{$term}%");
        });
    }

    public function getApprovalStatusAttribute(): ?string
    {
        try {
            if (!$this->requires_approval) {
                return null;
            }

            return match ($this->status) {
                TaskStatus::InReview => 'pending_review',
                TaskStatus::Approved => 'approved',
                default => 'not_submitted',
            };
        } catch (\Illuminate\Database\Eloquent\MissingAttributeException) {
            return null;
        }
    }

    public function scopeNeedsApproval($query)
    {
        return $query->where('requires_approval', true);
    }

    public function scopeAwaitingApproval($query)
    {
        return $query->where('requires_approval', true)
            ->where('status', TaskStatus::InReview);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function subtasks(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function dependencies(): BelongsToMany
    {
        return $this->belongsToMany(self::class, 'task_dependencies', 'task_id', 'dependency_id')
            ->withTimestamps();
    }

    public function dependents(): BelongsToMany
    {
        return $this->belongsToMany(self::class, 'task_dependencies', 'dependency_id', 'task_id')
            ->withTimestamps();
    }
}
