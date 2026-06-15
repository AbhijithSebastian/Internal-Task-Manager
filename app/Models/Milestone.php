<?php

namespace App\Models;

use App\Traits\HasAuthor;
use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Milestone extends Model
{
    use HasFactory, SoftDeletes, HasAuthor, LogsActivity;

    protected $fillable = [
        'name',
        'description',
        'due_date',
        'completed_at',
        'status',
        'project_id',
    ];

    protected $casts = [
        'due_date' => 'date',
        'completed_at' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $appends = ['status_label'];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            'completed' => 'Completed',
            'in_progress' => 'In Progress',
            'at_risk' => 'At Risk',
            'cancelled' => 'Cancelled',
            default => 'Pending',
        };
    }

    public function scopePending($query)
    {
        return $query->whereIn('status', ['pending', 'in_progress', 'at_risk']);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeByProject($query, int $projectId)
    {
        return $query->where('project_id', $projectId);
    }
}
