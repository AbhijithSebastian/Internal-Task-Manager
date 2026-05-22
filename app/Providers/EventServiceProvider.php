<?php

namespace App\Providers;

use App\Models\Comment;
use App\Models\Project;
use App\Models\Task;
use App\Observers\CommentObserver;
use App\Observers\ProjectObserver;
use App\Observers\TaskObserver;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    protected $observers = [
        Task::class => [TaskObserver::class],
        Project::class => [ProjectObserver::class],
        Comment::class => [CommentObserver::class],
    ];

    public function boot(): void
    {
        //
    }

    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
