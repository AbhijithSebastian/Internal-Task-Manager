<?php

namespace App\Models;

use App\Enums\ProjectPriority;
use App\Enums\ProjectStatus;
use App\Traits\HasAuthor;
use App\Traits\HasAttachments;
use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\MediaLibrary\HasMedia;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Project extends Model implements HasMedia
{
    use HasFactory,
        SoftDeletes,
        HasAuthor,
        HasAttachments,
        LogsActivity;

    protected $fillable = [
        'name',
        'description',
        'status',
        'priority',
        'start_date',
        'end_date',
        'author_id',
        'pm_id',
        'lead_id',
        'figma_url',
        'github_url',
        'docs_url',
        'meeting_url',
    ];

    protected $casts = [
        'status' => ProjectStatus::class,
        'priority' => ProjectPriority::class,
        'start_date' => 'date',
        'end_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $appends = [
        'status_label',
        'priority_label',
        'health',
        'subtask_count',
        'completed_subtask_count',
    ];

    public function getMemberCountAttribute(): int
    {
        return $this->members()->count();
    }

    public function getTaskCountAttribute(): int
    {
        return $this->tasks_count ?? $this->parentTasks()->count();
    }

    public function getCompletedTaskCountAttribute(): int
    {
        return $this->completed_tasks_count ?? $this->parentTasks()->where('status', 'done')->count();
    }

    public function getCompletionRateAttribute(): ?int
    {
        $totalTasks = $this->tasks_count ?? $this->parentTasks()->count();
        $completedTasks = $this->completed_tasks_count ?? $this->parentTasks()->where('status', 'done')->count();

        $totalSubtasks = $this->subtask_count ?? $this->tasks()->whereNotNull('parent_id')->count();
        $completedSubtasks = $this->completed_subtask_count ?? $this->tasks()->whereNotNull('parent_id')->where('status', 'done')->count();

        $combined = $totalTasks + $totalSubtasks;
        if ($combined === 0) {
            return null;
        }

        $combinedCompleted = $completedTasks + $completedSubtasks;
        return (int) round(($combinedCompleted / $combined) * 100);
    }

    public function getSubtaskCountAttribute(): int
    {
        return $this->subtask_count ?? $this->tasks()->whereNotNull('parent_id')->count();
    }

    public function getCompletedSubtaskCountAttribute(): int
    {
        return $this->completed_subtask_count ?? $this->tasks()->whereNotNull('parent_id')->where('status', 'done')->count();
    }

    public function getStatusLabelAttribute(): ?string
    {
        try {
            return $this->status instanceof ProjectStatus ? $this->status->label() : null;
        } catch (\Illuminate\Database\Eloquent\MissingAttributeException) {
            return null;
        }
    }

    public function getPriorityLabelAttribute(): ?string
    {
        try {
            return $this->priority instanceof ProjectPriority ? $this->priority->label() : null;
        } catch (\Illuminate\Database\Eloquent\MissingAttributeException) {
            return null;
        }
    }

    public function getHealthAttribute(): array
    {
        $totalTasks = $this->tasks_count ?? $this->parentTasks()->count();
        if ($totalTasks === 0) {
            return ['status' => 'healthy', 'label' => 'Healthy', 'score' => 100, 'issues' => []];
        }

        $completedTasks = $this->completed_tasks_count ?? $this->parentTasks()->where('status', 'done')->count();
        $blockedTasks = $this->parentTasks()->where('status', 'blocked')->count();
        $inReviewTasks = $this->parentTasks()->where('status', 'in_review')->count();

        $issues = [];

        if ($blockedTasks > 0) {
            $issues[] = $blockedTasks . ' blocked task' . ($blockedTasks > 1 ? 's' : '');
        }

        $completionRate = $totalTasks > 0 ? ($completedTasks / $totalTasks) * 100 : 0;
        $blockedRatio = $totalTasks > 0 ? ($blockedTasks / $totalTasks) * 100 : 0;

        $score = 100;
        $score -= min(40, $blockedRatio * 5);
        if ($completionRate < 20 && $totalTasks > 5) $score -= 10;

        $score = max(0, (int) round($score));

        $status = match (true) {
            $score >= 80 => 'healthy',
            $score >= 50 => 'at_risk',
            $score >= 25 => 'delayed',
            default => 'critical',
        };

        $label = match ($status) {
            'healthy' => 'Healthy',
            'at_risk' => 'At Risk',
            'delayed' => 'Delayed',
            default => 'Critical',
        };

        return [
            'status' => $status,
            'label' => $label,
            'score' => $score,
            'issues' => $issues,
        ];
    }

    public function scopeActive($query)
    {
        return $query->where('status', ProjectStatus::Active);
    }

    public function scopeArchived($query)
    {
        return $query->where('status', ProjectStatus::Archived);
    }

    public function scopeByMember($query, int $userId)
    {
        return $query->whereHas('members', fn ($q) => $q->where('user_id', $userId));
    }

    public function scopeByStatus($query, array $statuses)
    {
        $values = array_map(fn ($s) => $s instanceof ProjectStatus ? $s->value : $s, $statuses);
        return $query->whereIn('status', $values);
    }

    public function scopeSearch($query, string $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('name', 'ilike', "%{$term}%")
              ->orWhere('description', 'ilike', "%{$term}%");
        });
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'project_members')
            ->select('users.*')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function parentTasks(): HasMany
    {
        return $this->hasMany(Task::class)->whereNull('parent_id');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function projectManager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pm_id');
    }

    public function teamLead(): BelongsTo
    {
        return $this->belongsTo(User::class, 'lead_id');
    }

    public function integrations(): HasMany
    {
        return $this->hasMany(Integration::class);
    }

    public function meetingLogs(): HasMany
    {
        return $this->hasMany(MeetingLog::class);
    }

    public function milestones(): HasMany
    {
        return $this->hasMany(Milestone::class)->orderBy('due_date');
    }

    public function getLinks(): array
    {
        return array_filter([
            'figma' => $this->figma_url,
            'github' => $this->github_url,
            'docs' => $this->docs_url,
            'meeting' => $this->meeting_url,
        ]);
    }
}
