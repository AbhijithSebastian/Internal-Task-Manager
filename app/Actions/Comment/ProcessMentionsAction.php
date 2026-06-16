<?php

namespace App\Actions\Comment;

use App\Models\Comment;
use App\Models\Mention;
use App\Models\User;
use App\Notifications\UserMentionedNotification;
use Illuminate\Support\Collection;

class ProcessMentionsAction
{
    private const MENTION_PATTERN = '/@(\w+[\s.]?\w+)/';

    public function execute(Comment $comment): Collection
    {
        $usernames = $this->extractUsernames($comment->body);

        if ($usernames->isEmpty()) {
            return collect();
        }

        $users = User::whereIn('name', $usernames)->get();

        $mentioned = collect();

        foreach ($users as $user) {
            if ($user->id === $comment->author_id) {
                continue;
            }

            Mention::create([
                'user_id' => $user->id,
                'mentionable_id' => $comment->id,
                'mentionable_type' => Comment::class,
            ]);

            $user->notify(new UserMentionedNotification($comment));
            $mentioned->push($user);
        }

        return $mentioned;
    }

    private function extractUsernames(string $body): Collection
    {
        preg_match_all(self::MENTION_PATTERN, $body, $matches);

        return collect($matches[1])->unique();
    }
}
