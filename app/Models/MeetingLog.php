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
        'title',
        'date',
        'attendees',
        'summary',
        'decisions_taken',
        'blockers',
        'action_items',
        'notes',
    ];

    protected $casts = [
        'date' => 'date',
        'attendees' => 'array',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
