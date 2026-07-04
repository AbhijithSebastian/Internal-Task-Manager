<?php

namespace App\Notifications;

use App\Models\Comment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CommentRepliedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Comment $reply,
        public Comment $parent,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("New reply to your comment on \"{$this->reply->task?->title}\"")
            ->greeting('Hello!')
            ->line("{$this->reply->author?->name} replied to your comment on task \"{$this->reply->task?->title}\":")
            ->line("> " . str($this->reply->body)->limit(200))
            ->action('View Reply', route('tasks.show', $this->reply->task_id))
            ->line('Thank you for using the Internal Task Manager.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'comment_reply',
            'task_id' => $this->reply->task_id,
            'comment_id' => $this->reply->id,
            'parent_comment_id' => $this->parent->id,
            'reply_body' => str($this->reply->body)->limit(100),
            'replied_by' => $this->reply->author?->name,
            'replied_by_id' => $this->reply->author_id,
            'message' => "{$this->reply->author?->name} replied to your comment",
        ];
    }
}
