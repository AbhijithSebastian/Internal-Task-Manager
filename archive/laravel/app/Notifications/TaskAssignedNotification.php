<?php

namespace App\Notifications;

use App\Models\Task;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TaskAssignedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Task $task,
        public ?User $assignedBy = null,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $assignedByName = $this->assignedBy?->name ?? 'System';
        $projectName = $this->task->project?->name ?? 'N/A';

        return (new MailMessage)
            ->subject("Task Assigned: {$this->task->title}")
            ->greeting('Hello!')
            ->line("You have been assigned to a task by {$assignedByName}.")
            ->line("**Task:** {$this->task->title}")
            ->line("**Project:** {$projectName}")
            ->action('View Task', route('tasks.show', $this->task->id))
            ->line('Thank you for using the Internal Task Manager.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'task_assigned',
            'task_id' => $this->task->id,
            'task_title' => $this->task->title,
            'project_id' => $this->task->project_id,
            'project_name' => $this->task->project?->name,
            'assigned_by' => $this->assignedBy?->name ?? 'System',
            'assigned_by_id' => $this->assignedBy?->id,
            'message' => "You have been assigned to task: {$this->task->title}",
        ];
    }
}
