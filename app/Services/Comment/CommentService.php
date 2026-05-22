<?php

namespace App\Services\Comment;

use App\Models\Comment;
use App\Models\Task;
use App\Notifications\UserMentionedNotification;
use App\Services\Core\BaseService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;

class CommentService extends BaseService
{
    protected function model(): string
    {
        return Comment::class;
    }

    public function list(Task $task, array $filters = []): LengthAwarePaginator
    {
        $query = $task->comments()
            ->with(['author', 'mentions.user', 'replies' => fn ($q) => $q->with(['author', 'mentions.user'])->latest()->limit(3)])
            ->withCount('replies')
            ->whereNull('parent_id')
            ->latest();

        return $this->paginate($query, $filters['per_page'] ?? 15);
    }

    public function replies(Comment $comment, array $filters = []): LengthAwarePaginator
    {
        $query = $comment->replies()
            ->with(['author', 'mentions.user'])
            ->latest();

        return $this->paginate($query, $filters['per_page'] ?? 10);
    }

    public function create(Task $task, array $data): Comment
    {
        $comment = $this->transaction(function () use ($task, $data) {
            $comment = Comment::create([
                'body' => $data['body'],
                'task_id' => $task->id,
                'project_id' => $task->project_id,
                'author_id' => auth()->id(),
                'parent_id' => $data['parent_id'] ?? null,
            ]);

            log_activity($comment, 'Comment created', [
                'task_id' => $task->id,
                'task_title' => $task->title,
                'body_preview' => str($comment->body)->limit(100),
                'created_by' => auth()->user()?->name,
            ]);

            return $comment;
        });

        return $comment->load(['author', 'mentions.user']);
    }

    public function update(Comment $comment, array $data): Comment
    {
        $this->transaction(function () use ($comment, $data) {
            $oldBody = $comment->body;
            $comment->update(['body' => $data['body']]);

            log_activity($comment, 'Comment updated', [
                'task_id' => $comment->task_id,
                'old_preview' => str($oldBody)->limit(100),
                'new_preview' => str($comment->body)->limit(100),
                'updated_by' => auth()->user()?->name,
            ]);
        });

        return $comment->fresh()->load(['author', 'mentions.user']);
    }

    public function delete(Model|int|string $idOrModel): void
    {
        $comment = $idOrModel instanceof Comment ? $idOrModel : $this->find($idOrModel);

        $this->transaction(function () use ($comment) {
            $taskTitle = $comment->task?->title;
            $comment->delete();

            log_activity($comment, 'Comment deleted', [
                'task_title' => $taskTitle,
                'body_preview' => str($comment->body)->limit(100),
                'deleted_by' => auth()->user()?->name,
            ]);
        });
    }
}
