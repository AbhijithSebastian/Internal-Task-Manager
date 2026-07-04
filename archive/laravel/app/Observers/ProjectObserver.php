<?php

namespace App\Observers;

use App\Enums\ProjectStatus;
use App\Models\Project;

class ProjectObserver
{
    public function creating(Project $project): void
    {
        if (!$project->status) {
            $project->status = ProjectStatus::Active;
        }
    }
}
