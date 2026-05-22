<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MeetingLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'author_id',
        'title',
        'meeting_date',
        'attendees',
        'summary',
        'decisions_taken',
        'blockers',
        'action_items',
        'notes',
    ];

    protected $casts = [
        'meeting_date' => 'date',
        'attendees' => 'array',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
