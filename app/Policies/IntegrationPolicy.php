<?php

namespace App\Policies;

use App\Models\Integration;
use App\Models\User;

class IntegrationPolicy extends BasePolicy
{
    public function view(User $user, Integration $integration): bool
    {
        return $user->can('view', $integration->project);
    }

    public function update(User $user, Integration $integration): bool
    {
        return $user->can('update', $integration->project);
    }

    public function delete(User $user, Integration $integration): bool
    {
        return $user->can('update', $integration->project);
    }

    public function toggle(User $user, Integration $integration): bool
    {
        return $user->can('update', $integration->project);
    }
}
