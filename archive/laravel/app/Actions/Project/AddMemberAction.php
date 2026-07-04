<?php

namespace App\Actions\Project;

use App\Exceptions\BusinessException;
use App\Models\Project;
use App\Models\User;

class AddMemberAction
{
    const VALID_ROLES = ['member', 'manager'];

    public function execute(Project $project, User $user, string $role = 'member'): void
    {
        $this->validateRole($role);

        if ($project->members()->where('user_id', $user->id)->exists()) {
            throw new BusinessException(
                message: "User {$user->id} is already a member of project {$project->id}.",
                publicMessage: __('projects.member_already_exists', ['name' => $user->name]),
            );
        }

        $project->members()->attach($user->id, ['role' => $role]);

        activity()
            ->performedOn($project)
            ->causedBy(auth()->user())
            ->withProperties([
                'member_id' => $user->id,
                'member_name' => $user->name,
                'role' => $role,
            ])
            ->log("{$user->name} was added to the project as {$role}");
    }

    public function executeBatch(Project $project, array $memberIds, string $role = 'member'): int
    {
        $this->validateRole($role);

        $newMembers = collect($memberIds)
            ->reject(fn ($id) => $project->members()->where('user_id', $id)->exists())
            ->mapWithKeys(fn ($id) => [$id => ['role' => $role]]);

        if ($newMembers->isNotEmpty()) {
            $project->members()->attach($newMembers);
        }

        return $newMembers->count();
    }

    private function validateRole(string $role): void
    {
        if (!in_array($role, self::VALID_ROLES, true)) {
            throw new BusinessException(
                message: "Invalid project role: {$role}.",
                publicMessage: __('projects.invalid_role'),
            );
        }
    }
}
