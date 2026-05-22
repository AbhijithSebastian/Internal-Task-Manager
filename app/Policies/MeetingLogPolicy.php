<?php

namespace App\Policies;

use App\Models\MeetingLog;
use App\Models\Project;
use App\Models\User;

class MeetingLogPolicy extends BasePolicy
{
    public function view(User $user, MeetingLog $meetingLog): bool
    {
        return $this->isProjectMember($user, $meetingLog->project);
    }

    public function create(User $user, Project $project): bool
    {
        return $this->isProjectMember($user, $project);
    }

    public function update(User $user, MeetingLog $meetingLog): bool
    {
        return $this->isProjectMember($user, $meetingLog->project);
    }

    public function delete(User $user, MeetingLog $meetingLog): bool
    {
        return $this->isProjectMember($user, $meetingLog->project) &&
            ($this->hasProjectRole($user, $meetingLog->project, ['owner', 'manager']) 
             || $user->id === $meetingLog->project->pm_id 
             || $user->id === $meetingLog->project->lead_id);
    }
}
