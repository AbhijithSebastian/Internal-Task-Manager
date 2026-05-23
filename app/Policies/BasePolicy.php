<?php

namespace App\Policies;

use App\Enums\Permission;
use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

abstract class BasePolicy
{
    use HandlesAuthorization;

    public function before(User $user): ?bool
    {
        if ($user->hasRole(UserRole::SuperAdmin->value)) {
            return true;
        }

        return null;
    }

    protected function hasPermission(User $user, Permission $permission): bool
    {
        return $user->can($permission->value);
    }

    protected function hasAnyPermission(User $user, Permission ...$permissions): bool
    {
        foreach ($permissions as $permission) {
            if ($user->can($permission->value)) {
                return true;
            }
        }

        return false;
    }

    protected function isOwner(User $user, object $model, string $ownerColumn = 'user_id'): bool
    {
        return $user->id === $model->{$ownerColumn};
    }
    protected function isProjectMember(User $user, object $project): bool
    {
        return $project->members()->where('user_id', $user->id)->exists()
            || $project->pm_id === $user->id
            || $project->lead_id === $user->id;
    }

    protected function getProjectRole(User $user, object $project): ?string
    {
        $membership = $project->members()->where('user_id', $user->id)->first();
        if ($membership) {
            return $membership->pivot->role;
        }

        if ($project->pm_id === $user->id || $project->lead_id === $user->id) {
            return 'manager';
        }

        return null;
    }

    protected function hasProjectRole(User $user, object $project, array $roles): bool
    {
        $memberRole = $this->getProjectRole($user, $project);

        return $memberRole !== null && in_array($memberRole, $roles, true);
    }
}
