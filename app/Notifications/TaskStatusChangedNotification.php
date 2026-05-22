<?php

namespace App\Notifications;

use App\Models\Task;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TaskStatusChangedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Task $task,
        public ?User $changedBy = null,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $changedByName = $this->changedBy?->name ?? 'System';

        return (new MailMessage)
            ->subject("Task Status Changed: {$this->task->title}")
            ->greeting('Hello!')
            ->line("The status of task \"{$this->task->title}\" has been updated.")
            ->line("**New Status:** {$this->task->status?->label()}")
            ->line("**Changed by:** {$changedByName}")
            ->action('View Task', route('tasks.show', $this->task->id))
            ->line('Thank you for using the Internal Task Manager.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'task_status_changed',
            'task_id' => $this->task->id,
            'task_title' => $this->task->title,
            'project_id' => $this->task->project_id,
            'new_status' => $this->task->status?->value,
            'new_status_label' => $this->task->status?->label(),
            'changed_by' => $this->changedBy?->name ?? 'System',
            'changed_by_id' => $this->changedBy?->id,
            'message' => "Task {$this->task->title} moved to {$this->task->status?->label()}",
        ];
    }
}
