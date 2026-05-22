<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Task;
use App\Services\Comment\CommentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function __construct(
        private readonly CommentService $commentService
    ) {}

    public function store(Task $task, \App\Http\Requests\Comment\StoreCommentRequest $request): RedirectResponse
    {
        $this->authorize('view', $task);
        $this->authorize('create', \App\Models\Comment::class);

        $this->commentService->create($task, $request->validated());

        return redirect()->back()->with('success', 'Comment added.');
    }

    public function update(Comment $comment, \App\Http\Requests\Comment\UpdateCommentRequest $request): RedirectResponse
    {
        $this->authorize('update', $comment);

        $this->commentService->update($comment, $request->validated());

        return redirect()->back()->with('success', 'Comment updated.');
    }

    public function destroy(Comment $comment): RedirectResponse
    {
        $this->authorize('delete', $comment);

        $this->commentService->delete($comment);

        return redirect()->back()->with('success', 'Comment deleted.');
    }

}
