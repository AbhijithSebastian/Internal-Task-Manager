<?php

namespace App\Policies;

use App\Models\Announcement;
use App\Models\User;

class AnnouncementPolicy extends BasePolicy
{

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Announcement $announcement): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->is_super_admin || $user->hasRole('project-manager') || $user->hasRole('team-lead');
    }

    public function update(User $user, Announcement $announcement): bool
    {
        return $user->is_super_admin || $announcement->author_id === $user->id;
    }

    public function delete(User $user, Announcement $announcement): bool
    {
        return $user->is_super_admin || $announcement->author_id === $user->id;
    }
}
