<?php

namespace App\Jobs;

use App\Actions\Comment\ProcessMentionsAction;
use App\Models\Comment;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ProcessCommentMentions implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public int $commentId
    ) {}

    public function handle(ProcessMentionsAction $action): void
    {
        $comment = Comment::find($this->commentId);
        if (!$comment) {
            return;
        }

        $mentioned = $action->execute($comment);

        if ($mentioned->isNotEmpty()) {
            logger()->info('Mentions processed', [
                'comment_id' => $this->commentId,
                'mentioned_users' => $mentioned->pluck('id')->toArray(),
            ]);
        }
    }
}
