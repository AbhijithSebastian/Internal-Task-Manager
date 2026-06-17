<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Project;

trait HasProject
{
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
