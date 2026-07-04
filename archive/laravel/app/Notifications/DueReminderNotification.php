<?php

namespace App\Notifications;

use App\Models\Task;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DueReminderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Task $task) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $projectName = $this->task->project?->name ?? 'N/A';

        return (new MailMessage)
            ->subject("Task Due Soon: {$this->task->title}")
            ->greeting('Hello!')
            ->line("This is a reminder that task \"{$this->task->title}\" is due soon.")
            ->line("**Due Date:** {$this->task->due_date?->format('M j, Y')}")
            ->line("**Project:** {$projectName}")
            ->line("**Priority:** {$this->task->priority?->label()}")
            ->action('View Task', route('tasks.show', $this->task->id))
            ->line('Please ensure this task is completed on time.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'due_reminder',
            'task_id' => $this->task->id,
            'task_title' => $this->task->title,
            'project_id' => $this->task->project_id,
            'due_date' => $this->task->due_date?->format('Y-m-d'),
            'message' => "Reminder: \"{$this->task->title}\" is due on {$this->task->due_date?->format('M j, Y')}",
        ];
    }
}
