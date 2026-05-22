<?php

namespace App\Console\Commands;

use App\Enums\TaskStatus;
use App\Models\Task;
use App\Notifications\TaskOverdueNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Notification;

class SendOverdueNotifications extends Command
{
    protected $signature = 'tasks:send-overdue';

    protected $description = 'Send notifications for tasks that are now overdue';

    public function handle(): int
    {
        $tasks = Task::query()
            ->whereHas('assignees')
            ->whereNotNull('due_date')
            ->where('due_date', '<', now())
            ->whereNotIn('status', [TaskStatus::Done, TaskStatus::Cancelled, TaskStatus::Approved])
            ->with(['project', 'assignees'])
            ->get();

        $sent = 0;

        foreach ($tasks as $task) {
            foreach ($task->assignees as $assignee) {
                $alreadySent = $assignee
                    ->notifications()
                    ->where('type', TaskOverdueNotification::class)
                    ->where('data->task_id', $task->id)
                    ->where('created_at', '>=', now()->subDay())
                    ->exists();

                if ($alreadySent) {
                    continue;
                }

                $assignee->notify(new TaskOverdueNotification($task));
                $sent++;
            }
        }

        $this->info("Sent {$sent} overdue notifications.");

        return self::SUCCESS;
    }
}
