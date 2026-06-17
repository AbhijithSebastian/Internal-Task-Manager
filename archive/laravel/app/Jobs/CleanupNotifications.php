<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Notifications\DatabaseNotification;

class CleanupNotifications implements ShouldQueue
{
    use Queueable;

    public function handle(): void
    {
        DatabaseNotification::where('read_at', '<', now()->subMonths(3))
            ->each(fn ($n) => $n->delete(), 100);

        DatabaseNotification::whereNull('read_at')
            ->where('created_at', '<', now()->subMonths(6))
            ->each(fn ($n) => $n->delete(), 100);
    }
}
