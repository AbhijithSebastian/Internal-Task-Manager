<?php

namespace App\Notifications;

use App\Models\Task;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TaskApprovedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Task $task,
        public ?User $approvedBy = null,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $approvedByName = $this->approvedBy?->name ?? 'System';

        return (new MailMessage)
            ->subject("Task Approved: {$this->task->title}")
            ->greeting('Hello!')
            ->line("Your task \"{$this->task->title}\" has been approved by {$approvedByName}.")
            ->action('View Task', route('tasks.show', $this->task->id))
            ->line('Thank you for using the Internal Task Manager.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'task_approved',
            'task_id' => $this->task->id,
            'task_title' => $this->task->title,
            'project_id' => $this->task->project_id,
            'approved_by' => $this->approvedBy?->name ?? 'System',
            'message' => "{$this->task->title} has been approved",
        ];
    }
}
