<?php

namespace App\Policies;

use App\Enums\Permission;
use App\Models\Comment;
use App\Models\User;

class CommentPolicy extends BasePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can(\App\Enums\Permission::COMMENTS_CREATE->value);
    }

    public function create(User $user): bool
    {
        return $this->hasPermission($user, Permission::COMMENTS_CREATE);
    }

    public function update(User $user, Comment $comment): bool
    {
        if (!$this->hasPermission($user, Permission::COMMENTS_UPDATE)) {
            return false;
        }

        return $this->isOwner($user, $comment, 'author_id');
    }

    public function delete(User $user, Comment $comment): bool
    {
        if (!$this->hasPermission($user, Permission::COMMENTS_DELETE)) {
            return false;
        }

        return $this->isOwner($user, $comment, 'author_id');
    }
}
