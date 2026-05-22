<?php

namespace App\Providers;

use App\Models\Comment;
use App\Models\Integration;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Policies\CommentPolicy;
use App\Policies\IntegrationPolicy;
use App\Policies\ProjectPolicy;
use App\Policies\TaskPolicy;
use App\Policies\UserPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        User::class => UserPolicy::class,
        Project::class => ProjectPolicy::class,
        Task::class => TaskPolicy::class,
        Comment::class => CommentPolicy::class,
        Integration::class => IntegrationPolicy::class,
        \App\Models\MeetingLog::class => \App\Policies\MeetingLogPolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();

        \Illuminate\Support\Facades\Gate::define('viewHorizon', function ($user) {
            return $user->hasRole('super-admin');
        });
    }
}
