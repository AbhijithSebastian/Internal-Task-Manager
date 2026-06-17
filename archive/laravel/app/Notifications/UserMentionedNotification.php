<?php

namespace App\Notifications;

use App\Models\Comment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class UserMentionedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Comment $comment) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('You were mentioned in a comment')
            ->greeting('Hello!')
            ->line("{$this->comment->author?->name} mentioned you in a comment on task \"{$this->comment->task?->title}\":")
            ->line("> " . str($this->comment->body)->limit(200))
            ->action('View Comment', route('tasks.show', $this->comment->task_id))
            ->line('Thank you for using the Internal Task Manager.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'mention',
            'task_id' => $this->comment->task_id,
            'comment_id' => $this->comment->id,
            'comment_body' => str($this->comment->body)->limit(100),
            'mentioned_by' => $this->comment->author?->name,
        ];
    }
}
