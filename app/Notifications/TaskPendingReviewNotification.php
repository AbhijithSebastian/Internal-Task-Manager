<?php

namespace App\Notifications;

use App\Models\Task;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TaskPendingReviewNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Task $task,
        public ?User $submittedBy = null,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $submittedByName = $this->submittedBy?->name ?? 'Someone';
        $projectName = $this->task->project?->name ?? 'N/A';

        return (new MailMessage)
            ->subject("Task Ready for Review: {$this->task->title}")
            ->greeting('Hello!')
            ->line("{$submittedByName} submitted \"{$this->task->title}\" for review.")
            ->line("**Project:** {$projectName}")
            ->action('Review Task', route('tasks.show', $this->task->id))
            ->line('Thank you for using the Internal Task Manager.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'task_pending_review',
            'task_id' => $this->task->id,
            'task_title' => $this->task->title,
            'project_id' => $this->task->project_id,
            'submitted_by' => $this->submittedBy?->name ?? 'System',
            'message' => "{$this->task->title} is ready for review",
        ];
    }
}
