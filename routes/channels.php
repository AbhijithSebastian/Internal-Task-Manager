<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\User;

Broadcast::channel('App.Models.User.{id}', function (User $user, int $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('project.{projectId}', function (User $user, int $projectId) {
    return $user->projects()->where('project_id', $projectId)->exists();
});
