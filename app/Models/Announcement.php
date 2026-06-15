<?php

namespace App\Models;

use App\Traits\HasAuthor;
use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Announcement extends Model
{
    use HasFactory, SoftDeletes, HasAuthor, LogsActivity;

    protected $fillable = [
        'title',
        'content',
        'priority',
        'status',
        'published_at',
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $appends = ['priority_label', 'status_label'];

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function getPriorityLabelAttribute(): string
    {
        return ucfirst($this->priority);
    }

    public function getStatusLabelAttribute(): string
    {
        return ucfirst($this->status);
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopeRecent($query)
    {
        return $query->orderBy('published_at', 'desc')->orderBy('created_at', 'desc');
    }
}
