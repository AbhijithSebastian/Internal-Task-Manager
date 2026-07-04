<?php

namespace App\Policies;

use App\Enums\Permission;
use App\Models\Project;
use App\Models\User;

class ProjectPolicy extends BasePolicy
{
    private const MANAGER_ROLES = ['owner', 'manager'];

    public function viewAny(User $user): bool
    {
        return $this->hasPermission($user, Permission::PROJECTS_VIEW);
    }

    public function view(User $user, Project $project): bool
    {
        return $this->isProjectMember($user, $project)
            || $project->author_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $this->hasPermission($user, Permission::PROJECTS_CREATE);
    }

    public function update(User $user, Project $project): bool
    {
        return $this->hasPermission($user, Permission::PROJECTS_UPDATE)
            && $this->hasProjectRole($user, $project, self::MANAGER_ROLES);
    }

    public function delete(User $user, Project $project): bool
    {
        if ($project->trashed()) {
            return $this->hasPermission($user, Permission::PROJECTS_DELETE)
                && $this->hasProjectRole($user, $project, ['owner']);
        }

        return $this->hasPermission($user, Permission::PROJECTS_DELETE)
            && $this->hasProjectRole($user, $project, ['owner']);
    }

    public function archive(User $user, Project $project): bool
    {
        return $this->hasPermission($user, Permission::PROJECTS_UPDATE)
            && $this->hasProjectRole($user, $project, self::MANAGER_ROLES);
    }

    public function restore(User $user): bool
    {
        return $this->hasPermission($user, Permission::PROJECTS_UPDATE);
    }

    public function manageMembers(User $user, Project $project): bool
    {
        return $this->hasPermission($user, Permission::PROJECTS_MANAGE_MEMBERS)
            && $this->hasProjectRole($user, $project, self::MANAGER_ROLES);
    }
}
