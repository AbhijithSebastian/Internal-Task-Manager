<?php

namespace App\Policies;

use App\Enums\Permission;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;

class TaskPolicy extends BasePolicy
{
    private const MANAGER_ROLES = ['owner', 'manager'];

    public function viewAny(User $user, ?Project $project = null): bool
    {
        return $this->hasPermission($user, Permission::TASKS_VIEW);
    }

    public function view(User $user, Task $task): bool
    {
        return $this->isProjectMember($user, $task->project)
            || $task->assignees->contains($user->id)
            || $task->author_id === $user->id;
    }

    public function create(User $user, Project $project): bool
    {
        return $this->hasPermission($user, Permission::TASKS_CREATE)
            && $this->isProjectMember($user, $project);
    }

    public function update(User $user, Task $task): bool
    {
        if (!$this->hasPermission($user, Permission::TASKS_UPDATE)) {
            return false;
        }

        return $this->hasProjectRole($user, $task->project, self::MANAGER_ROLES)
            || $task->assignees->contains($user->id)
            || $task->author_id === $user->id;
    }

    public function delete(User $user, Task $task): bool
    {
        if (!$this->hasPermission($user, Permission::TASKS_DELETE)) {
            return false;
        }

        return $task->author_id === $user->id
            || $this->hasProjectRole($user, $task->project, self::MANAGER_ROLES);
    }

    public function assign(User $user, Task $task): bool
    {
        return $this->hasPermission($user, Permission::TASKS_ASSIGN)
            && $this->hasProjectRole($user, $task->project, self::MANAGER_ROLES);
    }

    public function approve(User $user, Task $task): bool
    {
        if (!$this->hasPermission($user, Permission::TASKS_APPROVE)) {
            return false;
        }

        return $task->approver_id === $user->id
            || $this->hasProjectRole($user, $task->project, self::MANAGER_ROLES);
    }

    public function review(User $user, Task $task): bool
    {
        if (!$this->hasPermission($user, Permission::TASKS_REVIEW)) {
            return false;
        }

        return $this->isProjectMember($user, $task->project);
    }

    public function submitForApproval(User $user, Task $task): bool
    {
        if (!$this->hasPermission($user, Permission::TASKS_SUBMIT_APPROVAL)) {
            return false;
        }

        return $task->assignees->contains($user->id);
    }

    public function block(User $user, Task $task): bool
    {
        return $this->hasPermission($user, Permission::TASKS_UPDATE)
            && ($task->assignees->contains($user->id)
                || $this->hasProjectRole($user, $task->project, self::MANAGER_ROLES));
    }

    public function unblock(User $user, Task $task): bool
    {
        return $this->hasPermission($user, Permission::TASKS_UPDATE)
            && $this->hasProjectRole($user, $task->project, self::MANAGER_ROLES);
    }

    public function manageSubtasks(User $user, Task $task): bool
    {
        if (!$this->hasPermission($user, Permission::TASKS_UPDATE)) {
            return false;
        }

        return $this->hasProjectRole($user, $task->project, self::MANAGER_ROLES)
            || $task->assignees->contains($user->id)
            || $task->author_id === $user->id;
    }
}
