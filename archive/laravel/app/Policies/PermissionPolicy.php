<?php

namespace App\Policies;

use App\Enums\Permission;
use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class PermissionPolicy
{
    use HandlesAuthorization;

    public function before(User $user): ?bool
    {
        if ($user->hasRole(UserRole::SuperAdmin->value)) {
            return true;
        }
        return null;
    }

    public function view(User $user): bool
    {
        return $user->can(Permission::PERMISSIONS_VIEW->value)
            || $user->can(Permission::PERMISSIONS_MANAGE->value);
    }

    public function manage(User $user): bool
    {
        return $user->can(Permission::PERMISSIONS_MANAGE->value);
    }
}
