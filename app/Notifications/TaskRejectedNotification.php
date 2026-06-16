<?php

namespace App\Notifications;

use App\Models\Task;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TaskRejectedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Task $task,
        public ?User $rejectedBy = null,
        public ?string $reason = null,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $rejectedByName = $this->rejectedBy?->name ?? 'System';
        $mail = (new MailMessage)
            ->subject("Task Rejected: {$this->task->title}")
            ->greeting('Hello!')
            ->line("Your task \"{$this->task->title}\" was rejected by {$rejectedByName}.");

        if ($this->reason) {
            $mail->line("**Reason:** {$this->reason}");
        }

        return $mail
            ->action('View Task', route('tasks.show', $this->task->id))
            ->line('Please review the feedback and resubmit.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'task_rejected',
            'task_id' => $this->task->id,
            'task_title' => $this->task->title,
            'project_id' => $this->task->project_id,
            'rejected_by' => $this->rejectedBy?->name ?? 'System',
            'reason' => $this->reason,
            'message' => "{$this->task->title} was rejected" . ($this->reason ? ": {$this->reason}" : ''),
        ];
    }
}
