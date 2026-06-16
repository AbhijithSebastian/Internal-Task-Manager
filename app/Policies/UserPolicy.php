<?php

namespace App\Policies;

use App\Enums\Permission;
use App\Models\User;

class UserPolicy extends BasePolicy
{
    public function viewAny(User $user): bool
    {
        return $this->hasPermission($user, Permission::USERS_VIEW);
    }

    public function view(User $user, User $model): bool
    {
        if ($user->id === $model->id) {
            return true;
        }

        return $this->hasPermission($user, Permission::USERS_VIEW);
    }

    public function create(User $user): bool
    {
        return $this->hasPermission($user, Permission::USERS_CREATE);
    }

    public function update(User $user, User $model): bool
    {
        if ($user->id === $model->id) {
            return true;
        }

        return $this->hasPermission($user, Permission::USERS_UPDATE);
    }

    public function delete(User $user, User $model): bool
    {
        if ($user->id === $model->id) {
            return false;
        }

        if ($model->hasRole(\App\Enums\UserRole::SuperAdmin->value)) {
            return false;
        }

        return $this->hasPermission($user, Permission::USERS_DELETE);
    }

    public function restore(User $user): bool
    {
        return $this->hasPermission($user, Permission::USERS_RESTORE);
    }

    public function toggleActive(User $user): bool
    {
        return $this->hasPermission($user, Permission::USERS_UPDATE);
    }
}
