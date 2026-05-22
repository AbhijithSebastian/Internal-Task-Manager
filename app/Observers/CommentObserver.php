<?php

namespace App\Observers;

use App\Models\Comment;
use App\Notifications\CommentRepliedNotification;
use App\Jobs\ProcessCommentMentions;

class CommentObserver
{
    public function created(Comment $comment): void
    {
        ProcessCommentMentions::dispatch($comment->id);

        if ($comment->parent_id) {
            $parent = $comment->parent()->with('author')->first();

            if ($parent && $parent->author_id && $parent->author_id !== $comment->author_id) {
                $parent->author->notify(new CommentRepliedNotification($comment, $parent));
            }
        }
    }
}
