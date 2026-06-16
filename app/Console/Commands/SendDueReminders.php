<?php

namespace App\Console\Commands;

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Models\Task;
use App\Notifications\DueReminderNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Notification;

class SendDueReminders extends Command
{
    protected $signature = 'tasks:send-due-reminders';

    protected $description = 'Send due-date reminders for tasks due within the next 24 hours';

    public function handle(): int
    {
        $tasks = Task::query()
            ->whereHas('assignees')
            ->whereNotNull('due_date')
            ->whereDate('due_date', now()->addDay()->toDateString())
            ->whereNotIn('status', [TaskStatus::Done, TaskStatus::Cancelled, TaskStatus::Approved])
            ->with(['project', 'assignees'])
            ->get();

        $sent = 0;

        foreach ($tasks as $task) {
            foreach ($task->assignees as $assignee) {
                $alreadySent = $assignee
                    ->notifications()
                    ->where('type', DueReminderNotification::class)
                    ->where('data->task_id', $task->id)
                    ->where('created_at', '>=', now()->subDay())
                    ->exists();

                if ($alreadySent) {
                    continue;
                }

                $assignee->notify(new DueReminderNotification($task));
                $sent++;
            }
        }

        $this->info("Sent {$sent} due-reminder notifications.");

        return self::SUCCESS;
    }
}
