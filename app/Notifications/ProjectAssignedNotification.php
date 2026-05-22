<?php

namespace App\Notifications;

use App\Models\Project;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ProjectAssignedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly Project $project,
        private readonly string $role,
        private readonly User $assignedBy,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Project Assignment: {$this->project->name}")
            ->greeting('Hello!')
            ->line("You have been assigned as **{$this->role}** of project \"{$this->project->name}\" by {$this->assignedBy->name}.")
            ->action('View Project', route('projects.show', $this->project->id))
            ->line('Thank you for using the Internal Task Manager.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'project_assigned',
            'project_id' => $this->project->id,
            'project_name' => $this->project->name,
            'role' => $this->role,
            'assigned_by' => $this->assignedBy->name,
            'assigned_by_id' => $this->assignedBy->id,
            'message' => "You have been assigned as {$this->role} of {$this->project->name}",
        ];
    }
}
